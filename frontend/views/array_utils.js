
import * as C from 'persistent-c';
import {FibonacciHeap} from 'js-data-structures';
import range from 'node-range';

import {readScalarBasic, viewVariable} from './utils';

/**

  extractView(core, frame, name, options) looks up `name` in `frame` and
  builds a view depending on the `options` given.

  TODO: look up in in globals if `name` not defined in `frame`.

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

  If `options` contains a `cursorNames` property (array of strings representing
  variable names in the current `frame`), the `cursors` property in the result
  is an array of cursor objects of this shape:

    {cursors, index, row, col}

  where

    `index`   is the index of the cursors the array
    `cursors` is a list of the cursor names at the given index
    `col`     is the position of the cursor in `cells`
    `row`     is such that adjacent cursors are on different rows
              (up to `options.cursorRows` rows are used)

*/
export const extractView = function (core, frame, name, options) {
  // Normalize options.
  const {fullView} = options;
  let {cursorNames, cursorRows, maxVisibleCells, pointsByKind} = options;
  let elemCount = options.dim;
  if (cursorNames === undefined) {
    cursorNames = [];
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
  // TODO: look up `name` in globals if frames.length === 0
  const localMap = frame.get('localMap');
  if (!localMap.has(name)) {
    return {error: `${name} not in scope`};
  }
  const {type, ref} = localMap.get(name);
  let address, elemType;
  if (type.kind === 'array') {
    // Array variable.
    elemType = type.elem;
    address = ref.address;
    if (elemCount === undefined && type.count !== undefined) {
      elemCount = type.count.toInteger();
    }
    if (elemCount === undefined) {
      // Make up a sensible elemCount.
      elemCount = Math.floor(128 / type.elem.size);
    }
  } else if (type.kind === 'pointer') {
    // Pointer variable.
    elemType = type.pointee;
    address = C.readValue(core.memory, ref).address;
    if (elemCount === undefined) {
      // Make up a sensible elemCount.
      elemCount = Math.floor(128 / type.pointee.size);
    }
  } else {
    return {error: "variable is neither an array nor a pointer"};
  }
  const cellOpsMap = getCellOpsMap(core, address, elemCount, elemType.size);
  const cursorMap = getCursorMap(core, cursorNames, 0, elemCount, localMap);
  const selection =
    fullView
      ? range(0, elemCount + 1)
      : getSelection(maxVisibleCells, elemCount, cellOpsMap, cursorMap, pointsByKind);
  const cells = readArray1D(core, address, elemType, elemCount, selection, cellOpsMap);
  const cursors = getCursors(selection, cursorMap, cursorRows);
  return {cells, cursors};
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

   function addPointsAndRank (index, points, rank) {
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
      const heap = new FibonacciHeap(compareHeapNodes);
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
const findInsertionIndex = function (element, array, comparer) {
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

const compareHeapNodes = function (a, b) {
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

export const getArrayMapper1D = function (arrayBase, elemCount, elemSize) {
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

// Read an 1D array of scalars.
export const readArray1D = function (core, arrayBase, elemType, elemCount, selection, mops) {
  const elemSize = elemType.size;
  const elemRefType = C.pointerType(elemType);
  // TODO: check that elemType is scalar
  const cells = [];
  if (selection === undefined) {
    selection = range(0, elemCount + 1);
  }
  selection.forEach(function (index, position) {
    if (position === undefined)
      position = index;
    if (index === '…') {
      cells.push({position, gap: true});
    } else {
      const elemAddress = arrayBase + index * elemSize;
      const cell = {position, index, address: elemAddress};
      if (index >= 0 && index < elemCount) {
        const content = readScalarBasic(core.memory, elemRefType, elemAddress);
        if (index in mops) {
          const mop = mops[index];
          if ('load' in mop) {
            content.load = mop.load;
          }
          if ('store' in mop) {
            content.store = mop.store;
            content.previous = C.readValue(core.oldMemory, content.ref);
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
const getCellOpsMap = function (core, address, elemCount, elemSize) {
  // Go through the memory log, translate memory-operation references into
  // array cells indexes, and save the cell load/store operations in cellOps.
  const cellOpsMap = [];
  const forEachCell = getArrayMapper1D(address, elemCount, elemSize);
  core.memoryLog.forEach(function (entry, i) {
    const op = entry[0]; // 'load' or 'store'
    forEachCell(entry[1], function (index) {
      let cellOps;
      if (index in cellOpsMap) {
        cellOps = cellOpsMap[index];
      } else {
        cellOps = cellOpsMap[index] = {};
      }
      cellOps[op] = i; // the greatest memory log index is used as rank
    });
  });
  return cellOpsMap;
};

// Returns a map keyed by cell index, and whose values are objects of shape
// {index, cursors}, where cursors lists the cursor names pointing to the
// cell.
// Only cursors whose value is in the range [minVal, maxVal] are included.
export const getCursorMap =  function (core, cursorNames, minVal, maxVal, localMap) {
  const cursorMap = [];
  cursorNames.forEach(function (cursorName) {
    if (localMap.has(cursorName)) {
      const {type, ref} = localMap.get(cursorName);
      const decl = viewVariable(core, cursorName, type, ref.address);
      const cursorPos = decl.value.current.toInteger();
      if (cursorPos >= minVal && cursorPos <= maxVal) {
        const cursor = {name: cursorName};
        if ('store' in decl.value) {
          const cursorPrevPos = decl.value.previous.toInteger();
          if (cursorPrevPos >= minVal && cursorPrevPos <= maxVal) {
            cursor.prev = cursorPrevPos;
          }
        }
        // Add cursor to position's cursors list.
        if (!(cursorPos in cursorMap)) {
          cursorMap[cursorPos] = {index: cursorPos, cursors: [], row: 0};
        }
        cursorMap[cursorPos].cursors.push(cursor);
      }
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
  cellOpsMap.forEach(function (ops, index) {
    if ('load' in ops) {
      builder.addMarker(index, pointsByKind.load, ops.load);
    }
    if ('store' in ops) {
      builder.addMarker(index, pointsByKind.store, ops.store);
    }
  });
  cursorMap.forEach(function (cursor, cursorPos) {
    builder.addMarker(cursorPos, pointsByKind.cursor);
  });
  return builder.getSelection();
};

// Returns an array of cursor objects within the selection.
// Each cursor is modified to contain a 'col' field giving its position in
// the selection, and a 'row' field such that adjacent cursors in the result
// are on a different row.
export const getCursors = function (selection, cursorMap, cursorRows) {
  const cursors = [];
  let nextStaggerCol, cursorRow = 0;
  selection.forEach(function (index, col) {
    if (col === undefined)
      col = index;
    if (index in cursorMap) {
      const cursor = cursorMap[index];
      if (col === nextStaggerCol) {
        cursorRow = (cursorRow + 1) % cursorRows;
      } else {
        cursorRow = 0;
      }
      nextStaggerCol = col + 1;
      cursor.col = col;
      cursor.row = cursorRow;
      cursors.push(cursor);
    }
  });
  return cursors;
};

