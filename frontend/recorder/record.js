
import {call} from 'redux-saga/effects';

export default function (bundle, deps) {

  /* Recorder API */
  const record = {};
  bundle.defineValue('record', record);

  /* Sagas can be registered to run when recording starts, to populate an
     'init' object which is stored in the 'start' event of the recording. */
  const startSagas = [];
  record.onStart = function (saga) {
    startSagas.push(saga);
  };
  record.start = function* (init) {
    for (var saga of startSagas) {
      yield call(saga, init);
    }
  };

  /* For each redux action a single saga handler(addEvent, action) can be
     registered to add an event to the recorded stream. */
  const actionHandlers = new Map();
  record.on = function (actionType, handler) {
    if (actionHandlers.has(actionType)) {
      throw new Error(`multiple record handlers for ${actionType}`);
    }
    actionHandlers.set(actionType, handler);
  };
  record.recordAction = function* (action) {
    if (actionHandlers.has(action.type)) {
      const timestamp = Math.round(context.audioContext.currentTime * 1000);
      function* addEvent (name, ...args) {
        const event = [timestamp, name, ...args];
        yield put({type: deps.recorderAddEvent, event});
      }
      yield call(recordHandlers.get(action.type), addEvent, action);
    }
  };
  bundle.defineAction('recorderAddEvent', 'Recorder.AddEvent');
  bundle.addReducer('recorderAddEvent', function (state, action) {
    const {event} = action;
    return state.updateIn(['recorder', 'events'], events => events.push(event));
  });

};
