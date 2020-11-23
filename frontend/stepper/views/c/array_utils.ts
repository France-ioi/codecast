import * as C from 'persistent-c';
import {FibonacciHeap, INode} from '@tyriar/fibonacci-heap';
import range from 'node-range';

import {evalExpr, readScalarBasic, stringifyExpr} from './utils';

interface HeapNode {
    key: any,
    points: number,
    rank: number,
    index: number
}

/**

 extractView(context, stackFrame, name, options) looks up `name` in `stackFrame` and
 builds a view depending on the `options` given.

 TODO: look up in in globals if `name` not defined in `stackFrame`.

 The return value is an object of shape {cells, cursors} where `cells`
 is an array in which each element is either a cell-content object or the
 string '…' to indicate a gap in a sequence of indexes.

 A cell-content object has the following shape:

 {
      position,
      index,
      address,
      content: {
        kind,
        ref,
        current,
        load?,
        store?,
        previous?
      }
    }

 - `position` is the index in `cells`
 - `index` is the index in the array
 - `address` is the address of the array cell
 - `content` is the stored-value, in which:
 - `kind` is always 'scalar'
 - `ref` is a reference (pointer object) to the cell
 - `current` is the current persistent-c value of the cell
 - `load` if present is the rank of the most recent memory operation
 in the memory log that loads from the cell
 - `store` if present is the rank of the most recent memory operation
 in the memory log that writes to the cell
 - `previous` is the persistent-c value of the cell at the start of the
 memory log, if it contains any store operation that overlaps
 with the cell

 If `options` contains a `cursorExprs` property (array of expressions evaluated
 in the context of the current `stackFrame`), the `cursors` property in the result
 is an array of cursor objects of this shape:

 {cursors, index, row, col}

 where

 `index`   is the index of the cursors the array
 `cursors` is a list of the cursor names at the given index
 `col`     is the position of the cursor in `cells`
 `row`     is such that adjacent cursors are on different rows
 (up to `options.cursorRows` rows are used)

 */
export const extractView = function (context, stackFrame, refExpr, options) {
    const {programState} = context;
    const localMap = stackFrame.get('localMap');
    // Normalize options.
    const {fullView, dimExpr} = options;
    let {cursorExprs, cursorRows, maxVisibleCells, pointsByKind, getMessage} = options;
    if (cursorExprs === undefined) {
        cursorExprs = [];
    }
    if (cursorRows === undefined) {
        cursorRows = 2;
    }
    if (maxVisibleCells === undefined) {
        maxVisibleCells = 40;
    }
    if (pointsByKind === undefined) {
        pointsByKind = {
            cursor: 300,
            store: 100,
            load: 50,
            first: 25,
            last: 20
        };
    }
    // Evaluate `dimExpr` if given.
    let elemCount;
    if (dimExpr) {
        try {
            const dimVal = evalExpr(programState, localMap, dimExpr, false);
            if (dimVal.type.kind !== 'builtin') {
                return {error: getMessage('ARRAY1D_DIM_INVALID').format({dim: stringifyExpr(dimExpr)})};
            }
            elemCount = dimVal.toInteger();
        } catch (ex) {
            return {
                error: getMessage('ARRAY1D_DIM_NOVAL').format({
                    dim: stringifyExpr(dimExpr),
                    ex: getMessage.format(ex)
                })
            };
        }
    }
    // Evaluate the array expression `expr`.
    let ref;
    try {
        ref = evalExpr(programState, localMap, refExpr, false);
    } catch (ex) {
        return {
            error: getMessage('ARRAY1D_EXPR_NOVAL').format({
                expr: stringifyExpr(refExpr),
                ex: getMessage.format(ex)
            })
        };
    }
    // By the array-value decaying rule, ref should be a pointer.
    if (ref.type.kind !== 'pointer') {
        return {error: getMessage('ARRAY1D_EXPR_NOPTR').format({expr: stringifyExpr(refExpr)})};
    }
    if (elemCount === undefined) {
        if ('orig' in ref.type) {
            // The array size can be obtained from the original type.
            elemCount = ref.type.orig.count.toInteger();
        } else {
            return {error: getMessage('ARRAY1D_DIM_UNK').format({expr: stringifyExpr(refExpr)})};
        }
    }
    const address = ref.address;
    const elemType = ref.type.pointee;
    if (!/^(builtin|pointer)$/.test(elemType.kind)) {
        return {error: getMessage('ARRAY1D_ELT_UNSUP').format({expr: stringifyExpr(refExpr)})};
    }
    const cellOpsMap = getOpsArray1D(programState, address, elemCount, elemType.size);
    const cursorMap = getCursorMap(
        programState, localMap, cursorExprs,
        {minIndex: 0, maxIndex: elemCount, address, cellSize: elemType.size});
    const selection =
        fullView
            ? range(0, elemCount + 1)
            : getSelection(maxVisibleCells, elemCount, cellOpsMap, cursorMap, pointsByKind);
    const cells = readArray1D(context, address, elemType, elemCount, selection, cellOpsMap);
    finalizeCursors(selection, cursorMap, cursorRows);
    return {cells, cursorMap};
};

