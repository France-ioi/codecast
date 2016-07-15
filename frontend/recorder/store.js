
import Immutable from 'immutable';

import {addReducer, defineSelector} from '../utils/linker';

/*

  shape of state.recorder:
  {
    status: /preparing|ready|starting|start_failed|stopping/,
    timeOffset,
    lastEventTime,
    events: [[timestamp, ...payload]],
    elapsed
  }

*/

export default function* () {

  yield addReducer('switchToScreen', function (state, action) {
    return state.set('screen', action.screen);
  });

  yield defineSelector('getRecorderState', state =>
    state.get('recorder', Immutable.Map())
  );

  yield addReducer('recorderPreparing', function (state, action) {
    const {progress} = action;
    return state.set('recorder', Immutable.Map({status: 'preparing', progress}));
  });

  yield addReducer('recorderReady', function (state, action) {
    const {context} = action;
    return state.set('recorder', Immutable.Map({status: 'ready', context: Immutable.Map(context)}));
  });

  yield addReducer('recorderStarting', function (state, action) {
    return state.setIn(['recorder', 'status'], 'starting');
  });

  yield addReducer('recorderStarted', function (state, action) {
    const {recorder} = state;
    return state.update('recorder', recorder => recorder
      .set('status', 'recording')
      .set('timeOffset', 0)
      .set('lastEventTime', 0)
      .set('events', Immutable.List()))
      .set('elapsed', 0);
  });

  yield addReducer('recorderStartFailed', function (state, action) {
    return state.setIn(['recorder', 'status'], 'start_failed');
  });

  yield addReducer('recorderStopping', function (state, action) {
    return state.setIn(['recorder', 'status'], 'stopping');
  });

  yield addReducer('recorderStopped', function (state, action) {
    // Clear the recorder state, keeping its context.
    const context = state.getIn(['recorder', 'context']);
    return state
      .set('recorder', Immutable.Map({status: 'ready', context}))
      .set('screen', 'save')
      .set('save', Immutable.Map({
        audioUrl: action.audioUrl,
        wavAudioUrl: action.wavAudioUrl,
        eventsUrl: action.eventsUrl
      }));
  });

  yield addReducer('recorderTick', function (state, action) {
    const {elapsed} = action;
    return state.setIn(['recorder', 'elapsed'], elapsed);
  });

  yield addReducer('recorderAddEvent', function (state, action) {
    const {event} = action;
    return state.updateIn(['recorder', 'events'], events => events.push(event));
  });

};
