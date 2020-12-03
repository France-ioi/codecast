// An instant has shape {t, eventIndex, state},
// where state is an Immutable Map of shape {source, input, syntaxTree, stepper, stepperInitial}
// where source and input are buffer models (of shape {document, selection, firstVisibleRow}).

import {buffers, eventChannel} from 'redux-saga';
import {call, put, select, take, takeLatest} from 'redux-saga/effects';
import {Map} from 'immutable';

import {getJson} from '../common/utils';
import {findInstantIndex} from './utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {getPlayerState} from "./selectors";

export default function(bundle) {
    bundle.addSaga(playerSaga);
};

function* playerSaga(action) {
    yield takeLatest(ActionTypes.PlayerPrepare, playerPrepare, action);

    /* Use redux-saga takeLatest to cancel any executing replay saga. */
    const anyReplayAction = [
        ActionTypes.PlayerStart,
        ActionTypes.PlayerPause,
        ActionTypes.PlayerSeek
    ];
    yield takeLatest(anyReplayAction, replaySaga, action);
}

function* playerPrepare(app, action) {
    const {globals: {replayApi}} = app;

    /*
      baseDataUrl is forwarded to playerReady (stored in its reducer) in order
        to serve as the base URL for subtitle files (in the player & editor).
      audioUrl, eventsUrl need to be able to be passed independently by the
        recorder, where they are "blob:" URLs.
    */
    const {baseDataUrl, audioUrl} = action.payload;

    // Check that the player is idle.
    const player = yield select(getPlayerState);
    if (player.get('isPlaying')) {
        return;
    }

    // Emit a Preparing action.
    yield put({type: ActionTypes.PlayerPreparing});

    /* Load the audio. */
    const audio = player.get('audio');
    audio.src = audioUrl;
    audio.load();

    /* Load the events. */
    let data;
    if (action.payload.data) {
        data = action.payload.data;
    } else {
        data = yield call(getJson, action.payload.eventsUrl);
    }

    if (Array.isArray(data)) {
        yield put({
            type: ActionTypes.PlayerPrepareFailure,
            payload: {message: "recording is incompatible with this player"}
        });

        return;
    }
    /* Compute the future state after every event. */
    const chan = yield call(requestAnimationFrames, 50);

    let platform = 'unix';
    if (data.options) {
        platform = data.options.platform;
    }

    yield put({
        type: CommonActionTypes.PlatformChanged,
        payload: platform
    });

    const state = Map({
        options: {platform}
    });

    if (data.options) {
        state.set('options', data.options);
    }

    const replayContext = {
        state,
        events: data.events,
        instants: [],
        applyEvent: replayApi.applyEvent,
        addSaga,
        reportProgress,
    };

    try {
        yield call(computeInstants, replayContext);
        /* The duration of the recording is the timestamp of the last event. */
        const instants = replayContext.instants;
        const duration = instants[instants.length - 1].t;
        yield put({type: ActionTypes.PlayerReady, payload: {baseDataUrl, duration, data, instants}});
        yield call(resetToAudioTime, app, 0);
    } catch (ex) {
        yield put({
            type: ActionTypes.PlayerPrepareFailure,
            payload: {message: `${ex.toString()}`, context: replayContext}
        });
        return null;
    } finally {
        chan.close();
    }

    function addSaga(saga) {
        // @ts-ignore
        let {sagas} = replayContext.instant;
        if (!sagas) {
            // @ts-ignore
            sagas = replayContext.instant.sagas = [];
        }

        sagas.push(saga);
    }

    function* reportProgress(progress) {
        yield put({type: ActionTypes.PlayerPrepareProgress, payload: {progress}});
        /* Allow the display to refresh. */
        yield take(chan);
    }
}

