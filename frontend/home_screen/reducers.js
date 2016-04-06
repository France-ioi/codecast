
import Immutable from 'immutable';

import Document from '../document';

const initialDocument = Document.fromString("int main (int argc, char** argv) {\n    int b = 1;\n    for (int a = 1; a < 1000000; a += 1) {\n        b = b * a;\n        printf(\"%d\\n\", b);\n    }\n    return 1;\n}\n");
const initialSelection = {start: {row: 2, column: 24}, end: {row: 2, column: 31}};
const initialSource = Immutable.Map({document: initialDocument, selection: initialSelection});

export function homeNewRecording (state, action) {
  return state
    .set('prepare', Immutable.Map({source: initialSource}))
    .set('screen', 'prepare');
};
