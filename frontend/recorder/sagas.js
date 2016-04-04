
import {take, put, call, fork, select, race} from 'redux-saga/effects';

import {getRecorderState} from '../selectors';
import {workerUrlFromText, spawnWorker, callWorker, killWorker} from '../worker_utils';

// import audioWorkerText from '../../assets/audio_worker.js!text';
// const audioWorkerUrl = workerUrlFromText(audioWorkerText);
const audioWorkerUrl = '/assets/audio_worker.js';

export default function (actions) {

  //
  // Async helpers (normal functions)
  //

  function getAudioStream () {
    // Use the modern API returning a promise.
    return navigator.mediaDevices.getUserMedia({audio: true});
  }

  function suspendAudioContext (audioContext) {
    return audioContext.suspend();
  }

  function resumeAudioContext (audioContext) {
    return audioContext.resume();
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  //
  // Sagas (generators)
  //

  function* recorderPrepare () {
    try {
      // Clean up any previous audioContext and worker.
      const recorderState = yield select(getRecorderState);
      if (recorderState.audioContext) {
        audioContext.close();
      }
      if (recorderState.worker) {
        killWorker(worker);
      }
      yield put({type: actions.recorderPreparing, progress: 'start'});
      // Attempt to obtain an audio stream.  The async call will complete once
      // the user has granted permission to use the microphone.
      const stream = yield call(getAudioStream);
      yield put({type: actions.recorderPreparing, progress: 'stream_ok'});
      // Create the AudioContext, connect the nodes, and suspend the audio
      // context until we actually start recording.
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(
        /*bufferSize*/ 4096, /*numberOfInputChannels*/ 2, /*numberOfOutputChannels*/ 2);
      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
      yield call(suspendAudioContext, audioContext);
      yield put({type: actions.recorderPreparing, progress: 'audio_ok'});
      // Set up a worker to hold and encode the buffers.
      const worker = yield call(spawnWorker, audioWorkerUrl);
      yield put({type: actions.recorderPreparing, progress: 'worker_ok'});
      // Initialize the worker.
      yield call(callWorker, worker, {
        command: "init",
        config: {
          sampleRate: audioContext.sampleRate
        }
      });
      yield put({type: actions.recorderPreparing, progress: 'worker_init_ok'});
      // Set up the ScriptProcessor to divert all buffers to the worker.
      scriptProcessor.onaudioprocess = function (event) {
        worker.postMessage({
          command: "record",
          buffer: [
             event.inputBuffer.getChannelData(0),
             event.inputBuffer.getChannelData(1)
          ]
        });
      };
      // Signal that the recorder is ready to start.
      yield put({type: actions.recorderReady, audioContext, worker});
    } catch (error) {
      // XXX send a specialized event and allow retrying recorderPrepare
      yield put({type: actions.error, source: 'recorderPrepare', error});
    }
  }

  function* recorderStart () {
    try {
      // The user clicked the "start recording" button.
      const recorderState = yield select(getRecorderState);
      if (recorderState.state !== 'ready') {
        console.log('not ready', recorderState);
        return;
      }
      // Signal that the recorder is starting.
      yield put({type: actions.recorderStarting});
      // Resume the audio context to start recording audio buffers.
      const {audioContext} = recorderState;
      yield call(resumeAudioContext, audioContext);
      // Save the start time and signal that recording has started.
      const startTime = window.performance.now();
      yield put({type: actions.recorderStarted, startTime});
    } catch (error) {
      // XXX generic error
      yield put({type: actions.error, source: 'recorderStart', error});
    }
  }

  function* recorderStop () {
    try {
      const recorderState = yield select(getRecorderState);
      if (recorderState.state !== 'recording')
        return;
      // Signal that the recorder is stopping.
      yield put({type: actions.recorderStopping});
      // Suspend the audio context to stop recording audio buffers.
      const {audioContext, worker} = recorderState;
      yield call(suspendAudioContext, audioContext);
      const audioResult = yield call(callWorker, worker, {command: "finishRecording"});
      console.log(audioResult);
      yield put({type: actions.recorderStopped});
      console.log('recorderStop stopped');
    } catch (error) {
      // XXX generic error
      yield put({type: actions.error, source: 'recorderStop', error});
    }
  }

  function* recorderTicker () {
    while (true) {
      yield take(actions.recorderStarted);
      while (true) {
        const outcome = yield race({
          tick: call(delay, 1000),
          stopped: take(actions.recorderStopped)
        });
        if ('stopped' in outcome)
          break;
        const now = window.performance.now();
        yield put({type: actions.recorderTick, now});
      }
    }
  }

  function* watchRecorderStart () {
    while (true) {
      yield take(actions.recorderStart);
      yield call(recorderStart);
    }
  }

  function* watchRecorderStop () {
    while (true) {
      yield take(actions.recorderStop);
      yield call(recorderStop);
    }
  }

  // Currently the recorder is automatically prepared once,
  // when the application starts up.
  return [
    recorderPrepare,
    watchRecorderStart,
    watchRecorderStop,
    recorderTicker
  ];

};
