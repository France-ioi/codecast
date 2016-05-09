
import {take, select} from 'redux-saga/effects';

import Document from '../utils/document';

export default function (m) {

  const {actions, selectors} = m;

  m.saga(function* watchError () {
    while (true) {
      const action = yield take(actions.error);
      console.error('error', action);
    }
  });

  m.saga(function* watchSourceInit () {
    while (true) {
      const {editor} = yield take(actions.sourceInit);
      if (editor) {
        const source = yield select(selectors.getSource);
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

  m.saga(function* watchInputInit () {
    while (true) {
      const {editor} = yield take(actions.inputInit);
      if (editor) {
        const input = yield select(selectors.getInput);
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
