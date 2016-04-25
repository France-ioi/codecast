
import Immutable from 'immutable';

import Document from '../common/document';

// const initialDocument = Document.fromString("int main (int argc, char** argv) {\n    //! showVar(b)\n    int b = 1;\n    for (int a = 1; a < 1000000; a += 1) {\n        b = b * a;\n        printf(\"%d\\n\", b);\n    }\n    return 1;\n}\n");
// const initialSelection = {start: {row: 2, column: 24}, end: {row: 2, column: 31}};
// const initialDocument = Document.fromString("int main() {\n    //! showArray(a, cursors=[i])\n    int i;\n    int a[8];\n    a[0] = 1;\n    for (i = 1; i < 8; i++) {\n        a[i] = a[i - 1] * 2;\n    }\n    for (i = 0; i < 8; i++) {\n        printf(\"a[%i] = %i\\n\", i, a[i]);\n    }\n}\n");
const initialDocument = Document.fromString([
  "extern int printf (const char *, ...);",
  "extern int scanf (const char *restrict, ...);",
  "int main() {",
  "    int a, n;",
  "    printf(\"Entrez un nombre:\\n\");",
  "    n = scanf(\"%d\", &a);",
  "    if (n == 1) {",
  "        printf(\"Vous avez saisi %d\\n\", a);",
  "    } else {",
  "        printf(\"Pas de valeur!\\n\");",
  "    }",
  "    return 0;",
  "}"
].join('\n'));
const startOfBuffer = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
const initialSource = Immutable.Map({document: initialDocument, selection: startOfBuffer});
const initialInput = Immutable.Map({document: Document.fromString(""), selection: startOfBuffer});

export function prepareScreenInit (state, action) {
  return state.set('prepare', Immutable.Map({
    source: initialSource,
    input: initialInput
  }))
};

export function prepareScreenSourceEdit (state, action) {
  const prevSource = state.getIn(['prepare', 'source', 'document']);
  const source = Document.applyDelta(prevSource, action.delta);
  return state.setIn(['prepare', 'source', 'document'], source);
};

export function prepareScreenSourceSelect (state, action) {
  return state.setIn(['prepare', 'source', 'selection'], action.selection);
};
