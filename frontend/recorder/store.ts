import {List, Map} from 'immutable';
import {ActionTypes} from "./actionTypes";

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
    bundle.defineAction(ActionTypes.RecorderPreparing);
    bundle.addReducer(ActionTypes.RecorderPreparing, function (state, action) {
        const {progress} = action;
        return state.set('recorder', Map({status: 'preparing', progress}));
    });

    bundle.defineAction(ActionTypes.RecorderReady);
    bundle.addReducer(ActionTypes.RecorderReady, function (state, {payload: {recorderContext}}) {
        return state.set('recorder', Map({
            status: 'ready',
            context: recorderContext,
            junkTime: 0
        }));
    });

    bundle.defineAction(ActionTypes.RecorderStarting);
    bundle.addReducer(ActionTypes.RecorderStarting, function (state, action) {
        return state.setIn(['recorder', 'status'], 'starting');
    });

    bundle.defineAction(ActionTypes.RecorderStarted);
    bundle.addReducer(ActionTypes.RecorderStarted, function (state, action) {
        return state.update('recorder', recorder => recorder
            .set('status', 'recording')
            .set('timeOffset', 0)
            .set('lastEventTime', 0)
            .set('events', List()))
            .set('elapsed', 0);
    });

    bundle.defineAction(ActionTypes.RecorderStartFailed);
    bundle.addReducer(ActionTypes.RecorderStartFailed, function (state, action) {
        return state.setIn(['recorder', 'status'], 'start_failed');
    });

    bundle.defineAction(ActionTypes.RecorderStopping);
    bundle.addReducer(ActionTypes.RecorderStopping, function (state, action) {
        return state.setIn(['recorder', 'status'], 'stopping');
    });

    bundle.defineAction(ActionTypes.RecorderStopped);
    bundle.addReducer(ActionTypes.RecorderStopped, function (state, action) {
        return state.setIn(['recorder', 'status'], 'stopped');
    });

    bundle.defineAction(ActionTypes.RecorderPausing);
    bundle.addReducer(ActionTypes.RecorderPausing, (state, action) =>
        state.setIn(['recorder', 'status'], 'pausing')
    );

    bundle.defineAction(ActionTypes.RecorderPaused);
    bundle.addReducer(ActionTypes.RecorderPaused, (state, action) =>
        state.setIn(['recorder', 'status'], 'paused')
    );

    bundle.defineAction(ActionTypes.RecorderTick);
    bundle.addReducer(ActionTypes.RecorderTick, function (state, action) {
        const {elapsed} = action;

        return state.setIn(['recorder', 'elapsed'], elapsed);
    });
};