/*

   ArrayViewBuilder(nbVisibleCells, nbCells) is a constructor for an object
   that allows selecting nbVisibleCells cells out of an array of nbCells,
   prioritizing the display of the most important cells based on markers.

   The object constructed has this interface:

   * addMarker(index, kind, rank)

      Add a marker of the specified kind on cell at the given index.
      Supported kinds are /cursor|read|write|first|last/.
      Rank replaces the cell's rank if given and greater.

   * getSelection()

      Returns an array of the selected indices, in increasing order.
      Gaps between sequences count as 1 cell each towards the number of
      visible cells.

*/
export const ArrayViewBuilder = function (nbVisibleCells, nbCells) {

    // The spread is the number of cells around a marker which receive extra
    // points.
    // A marker added at index i adds j points to cells at index (i-j) and (i+j),
    // where 0 <= j <= spread.
    this.spread = 5;

    // Private state.
    const cells = {};  // object used as sparse array (length is not needed)

    function addPointsAndRank(index, points, rank) {
        // Find/initialize the cell at the given index.
        let cell;
        if (index in cells) {
            cell = cells[index];
        } else {
            cell = cells[index] = {index, points: 0, rank: 0};
        }
        // Add points to the cell.
        cell.points = Math.max(cell.points, points);
        // Keep track of the greatest rank, if provided.
        if (rank !== undefined) {
            cell.rank = Math.max(cell.rank, rank);
        }
    }

    this.addMarker = function (index, points, rank) {
        // Add points to the marked cell.
        addPointsAndRank(index, points, rank);
        // Also spread points arround the marked cell.
        for (let iDist = 1; iDist < this.spread; iDist++) {
            const prevIndex = index - iDist;
            if (prevIndex >= 0) {
                addPointsAndRank(prevIndex, this.spread - iDist, rank);
            }
            const nextIndex = index + iDist;
            // XXX should be nextIndex < nbCells?
            if (nextIndex <= nbCells) {
                addPointsAndRank(nextIndex, this.spread - iDist, rank);
            }
        }
    };

    this.getSelection = function () {
        // Insert the marked cells in a heap.
        const heap = new FibonacciHeap<HeapNode, any>(compareHeapNodes);
        Object.keys(cells).forEach(index => heap.insert(cells[index]));
        // Build the result array containing the selected indexes.
        const result = [];
        let spaceLeft = nbVisibleCells - 1; // subtract 1 for the implicit gap
        while (spaceLeft > 0) {
            let node = heap.extractMinimum();
            if (node === undefined) {
                break;
            }
            let {index, points, rank} = node.key;
            // Find the position in result where the index can be inserted.
            let pos = findInsertionIndex(index, result);
            // Does the inserted index extend a sequence on the left or right?
            let leftExt = index === 0 || result[pos - 1] === index - 1;
            let rightExt = index === nbCells || result[pos] === index + 1;
            // There are 3 cases to consider:
            // - leftExt  rightExt
            //    true     true    the element replaces a gap and takes no extra space
            //    true     false   the element extends a sequence and takes 1 space
            //    false    true    the element extends a sequence and takes 1 space
            //    false    false   the element splits a gap and takes 2 spaces
            let spaceUsed = 2 - (leftExt ? 1 : 0) - (rightExt ? 1 : 0);
            if (spaceUsed > spaceLeft) {
                break;
            }
            result.splice(pos, 0, index);
            spaceLeft -= spaceUsed;
        }
        if (spaceLeft > 0) {
            // Fill up the remaining space with unmarked cells.
            // Ensure there is at least 1 element in result.
            if (result.length === 0 || result[0] !== 0) {
                result.splice(0, 0, 0);
                spaceLeft -= 1;
            }
            let nextIndex = result[0] + 1, i = 1;
            while (spaceLeft > 0 && nextIndex < nbCells) {
                const index = result[i];
                if (nextIndex !== index) {
                    result.splice(i, 0, nextIndex);
                    spaceLeft -= 1;
                    if (spaceLeft === 0) {
                        break;
                    }
                }
                i += 1;
                nextIndex += 1;
            }
        }
        // Make gaps explicit.
        let i = 0, nextIndex = 0;
        while (nextIndex < nbCells) {
            if (result[i] === nextIndex) {
                i += 1;
                nextIndex += 1;
            } else {
                // If a gap of size 1 is detected, use the missing index.
                const filler = result[i] === nextIndex + 1 ? nextIndex : '…';
                result.splice(i, 0, filler);
                i += 1;
                // Reset nextIndex to the start of the sequence after the gap.
                nextIndex = result[i];
            }
        }
        return result;
    };

};

