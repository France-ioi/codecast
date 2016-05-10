
import Immutable from 'immutable';

import {addReducer} from '../utils/linker';

/*

  shape of state.recorder:
  {
    state: /preparing|ready|starting|start_failed|stopping/,
    source: {document, selection},
    stepper: {state, compute, display},
    startTime,
    timeOffset,
    lastEventTime,
    events: [[timestamp, ...payload]],
    elapsed
  }

*/

export default function* () {

  yield addReducer('switchToRecordScreen', function (state, action) {
    return state.set('screen', 'record')
                .set('source', Immutable.Map(action.source))
                .set('input', Immutable.Map(action.input));
  });

  yield addReducer('recorderPreparing', function (state, action) {
    const {progress} = action;
    return state.set('recorder', Immutable.Map({state: 'preparing', progress}));
  });

  yield addReducer('recorderReady', function (state, action) {
    const {context} = action;
    return state.set('recorder', Immutable.Map({state: 'ready', context: Immutable.Map(context)}));
  });

  yield addReducer('recorderStarting', function (state, action) {
    return state.setIn(['recorder', 'state'], 'starting');
  });

  yield addReducer('recorderStarted', function (state, action) {
    const {recorder} = state;
    const {startTime} = action;
    return state.update('recorder', recorder => recorder
      .set('state', 'recording')
      .set('startTime', startTime)
      .set('timeOffset', 0)
      .set('lastEventTime', 0)
      .set('events', Immutable.List()))
      .set('elapsed', 0);
  });

  yield addReducer('recorderStartFailed', function (state, action) {
    return state.setIn(['recorder', 'state'], 'start_failed');
  });

  yield addReducer('recorderStopping', function (state, action) {
    return state.setIn(['recorder', 'state'], 'stopping');
  });

  yield addReducer('recorderStopped', function (state, action) {
    // Clear the recorder state, keeping its context.
    const context = state.getIn(['recorder', 'context']);
    return state
      .set('recorder', Immutable.Map({state: 'ready', context}))
      .set('screen', 'save')
      .set('save', Immutable.Map({
        audioUrl: action.audioUrl,
        eventsUrl: action.eventsUrl
      }));
  });

  yield addReducer('recorderTick', function (state, action) {
    const startTime = state.getIn(['recorder', 'startTime']);
    const elapsed = action.now - startTime;
    return state.setIn(['recorder', 'elapsed'], elapsed);
  });

  yield addReducer('recorderAddEvent', function (state, action) {
    const audioContext = state.getIn(['recorder', 'context', 'audioContext']);
    const event = Immutable.List([Math.round(audioContext.currentTime * 1000), ...action.payload]);
    return state.updateIn(['recorder', 'events'], events => events.push(event));
  });

};
