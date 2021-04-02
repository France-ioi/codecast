import {call, delay, put, race, select, take, takeEvery, takeLatest} from 'redux-saga/effects';

import {RECORDING_FORMAT_VERSION} from '../version';
import {spawnWorker} from '../utils/worker_utils';
// @ts-ignore
import AudioWorker from '../audio_worker/index.worker';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from '../common/actionTypes';
import {ActionTypes as PlayerActionTypes} from '../player/actionTypes';
import {getPlayerState} from "../player/selectors";
import {getRecorderState} from "./selectors";
import {AppStore} from "../store";
import {RecorderStatus} from "./store";
import {ReplayContext} from "../player/sagas";
import {App} from "../index";
import {Screen} from "../common/screens";

export default function(bundle, deps) {
    bundle.use('recordApi');

    bundle.defineAction(ActionTypes.RecorderResume);

    bundle.defineAction(ActionTypes.RecorderResuming);
    bundle.addReducer(ActionTypes.RecorderResuming, (state: AppStore) => {
        state.recorder.status = RecorderStatus.Resuming;
    });

    bundle.defineAction(ActionTypes.RecorderResumed);
    bundle.addReducer(ActionTypes.RecorderResumed, (state: AppStore) => {
        state.recorder.status = RecorderStatus.Recording;
    });

    bundle.defineAction(ActionTypes.AudioContextSuspended);
    bundle.addReducer(ActionTypes.AudioContextSuspended, (state: AppStore, {payload: {audioTime}}) => {
        state.recorder.suspendedAt = audioTime;
    });

    bundle.addSaga(function* watchRecorderPrepare() {
        yield takeLatest(ActionTypes.RecorderPrepare, recorderPrepare);
    });

    bundle.addSaga(function* recorderTicker() {
        const {payload: {recorderContext}} = yield take(ActionTypes.RecorderReady);
        while (true) {
            yield take(ActionTypes.RecorderStarted);
            while (true) {
                const outcome = yield race({
                    tick: delay(1000),
                    stopped: take(ActionTypes.RecorderStopped)
                });
                if ('stopped' in outcome) {
                    break;
                }

                const state: AppStore = yield select();
                const junkTime = state.recorder.junkTime;
                const elapsed = Math.round(recorderContext.audioContext.currentTime * 1000) - junkTime;

                yield put({type: ActionTypes.RecorderTick, elapsed});
            }
        }
    });

    bundle.addSaga(function* watchRecorderActions() {
        yield takeEvery(ActionTypes.RecorderStart, recorderStart);
        yield takeEvery(ActionTypes.RecorderStop, recorderStop);
        yield takeEvery(ActionTypes.RecorderPause, recorderPause);
        yield takeEvery(ActionTypes.RecorderResume, recorderResume);
    });

    bundle.defer(function({replayApi}: App) {
        replayApi.on('end', function(replayContext: ReplayContext) {
            replayContext.instant.isEnd = true;
            replayContext.state.stopped = true;
        });
    });

    function* recorderPrepare() {
        try {
            /* Show 'record' screen to user. */
            yield put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Record}});

            // Clean up any previous audioContext and worker.
            const state: AppStore = yield select();
            const recorder = getRecorderState(state);
            let recorderContext = recorder.context;
            if (recorderContext) {
                const {worker: oldWorker} = recorderContext;
                // @ts-ignore
                if (oldContext) {
                    // @ts-ignore
                    oldContext.close();
                }
                if (oldWorker) {
                    yield call(oldWorker.kill);
                }
                // TODO: put an action to clean up the old recorderContext, in case the saga fails before recorderReady is sent.
            }

            yield put({type: ActionTypes.RecorderPreparing, payload: {progress: 'start'}});

            // Attempt to obtain an audio stream.  The async call will complete once
            // the user has granted permission to use the microphone.
            const stream = yield call(getAudioStream);
            yield put({type: ActionTypes.RecorderPreparing, payload: {progress: 'stream_ok'}});

            // Create the AudioContext, connect the nodes, and suspend the audio
            // context until we actually start recording.
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            const scriptProcessor = audioContext.createScriptProcessor(4096, 2, 2);
            source.connect(analyser);
            source.connect(scriptProcessor);
            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;
            scriptProcessor.connect(audioContext.destination);

            yield call(() => audioContext.suspend());
            yield put({type: ActionTypes.RecorderPreparing, payload: {progress: 'audio_ok'}});

            // Set up a worker to hold and encode the buffers.
            const worker = yield call(spawnWorker, AudioWorker);
            yield put({type: ActionTypes.RecorderPreparing, payload: {progress: 'worker_ok', worker}});

            // Initialize the worker.
            yield call(worker.call, 'init', {
                sampleRate: audioContext.sampleRate,
                numberOfChannels: source.channelCount
            });

            // XXX create a channel to which input buffers are posted.
            yield put({
                type: ActionTypes.RecorderPreparing, payload: {
                    progress: 'worker_init_ok', analyser
                }
            });

            // Set up the ScriptProcessor to divert all buffers to the worker.
            scriptProcessor.onaudioprocess = function(event) {
                // dispatch event
                // TODO: use same number of channels as in createScriptProcessor
                const ch0 = event.inputBuffer.getChannelData(0);
                const ch1 = event.inputBuffer.getChannelData(1);
                worker.post('addSamples', {samples: [ch0, ch1]});
            };

            // Signal that the recorder is ready to start, storing the new context.
            // /!\  Chrome: store a reference to the scriptProcessor node to prevent
            //      the browser from garbage-collection the node (which seems to
            //      occur even though the node is still connected).
            recorderContext = {audioContext, worker, scriptProcessor};

            yield put({type: ActionTypes.RecorderReady, payload: {recorderContext}});
        } catch (error) {
            // XXX send a specialized event and allow retrying recorderPrepare
            yield put({type: CommonActionTypes.Error, payload: {source: 'recorderPrepare', error}});
        }
    }

    function* recorderStart() {
        try {
            // The user clicked the "start recording" button.
            const state: AppStore = yield select();
            const recorder = getRecorderState(state);
            const recorderStatus = recorder.status;
            if (recorderStatus !== RecorderStatus.Ready) {
                console.log('not ready', recorder);

                return;
            }

            // Signal that the recorder is starting.
            yield put({type: ActionTypes.RecorderStarting});

            // Resume the audio context to start recording audio buffers.
            yield call(resumeAudioContext, recorder.context.audioContext);

            // Signal that recording has started.
            yield put({type: ActionTypes.RecorderStarted});

            /* Record the 'start' event */
            yield call(deps.recordApi.start);
        } catch (error) {
            // XXX generic error
            yield put({type: CommonActionTypes.Error, payload: {source: 'recorderStart', error}});
        }
    }

    function* recorderStop() {
        try {
            let state: AppStore = yield select();
            let recorder = getRecorderState(state);
            let recorderStatus = recorder.status;
            if (!/recording|paused/.test(recorderStatus)) {
                /* Stop request in invalid state. */
                return;
            }

            /* Signal that the recorder is stopping. */
            yield put({type: ActionTypes.RecorderStopping});

            const {audioContext} = recorder.context;
            if (recorderStatus === 'recording') {
                /* Suspend the audio context to stop recording audio buffers. */
                yield call(suspendAudioContext, audioContext);
            }

            // If the record was paused, the audio context is already suspended.

            /* Signal that the recorder has stopped. */
            yield put({type: ActionTypes.RecorderStopped, payload: {}});
        } catch (error) {
            // XXX generic error
            yield put({type: CommonActionTypes.Error, payload: {source: 'recorderStop', error}});
        }
    }

    function* recorderPause() {
        try {
            let state: AppStore = yield select();
            const recorder = getRecorderState(state);
            if (recorder.status !== RecorderStatus.Recording) {
                return;
            }

            // Signal that the recorder is pausing.
            yield put({type: ActionTypes.RecorderPausing});

            const {audioContext, worker} = recorder.context;
            yield call(suspendAudioContext, audioContext);

            // Obtain the URL to a (WAV-encoded) audio object from the worker.
            const {wav, duration} = yield call(worker.call, 'export', {wav: true}, pauseExportProgressSaga);
            const audioUrl = URL.createObjectURL(wav);

            // Get a URL for events.
            const endTime = Math.floor(duration * 1000);
            recorder.events.push([endTime, 'end']);

            const version = RECORDING_FORMAT_VERSION;
            state = yield select();
            const options = state.options;
            const data = {
                version,
                options,
                events: recorder.events,
                subtitles: []
            };
            const eventsBlob = new Blob([JSON.stringify(data)], {
                type: "application/json;charset=UTF-8"
            });
            const eventsUrl = URL.createObjectURL(eventsBlob);

            // Prepare the player to use the audio and event streams, wait till ready.
            yield put({type: PlayerActionTypes.PlayerPrepare, payload: {audioUrl, eventsUrl}});

            yield take(PlayerActionTypes.PlayerReady);

            // Signal that the recorder is paused.
            yield put({type: ActionTypes.RecorderPaused});
        } catch (error) {
            // XXX generic error
            yield put({type: CommonActionTypes.Error, payload: {source: 'recorderPause', error}});
        }

        function* pauseExportProgressSaga() {
            // console.log('pause', progress);
        }
    }

    function* recorderResume() {
        try {
            const state: AppStore = yield select();
            const recorder = getRecorderState(state);
            const recorderStatus = recorder.status;
            const player = getPlayerState(state);
            const isPlaying = player.isPlaying;
            if (recorderStatus !== RecorderStatus.Paused || isPlaying) {
                console.log('bad state', recorderStatus);

                return;
            }

            /* Pause the player (even if already paused) to make sure the state
               accurately represents the instant in the recording. */
            yield put({type: PlayerActionTypes.PlayerPause});
            yield take(PlayerActionTypes.PlayerPaused);

            /* Clear the player's state. */
            yield put({type: PlayerActionTypes.PlayerClear});

            recorder.events.pop(); // Remove the 'end' event put at the end when paused.

            /* Signal that the recorder is resuming. */
            yield put({type: ActionTypes.RecorderResuming});

            /* Truncate the recording at the current playback position. */
            yield call(truncateRecording, player.audioTime, player.current);

            /* Resume the audio context to resume recording audio buffers. */
            yield call(resumeAudioContext, recorder.context.audioContext);

            // Signal that recording has resumed.
            yield put({type: ActionTypes.RecorderResumed});
        } catch (error) {
            // XXX generic error
            yield put({type: CommonActionTypes.Error, payload: {source: 'recorderResume', error}});
        }
    }

    function* truncateRecording(audioTime, instant) {
        const state: AppStore = yield select();
        const {worker} = getRecorderState(state).context;

        yield call(worker.call, 'truncate', {position: audioTime / 1000});

        if (instant) {
            const position = instant.pos + 1;

            yield put({type: ActionTypes.RecorderTruncate, payload: {audioTime, position}});
        }
    }

    function* resumeAudioContext(audioContext) {
        /* Race with timeout, in case the audio device is busy. */
        const outcome = yield race({
            resumed: call(() => audioContext.resume()),
            timeout: delay(1000)
        });
        if ('timeout' in outcome) {
            throw new Error('audio device is busy');
            /* Consider calling recorderPrepare to fix the issue?
               yield call(recorderPrepare);
             */
        }
    }

    function* suspendAudioContext(audioContext) {
        yield call(() => audioContext.suspend());

        const audioTime = Math.round(audioContext.currentTime * 1000);

        yield put({type: ActionTypes.AudioContextSuspended, payload: {audioTime}})
    }
};

function getAudioStream() {
    const constraints = {audio: true};
    if (typeof navigator.mediaDevices === 'object' && typeof navigator.mediaDevices.getUserMedia === 'function') {
        // Use modern API returning a promise.
        return navigator.mediaDevices.getUserMedia(constraints);
    } else {
        // Use deprecated API taking two callbacks.
        // @ts-ignore
      const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        return new Promise(function(resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject);
        });
    }
}
