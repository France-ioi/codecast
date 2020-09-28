import {getVariable, stringifyExpr} from './utils';
import {getCursorMap} from './array_utils';

export const extractView = function (context, name, options) {
  const {getMessage, rowCount, colCount} = options;
  const {analysis} = context;
  const localMap = null;

  const ref = getVariable(analysis, name);
  if (!ref) {
    return {error: getMessage('PYTHON_ARRAY2D_REF_UNDEFINED').format({name: stringifyExpr(name)})};
  }

  if (!(ref.cur instanceof Sk.builtin.list)) {
    return {error: getMessage('PYTHON_ARRAY2D_REF_NOT_LIST').format({name: stringifyExpr(name)})};
  }

  // Inspect cursors.
  const rowInfoMap = getCursorMap(analysis, localMap, options.rowCursors, {
    minIndex: 0,
    maxIndex: rowCount + 1
  });
  const colInfoMap = getCursorMap(analysis, localMap, options.colCursors, {
    minIndex: 0,
    maxIndex: colCount + 1
  });

  return {ref, rowCount, colCount, rowInfoMap, colInfoMap};
};
