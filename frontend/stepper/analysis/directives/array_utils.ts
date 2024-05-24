import range from 'node-range';

import {DirectiveVariableName} from './utils';
import {getMessage} from "../../../lang";
import {LayoutDirectiveContext} from '../../../task/layout/LayoutDirective';
import {stringifyExpr} from '../../views/c/utils';

/**
 extractView(context, name, options) looks up `name` in `stackFrame` and
 builds a view depending on the `options` given.

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
export const extractView = function (context: LayoutDirectiveContext, name, options) {
    // Normalize options.
    const {dim} = options;
    let {cursors, cursorRows, maxVisibleCells, pointsByKind, thresholds} = options;
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
            const dimVariable = context.variableFetcher.getVariable(context, dim);
            if (dimVariable && dimVariable.value) {
                elemCount = Number(dimVariable.value);
            } else {
                return {error: getMessage('ARRAY1D_DIM_INVALID').format({dim: stringifyExpr(dim)})};
            }
        }
    }

    const ref = context.variableFetcher.getVariable(context, name, elemCount);
    if (!ref) {
        return {error: getMessage('ARRAY1D_REF_UNDEFINED').format({name: context.variableFetcher.stringifyVariableName(name)})};
    }

    if (!ref.variables) {
        return {error: getMessage('ARRAY1D_REF_NOT_LIST').format({name: context.variableFetcher.stringifyVariableName(name)})};
    }

    if (elemCount === undefined) {
        elemCount = ref.variables.length;
    }

    const cursorMap = getCursorMap(context, cursors, {
        minIndex: 0,
        maxIndex: elemCount
    });

    const thresholdsMap = thresholds ? getCursorMap(context, thresholds, {}) : [];

    const selection = range(0, elemCount + 1);
    finalizeCursors(selection, cursorMap, cursorRows);

    return {
        ref,
        cursorMap,
        thresholdsMap,
    };
};

// Returns a map keyed by cell index, and whose values are objects of shape
// {index, labels}, where `labels` lists the string representation of each
// cursor expression whose value is `index`.
// The `options` argument is an object with these properties:
//   minIndex, maxIndex
// Only cursors whose value is in the range [minIndex, maxIndex] are considered.
// The calculated value is then subject to the minIndex/maxIndex constraint.
export const getCursorMap = function (context: LayoutDirectiveContext, cursorNames: DirectiveVariableName[], options) {
    const {minIndex, maxIndex} = options;
    const cursorMap = [];  // spare array

    cursorNames.forEach(function(name) {
        const cursorVariable = context.variableFetcher.getVariable(context, name);
        if (!cursorVariable) {
            return;
        }

        if ('int' !== cursorVariable.type) {
            return;
        }

        const cursorLabel = context.variableFetcher.stringifyVariableName(name);

        const index = cursorVariable.value;

        if (undefined === minIndex || undefined === maxIndex || (index >= minIndex && index <= maxIndex)) {
            if (!(index in cursorMap)) {
                cursorMap[index] = {
                    index,
                    labels: [],
                };
            }

            cursorMap[index].labels.push(cursorLabel);
        }
    });

    return cursorMap;
};

// Finalize the cursors map.
// Each cursor is modified to contain a 'col' field giving its position in
// the selection, and a 'row' field such that adjacent cursors are on a
// different row (up to `cursorRows` rows are used).
export const finalizeCursors = function(selection, cursorMap, cursorRows) {
    const staggerAll = true; // XXX could be an option
    let nextStaggerCol, cursorRow = 0;
    selection.forEach(function(index, col) {
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
