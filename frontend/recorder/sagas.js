
/* TODO: figure out why the 'end' event seems to be inserted when the recording
         is paused, not when the recording is actually stopped
         => because 'end' is added by recorderStopping
*/

import {delay} from 'redux-saga';
import {take, takeEvery, put, call, race, select, actionChannel} from 'redux-saga/effects';
import Immutable from 'immutable';

import {RECORDING_FORMAT_VERSION} from '../version';

import {spawnWorker, callWorker, killWorker} from '../utils/worker_utils';

// XXX worker URL should use SystemJS baseURL?
// import {workerUrlFromText} from '../../utils/worker_utils';
// import audioWorkerText from '../../assets/audio_worker.js!text';
// const audioWorkerUrl = workerUrlFromText(audioWorkerText);
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
    'playerPrepare', 'playerClear', 'playerReady'
  );

  function* recorderPrepare () {
    try {
      /* Show 'record' screen to user. */
      yield put({type: deps.switchToScreen, payload: {screen: 'record'}});
      // Clean up any previous audioContext and worker.
      const recorder = yield select(deps.getRecorderState);
      let context = recorder.get('context');
      if (context) {
        const oldContext = context.get('audioContext');
        const oldWorker = context.get('worker');
        if (oldContext) {
          oldContext.close();
        }
        if (oldWorker) {
          killWorker(oldWorker);
        }
        // TODO: put an action to clean up the old context, in case
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
      yield call(callWorker, worker, {
        command: "init",
        config: {
          sampleRate: audioContext.sampleRate
        }
      });
      // XXX create a channel to which input buffers are posted.
      yield put({type: deps.recorderPreparing, payload: {
        progress: 'worker_init_ok', analyser
      }});
      // Set up the ScriptProcessor to divert all buffers to the worker.
      scriptProcessor.onaudioprocess = function (event) {
        // dispatch event
        const ch0 = event.inputBuffer.getChannelData(0);
        const ch1 = event.inputBuffer.getChannelData(1);
        worker.postMessage({command: "record", buffer: [ch0, ch1]});
      };
      // Signal that the recorder is ready to start, storing the new context.
      // /!\  Chrome: store a reference to the scriptProcessor node to prevent
      //      the browser from garbage-collection the node (which seems to
      //      occur even though the node is still connected).
      context = {audioContext, worker, scriptProcessor};
      yield put({type: deps.recorderReady, context});
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
      yield call(resumeAudioContext, recorder.get('context'));
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
      const context = recorder.get('context');
      if (recorderStatus === 'recording') {
        /* Suspend the audio context to stop recording audio buffers. */
        yield call(suspendAudioContext, context);
      }
      if (recorderStatus === 'paused') {
        /* When stopping while paused, the recording is truncated at the
           playback position */
        const audioTime = yield select(st => deps.getPlayerState(st).get('audioTime'));
        yield call(truncateRecording, audioTime, null);
      }
      /* Encode the audio track. */
      const worker = context.get('worker');
      const {mp3, wav, duration} = yield call(callWorker, worker, {command: 'finishRecording', options: {mp3: true, wav: true}});
      const mp3Url = URL.createObjectURL(mp3);
      const wavUrl = URL.createObjectURL(wav);
      /* Package the events track. */
      recorder = yield select(deps.getRecorderState);
       /* Ensure the 'end' event occurs before the end of the audio track. */
      const endTime = Math.floor(duration * 1000);
      const version = RECORDING_FORMAT_VERSION;
      const events = recorder.get('events').push([endTime, 'end']);
      const subtitles = [];
      const data = {version, events, subtitles};
      const eventsBlob = new Blob([JSON.stringify(data)], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
      const eventsUrl = URL.createObjectURL(eventsBlob);
      // Signal that the recorder has stopped.
      yield put({
        type: deps.recorderStopped,
        audioUrl: mp3Url,
        wavAudioUrl: wavUrl,
        eventsUrl: eventsUrl
      });
      /* Show 'save' screen to user. */
      yield put({
        type: deps.switchToScreen,
        payload: {screen: 'save'}
      });
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderStop', error});
    }
  }

  function* recorderPause () {
    try {
      let recorder = yield select(deps.getRecorderState);
      if (recorder.get('status') !== 'recording') {
        return;
      }
      // Signal that the recorder is pausing.
      yield put({type: deps.recorderPausing});
      const context = recorder.get('context');
      yield call(suspendAudioContext, context);
      // Obtain the URL to a (WAV-encoded) audio object from the worker.
      const worker = context.get('worker');
      const {wav} = yield call(callWorker, worker, {command: "pauseRecording", options: {wav: true}});
      const audioUrl = URL.createObjectURL(wav);
      // Get a URL for events.
      const events = recorder.get('events');
      const eventsBlob = new Blob([JSON.stringify(events.toJSON())], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
      const eventsUrl = URL.createObjectURL(eventsBlob);
      // Prepare the player to use the audio and event streams, wait till ready.
      yield put({type: deps.playerPrepare, audioUrl, eventsUrl});
      yield take(deps.playerReady);
      // Signal that the recorder is paused.
      yield put({type: deps.recorderPaused});
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderPause', error});
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
      const player = yield select(deps.getPlayerState);
      const recorderStatus = recorder.get('status');
      const playerStatus = player.get('status');
      if (recorderStatus !== 'paused' || !/ready|paused/.test(playerStatus)) {
        console.log('bad state', recorderStatus, playerStatus);
        return;
      }
      /* Clear the player's state. */
      yield put({type: deps.playerClear});
      /* Signal that the recorder is resuming. */
      yield put({type: deps.recorderResuming});
      /* Truncate the recording at the current playback position. */
      yield call(truncateRecording, player.get('audioTime'), player.get('current'));
      /* Resume the audio context to resume recording audio buffers. */
      yield call(resumeAudioContext, recorder.get('context'));
      // Signal that recording has resumed.
      yield put({type: deps.recorderResumed});
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderResume', error});
    }
  }

  function* truncateRecording (timestamp, instant) {
    const worker = yield select(st => deps.getRecorderState(st).getIn(['context', 'worker']));
    yield call(callWorker, worker, {command: 'truncateRecording', payload: {position: timestamp}});
    if (instant) {
      const position = instant.pos + 1;
      yield put({type: deps.recorderTruncate, payload: {timestamp, position}});
    }
  }

  function* resumeAudioContext (context) {
    /* Race with timeout, in case the audio device is busy. */
    const audioContext = context.get('audioContext');
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
    const timestamp = Math.round(audioContext.currentTime * 1000);
    console.log('audioContextResumed', timestamp);
    yield put({type: deps.audioContextResumed, payload: {timestamp}})
  }
  bundle.defineAction('audioContextResumed', 'Recorder.AudioContext.Resumed');
  bundle.addReducer('audioContextResumed', (state, {payload: {timestamp}}) =>
    state.setIn(['recorder', 'audioRef'], timestamp));

  function* suspendAudioContext (context) {
    const audioContext = context.get('audioContext');
    yield call(() => audioContext.suspend());
    const timestamp = Math.round(audioContext.currentTime * 1000);
    yield put({type: deps.audioContextSuspended, payload: {timestamp}})
  }
  bundle.defineAction('audioContextSuspended', 'Recorder.AudioContext.Suspended');
  bundle.addReducer('audioContextSuspended', (state, {payload: {timestamp}}) =>
    state.updateIn(['recorder', 'eventRef'],
      eventRef => eventRef + timestamp));

  bundle.addSaga(function* watchRecorderPrepare () {
    while (true) {
      yield take(deps.recorderPrepare);
      yield call(recorderPrepare);
    }
  });

  bundle.addSaga(function* recorderTicker () {
    const {context} = yield take(deps.recorderReady);
    while (true) {
      yield take(deps.recorderStarted);
      while (true) {
        const outcome = yield race({
          tick: call(delay, 1000),
          stopped: take(deps.recorderStopped)
        });
        if ('stopped' in outcome)
          break;
        const offset = yield select(st => st.getIn(['recorder', 'eventRef']) - st.getIn(['recorder', 'audioRef']));
        const elapsed = Math.round(context.audioContext.currentTime * 1000) + offset;
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
    replayApi.on('end', function (context, event, instant) {
      context.state = context.state.set('stopped', true);
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