/** findInsertionIndex(element, array, comparer) returns a value of index
 such that
 array.splice(index, 0, element)
 keeps array sorted according to comparer.
 */
const findInsertionIndex = function (element, array, comparer?) {
    if (array.length === 0) {
        return -1;
    }
    if (comparer === undefined) {
        comparer = function (a, b) {
            return a < b ? -1 : a > b ? 1 : 0;
        };
    }
    // The value of end is 1 beyond the last element in the search interval.
    let start = 0;
    let end = array.length;
    while (true) {
        const pivot = (start + end) >> 1;
        const c = comparer(element, array[pivot]);
        if (c === 0) {
            return pivot;
        }
        if (end - start <= 1) {
            // The search interval is reduced to a single element.
            return c < 0 ? pivot : pivot + 1;
        }
        if (c < 0) {
            end = pivot;
        } else {
            start = pivot;
        }
    }
}

const compareHeapNodes = function (a: HeapNode, b: HeapNode) {
    const cellA = a.key;
    const cellB = b.key;
    if (cellA.points > cellB.points) {
        return -1;
    }
    if (cellA.points < cellB.points) {
        return 1;
    }
    if (cellA.rank > cellB.rank) {
        return -1;
    }
    if (cellA.rank < cellB.rank) {
        return 1;
    }
    if (cellA.index < cellB.index) {
        return -1;
    }
    if (cellA.index > cellB.index) {
        return 1;
    }
    return 0;
};

/* Returns a function that takes a ref and a callback and calls the callback
   with an index argument for each cell of the array (described by arrayBase,
   elemCount, and elemSize) that the ref intersects.
 */
export const mapArray1D = function (arrayBase, elemCount, elemSize) {
    const arrayLimit = arrayBase + (elemCount * elemSize) - 1;
    return function (ref, callback) {
        // Skip if [array] < [ref]
        const {address, type} = ref;
        if (arrayLimit < address) return;
        // Skip if [ref] < [array]
        const refLimit = address + type.pointee.size - 1;
        if (refLimit < arrayBase) return;
        // Clip ref to within array region.
        const startAddress = Math.max(arrayBase, address);
        let index = Math.floor((startAddress - arrayBase) / elemSize);
        const endAddress = Math.min(arrayLimit, refLimit);
        let elemLimit = arrayBase + (index + 1) * elemSize - 1;
        while (elemLimit <= endAddress) {
            callback(index);
            index += 1;
            elemLimit += elemSize;
        }
    };
};

export interface Cell {
    position: any,
    gap?: boolean,
    index: string,
    content?: any,
    address?: any
}

// Read an 1D array of scalars.
export const readArray1D = function (context, arrayBase, elemType, elemCount, selection, mops) {
    const {programState, lastProgramState} = context;
    const elemSize = elemType.size;
    const elemRefType = C.pointerType(elemType);
    // TODO: check that elemType is scalar
    const cells: Cell[] = [];
    if (selection === undefined) {
        selection = range(0, elemCount + 1);
    }
    selection.forEach(function (index, position) {
        if (position === undefined)
            position = index;
        if (index === '…') {
            /* Generate a fake index so it can be used as a key for rendering. */
            cells.push({position, gap: true, index: `#${position}`});
        } else {
            const elemAddress = arrayBase + index * elemSize;
            const cell: Cell = {position, index, address: elemAddress};
            if (index >= 0 && index < elemCount) {
                const content = readScalarBasic(programState, elemRefType, elemAddress);
                if (index in mops) {
                    const mop = mops[index];
                    if ('load' in mop) {
                        content.load = mop.load;
                    }
                    if ('store' in mop) {
                        content.store = mop.store;
                        content.previous = C.readValue(lastProgramState, content.ref);
                    }
                }
                cell.content = content;
            }
            cells.push(cell);
        }
    });
    return cells;
};

