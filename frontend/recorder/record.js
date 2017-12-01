/*
  Record API

  Workflow:

  - onStart callbacks populate an 'init' object (recorded in the start event)
    to take a snapshot of the state when recording starts

  - each redux action can be associated with a saga to add events to the
    recording

*/

import {put, take, call, select, actionChannel} from 'redux-saga/effects';

import {RECORDING_FORMAT_VERSION} from '../version';

export default function (bundle, deps) {

  /* Recorder API */
  const recordApi = {};
  bundle.defineValue('recordApi', recordApi);

  /* Sagas can be registered to run when recording starts, to populate an
     'init' object which is stored in the 'start' event of the recording. */
  const startSagas = [];
  recordApi.onStart = function (saga) {
    startSagas.push(saga);
  };
  recordApi.start = function* () {
    const init = {};
    for (var saga of startSagas) {
      yield call(saga, init);
    }
    const event = [0, 'start', init];
    yield put({type: deps.recorderAddEvent, event});
  };

  /* For each redux action a single saga handler(addEvent, action) can be
     registered to add an event to the recorded stream. */
  const actionHandlers = new Map();
  recordApi.on = function (actionType, handler) {
    if (actionHandlers.has(actionType)) {
      throw new Error(`multiple record handlers for ${actionType}`);
    }
    actionHandlers.set(actionType, handler);
  };
  bundle.defineAction('recorderAddEvent', 'Recorder.AddEvent');
  bundle.addReducer('recorderAddEvent', function (state, action) {
    const {event} = action;
    return state.updateIn(['recorder', 'events'], events => events.push(event));
  });


  // Truncate the event stream at the given position (milliseconds).
  bundle.defineAction('recorderTruncate', 'Recorder.Truncate');
  bundle.addReducer('recorderTruncate', function (state, {payload: {position, timestamp}}) {
    return state.update('recorder', recorder => recorder
      .update('events', events => events.slice(0, position))
      .set('eventRef', timestamp)
    );
  });

  function findEventIndex (events, timestamp) {
    let low = 0, high = events.size;
    while (low + 1 < high) {
      const mid = (low + high) / 2 | 0;
      const event = events.get(mid);
      if (event[0] <= timestamp) {
        low = mid;
      } else {
        high = mid;
      }
    }
    let event = events.get(low);
    if (event) {
      while (low + 1 < events.size) {
        const nextEvent = events.get(low + 1);
        if (nextEvent[0] !== event[0])
          break;
        low += 1;
      }
    }
    return low;
  }

  bundle.use('recorderReady', 'recorderStarted')
  bundle.addSaga(function* recordEvents () {
    const pattern = Array.from(actionHandlers.keys());
    while (true) {
      // Wait for the recorder to be ready, grab the context.
      const {context} = yield take(deps.recorderReady);
      // Wait for recording to actually start.
      yield take(deps.recorderStarted);
      // Start buffering actions.
      const channel = yield actionChannel(pattern);
      let done = false;
      while (!done) {
        const action = yield take(channel);
        const recorder = yield select(st => st.get('recorder'));
        const status = recorder.get('status');
        if (status !== 'recording') {
          // Ignore events fired while not recording.
          continue;
        }
        const offset = recorder.get('eventRef') - recorder.get('audioRef');
        const timestamp = Math.round(context.audioContext.currentTime * 1000);
        function* addEvent (name, ...args) {
          const event = [timestamp + offset, name, ...args];
          yield put({type: deps.recorderAddEvent, event});
          if (name === 'end') {
            done = true;
          }
        }
        yield call(actionHandlers.get(action.type), addEvent, action);
      }
      channel.close();
    }
  });

};
