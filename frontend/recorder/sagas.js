
import {take, put, call, race, select} from 'redux-saga/effects';
import Immutable from 'immutable';

import {use, addSaga} from '../utils/linker';
import {RECORDING_FORMAT_VERSION} from '../version';
import Document from '../utils/document';
import {spawnWorker, callWorker, killWorker} from '../utils/worker_utils';

// XXX worker URL should use SystemJS baseURL?
// import {workerUrlFromText} from '../../utils/worker_utils';
// import audioWorkerText from '../../assets/audio_worker.js!text';
// const audioWorkerUrl = workerUrlFromText(audioWorkerText);
const audioWorkerUrl = '/assets/audio_worker.js';

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

export default function* (deps) {

  yield use(
    'error', 'switchToRecordScreen',
    'getRecorderState', 'getPreparedSource', 'getPreparedInput',
    'recorderPrepare', 'recorderPreparing', 'recorderReady',
    'recorderAddEvent', 'recorderTick',
    'recorderStart', 'recorderStarting', 'recorderStarted',
    'recorderStop', 'recorderStopping', 'recorderStopped',
    'sourceSelect', 'sourceEdit', 'sourceScroll',
    'inputSelect', 'inputEdit', 'inputScroll',
    'translateStarted', 'translateSucceeded', 'translateFailed',
    'stepperStep', 'stepperProgress', 'stepperIdle', 'stepperInterrupt', 'stepperRestart', 'stepperExit'
  );

  function recordEventAction (payload) {
    return {
      type: deps.recorderAddEvent,
      timestamp: window.performance.now(),
      payload
    };
  };

  function* recorderPrepare () {
    try {
      // Clean up any previous audioContext and worker.
      const recorder = yield select(deps.getRecorderState);
      let context = recorder.get('context');
      if (context) {
        const oldContext = recorder.get('audioContext');
        const oldWorker = recorder.get('worker');
        if (oldContext) {
          oldContext.close();
        }
        if (oldWorker) {
          killWorker(oldWorker);
        }
        // TODO: put an action to clean up the old context, in case
        //       the saga fails before recorderReady is sent.
      }
      yield put({type: deps.recorderPreparing, progress: 'start'});
      // Attempt to obtain an audio stream.  The async call will complete once
      // the user has granted permission to use the microphone.
      const stream = yield call(getAudioStream);
      yield put({type: deps.recorderPreparing, progress: 'stream_ok'});
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
      yield call(suspendAudioContext, audioContext);
      yield put({type: deps.recorderPreparing, progress: 'audio_ok'});
      // Set up a worker to hold and encode the buffers.
      const worker = yield call(spawnWorker, audioWorkerUrl);
      yield put({type: deps.recorderPreparing, progress: 'worker_ok'});
      // Initialize the worker.
      yield call(callWorker, worker, {
        command: "init",
        config: {
          sampleRate: audioContext.sampleRate
        }
      });
      yield put({type: deps.recorderPreparing, progress: 'worker_init_ok'});
      // Set up the ScriptProcessor to divert all buffers to the worker.
      const vumeterElement = document.getElementById('vumeter');
      if (vumeterElement) {
        const canvasContext = document.getElementById('vumeter').getContext("2d");
        const vumeterData = new Uint8Array(analyser.frequencyBinCount);
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
      }
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
      if (recorder.get('state') !== 'ready') {
        console.log('not ready', recorder);
        return;
      }
      const source = yield select(deps.getPreparedSource);
      const input = yield select(deps.getPreparedInput);
      // Signal that the recorder is starting.
      yield put({type: deps.recorderStarting});
      // Resume the audio context to start recording audio buffers.
      const context = recorder.get('context');
      // Race with timeout, in case the audio device is busy.
      const outcome = yield race({
        resumed: call(resumeAudioContext, context.get('audioContext')),
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
      yield put({type: deps.recorderStarted, startTime});
      yield put(recordEventAction(['start', {
        version: RECORDING_FORMAT_VERSION,
        source: {
          document: Document.toString(source.get('document')),
          selection: Document.compressRange(source.get('selection')),
          scrollTop: source.get('scrollTop')
        },
        input: {
          document: Document.toString(input.get('document')),
          selection: Document.compressRange(input.get('selection')),
          scrollTop: input.get('scrollTop')
        }
      }]));
      yield put({type: deps.switchToRecordScreen, source, input});
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderStart', error});
    }
  }

  function* recorderStop () {
    try {
      let recorder = yield select(deps.getRecorderState);
      if (recorder.get('state') !== 'recording')
        return;
      // Signal that the recorder is stopping.
      yield put({type: deps.recorderStopping});
      // Suspend the audio context to stop recording audio buffers.
      const context = recorder.get('context');
      const audioContext = context.get('audioContext');
      yield call(suspendAudioContext, audioContext);
      // Append the 'end' action to the events stream.
      yield put(recordEventAction(['end']));
      // Obtain the URL to the audio object from the worker.
      const worker = context.get('worker');
      const audioResult = yield call(callWorker, worker, {command: "finishRecording"});
      // Package the events blob and an URL.
      recorder = yield select(deps.getRecorderState);
      const events = recorder.get('events');
      const eventsBlob = new Blob([JSON.stringify(events.toJSON())], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
      const eventsUrl = URL.createObjectURL(eventsBlob);
      // Signal that the recorder has stopped.
      yield put({
        type: deps.recorderStopped,
        audioUrl: audioResult.url,
        eventsUrl: eventsUrl
      });
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderStop', error});
    }
  }

  yield addSaga(function* watchRecorderPrepare () {
    while (true) {
      yield take(deps.recorderPrepare);
      yield call(recorderPrepare);
    }
  });

  yield addSaga(function* recorderTicker () {
    while (true) {
      yield take(deps.recorderStarted);
      while (true) {
        const outcome = yield race({
          tick: call(delay, 1000),
          stopped: take(deps.recorderStopped)
        });
        if ('stopped' in outcome)
          break;
        const now = window.performance.now();
        yield put({type: deps.recorderTick, now});
      }
    }
  });

  yield addSaga(function* watchRecorderStart () {
    while (true) {
      yield take(deps.recorderStart);
      yield call(recorderStart);
    }
  });

  yield addSaga(function* watchRecorderStop () {
    while (true) {
      yield take(deps.recorderStop);
      yield call(recorderStop);
    }
  });

  yield addSaga(function* watchSourceSelect () {
    while (true) {
      const {selection} = yield take(deps.sourceSelect);
      yield put(recordEventAction(['source.select', Document.compressRange(selection)]));
    }
  });

  yield addSaga(function* watchSourceEdit () {
    while (true) {
      const {delta} = yield take(deps.sourceEdit);
      const {start, end} = delta;
      const range = {start, end};
      if (delta.action === 'insert') {
        yield put(recordEventAction(['source.insert', Document.compressRange(range), delta.lines]));
      } else {
        yield put(recordEventAction(['source.delete', Document.compressRange(range)]));
      }
    }
  });

  yield addSaga(function* watchSourceScroll () {
    while (true) {
      const {scrollTop, firstVisibleRow} = yield take(deps.sourceScroll);
      yield put(recordEventAction(['source.scroll', scrollTop, firstVisibleRow]));
    }
  });

  yield addSaga(function* watchInputSelect () {
    while (true) {
      const {selection} = yield take(deps.inputSelect);
      yield put(recordEventAction(['input.select', Document.compressRange(selection)]));
    }
  });

  yield addSaga(function* watchInputEdit () {
    while (true) {
      const {delta} = yield take(deps.inputEdit);
      const {start, end} = delta;
      const range = {start, end};
      if (delta.action === 'insert') {
        yield put(recordEventAction(['input.insert', Document.compressRange(range), delta.lines]));
      } else {
        yield put(recordEventAction(['input.delete', Document.compressRange(range)]));
      }
    }
  });

  yield addSaga(function* watchInputScroll () {
    while (true) {
      const {scrollTop, firstVisibleRow} = yield take(deps.inputScroll);
      yield put(recordEventAction(['input.scroll', scrollTop, firstVisibleRow]));
    }
  });

  yield addSaga(function* watchTranslateStart () {
    while (true) {
      const {source} = yield take(deps.translateStarted);
      yield put(recordEventAction(['stepper.translate', source]));
    }
  });

  yield addSaga(function* watchTranslateSuccess () {
    while (true) {
      const {response} = yield take(deps.translateSucceeded);
      yield put(recordEventAction(['stepper.translateSuccess', response]));
    }
  });

  yield addSaga(function* watchTranslateFailure () {
    while (true) {
      const {response} = yield take(deps.translateFailed);
      yield put(recordEventAction(['stepper.translateFailure', response]));
    }
  });

  yield addSaga(function* watchStepperStep () {
    while (true) {
      const {mode} = yield take(deps.stepperStep);
      yield put(recordEventAction(['stepper.' + mode]));
    }
  });

  yield addSaga(function* watchStepperProgress () {
    while (true) {
      const {context} = yield take(deps.stepperProgress);
      // CONSIDER: record control node id and step
      yield put(recordEventAction(['stepper.progress', context.stepCounter]));
    }
  });

  yield addSaga(function* watchStepperIdle () {
    while (true) {
      const {context} = yield take(deps.stepperIdle);
      // CONSIDER: record control node id and step
      yield put(recordEventAction(['stepper.idle', context.stepCounter]));
    }
  });

  yield addSaga(function* watchStepperInterrupt () {
    while (true) {
      yield take(deps.stepperInterrupt);
      yield put(recordEventAction(['stepper.interrupt']));
    }
  });

  yield addSaga(function* watchStepperRestart () {
    while (true) {
      yield take(deps.stepperRestart);
      yield put(recordEventAction(['stepper.restart']));
    }
  });

  yield addSaga(function* watchStepperExit () {
    while (true) {
      yield take(deps.stepperExit);
      yield put(recordEventAction(['stepper.exit']));
    }
  });

};
