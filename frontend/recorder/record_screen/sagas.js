
import {take, put, call, race, select} from 'redux-saga/effects';
import Immutable from 'immutable';

import {RECORDING_FORMAT_VERSION} from '../../common/version';
import Document from '../../common/document';
import {workerUrlFromText, spawnWorker, callWorker, killWorker} from '../../common/worker_utils';

// XXX worker URL should use SystemJS baseURL?
// import audioWorkerText from '../../assets/audio_worker.js!text';
// const audioWorkerUrl = workerUrlFromText(audioWorkerText);
const audioWorkerUrl = '/assets/audio_worker.js';

export default function (actions, selectors) {

  function recordEventAction (payload) {
    return {
      type: actions.recorderAddEvent,
      timestamp: window.performance.now(),
      payload
    };
  };

  //
  // Async helpers (normal functions)
  //

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

  //
  // Sagas (generators)
  //

  function* recorderPrepare () {
    try {
      // Clean up any previous audioContext and worker.
      const recorder = yield select(selectors.getRecorderState);
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
      yield put({type: actions.recorderPreparing, progress: 'start'});
      // Attempt to obtain an audio stream.  The async call will complete once
      // the user has granted permission to use the microphone.
      const stream = yield call(getAudioStream);
      yield put({type: actions.recorderPreparing, progress: 'stream_ok'});
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
      // Signal that the recorder is ready to start, storing the new context.
      // /!\  Chrome: store a reference to the scriptProcessor node to prevent
      //      the browser from garbage-collection the node (which seems to
      //      occur even though the node is still connected).
      context = {audioContext, worker, scriptProcessor};
      yield put({type: actions.recorderReady, context});
    } catch (error) {
      // XXX send a specialized event and allow retrying recorderPrepare
      yield put({type: actions.error, source: 'recorderPrepare', error});
    }
  }

  function* recorderStart () {
    try {
      // The user clicked the "start recording" button.
      const recorder = yield select(selectors.getRecorderState);
      if (recorder.get('state') !== 'ready') {
        console.log('not ready', recorder);
        return;
      }
      const source = yield select(selectors.getPreparedSource);
      const input = yield select(selectors.getPreparedInput);
      // Signal that the recorder is starting.
      yield put({type: actions.recorderStarting});
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
      yield put({type: actions.recorderStarted, startTime});
      yield put(recordEventAction(['start', {
        version: RECORDING_FORMAT_VERSION,
        source: {
          document: Document.toString(source.get('document')),
          selection: Document.compressRange(source.get('selection'))
        }
      }]));
      yield put({type: actions.switchToRecordScreen, source, input});
    } catch (error) {
      // XXX generic error
      yield put({type: actions.error, source: 'recorderStart', error});
    }
  }

  function* recorderStop () {
    try {
      const recorder = yield select(selectors.getRecorderState);
      if (recorder.get('state') !== 'recording')
        return;
      // Signal that the recorder is stopping.
      yield put({type: actions.recorderStopping});
      // Suspend the audio context to stop recording audio buffers.
      const context = recorder.get('context');
      const audioContext = context.get('audioContext');
      yield call(suspendAudioContext, audioContext);
      const endEvent = Immutable.List([(audioContext.currentTime * 1000) | 0, 'end']);
      const events = recorder.get('events').push(endEvent);
      const worker = context.get('worker');
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

  function* watchSourceSelect () {
    while (true) {
      const {selection} = yield take(actions.sourceSelect);
      yield put(recordEventAction(['select', Document.compressRange(selection)]));
    }
  }

  function* watchSourceEdit () {
    while (true) {
      const {delta} = yield take(actions.sourceEdit);
      const {start, end} = delta;
      const range = {start, end};
      if (delta.action === 'insert') {
        yield put(recordEventAction(['insert', Document.compressRange(range), delta.lines]));
      } else {
        yield put(recordEventAction(['delete', Document.compressRange(range)]));
      }
    }
  }

  function* watchInputSelect () {
    while (true) {
      const {selection} = yield take(actions.inputSelect);
      yield put(recordEventAction(['input.select', Document.compressRange(selection)]));
    }
  }

  function* watchInputEdit () {
    while (true) {
      const {delta} = yield take(actions.inputEdit);
      const {start, end} = delta;
      const range = {start, end};
      if (delta.action === 'insert') {
        yield put(recordEventAction(['input.insert', Document.compressRange(range), delta.lines]));
      } else {
        yield put(recordEventAction(['input.delete', Document.compressRange(range)]));
      }
    }
  }

  function* watchTranslateStart () {
    while (true) {
      const {source} = yield take(actions.translateStart);
      yield put(recordEventAction(['translate', source]));
    }
  }

  function* watchTranslateSuccess () {
    while (true) {
      const {response} = yield take(actions.translateSucceeded);
      yield put(recordEventAction(['translateSuccess', response]));
    }
  }

  function* watchTranslateFailure () {
    while (true) {
      const {response} = yield take(actions.translateFailed);
      yield put(recordEventAction(['translateFailure', response]));
    }
  }

  function* watchStepperStep () {
    while (true) {
      const {mode} = yield take(actions.stepperStep);
      yield put(recordEventAction(['stepper', mode]));
    }
  }

  function* watchStepperProgress () {
    while (true) {
      const {context} = yield take(actions.stepperProgress);
      // CONSIDER: record control node id and step
      yield put(recordEventAction(['stepper', 'progress', context.stepCounter]));
    }
  }

  function* watchStepperIdle () {
    while (true) {
      const {context} = yield take(actions.stepperIdle);
      // CONSIDER: record control node id and step
      yield put(recordEventAction(['stepper', 'idle', context.stepCounter]));
    }
  }

  function* watchStepperRestart () {
    while (true) {
      yield take(actions.stepperRestart);
      yield put(recordEventAction(['stepper', 'restart']));
    }
  }

  function* watchStepperExit () {
    while (true) {
      yield take(actions.stepperExit);
      yield put(recordEventAction(['stepper', 'exit']));
    }
  }

  const onEdit = function () {
    self.props.dispatch(recordEventAction(['translateClear']));
    self.props.dispatch({type: actions.stepperExit});
  };


  // Currently the recorder is automatically prepared once,
  // when the application starts up.
  return [
    recorderPrepare,
    recorderTicker,
    watchRecorderStart,
    watchRecorderStop,
    watchSourceSelect,
    watchSourceEdit,
    watchInputSelect,
    watchInputEdit,
    watchTranslateStart,
    watchTranslateSuccess,
    watchTranslateFailure,
    watchStepperProgress,
    watchStepperIdle,
    watchStepperRestart,
    watchStepperExit
  ];

};
