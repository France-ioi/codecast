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
import {AppStore} from "../store";
import produce from "immer";
import {RecorderStatus} from "./store";

export default function(bundle) {
    /* Recorder API */
    const recordApi = {};
    bundle.defineValue('recordApi', recordApi);

    /* Sagas can be registered to run when recording starts, to populate an
       'init' object which is stored in the 'start' event of the recording. */
    const startSagas = [];
    // @ts-ignore
    recordApi.onStart = function(saga) {
        startSagas.push(saga);
    };
    // @ts-ignore
    recordApi.start = function* () {
        const init = {};
        for (let saga of startSagas) {
            yield call(saga, init);
        }
        const event = [0, 'start', init];
        yield put({type: ActionTypes.RecorderAddEvent, event});
    };

    /* For each redux action a single saga handler(addEvent, action) can be
       registered to add an event to the recorded stream. */
    const actionHandlers = new Map();
    // @ts-ignore
    recordApi.on = function(actionType, handler) {
        if (actionHandlers.has(actionType)) {
            throw new Error(`multiple record handlers for ${actionType}`);
        }
        actionHandlers.set(actionType, handler);
    };
    bundle.defineAction(ActionTypes.RecorderAddEvent);
    bundle.addReducer(ActionTypes.RecorderAddEvent, produce((draft: AppStore, action) => {
        const {event} = action;

        draft.recorder.events.push(event);
    }));

    // Truncate the event stream at the given position (milliseconds).
    bundle.defineAction(ActionTypes.RecorderTruncate);
    bundle.addReducer(ActionTypes.RecorderTruncate, produce((draft: AppStore, {payload: {position, audioTime}}) => {
        draft.recorder.events = draft.recorder.events.slice(0, position);
        draft.recorder.junkTime = (draft.recorder.suspendedAt - audioTime);
    }));

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
                const recordAction = yield take(channel);
                const state: AppStore = yield select();
                const recorder = state.recorder;
                const status = recorder.status;
                if (status !== RecorderStatus.Recording) {
                    // Ignore events fired while not recording.
                    continue;
                }

                // @ts-ignore
                const audioTime = Math.round(action.payload.recorderContext.audioContext.currentTime * 1000) - recorder.junkTime;

                function* addEvent(name, ...args) {
                    const event = [audioTime, name, ...args];
                    yield put({type: ActionTypes.RecorderAddEvent, event});
                    if (name === 'end') {
                        done = true;
                    }
                }

                yield call(actionHandlers.get(recordAction.type), addEvent, recordAction);
            }

            channel.close();
        });
    });
}
