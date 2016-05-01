
import {take, select} from 'redux-saga/effects';

import Document from './document';

export default function (actions, selectors) {

  const {getSource, getInput} = selectors;

  function* watchError () {
    while (true) {
      const action = yield take(actions.error);
      console.error('error', action);
    }
  }

  function* watchSourceInit () {
    while (true) {
      const {editor} = yield take(actions.sourceInit);
      if (editor) {
        const source = yield select(getSource);
        const text = Document.toString(source.get('document'));
        const selection = source.get('selection');
        try {
          editor.reset(text, selection);
        } catch (error) {
          console.log(error); // XXX
        }
      }
    }
  }

  function* watchInputInit () {
    while (true) {
      const {editor} = yield take(actions.inputInit);
      if (editor) {
        const input = yield select(getInput);
        const text = Document.toString(input.get('document'));
        const selection = input.get('selection');
        try {
          editor.reset(text, selection);
        } catch (error) {
          console.log(error) // XXX
        }
      }
    }
  }

  return [
    watchError,
    watchSourceInit,
    watchInputInit
  ];

};
