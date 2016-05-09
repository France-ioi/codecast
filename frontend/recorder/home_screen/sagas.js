
import {take, put} from 'redux-saga/effects';

export default function (m) {

  const {actions} = m;

  m.saga(function* watchNewRecording () {
    while (true) {
      yield take(actions.homeNewRecording);
      yield put({type: actions.prepareScreenInit});
      yield put({type: actions.switchToScreen, screen: 'prepare'});
    }
  });

};