// Returns a map keyed by cell index, and whose values are objects giving
// the greatest rank in the memory log of a 'load' or 'store' operation.
const getOpsArray1D = function (programState, address, elemCount, elemSize) {
    // Go through the memory log, translate memory-operation references into
    // array cells indexes, and save the cell load/store operations in cellOps.
    const cellOpsMap = [];
    const forEachCell = mapArray1D(address, elemCount, elemSize);
    programState.memoryLog.forEach(function (entry, i) {
        const op = entry[0]; // 'load' or 'store'
        forEachCell(entry[1], function (index) {
            let cellOps;
            if (index in cellOpsMap) {
                cellOps = cellOpsMap[index];
            } else {
                cellOps = cellOpsMap[index] = {index};
            }
            cellOps[op] = i; // the greatest memory log index is used as rank
        });
    });
    return cellOpsMap;
};

// Returns a map keyed by cell index, and whose values are objects of shape
// {index, labels}, where `labels` lists the string representation of each
// cursor expression whose value is `index`.
// The `options` argument is an object with these properties:
//   minIndex, maxIndex, address, cellSize
// Only cursors whose value is in the range [minIndex, maxIndex] are considered.
// If a cursor expression evaluates to a pointer (rather than an integer),
// an index is calculated using `address` (address of cell at index 0) and
// `cellSize` (in bytes).  The calculated value is then subject to the
// minIndex/maxIndex constraint.
// If the `address` option is not given, then pointer values are not used.
export const getCursorMap = function (programState, localMap, cursorExprs, options) {
    const {minIndex, maxIndex, address, cellSize, cellSizeMod} = options;
    const allowPointers = typeof address === 'number';
    const haveCellSizeMod = typeof cellSizeMod === 'number';
    const cursorMap = [];  // spare array
    cursorExprs.forEach(function (expr) {
        let cursorValue;
        try {
            cursorValue = evalExpr(programState, localMap, expr);
        } catch (ex) {
            // TODO: return errors somehow
            //console.log('failed to evaluate cursor expression', expr, ex);
            return;
        }
        const cursorLabel = stringifyExpr(expr, 0);
        let index;
        if (cursorValue.type.kind === 'builtin') {
            index = cursorValue.toInteger();
        } else if (allowPointers && cursorValue.type.kind === 'pointer') {
            let offset = cursorValue.address - address;
            if (haveCellSizeMod) {
                offset = offset % cellSizeMod;
            }
            index = Math.floor(offset / cellSize);
        } else {
            //console.log('invalid cursor expression value', expr);
            return;
        }
        if (index >= minIndex && index <= maxIndex) {
            // We currently do not attempt to find the previous value of the cursor
            // (and when it changed).  This would requires support from evalExpr.
            if (!(index in cursorMap)) {
                cursorMap[index] = {index, labels: []};
            }
            cursorMap[index].labels.push(cursorLabel);
        }
    });
    return cursorMap;
};

// Returns an array of up to maxVisibleCells indices between 0 and elemCount
// (inclusive), prioritizing cells that have memory operations or cursors.
const getSelection = function (maxVisibleCells, elemCount, cellOpsMap, cursorMap, pointsByKind) {
    const builder = new ArrayViewBuilder(maxVisibleCells, elemCount);
    builder.addMarker(0, pointsByKind.first);
    builder.addMarker(elemCount, pointsByKind.last);
    cellOpsMap.forEach(function (ops) {
        if ('load' in ops) {
            builder.addMarker(ops.index, pointsByKind.load, ops.load);
        }
        if ('store' in ops) {
            builder.addMarker(ops.index, pointsByKind.store, ops.store);
        }
    });
    cursorMap.forEach(function (cursor) {
        builder.addMarker(cursor.index, pointsByKind.cursor);
    });
    return builder.getSelection();
};

// Finalize the cursors map.
// Each cursor is modified to contain a 'col' field giving its position in
// the selection, and a 'row' field such that adjacent cursors are on a
// different row (up to `cursorRows` rows are used).
export const finalizeCursors = function (selection, cursorMap, cursorRows) {
    const staggerAll = true; // XXX could be an option
    let nextStaggerCol, cursorRow = 0;
    selection.forEach(function (index, col) {
        if (col === undefined)
            col = index;
        if (index in cursorMap) {
            const cursor = cursorMap[index];
            if (staggerAll || col === nextStaggerCol) {
                cursorRow = (cursorRow + 1) % cursorRows;
            } else {
                cursorRow = 0;
            }
            nextStaggerCol = col + 1;
            cursor.col = col;
            cursor.row = cursorRow;
        }
    });
};
