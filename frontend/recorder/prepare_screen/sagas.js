
import {take, put, select} from 'redux-saga/effects';

import Document from '../../common/document';

export default function (actions, selectors) {

  function* watchNewRecording () {
    // XXX move to home screen?
    while (true) {
      yield take(actions.homeNewRecording);
      yield put({type: actions.prepareScreenInit});
      yield put({type: actions.switchToScreen, screen: 'prepare'});
    }
  }

  function* watchSourceInit () {
    while (true) {
      const {editor} = yield take(actions.prepareScreenSourceInit);
      if (editor) {
        const source = yield select(selectors.getPreparedSource);
        const text = Document.toString(source.get('document'));
        const selection = source.get('selection');
        editor.reset(text, selection);
      }
    }
  }

  function* watchExampleSelected () {
    while (true) {
      const {example} = yield take(actions.prepareScreenExampleSelected);
      const source = yield select(selectors.getPreparedSource);
      const editor = source.get('editor');
      if (editor) {
        const text = example.source;
        const selection = example.selection || {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
        editor.reset(text, selection);
      }
    }
  }

  return [
    watchNewRecording,
    watchSourceInit,
    watchExampleSelected
  ];

};
