
import {takeLatest} from 'redux-saga';
import {put, call, fork, select} from 'redux-saga/effects';

import {getRecorderState} from '../selectors';
import {workerUrlFromText, spawnWorker, watchWorker} from '../worker_utils';

import audioWorkerText from './audio-worker.js!text';
const audioWorkerUrl = workerUrlFromText(audioWorkerText);

export default function (actions) {

  function asyncGetAudioStream () {
    // Use the modern API returning a promise.
    return navigator.mediaDevices.getUserMedia({audio: true});
  }

  function* recorderPrepare () {
    try {
      // Terminate a previous worker.
      const recorderState = yield select(getRecorderState);
      if (recorderState.worker) {
        recorderState.worker.watcher.cancel();
        recorderState.worker.terminate();
      }
      yield put({type: actions.recorderPreparing});
      const stream = yield call(asyncGetAudioStream);
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const {worker} = yield call(spawnWorker, audioWorkerUrl);
      worker.watcher = yield fork(watchWorker, worker, actions.audioWorkerMessage);
      yield put({type: actions.recorderReady, source, worker});
    } catch (error) {
      yield put({type: actions.error, source: 'recorderPrepare', error});
    }
  }

  function* watchRecorderStart () {
    try {
      yield* takeLatest(actions.recorderStart, recorderStart);
    } catch (error) {
      yield put({type: actions.error, source: 'recorderStart', error});
    }
  }

  function* recorderStart () {
    // The user clicked the "start recording" button.
    const recorderState = yield select(getRecorderState);
    if (recorderState.state !== 'ready')
      return;
    const {worker, source} = recorderState;
    // Initialize the worker's state.
    worker.postMessage({
      command: "init",
        config: {
          sampleRate: source.context.sampleRate
      }
    });
    // Process the audio samples using a script function.
    const node = source.context.createScriptProcessor(4096, 2, 2);
    node.onaudioprocess = function (event) {
      // Pass the buffer on to the worker.
      worker.postMessage({
        command: "record",
        buffer: [
           event.inputBuffer.getChannelData(0),
           event.inputBuffer.getChannelData(1)
        ]
      });
    };
    source.connect(node);
    node.connect(source.context.destination);
    yield put({type: actions.recorderStarted});
  }

  function* watchRecorderStop () {
    yield* takeLatest(actions.recorderStop, recorderStop);
  }

  function* recorderStop () {
    const recorderState = yield select(getRecorderState);
    if (recorderState.state !== 'recording')
      return;
    yield put({type: actions.recorderStopping});
    // TODO: save the recording and kill the worker
    // TODO: let the worker do the mp3 encoding?
    yield put({type: actions.recorderStopped});
  }

  // Currently the recorder is automatically prepared once,
  // when the application starts up.
  return [
    recorderPrepare,
    watchRecorderStart,
    watchRecorderStop
  ];

};
