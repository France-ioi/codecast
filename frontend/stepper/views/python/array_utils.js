import FibonacciHeap from '@tyriar/fibonacci-heap';
import range from 'node-range';

import {stringifyExpr, getVariable, getLoadedReferencesFromVariable} from './utils';

/**
  extractView(context, name, options) looks up `name` in `stackFrame` and
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

  If `options` contains a `cursors` property (array of expressions evaluated
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
export const extractView = function (context, name, options) {
  const {analysis} = context;

  // Normalize options.
  const {fullView, dim} = options;
  let {cursors, cursorRows, maxVisibleCells, pointsByKind, getMessage} = options;
  if (cursors === undefined) {
    cursors = [];
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

  // Evaluate "dim" if given.
  let elemCount;
  if (dim) {
    if (/^\d/.test(dim)) {
        elemCount = dim;
    } else {
        const dimVariable = getVariable(analysis, dim);
        if (dimVariable && dimVariable.cur) {
            elemCount = dimVariable.cur.v;
        }
    }
  }

  const ref = getVariable(analysis, name);
  if (!ref) {
    return {error: getMessage('PYTHON_ARRAY1D_REF_UNDEFINED').format({name: stringifyExpr(name)})};
  }

  if (!(ref.cur instanceof Sk.builtin.list)) {
    return {error: getMessage('PYTHON_ARRAY1D_REF_NOT_LIST').format({name: stringifyExpr(name)})};
  }

  if (elemCount === undefined) {
    elemCount = ref.cur.v.length;
  }

  const cursorMap = getCursorMap(analysis, cursors, {
      minIndex: 0,
      maxIndex: elemCount
  });
  const selection =
    fullView
      ? range(0, elemCount + 1)
      : getSelection(maxVisibleCells, elemCount, cursorMap, pointsByKind);

  finalizeCursors(selection, cursorMap, cursorRows);

  return {
      ref,
      cursorMap,
      loadedReferences: getLoadedReferencesFromVariable(analysis, name)
  };
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
         let {index} = node.key;
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
            const filler = result[i] === nextIndex + 1 ? nextIndex : '…'; // TODO: Is this useful ?
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

// Returns a map keyed by cell index, and whose values are objects of shape
// {index, labels}, where `labels` lists the string representation of each
// cursor expression whose value is `index`.
// The `options` argument is an object with these properties:
//   minIndex, maxIndex
// Only cursors whose value is in the range [minIndex, maxIndex] are considered.
// The calculated value is then subject to the minIndex/maxIndex constraint.
export const getCursorMap = function (analysis, cursorNames, options) {
  const {minIndex, maxIndex} = options;
  const cursorMap = [];  // spare array

  cursorNames.forEach(function(name) {
    const cursorVariable = getVariable(analysis, name);
    if (!cursorVariable) {
        return;
    }

    if (!(cursorVariable.cur instanceof Sk.builtin.int_)) {
        return;
    }

    const index = cursorVariable.cur.v;

    if (index >= minIndex && index <= maxIndex) {
      // TODO: We currently do not attempt to find the previous value of the cursor (and when it changed) ?
      if (!(index in cursorMap)) {
        cursorMap[index] = {
            index,
            labels: []
        };
      }

      cursorMap[index].labels.push(name);
    }
  });

  return cursorMap;
};

// Returns an array of up to maxVisibleCells indices between 0 and elemCount
// (inclusive), prioritizing cells that have memory operations or cursors.
const getSelection = function (maxVisibleCells, elemCount, cursorMap, pointsByKind) {
  const builder = new ArrayViewBuilder(maxVisibleCells, elemCount);

  builder.addMarker(0, pointsByKind.first);
  builder.addMarker(elemCount, pointsByKind.last);

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
    if (col === undefined) {
        col = index;
    }
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
