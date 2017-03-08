
import Immutable from 'immutable';

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

export default function (bundle) {

  bundle.addReducer('switchToScreen', function (state, action) {
    return state.set('screen', action.screen);
  });

  bundle.defineSelector('getRecorderState', state =>
    state.get('recorder', Immutable.Map())
  );

  bundle.addReducer('recorderPreparing', function (state, action) {
    const {progress} = action;
    return state.set('recorder', Immutable.Map({status: 'preparing', progress}));
  });

  bundle.addReducer('recorderReady', function (state, action) {
    const {context} = action;
    return state.set('recorder', Immutable.Map({status: 'ready', context: Immutable.Map(context)}));
  });

  bundle.addReducer('recorderStarting', function (state, action) {
    return state.setIn(['recorder', 'status'], 'starting');
  });

  bundle.addReducer('recorderStarted', function (state, action) {
    const {recorder} = state;
    return state.update('recorder', recorder => recorder
      .set('status', 'recording')
      .set('timeOffset', 0)
      .set('lastEventTime', 0)
      .set('events', Immutable.List()))
      .set('elapsed', 0);
  });

  bundle.addReducer('recorderStartFailed', function (state, action) {
    return state.setIn(['recorder', 'status'], 'start_failed');
  });

  bundle.addReducer('recorderStopping', function (state, action) {
    return state.setIn(['recorder', 'status'], 'stopping');
  });

  bundle.addReducer('recorderStopped', function (state, action) {
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

  bundle.addReducer('recorderTick', function (state, action) {
    const {elapsed} = action;
    return state.setIn(['recorder', 'elapsed'], elapsed);
  });

  bundle.addReducer('recorderAddEvent', function (state, action) {
    const {event} = action;
    return state.updateIn(['recorder', 'events'], events => events.push(event));
  });

};
