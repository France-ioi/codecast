
/* TODO: figure out why the 'end' event seems to be inserted when the recording
         is paused, not when the recording is actually stopped
         => because 'end' is added by recorderStopping
*/

import {delay} from 'redux-saga';
import {take, takeLatest, takeEvery, put, call, race, select, actionChannel} from 'redux-saga/effects';
import Immutable from 'immutable';

import {RECORDING_FORMAT_VERSION} from '../version';
import {spawnWorker} from '../utils/worker_utils';
import AudioWorker from 'worker-loader?inline!../audio_worker';

export default function (bundle, deps) {

  bundle.use(
    'error', 'recordApi', 'switchToScreen',
    'getRecorderState', 'getPlayerState',
    'recorderPrepare', 'recorderPreparing', 'recorderReady',
    'recorderTick',
    'recorderStart', 'recorderStarting', 'recorderStarted',
    'recorderPause', 'recorderPausing', 'recorderPaused',
    'recorderStop', 'recorderStopping', 'recorderStopped',
    'recorderTruncate',
    'playerPrepare', 'playerPause', 'playerPaused', 'playerClear', 'playerReady'
  );

  function* recorderPrepare () {
    try {
      /* Show 'record' screen to user. */
      yield put({type: deps.switchToScreen, payload: {screen: 'record'}});
      // Clean up any previous audioContext and worker.
      const recorder = yield select(deps.getRecorderState);
      let recorderContext = recorder.get('context');
      if (recorderContext) {
        const {audioContext: oldAudioContext, worker: oldWorker} = recorderContext;
        if (oldContext) {
          oldContext.close();
        }
        if (oldWorker) {
          yield call(oldWorker.kill);
        }
        // TODO: put an action to clean up the old recorderContext, in case
        //       the saga fails before recorderReady is sent.
      }
      yield put({type: deps.recorderPreparing, payload: {progress: 'start'}});
      // Attempt to obtain an audio stream.  The async call will complete once
      // the user has granted permission to use the microphone.
      const stream = yield call(getAudioStream);
      yield put({type: deps.recorderPreparing, payload: {progress: 'stream_ok'}});
      // Create the AudioContext, connect the nodes, and suspend the audio
      // context until we actually start recording.
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      const scriptProcessor = audioContext.createScriptProcessor(
        /*bufferSize*/ 4096, /*numberOfInputChannels*/ 2, /*numberOfOutputChannels*/ 2);
      source.connect(analyser);
      source.connect(scriptProcessor);
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      scriptProcessor.connect(audioContext.destination);
      yield call(() => audioContext.suspend());
      yield put({type: deps.recorderPreparing, payload: {progress: 'audio_ok'}});
      // Set up a worker to hold and encode the buffers.
      const worker = yield call(spawnWorker, AudioWorker);
      yield put({type: deps.recorderPreparing, payload: {progress: 'worker_ok', worker}});
      // Initialize the worker.
      yield call(worker.call, 'init', {
        sampleRate: audioContext.sampleRate,
        numberOfChannels: source.channelCount
      });
      // XXX create a channel to which input buffers are posted.
      yield put({type: deps.recorderPreparing, payload: {
        progress: 'worker_init_ok', analyser
      }});
      // Set up the ScriptProcessor to divert all buffers to the worker.
      scriptProcessor.onaudioprocess = function (event) {
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
      yield put({type: deps.recorderReady, payload: {recorderContext}});
    } catch (error) {
      // XXX send a specialized event and allow retrying recorderPrepare
      yield put({type: deps.error, source: 'recorderPrepare', error});
    }
  }

  function* recorderStart () {
    try {
      // The user clicked the "start recording" button.
      const recorder = yield select(deps.getRecorderState);
      const recorderStatus = recorder.get('status');
      if (recorderStatus !== 'ready') {
        console.log('not ready', recorder);
        return;
      }
      // Signal that the recorder is starting.
      yield put({type: deps.recorderStarting});
      // Resume the audio context to start recording audio buffers.
      yield call(resumeAudioContext, recorder.get('context').audioContext);
      // Signal that recording has started.
      yield put({type: deps.recorderStarted});
      /* Record the 'start' event */
      yield call(deps.recordApi.start);
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderStart', error});
    }
  }

  function* recorderStop () {
    try {
      let recorder = yield select(deps.getRecorderState);
      let recorderStatus = recorder.get('status');
      if (!/recording|paused/.test(recorderStatus)) {
        /* Stop request in invalid state. */
        return;
      }
      /* Signal that the recorder is stopping. */
      yield put({type: deps.recorderStopping});
      const {audioContext} = recorder.get('context');
      if (recorderStatus === 'recording') {
        /* Suspend the audio context to stop recording audio buffers. */
        yield call(suspendAudioContext, audioContext);
      }
      if (recorderStatus === 'paused') {
        /* When stopping while paused, the recording is truncated at the
           playback position */
        const audioTime = yield select(st => deps.getPlayerState(st).get('audioTime'));
        yield call(truncateRecording, audioTime, null);
      }
      /* Signal that the recorder has stopped. */
      yield put({type: deps.recorderStopped, payload: {}});
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderStop', error});
    }
  }

  function* recorderPause () {
    try {
      const recorder = yield select(deps.getRecorderState);
      if (recorder.get('status') !== 'recording') {
        return;
      }
      // Signal that the recorder is pausing.
      yield put({type: deps.recorderPausing});
      const {audioContext, worker} = recorder.get('context');
      yield call(suspendAudioContext, audioContext);
      // Obtain the URL to a (WAV-encoded) audio object from the worker.
      const {wav, duration} = yield call(worker.call, 'export', {wav: true}, pauseExportProgressSaga);
      const audioUrl = URL.createObjectURL(wav);
      // Get a URL for events.
      const endTime = Math.floor(duration * 1000);
      const events = recorder.get('events').push([endTime, 'end']);
      const version = RECORDING_FORMAT_VERSION;
      const data = {version, events, subtitles: []};
      const eventsBlob = new Blob([JSON.stringify(data)], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
      const eventsUrl = URL.createObjectURL(eventsBlob);
      // Prepare the player to use the audio and event streams, wait till ready.
      yield put({type: deps.playerPrepare, payload: {audioUrl, eventsUrl}});
      yield take(deps.playerReady);
      // Signal that the recorder is paused.
      yield put({type: deps.recorderPaused});
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderPause', error});
    }
    function* pauseExportProgressSaga (progress) {
      // console.log('pause', progress);
    }
  }

  bundle.defineAction('recorderResume', 'Recorder.Resume');
  bundle.defineAction('recorderResuming', 'Recorder.Resuming');
  bundle.defineAction('recorderResumed', 'Recorder.Resumed');
  bundle.addReducer('recorderResuming', (state, action) =>
    state.setIn(['recorder', 'status'], 'resuming')
  );

  bundle.addReducer('recorderResumed', (state, action) =>
    state.setIn(['recorder', 'status'], 'recording')
  );
  function* recorderResume () {
    try {
      const recorder = yield select(deps.getRecorderState);
      const recorderStatus = recorder.get('status');
      const player = yield select(deps.getPlayerState);
      const isPlaying = player.get('isPlaying');
      if (recorderStatus !== 'paused' || isPlaying) {
        console.log('bad state', recorderStatus);
        return;
      }
      /* Pause the player (even if already paused) to make sure the state
         accurately represents the instant in the recording. */
      yield put({type: deps.playerPause});
      yield take(deps.playerPaused);
      /* Clear the player's state. */
      yield put({type: deps.playerClear});
      /* Signal that the recorder is resuming. */
      yield put({type: deps.recorderResuming});
      /* Truncate the recording at the current playback position. */
      yield call(truncateRecording, player.get('audioTime'), player.get('current'));
      /* Resume the audio context to resume recording audio buffers. */
      yield call(resumeAudioContext, recorder.get('context').audioContext);
      // Signal that recording has resumed.
      yield put({type: deps.recorderResumed});
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderResume', error});
    }
  }

  function* truncateRecording (audioTime, instant) {
    const {worker} = yield select(st => deps.getRecorderState(st).get('context'));
    yield call(worker.call, 'truncate', {position: audioTime / 1000});
    if (instant) {
      const position = instant.pos + 1;
      yield put({type: deps.recorderTruncate, payload: {audioTime, position}});
    }
  }

  function* resumeAudioContext (audioContext) {
    /* Race with timeout, in case the audio device is busy. */
    const outcome = yield race({
      resumed: call(() => audioContext.resume()),
      timeout: call(delay, 1000)
    });
    if ('timeout' in outcome) {
      throw new Error('audio device is busy');
      /* Consider calling recorderPrepare to fix the issue?
         yield call(recorderPrepare);
       */
    }
  }

  function* suspendAudioContext (audioContext) {
    yield call(() => audioContext.suspend());
    const audioTime = Math.round(audioContext.currentTime * 1000);
    yield put({type: deps.audioContextSuspended, payload: {audioTime}})
  }
  bundle.defineAction('audioContextSuspended', 'Recorder.AudioContext.Suspended');
  bundle.addReducer('audioContextSuspended', (state, {payload: {audioTime}}) =>
    state.setIn(['recorder', 'suspendedAt'], audioTime));

  bundle.addSaga(function* watchRecorderPrepare () {
    yield takeLatest(deps.recorderPrepare, recorderPrepare);
  });

  bundle.addSaga(function* recorderTicker () {
    const {payload: {recorderContext}} = yield take(deps.recorderReady);
    while (true) {
      yield take(deps.recorderStarted);
      while (true) {
        const outcome = yield race({
          tick: call(delay, 1000),
          stopped: take(deps.recorderStopped)
        });
        if ('stopped' in outcome)
          break;
        const junkTime = yield select(st => st.getIn(['recorder', 'junkTime']));
        const elapsed = Math.round(recorderContext.audioContext.currentTime * 1000) - junkTime;
        yield put({type: deps.recorderTick, elapsed});
      }
    }
  });

  bundle.addSaga(function* watchRecorderActions () {
    yield takeEvery(deps.recorderStart, recorderStart);
    yield takeEvery(deps.recorderStop, recorderStop);
    yield takeEvery(deps.recorderPause, recorderPause);
    yield takeEvery(deps.recorderResume, recorderResume);
  });

  bundle.defer(function ({recordApi, replayApi}) {
    replayApi.on('end', function (replayContext, event) {
      replayContext.instant.isEnd = true;
      replayContext.state = replayContext.state.set('stopped', true);
    });
  });

};

function getAudioStream () {
  const constraints = {audio: true};
  if (typeof navigator.mediaDevices === 'object' &&
      typeof navigator.mediaDevices.getUserMedia === 'function') {
    // Use modern API returning a promise.
    return navigator.mediaDevices.getUserMedia(constraints);
  } else {
    // Use deprecated API taking two callbacks.
    const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    return new Promise(function (resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  }
}
