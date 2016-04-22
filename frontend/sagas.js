
import {take} from 'redux-saga/effects';

export default function (actions) {

  function* watchError () {
    while (true) {
      const action = yield take(actions.error);
      console.error('error', action);
    }
  }

  return [
    watchError
  ];

};
