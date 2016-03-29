
import {takeLatest} from 'redux-saga';
import {put, call} from 'redux-saga/effects';
import {asyncRequestJson} from '../api';

export default function (actions) {

  function* translateSource (action) {
    const {source} = action;
    try {
      const {ast} = yield call(asyncRequestJson, '/translate', {source});
      yield put({type: actions.translateSourceSucceeded, source, syntaxTree: ast});
    } catch (error) {
      yield put({type: actions.translateSourceFailed, error: error.toString(), source});
    }
  }

  function* watchTranslateSource () {
    yield* takeLatest(actions.translateSource, translateSource);
  }

  return [
    watchTranslateSource
  ];

};
