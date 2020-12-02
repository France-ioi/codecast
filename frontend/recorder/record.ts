/*
  Record API

  Workflow:

  - onStart callbacks populate an 'init' object (recorded in the start event)
    to take a snapshot of the state when recording starts

  - each redux action can be associated with a saga to add events to the
    recording

*/

import {actionChannel, call, put, select, take, takeLatest} from 'redux-saga/effects';
import {ActionTypes} from "./actionTypes";

export default function(bundle) {
    /* Recorder API */
    const recordApi = {};
    bundle.defineValue('recordApi', recordApi);

    /* Sagas can be registered to run when recording starts, to populate an
       'init' object which is stored in the 'start' event of the recording. */
    const startSagas = [];
    // @ts-ignore
    recordApi.onStart = function (saga) {
        startSagas.push(saga);
    };
    // @ts-ignore
    recordApi.start = function* () {
        const init = {};
        for (var saga of startSagas) {
            yield call(saga, init);
        }
        const event = [0, 'start', init];
        yield put({type: ActionTypes.RecorderAddEvent, event});
    };

    /* For each redux action a single saga handler(addEvent, action) can be
       registered to add an event to the recorded stream. */
    const actionHandlers = new Map();
    // @ts-ignore
    recordApi.on = function (actionType, handler) {
        if (actionHandlers.has(actionType)) {
            throw new Error(`multiple record handlers for ${actionType}`);
        }
        actionHandlers.set(actionType, handler);
    };
    bundle.defineAction(ActionTypes.RecorderAddEvent);
    bundle.addReducer(ActionTypes.RecorderAddEvent, function (state, action) {
        const {event} = action;
        return state.updateIn(['recorder', 'events'], events => events.push(event));
    });

    // Truncate the event stream at the given position (milliseconds).
    bundle.defineAction(ActionTypes.RecorderTruncate);
    bundle.addReducer(ActionTypes.RecorderTruncate, function (state, {payload: {position, audioTime}}) {
        return state.update('recorder', recorder => recorder
            .update('events', events => events.slice(0, position))
            .set('junkTime', recorder.get('suspendedAt') - audioTime)
        );
    });

    bundle.addSaga(function* recordEvents() {
        const pattern = Array.from(actionHandlers.keys());
        // Wait for the recorder to be ready, grab the context.
        yield takeLatest(ActionTypes.RecorderReady, function* (action) {
            // Wait for recording to actually start.
            yield take(ActionTypes.RecorderStarted);
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
                const audioTime = Math.round(action.payload.recorderContext.audioContext.currentTime * 1000) - recorder.get('junkTime');

                function* addEvent(name, ...args) {
                    const event = [audioTime, name, ...args];
                    yield put({type: ActionTypes.RecorderAddEvent, event});
                    if (name === 'end') {
                        done = true;
                    }
                }

                yield call(actionHandlers.get(action.type), addEvent, action);
            }
            channel.close();
        });
    });
};
