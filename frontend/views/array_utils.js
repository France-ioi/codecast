
import {FibonacciHeap} from 'js-data-structures';

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

   // Number of points given to each marker kind.
   this.pointsByKind = {
      cursor: 300,
      write: 100,
      read: 50,
      first: 25,
      last: 20
   };

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
      cell.points += points;
      // Keep track of the greatest rank, if provided.
      if (rank !== undefined) {
         cell.rank = Maths.max(cell.rank, rank);
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
   return 0;
};
