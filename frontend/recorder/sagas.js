
import {takeLatest} from 'redux-saga';
import {take, put, call, race, fork, select} from 'redux-saga/effects';
import * as C from 'persistent-c';

import {asyncRequestJson} from '../api';
import {getPreparedSource, getRecorderState, getStepperState} from '../selectors';
import {workerUrlFromText, spawnWorker, callWorker, killWorker} from '../worker_utils';
import {loadTranslated} from '../common/translate';
import * as runtime from '../common/runtime';
import Document from '../document';
import {recordEventAction, compressRange, RECORDING_FORMAT_VERSION} from './utils';

// XXX worker URL should use SystemJS baseURL?
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

  /* A context is an object that is mutated as a saga steps through nodes.
     The context must never escape the saga, use viewContext to export the
     persistent bits.
   */
  function buildContext (state) {
    const startTime = window.performance.now();
    return {
      state,
      startTime,
      timeLimit: startTime + 20,
      stepCounter: 0,
      running: true
    };
  }

  function viewContext (context) {
    // Returns a persistent view of the context.
    const {state, startTime, stepCounter, running} = context;
    const elapsed = window.performance.now() - context.startTime;
    return {state, elapsed, stepCounter};
  }

  function singleStep (context, stopCond) {
    const {running, state} = context;
    if (!running || state.error || !state.control) {
      context.running = false;
      return false;
    }
    if (stopCond && stopCond(state)) {
      return false;
    }
    context.state = C.step(state, runtime.options);
    context.stepCounter += 1;
    return true;
  }

  //
  // Sagas (generators)
  //

  function* recorderPrepare () {
    try {
      // Clean up any previous audioContext and worker.
      const recorder = yield select(getRecorderState);
      let audioContext = recorder.get('audioContext');
      let worker = recorder.get('worker');
      if (audioContext) {
        audioContext.close();
      }
      if (worker) {
        killWorker(worker);
      }
      yield put({type: actions.recorderPreparing, progress: 'start'});
      // Attempt to obtain an audio stream.  The async call will complete once
      // the user has granted permission to use the microphone.
      const stream = yield call(getAudioStream);
      yield put({type: actions.recorderPreparing, progress: 'stream_ok'});
      // Create the AudioContext, connect the nodes, and suspend the audio
      // context until we actually start recording.
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      const scriptProcessor = audioContext.createScriptProcessor(
        /*bufferSize*/ 4096, /*numberOfInputChannels*/ 2, /*numberOfOutputChannels*/ 2);
      source.connect(analyser);
      source.connect(scriptProcessor);
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      scriptProcessor.connect(audioContext.destination);
      yield call(suspendAudioContext, audioContext);
      yield put({type: actions.recorderPreparing, progress: 'audio_ok'});
      // Set up a worker to hold and encode the buffers.
      worker = yield call(spawnWorker, audioWorkerUrl);
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
      const vumeterData = new Uint8Array(analyser.frequencyBinCount);
      const canvasContext = document.getElementById('vumeter').getContext("2d");
      scriptProcessor.onaudioprocess = function (event) {
        if (canvasContext) {
          // Get analyser data and update vumeter.
          analyser.getByteFrequencyData(vumeterData);
          let sum = 0, i;
          for (i = 0; i < vumeterData.length; i++) {
            sum += vumeterData[i];
          }
          const average = sum / vumeterData.length;
          canvasContext.fillStyle = '#dddddd';
          canvasContext.fillRect(0, 0, 10, 100);
          canvasContext.fillStyle = '#00ff00';
          canvasContext.fillRect(0, 100 - average, 10, 100);
        }
        // Post buffers to worker.
        const ch0 = event.inputBuffer.getChannelData(0);
        const ch1 = event.inputBuffer.getChannelData(1);
        worker.postMessage({command: "record", buffer: [ch0, ch1]});
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
      const recorder = yield select(getRecorderState);
      if (recorder.get('state') !== 'ready') {
        console.log('not ready', recorder);
        return;
      }
      const source = yield select(getPreparedSource);
      // Signal that the recorder is starting.
      yield put({type: actions.recorderStarting});
      // Resume the audio context to start recording audio buffers.
      const audioContext = recorder.get('audioContext');
      // Race with timeout, in case the audio device is busy.
      const outcome = yield race({
        resumed: call(resumeAudioContext, audioContext),
        timeout: call(delay, 1000)
      });
      if ('timeout' in outcome) {
        // XXX We call recorderPrepare to attempt to fix the issue and abort
        //     the start, ideally we should put an action to notify the user.
        yield call(recorderPrepare);
        return;
      }
      // Save the start time and signal that recording has started.
      const startTime = window.performance.now();
      yield put({type: actions.recorderStarted, startTime});
      yield put(recordEventAction(['start', {
        version: RECORDING_FORMAT_VERSION,
        source: {
          document: Document.toString(source.get('document')),
          selection: compressRange(source.get('selection'))
        }
      }]));
      yield put({type: actions.switchToRecordScreen, source});
    } catch (error) {
      // XXX generic error
      yield put({type: actions.error, source: 'recorderStart', error});
    }
  }

  function* recorderStop () {
    try {
      const recorder = yield select(getRecorderState);
      if (recorder.get('state') !== 'recording')
        return;
      // Signal that the recorder is stopping.
      yield put({type: actions.recorderStopping});
      // Suspend the audio context to stop recording audio buffers.
      const audioContext = recorder.get('audioContext');
      const worker = recorder.get('worker');
      const events = recorder.get('events');
      yield call(suspendAudioContext, audioContext);
      const audioResult = yield call(callWorker, worker, {command: "finishRecording"});
      const eventsBlob = new Blob([JSON.stringify(events.toJSON())], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
      const eventsUrl = URL.createObjectURL(eventsBlob);
      yield put({
        type: actions.recorderStopped,
        audioUrl: audioResult.url,
        eventsUrl: eventsUrl
      });
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

  function* translateSource (action) {
    const {source} = action;
    try {
      yield put(recordEventAction(['translate', source]));
      const {ast} = yield call(asyncRequestJson, '/translate', {source});
      const result = loadTranslated(source, ast);
      yield put(recordEventAction(['translateSuccess', ast]));
      yield put({type: actions.translateSourceSucceeded, result});
      yield put({type: actions.recordScreenStepperRestart, result});
    } catch (error) {
      const message = error.toString();
      yield put({type: actions.translateSourceFailed, error: message, source});
      yield put(recordEventAction(['translateFailure', message]));
    }
  }

  function* watchTranslateSource () {
    yield* takeLatest(actions.translateSource, translateSource);
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

  function* watchStepperStep () {
    while (true) {
      const action = yield take(actions.recordScreenStepperStep);
      const stepper = yield select(getStepperState);
      if (stepper.get('state') === 'starting') {
        yield put({type: actions.recordScreenStepperStart});
        const context = buildContext(stepper.get('compute'));
        // Take a single step unconditionally,
        context.state = C.step(context.state, runtime.options);
        context.stepCounter += 1;
        // ...
        switch (action.mode) {
          case 'into':
            // Step out of the current statement.
            yield call(stepUntil, context, C.outOfCurrentStmt);
            // Step into the next statement.
            yield call(stepUntil, context, C.intoNextStmt);
            break;
          case 'expr':
            // then stop when we enter the next expression.
            yield call(stepUntil, context, C.intoNextExpr);
            break;
        }
        yield put(recordEventAction(['stepIdle', context.stepCounter]));
        yield put({type: actions.recordScreenStepperIdle, context: viewContext(context)});
      }
    }
  }

  function* stepUntil (context, stopCond) {
    while (true) {
      // Execute up to 100 steps, or until the stop condition (or end of the
      // program, or an error condition) is met.
      for (let stepCount = 100; stepCount !== 0; stepCount -= 1) {
        if (!singleStep(context, stopCond)) {
          return;
        }
      }
      // Has the time limit for the current run passed?
      const now = window.performance.now();
      if (now >= context.timeLimit) {
        // Reset the time limit and put a Progress event.
        context.timeLimit = window.performance.now() + 20;
        yield put({type: actions.recordScreenStepperProgress, context: viewContext(context)});
        yield put(recordEventAction(['stepProgress', context.stepCounter]));
        // Yield until the next tick (XXX consider requestAnimationFrame).
        yield call(delay, 0);
        // Stop prematurely if interrupted.
        const interrupted = yield select(getStepperInterrupted);
        if (interrupted) {
          context.running = false;
          return;
        }
      }
    }
  }

  // Currently the recorder is automatically prepared once,
  // when the application starts up.
  return [
    recorderPrepare,
    recorderTicker,
    watchRecorderStart,
    watchRecorderStop,
    watchTranslateSource,
    watchStepperStep
  ];

};
