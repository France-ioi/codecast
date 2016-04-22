
import {take, put} from 'redux-saga/effects';

export default function (actions) {

  function* watchNewRecording () {
    while (true) {
      yield take(actions.homeNewRecording);
      yield put({type: actions.prepareScreenInit});
      yield put({type: actions.switchToScreen, screen: 'prepare'});
    }
  }

  return [
    watchNewRecording
  ];

};