function* computeInstants(replayContext) {
    /* CONSIDER: create a redux store, use the replayApi to convert each event
       to an action that is dispatched to the store (which must have an
       appropriate reducer) plus an optional saga to be called during playback. */
    let pos, progress, lastProgress = 0, range;
    const events = replayContext.events;
    const duration = events[events.length - 1][0];
    for (pos = 0; pos < events.length; pos += 1) {
        const event = events[pos];

        /**
         * For version < 6, the translate.success action, now renamed to compile.success used to contain :
         * {
         *   ast,
         *   diagnostics
         * }
         *
         * Now it should contain :
         * {
         *   response: {
         *     ast,
         *     diagnotics,
         *     platform: 'unix'
         *   }
         * }
         */
        if (event[1] === 'translate.success') {
            event[2] = {
                response: {
                    ...event[2],
                    platform: 'unix'
                }
            };
        }

        const t = event[0];

        /**
         * Get the action name.
         * Note : translate.* actions have been replaced by compile.* actions from version 6.
         */
        const key = event[1].replace('translate.', 'compile.');

        const instant = {t, pos, event};
        replayContext.instant = instant;

        console.log('-------- REPLAY ---- EVENT ----', key, event);
        yield call(replayContext.applyEvent, key, replayContext, event);

        /* Preserve the last explicitly set range. */
        if ('range' in instant) {
            // @ts-ignore
            range = instant.range;
        } else {
            // @ts-ignore
            instant.range = range;
        }
        // @ts-ignore
        instant.state = replayContext.state;

        replayContext.instants.push(instant);
        progress = Math.round(pos * 50 / events.length + t * 50 / duration) / 100;
        if (progress !== lastProgress) {
            lastProgress = progress;
            yield call(replayContext.reportProgress, progress);
        }
    }
}

function* replaySaga(app, {type, payload}) {
    const player = yield select(getPlayerState);
    const isPlaying = player.get('isPlaying');
    const audio = player.get('audio');
    const instants = player.get('instants');
    let audioTime = player.get('audioTime');
    let instant = player.get('current');

    if (type === ActionTypes.PlayerStart && !player.get('isReady')) {
        /* Prevent starting playback until ready.  Should perhaps wait until
           preparation is done, for autoplay. */
        return;
    }
    if (type === ActionTypes.PlayerStart) {
        /* If at end of stream, restart automatically. */
        if (instant.isEnd) {
            audioTime = 0;
            audio.currentTime = 0;
        }
        /* The player was started (or resumed), reset to the current instant to
           clear any possible changes to the state prior to entering the update
           loop. */
        yield call(resetToAudioTime, app, audioTime);
        /* Disable the stepper during playback, its states are pre-computed. */
        yield put({type: StepperActionTypes.StepperDisabled});
        /* Play the audio now that an accurate state is displayed. */
        audio.play();
        yield put({type: ActionTypes.PlayerStarted});
    }

    if (type === ActionTypes.PlayerPause) {
        /* The player is being paused.  The audio is paused first, then the
           audio time is used to reset the state accurately. */
        audio.pause();
        const audioTime = Math.round(audio.currentTime * 1000);
        yield call(resetToAudioTime, app, audioTime);
        yield call(restartStepper, app);
        yield put({type: ActionTypes.PlayerPaused});
        return;
    }

    if (type === ActionTypes.PlayerSeek) {
        if (!isPlaying) {
            /* The stepper is disabled before a seek-while-paused, as it could be
               waiting on I/O. */
            yield put({type: StepperActionTypes.StepperDisabled});
        }
        /* Refreshing the display first then make the jump in the audio should
           make a cleaner jump, as audio will not start playing at the new
           position until the new state has been rendered. */
        const audioTime = Math.max(0, Math.min(player.get('duration'), payload.audioTime));
        yield call(resetToAudioTime, app, audioTime);
        if (!isPlaying) {
            /* The stepper is restarted after a seek-while-paused, in case it is
               waiting on I/O. */
            yield call(restartStepper, app);
        }

        audio.currentTime = audioTime / 1000;
        if (!isPlaying) {
            return;
        }
        /* fall-through for seek-during-playback, which is handled by the
           periodic update loop */
    }

    /* The periodic update loop runs until cancelled by another replay action. */
    const chan = yield call(requestAnimationFrames, 50);
    try {
        while (!(yield select(state => state.getIn(['player', 'current']).isEnd))) {
            /* Use the audio time as reference. */
            let endTime = Math.round(audio.currentTime * 1000);
            if (audio.ended) {
                /* Extend a short audio to the timestamp of the last event. */
                endTime = instants[instants.length - 1].t;
            }
            if (endTime < audioTime || audioTime + 2000 < endTime) {
                /* Audio time has jumped. */
                yield call(resetToAudioTime, app, endTime);
            } else {
                /* Continuous playback. */
                yield call(replayToAudioTime, app, instants, audioTime, endTime);
            }
            audioTime = endTime;
            yield take(chan);
        }
    } finally {
        chan.close();
    }

    /* Pause when the end event is reached. */
    yield put({type: ActionTypes.PlayerPause});
}

