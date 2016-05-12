
import {take} from 'redux-saga/effects';
import {use, addSaga} from '../utils/linker';

export default function* (deps) {

  yield use('error');

  yield addSaga(function* watchError () {
    while (true) {
      const action = yield take(deps.error);
      // TODO: display a notification rather than a console message.
      console.error('error', action);
    }
  });

};
