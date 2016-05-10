
import {take, select} from 'redux-saga/effects';
import {use, addSaga} from '../utils/linker';

import Document from '../utils/document';

export default function* (deps) {

  yield use('error', 'sourceInit', 'getSource', 'inputInit', 'getInput');

  yield addSaga(function* watchError () {
    while (true) {
      const action = yield take(deps.error);
      console.error('error', action);
    }
  });

  yield addSaga(function* watchSourceInit () {
    while (true) {
      const {editor} = yield take(deps.sourceInit);
      if (editor) {
        const source = yield select(deps.getSource);
        const text = Document.toString(source.get('document'));
        const selection = source.get('selection');
        try {
          editor.reset(text, selection);
        } catch (error) {
          console.log(error); // XXX
        }
      }
    }
  });

  yield addSaga(function* watchInputInit () {
    while (true) {
      const {editor} = yield take(deps.inputInit);
      if (editor) {
        const input = yield select(deps.getInput);
        const text = Document.toString(input.get('document'));
        const selection = input.get('selection');
        try {
          editor.reset(text, selection);
        } catch (error) {
          console.log(error) // XXX
        }
      }
    }
  });

};
