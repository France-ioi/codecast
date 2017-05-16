
import {delay} from 'redux-saga';
import {take, put, call, race, select, actionChannel} from 'redux-saga/effects';
import Immutable from 'immutable';

import {spawnWorker, callWorker, killWorker} from '../utils/worker_utils';

// XXX worker URL should use SystemJS baseURL?
// import {workerUrlFromText} from '../../utils/worker_utils';
// import audioWorkerText from '../../assets/audio_worker.js!text';
// const audioWorkerUrl = workerUrlFromText(audioWorkerText);
import AudioWorker from 'worker-loader?inline!../audio_worker';

export default function (bundle, deps) {

  bundle.use(
    'error', 'recordApi', 'switchToScreen',
    'getRecorderState',
    'recorderPrepare', 'recorderPreparing', 'recorderReady',
    'recorderTick',
    'recorderStart', 'recorderStarting', 'recorderStarted',
    'recorderStop', 'recorderStopping', 'recorderStopped'
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
      const worker = yield call(spawnWorker, AudioWorker);
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
      /* Record the 'start' event */
      yield call(deps.recordApi.start);
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
      const {key, mp3, wav} = yield call(callWorker, worker, {command: "finishRecording", options: {mp3: true, wav: true}});
      const mp3Url = URL.createObjectURL(mp3);
      const wavUrl = URL.createObjectURL(wav);
      // Package the events blob and an URL.
      recorder = yield select(deps.getRecorderState);
      const events = recorder.get('events');
      const eventsBlob = new Blob([JSON.stringify(events.toJSON())], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
      const eventsUrl = URL.createObjectURL(eventsBlob);
      // Signal that the recorder has stopped.
      yield put({
        type: deps.recorderStopped,
        audioUrl: mp3Url,
        wavAudioUrl: wavUrl,
        eventsUrl: eventsUrl
      });
    } catch (error) {
      // XXX generic error
      yield put({type: deps.error, source: 'recorderStop', error});
    }
  }

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
        const elapsed = Math.round(context.audioContext.currentTime * 1000);
        yield put({type: deps.recorderTick, elapsed});
      }
    }
  });

  bundle.addSaga(function* watchRecorderStart () {
    while (true) {
      yield take(deps.recorderStart);
      yield call(recorderStart);
    }
  });

  bundle.addSaga(function* watchRecorderStop () {
    while (true) {
      yield take(deps.recorderStop);
      yield call(recorderStop);
    }
  });

  bundle.defer(function ({recordApi, replayApi}) {
    recordApi.on(deps.recorderStopping, function* (addEvent, action) {
      yield call(addEvent, 'end');
    });
    replayApi.on('end', function* (context, event, instant) {
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

function suspendAudioContext (audioContext) {
  return audioContext.suspend();
}

function resumeAudioContext (audioContext) {
  return audioContext.resume();
}
