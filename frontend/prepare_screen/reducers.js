
import Immutable from 'immutable';

import Document from '../common/document';

// const initialDocument = Document.fromString("int main (int argc, char** argv) {\n    //! showVar(b)\n    int b = 1;\n    for (int a = 1; a < 1000000; a += 1) {\n        b = b * a;\n        printf(\"%d\\n\", b);\n    }\n    return 1;\n}\n");
// const initialSelection = {start: {row: 2, column: 24}, end: {row: 2, column: 31}};
const initialDocument = Document.fromString("int main() {\n    //! showArray(a, cursors=[i])\n    int i;\n    int a[8];\n    a[0] = 1;\n    for (i = 1; i < 8; i++) {\n        a[i] = a[i - 1] * 2;\n    }\n    for (i = 0; i < 8; i++) {\n        printf(\"a[%i] = %i\\n\", i, a[i]);\n    }\n}\n");
const initialSelection = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
const initialSource = Immutable.Map({document: initialDocument, selection: initialSelection});

export function prepareScreenInit (state, action) {
  return state.set('prepare', Immutable.Map({source: initialSource}))
};

export function prepareScreenSourceEdit (state, action) {
  const prevSource = state.getIn(['prepare', 'source', 'document']);
  const source = Document.applyDelta(prevSource, action.delta);
  return state.setIn(['prepare', 'source', 'document'], source);
};

export function prepareScreenSourceSelect (state, action) {
  return state.setIn(['prepare', 'source', 'selection'], action.selection);
};
