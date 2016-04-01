
import {takeLatest} from 'redux-saga';
import {put, call} from 'redux-saga/effects';

import {asyncRequestJson} from '../api';
import {recordEventAction} from '../recorder';

export default function (actions) {

  function* translateSource (action) {
    const {source} = action;
    try {
      yield put(recordEventAction(['translate', source]));
      const {ast} = yield call(asyncRequestJson, '/translate', {source});
      yield put({type: actions.translateSourceSucceeded, source, syntaxTree: ast});
      yield put(recordEventAction(['translateSuccess', ast]));
    } catch (error) {
      const message = error.toString();
      yield put({type: actions.translateSourceFailed, error: message, source});
      yield put(recordEventAction(['translateFailure', message]));
    }
  }

  function* watchTranslateSource () {
    yield* takeLatest(actions.translateSource, translateSource);
  }

  return [
    watchTranslateSource
  ];

};
