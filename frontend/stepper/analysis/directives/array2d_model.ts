import {DirectiveVariableName, getVariable} from './utils';
import {getCursorMap} from './array_utils';
import {getMessage} from "../../../lang";
import {LayoutDirectiveContext} from '../../../task/layout/LayoutDirective';

export const extractView = function (context: LayoutDirectiveContext, name: DirectiveVariableName, options) {
    const ref = getVariable(context, name);
    if (!ref) {
        return {error: getMessage('ARRAY2D_REF_UNDEFINED').format({name})};
    }

    if (!ref.variables) {
        return {error: getMessage('ARRAY2D_REF_NOT_LIST').format({name})};
    }

    const rowCount = (options.rowCount) ? options.rowCount : ref.variables.length;
    const colCount = (options.colCount) ? options.colCount : ref.variables[0].variables.length;

    // Inspect cursors.
    const rowInfoMap = getCursorMap(context, options.rowCursors, {
        minIndex: 0,
        maxIndex: rowCount + 1
    });
    const colInfoMap = getCursorMap(context, options.colCursors, {
        minIndex: 0,
        maxIndex: colCount + 1
    });

    // Stagger adjacent column cursors.
    let nextStaggerPos = -1, cursorRow = 0;
    const colCursorRows = 2;
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

    return {
        ref,
        rowCount,
        colCount,
        rowInfoMap,
        colInfoMap,
    };
};
