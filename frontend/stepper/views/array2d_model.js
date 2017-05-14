
import * as C from 'persistent-c';

import {readScalarBasic, stringifyExpr, evalExpr} from './utils';
import {getCursorMap} from './array_utils';

export const extractView = function (context, frame, refExpr, view) {
  const {core} = context;
  const localMap = frame.get('localMap');
  let ref;
  try {
    ref = evalExpr(core, localMap, refExpr, false);
  } catch (ex) {
    return {error: `expression ${stringifyExpr(refExpr)} has no value (${ex})`};
  }
  // By the array-value decaying rule, ref should be a pointer.
  if (ref.type.kind !== 'pointer') {
    return {error: `expression ${stringifyExpr(refExpr)} is not a pointer`};
  }
  const arrayType = ref.type.orig;
  if (arrayType === undefined || arrayType.kind !== 'array') {
    return {error: `expression ${stringifyExpr(refExpr)} is not an array`};
  }
  const rowCount = arrayType.count.toInteger();
  const rowType = arrayType.elem;
  if (rowType.kind !== 'array') {
    return {error: `expression ${stringifyExpr(refExpr)} is not a 2D array`};
  }
  const colCount = rowType.count.toInteger();
  const cellType = rowType.elem;
  if (cellType.kind !== 'builtin') {
    return {error: `elements of 2D array ${stringifyExpr(refExpr)} have an unsupported type`};
  }
  // Read the cells.
  const rows = readArray2D(context, arrayType, ref.address, rowCount, colCount, cellType);
  // Inspect cursors.
  const rowInfoMap = getCursorMap(core, localMap, view.rowCursors,
    {
      minIndex: 0,
      maxIndex: rowCount + 1,
      address: ref.address,
      cellSize: rowType.size
    });
  const colInfoMap = getCursorMap(core, localMap, view.colCursors,
    {
      minIndex: 0,
      maxIndex: colCount + 1,
      address: ref.address,
      cellSize: cellType.size,
      cellSizeMod: rowType.size
    });
  // Stagger adjacent column cursors.
  let nextStaggerPos, cursorRow = 0;
  for (let index in colInfoMap) {
    const cursor = colInfoMap[index];
    if (nextStaggerPos === cursor.index) {
      cursorRow = (cursorRow + 1) % colCursorRows;
    } else {
      cursorRow = 0;
    }
    nextStaggerPos = cursor.index + 1;
    cursor.row = cursorRow;
  }
  return {rows, rowCount, colCount, rowInfoMap, colInfoMap};
};

/* Returns a function that takes a ref and a callback and calls the callback
   with arguments (row, col) for each cell of the array (described by arrayBase,
   nRows, nCols, and cellSize) that the ref intersects.
 */
const mapArray2D = function (arrayBase, nRows, nCols, cellSize) {
  const rowSize = nCols * cellSize;
  const arrayLimit = arrayBase + (nRows * rowSize) - 1;
  return function (ref, callback) {
    // Skip if [array] < [ref]
    const {address, type} = ref;
    if (arrayLimit < address) return;
    // Skip if [ref] < [array]
    const refLimit = address + type.pointee.size - 1;
    if (refLimit < arrayBase) return;
    // Clip ref to within array region.
    const startAddress = Math.max(arrayBase, address);
    const endAddress = Math.min(arrayLimit, refLimit);
    let row = Math.floor((startAddress - arrayBase) / rowSize);
    let col = Math.floor((startAddress - row * rowSize) / cellSize) % nCols;
    let cellLimit = arrayBase + row * rowSize + col * cellSize + cellSize - 1;
    while (cellLimit <= endAddress) {
      callback(row, col);
      col += 1;
      if (col === nCols) {
        col = 0;
        row += 1;
      }
      cellLimit += cellSize;
    }
  };
};

// Returns a map keyed by `${row},${col}` whose values are objects giving
// the greatest rank in the memory log of a 'load' or 'store' operation.
const getOpsArray2D = function (core, address, nRows, nCols, cellSize) {
  // Go through the memory log, translate memory-operation references into
  // (row, col) pairs, and save the cell load/store operations in cellOpsMap.
  const cellOpsMap = [];
  const forEachCell = mapArray2D(address, nRows, nCols, cellSize);
  core.memoryLog.forEach(function (entry, i) {
    const op = entry[0]; // 'load' or 'store'
    forEachCell(entry[1], function (row, col) {
      const key = `${row},${col}`;
      let cellOps;
      if (key in cellOpsMap) {
        cellOps = cellOpsMap[key];
      } else {
        cellOps = cellOpsMap[key] = {key};
      }
      cellOps[op] = i
    });
  });
  return cellOpsMap;
};

// Read all cells of a 2D array, returning an array of objects each representing
// a row with properties {index, address, content}, where `content` is array of
// objects each representing a cell with keys {index,address,content},
// where `content` is as the documented result of `readScalar`.
const readArray2D = function (context, arrayType, address, rowCount, colCount, cellType) {
  const {core, oldCore} = context;
  const cellSize = cellType.size;
  const mops = getOpsArray2D(core, address, rowCount, colCount, cellSize);
  const rowSize = colCount * cellSize;
  const cellRefType = C.pointerType(cellType);
  const rows = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = [];
    const rowAddress = address + rowIndex * rowSize;
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const cellAddress = rowAddress + colIndex * cellSize;
      const content = readScalarBasic(core, cellRefType, cellAddress);
      const key = `${rowIndex},${colIndex}`;
      if (key in mops) {
        const mop = mops[key];
        if ('load' in mop) {
          content.load = mop.load;
        }
        if ('store' in mop) {
          content.store = mop.store;
          content.previous = C.readValue(oldCore, content.ref);
        }
      }
      row.push({index: colIndex, address: cellAddress, key, content});
    }
    rows.push({index: rowIndex, address: rowAddress, content: row});
  }
  return rows;
};