function* replayToAudioTime(app, instants, startTime, endTime) {
    let instantIndex = findInstantIndex(instants, startTime);
    const nextInstantIndex = findInstantIndex(instants, endTime);
    if (instantIndex === nextInstantIndex) {
        /* Fast path: audio time has advanced but we are still at the same
           instant, just emit a tick event to update the audio time. */
        yield put({type: ActionTypes.PlayerTick, payload: {audioTime: endTime}});
        return;
    }
    /* Update the DOM by replaying incremental events between (immediately
       after) `instant` and up to (including) `nextInstant`. */
    instantIndex += 1;
    while (instantIndex <= nextInstantIndex) {
        let instant = instants[instantIndex];
        if (instant.hasOwnProperty('mute')) {
            yield put({type: ActionTypes.PlayerMutedChanged, payload: {isMuted: instant.mute}});
        }
        if (instant.hasOwnProperty('jump')) {
            yield call(jumpToAudioTime, app, instant.jump);
            return;
        }
        if (instant.sagas) {
            /* Keep in mind that the instant's saga runs *prior* to the call
               to resetToAudioTime below, and should not rely on the global
               state being accurate.  Instead, it should use `instant.state`. */
            for (let saga of instant.sagas) {
                yield call(saga, instant);
            }
        }
        if (instant.isEnd) {
            /* Stop a long audio at the timestamp of the last event. */
            endTime = instant.t;
            break;
        }
        instantIndex += 1;
    }
    /* Perform a quick reset to update the editor models without pushing
       the new state to the editors instances (they are assumed to have
       been synchronized by replaying individual events).
    */
    yield call(resetToAudioTime, app, endTime, true);
}

/* A quick reset avoids disabling and re-enabling the stepper (which restarts
   the stepper task). */
function* resetToAudioTime(app, audioTime, quick?: boolean) {
    const {globals: {replayApi}} = app;

    /* Call playerTick to store the current audio time and to install the
       current instant's state as state.getIn(['player', 'current']). */
    yield put({type: ActionTypes.PlayerTick, payload: {audioTime}});

    /* Call the registered reset-sagas to update any part of the state not
       handled by playerTick. */
    const instant = yield select(state => state.getIn(['player', 'current']));

    yield call(replayApi.reset, instant, quick);
}

function* restartStepper(app) {
    /* Re-enable the stepper to allow the user to interact with it. */
    yield put({type: StepperActionTypes.StepperEnabled});

    /* If the stepper was running and blocking on input, do a "step-into" to
       restore the blocked-on-I/O state. */
    const instant = yield select(state => state.getIn(['player', 'current']));
    if (instant.state.get('status') === 'running') {
        const {isWaitingOnInput} = instant.state.get('current');
        if (isWaitingOnInput) {
            yield put({type: StepperActionTypes.StepperStep, mode: 'into'});
        }
    }
}

function* jumpToAudioTime(app, audioTime) {
    /* Jump and full reset to the specified audioTime. */
    const player = yield select(getPlayerState);
    audioTime = Math.max(0, Math.min(player.get('duration'), audioTime));
    const audio = player.get('audio');
    audio.currentTime = audioTime / 1000;
    yield call(resetToAudioTime, app, audioTime);
}

function requestAnimationFrames(maxDelta) {
    let shutdown = false;
    let lastTimestamp = 0;
    return eventChannel(function(emitter) {
        function onAnimationFrame(timestamp) {
            if (timestamp >= lastTimestamp + maxDelta) {
                lastTimestamp = timestamp;
                emitter(timestamp);
            }
            if (!shutdown) {
                window.requestAnimationFrame(onAnimationFrame);
            }
        }

        window.requestAnimationFrame(onAnimationFrame);
        return function() {
            shutdown = true;
        };
    }, buffers.sliding(1));
}
