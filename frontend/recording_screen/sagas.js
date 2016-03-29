
import {takeEvery} from 'redux-saga';
import {take, put, race, delay} from 'redux-saga/effects';

export default function (actions) {

  function* translateSourceSucceeded (action) {
    // Restart the stepper whenever a new source code has been translated.
    yield put({type: actions.recordingScreenStepperRestart});
  }

  function* watchTranslateSourceSucceeded () {
    yield* takeEvery(actions.translateSourceSucceeded, translateSourceSucceeded);
  }

  return [
    watchTranslateSourceSucceeded
  ];

};
