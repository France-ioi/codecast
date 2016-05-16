
import {delay} from 'redux-saga';
import {take, put, call, race, select, actionChannel} from 'redux-saga/effects';
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


export default function* (deps) {

  yield use(
    'error', 'switchToScreen',
    'getRecorderState', 'getSourceModel', 'getInputModel',
    'recorderPrepare', 'recorderPreparing', 'recorderReady',
    'recorderAddEvent', 'recorderTick',
    'recorderStart', 'recorderStarting', 'recorderStarted',
    'recorderStop', 'recorderStopping', 'recorderStopped',
    'sourceSelect', 'sourceEdit', 'sourceScroll',
    'inputSelect', 'inputEdit', 'inputScroll',
    'translateStarted', 'translateSucceeded', 'translateFailed', 'translateClearDiagnostics',
    'stepperStarted', 'stepperProgress', 'stepperIdle', 'stepperInterrupt', 'stepperRestart', 'stepperExit'
  );

  function* recorderPrepare () {
    try {
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
      if (recorder.get('status') !== 'ready') {
        console.log('not ready', recorder);
        return;
      }
      const sourceModel = yield select(deps.getSourceModel);
      const inputModel = yield select(deps.getInputModel);
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
      // Signal that recording has started.
      yield put({type: deps.recorderStarted});
      yield call(recordEvent, [0, 'start', {
        version: RECORDING_FORMAT_VERSION,
        source: {
          document: Document.toString(sourceModel.get('document')),
          selection: Document.compressRange(sourceModel.get('selection')),
          scrollTop: sourceModel.get('scrollTop')
        },
        input: {
          document: Document.toString(inputModel.get('document')),
          selection: Document.compressRange(inputModel.get('selection')),
          scrollTop: inputModel.get('scrollTop')
        }
      }]);
      yield put({type: deps.switchToScreen, screen: 'record'});
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderStart', error});
    }
  }

  function* recorderStop () {
    try {
      let recorder = yield select(deps.getRecorderState);
      if (recorder.get('status') !== 'recording') {
        return;
      }
      // Signal that the recorder is stopping.
      yield put({type: deps.recorderStopping});
      // The recorderStopping action appends the 'end' action to the events
      // stream.  Do this before pausing the audio to ensure that the 'end'
      // event occurs before the end of the audio stream, so that playback
      // always goes past the 'end' event.
      // Suspend the audio context to stop recording audio buffers.
      const context = recorder.get('context');
      const audioContext = context.get('audioContext');
      yield call(suspendAudioContext, audioContext);
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
        const elapsed = 0; // XXX
        yield put({type: deps.recorderTick, elapsed});
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

  function* recordEvent (event) {
    yield put({type: deps.recorderAddEvent, event});
  };

  const recorders = {};

  recorders.sourceSelect = function* (t, action) {
    const {selection} = action;
    yield call(recordEvent, [t, 'source.select', Document.compressRange(selection)]);
  };

  recorders.sourceEdit = function* (t, action) {
    const {delta} = action;
    const {start, end} = delta;
    const range = {start, end};
    if (delta.action === 'insert') {
      yield call(recordEvent, [t, 'source.insert', Document.compressRange(range), delta.lines]);
    } else {
      yield call(recordEvent, [t, 'source.delete', Document.compressRange(range)]);
    }
  };

  recorders.sourceScroll = function* (t, action) {
    const {scrollTop, firstVisibleRow} = action;
    yield call(recordEvent, [t, 'source.scroll', scrollTop, firstVisibleRow]);
  };

  recorders.inputSelect = function* (t, action) {
    const {selection} = action;
    yield call(recordEvent, [t, 'input.select', Document.compressRange(selection)]);
  };

  recorders.inputEdit = function* (t, action) {
    const {delta} = action;
    const {start, end} = delta;
    const range = {start, end};
    if (delta.action === 'insert') {
      yield call(recordEvent, [t, 'input.insert', Document.compressRange(range), delta.lines]);
    } else {
      yield call(recordEvent, [t, 'input.delete', Document.compressRange(range)]);
    }
  };

  recorders.inputScroll = function* (t, action) {
    const {scrollTop, firstVisibleRow} = action;
    yield call(recordEvent, [t, 'input.scroll', scrollTop, firstVisibleRow]);
  };

  recorders.translateStarted = function* (t, action) {
    const {source} = action;
    yield call(recordEvent, [t, 'stepper.translate', source]);
  };

  recorders.translateSucceeded = function* (t, action) {
    const {response} = action;
    yield call(recordEvent, [t, 'stepper.translateSuccess', response]);
  };

  recorders.translateFailed = function* (t, action) {
    const {response} = action;
    yield call(recordEvent, [t, 'stepper.translateFailure', response]);

  recorders.translateClearDiagnostics = function* (t, action) {
    yield call(recordEvent, [t, 'translate.clearDiagnostics']);
  };

  recorders.stepperStarted = function* (t, action) {
    const {mode} = action;
    yield call(recordEvent, [t, 'stepper.step', mode]);
  };

  recorders.stepperProgress = function* (t, action) {
    const {context} = action;
    // CONSIDER: record control node id and step
    yield call(recordEvent, [t, 'stepper.progress', context.stepCounter]);
  };

  recorders.stepperIdle = function* (t, action) {
    const {context} = action;
    // CONSIDER: record control node id and step
    yield call(recordEvent, [t, 'stepper.idle', context.stepCounter]);
  };

  recorders.stepperInterrupt = function* (t, action) {
    yield call(recordEvent, [t, 'stepper.interrupt']);
  };

  recorders.stepperRestart = function* (t, action) {
    yield call(recordEvent, [t, 'stepper.restart']);
  };

  recorders.stepperExit = function* (t, action) {
    yield call(recordEvent, [t, 'stepper.exit']);
  };

  recorders.recorderStopping = function* (t, action) {
    yield call(recordEvent, [t, 'end']);
  };

  yield addSaga(function* recordEvents () {
    const recorderMap = {};
    Object.keys(recorders).forEach(function (key) {
      recorderMap[deps[key]] = recorders[key];
    });
    const pattern = Object.keys(recorderMap);
    while (true) {
      // Wait for the recorder to be ready, grab the context.
      const {context} = yield take(deps.recorderReady);
      // Wait for recording to actually start.
      yield take(deps.recorderStarted);
      // Start buffering actions.
      const channel = yield actionChannel(pattern);
      while (true) {
        const action = yield take(channel);
        const timestamp = Math.round(context.audioContext.currentTime * 1000);
        yield call(recorderMap[action.type], timestamp, action);
        if (action.type === deps.recorderStopping) {
          channel.close();
          break;
        }
      }
    }
  });

};
