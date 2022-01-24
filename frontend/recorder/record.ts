/*
  Record API

  Workflow:

  - onStart callbacks populate an 'init' object (recorded in the start event)
    to take a snapshot of the state when recording starts

  - each redux action can be associated with a saga to add events to the
    recording

*/

import {actionChannel, call, put, select, take, takeLatest} from 'typed-redux-saga';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {AppStore} from "../store";
import {RecorderStatus} from "./store";
import {Bundle} from "../linker";
import {ReplayContext} from "../player/sagas";
import {App} from "../index";
import {PlayerInstant, playerReset} from "../player";
import {PayloadAction} from "@reduxjs/toolkit";

export interface AutoRecordingParams {
    sliceName: string,
    actionNames: string[],
    actions: any,
    reducers: any,
    initialState?: any,
    onResetDisabled?: boolean,
}

export function addAutoRecordingBehaviour({recordApi, replayApi}: App, {sliceName, actions, actionNames, reducers, initialState, onResetDisabled}: AutoRecordingParams) {
    for (let actionName of actionNames) {
        const action = actions[actionName];
        recordApi.on(action.type, function* (addEvent, {payload}) {
            yield* call(addEvent, action.type, payload);
        });

        if (initialState) {
            replayApi.on('start', function* () {
                yield* put({type: PlayerActionTypes.PlayerReset, payload: {sliceName, state: initialState}});
            });
        }

        replayApi.on(action.type, function* (replayContext: ReplayContext, event) {
            const payload = event[2];

            yield* put({type: action.type, payload});
        });
    }

    if (!onResetDisabled) {
        replayApi.onReset(function* (instant: PlayerInstant) {
            const sliceState = instant.state[sliceName];
            if (sliceState) {
                yield* put(playerReset({sliceName, state: sliceState}));
            }
        });
    }
}

export interface RecordApi {
    onStart: Function,
    start: any,
    on: (actionType: string, handler) => void,
}

export default function(bundle: Bundle) {
    /* Sagas can be registered to run when recording starts, to populate an
   'init' object which is stored in the 'start' event of the recording. */
    const startSagas = [];

    /* For each redux action a single saga handler(addEvent, action) can be
       registered to add an event to the recorded stream. */
    const actionHandlers = new Map();


    /* Recorder API */
    const recordApi = {
        onStart: function(saga) {
            startSagas.push(saga);
        },
        start: function* () {
            const init = {};
            for (let saga of startSagas) {
                yield* call(saga, init);
            }
            const event = [0, 'start', init];
            yield* put({type: ActionTypes.RecorderAddEvent, event});
        },
        on: function(actionType: string, handler) {
            if (actionHandlers.has(actionType)) {
                throw new Error(`multiple record handlers for ${actionType}`);
            }
            actionHandlers.set(actionType, handler);
        }
    };

    bundle.defineValue('recordApi', recordApi);

    bundle.defineAction(ActionTypes.RecorderAddEvent);
    bundle.addReducer(ActionTypes.RecorderAddEvent, (state: AppStore, action) => {
        const {event} = action;

        state.recorder.events.push(event);
    });

    // Truncate the event stream at the given position (milliseconds).
    bundle.defineAction(ActionTypes.RecorderTruncate);
    bundle.addReducer(ActionTypes.RecorderTruncate, (state: AppStore, {payload: {position, audioTime}}) => {
        state.recorder.events = state.recorder.events.slice(0, position);
        state.recorder.junkTime = (state.recorder.suspendedAt - audioTime);
    });

    bundle.defineAction(ActionTypes.RecorderPopEvent);
    bundle.addReducer(ActionTypes.RecorderPopEvent, (state: AppStore) => {
        state.recorder.events.pop();
    });

    bundle.addSaga(function* recordEvents() {
        // Wait for the recorder to be ready, grab the context.
        yield* takeLatest(ActionTypes.RecorderReady, function* (action) {
            const pattern = Array.from(actionHandlers.keys());
            // Wait for recording to actually start.
            yield* take(ActionTypes.RecorderStarted);
            // Start buffering actions.
            const channel = yield* actionChannel<PayloadAction<{record: boolean}>>(pattern);
            let done = false;
            while (!done) {
                const recordAction = yield* take(channel);
                if (recordAction.payload && false === recordAction.payload.record) {
                    console.log('skip record');
                    continue;
                }
                const state: AppStore = yield* select();
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
                    yield* put({type: ActionTypes.RecorderAddEvent, event});
                    if (name === 'end') {
                        done = true;
                    }
                }

                yield* call(actionHandlers.get(recordAction.type), addEvent, recordAction);
            }

            channel.close();
        });
    });
}
