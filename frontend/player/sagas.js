
// An instant has shape {t, eventIndex, state},
// where state is an Immutable Map of shape {source, input, syntaxTree, stepper, stepperInitial}
// where source and input are buffer models (of shape {document, selection, firstVisibleRow}).

import {delay} from 'redux-saga';
import {take, put, call, race, fork, select} from 'redux-saga/effects';
import * as C from 'persistent-c';
import request from 'superagent';
import Immutable from 'immutable';

import {RECORDING_FORMAT_VERSION} from '../version';
import {documentFromString, emptyDocument, expandRange} from '../buffers/document';
import {DocumentModel} from '../buffers/index';
import {translateClear, translateStarted, translateSucceeded, translateFailed, translateClearDiagnostics} from '../stepper/translate';
import {stepperClear, stepperRestart, stepperStarted, stepperIdle, stepperProgress, stepperUndo, stepperRedo, stepperStackUp, stepperStackDown, stepperViewControlsChanged} from '../stepper/reducers';
import {ioPaneModeChanged} from '../stepper/io_pane';
import {terminalInputNeeded, terminalInputKey, terminalInputBackspace, terminalInputEnter} from '../stepper/terminal_input';
import * as runtime from '../stepper/runtime';


export default function (bundle, deps) {

  bundle.use(
    'error',
    'playerPrepare', 'playerPreparing', 'playerReady',
    'playerStart', 'playerStarting', 'playerStarted',
    'playerPause', 'playerPausing', 'playerPaused',
    'playerResume', 'playerResuming', 'playerResumed',
    'playerStop', 'playerStopping', 'playerStopped',
    'playerTick', 'playerSeek', 'playerSeeked',
    'playerAudioReady', 'playerAudioError',
    'getStepperInit', 'buildStepperState',
    'getPlayerState', 'getStepperDisplay',
    'translateReset',
    'stepperIdle', 'stepperProgress', 'stepperExit', 'stepperReset',
    'bufferReset', 'bufferModelSelect', 'bufferModelEdit', 'bufferModelScroll', 'bufferHighlight',
    'stepperEnabled', 'stepperDisabled',
    'ioPaneModeChanged'
  );

  // pause, resume audio

  function getJson (path) {
    return new Promise(function (resolve, reject) {
      var req = request.get(path);
      req.set('Accept', 'application/json');
      req.end(function (err, res) {
        if (err) {
          reject({err, res});
        } else {
          resolve(res.body);
        }
      });
    });
  };

  function eventToDelta (event) {
    const range = expandRange(event[3]);
    if (event[1].endsWith('insert')) {
      return {
        action: 'insert',
        start: range.start,
        end: range.end,
        lines: event[4]
      };
    }
    if (event[1].endsWith('delete')) {
      return {
        action: 'remove',
        start: range.start,
        end: range.end
      };
    }
  }

  const findInstant = function (instants, time) {
    let low = 0, high = instants.length;
    while (low + 1 < high) {
      const mid = (low + high) / 2 | 0;
      const state = instants[mid];
      if (state.t <= time) {
        low = mid;
      } else {
        high = mid;
      }
    }
    let instant = instants[low];
    if (instant) {
      while (low + 1 < instants.length) {
        const nextInstant = instants[low + 1];
        if (nextInstant.t !== instant.t)
          break;
        low += 1;
      }
    }
    return instants[low];
  };

  //
  // Sagas (generators)
  //

  function waitForAudio (audio, timeout) {
    return new Promise(function (resolve, reject) {
      let timer;
      function onCanPlay () {
        audio.pause();
        audio.removeEventListener('canplay', onCanPlay);
        timer && clearTimeout(timer);
        resolve();
      };
      audio.addEventListener('canplay', onCanPlay);
      if (timeout) {
        timer = setTimeout(function () {
          audio.removeEventListener('canplay', onCanPlay);
          reject();
        }, timeout);
      }
    });
  }

  function* watchAudioCanPlay (audio) {
    try {
      // Some browsers, including Chrome, do not load audio (and send the
      // canplay event) unless the window is visible, which results in
      // background tabs failing to load.  The timeout is disabled and we
      // have to wait indefinitely for the autio to load.
      const timeout = false;
      yield call(waitForAudio, audio, timeout);
      const duration = Math.round(audio.duration * 1000);
      yield put({type: deps.playerAudioReady, duration});
    } catch (ex) {
      yield put({type: deps.playerAudioError});
    }
  }

  function* playerPrepare (action) {
    const {audioUrl, eventsUrl} = action;
    // Check that the player is idle.
    const player = yield select(deps.getPlayerState);
    if (player.get('status') !== 'idle') {
      return;
    }
    // Emit a Preparing action.
    yield put({type: deps.playerPreparing});
    // Make the media player load the audio
    // Start and immediately pause the audio to cause it to start loading,
    // while monitoring the 'canplay' event in a background saga.
    const audio = player.get('audio');
    audio.src = audioUrl;
    audio.load();
    yield fork(watchAudioCanPlay, audio);
    audio.play();
    // While the audio is buffering, download the events URL,
    const events = yield call(getJson, eventsUrl);
    // and compute the future state after every event.
    const instants = yield call(computeInstants, events);
    yield put({type: deps.playerReady, events, instants});
    yield call(resetToInstant, instants[0], 0, true);
  }

  function* playerStart () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'ready')
        return;
      /* The stepper is disabled during playback. */
      yield put({type: deps.stepperDisabled});
      yield put({type: deps.playerStarting});
      // Reset to current instant, in case the user made changes before
      // starting playback.
      const audio = player.get('audio');
      const audioTime = Math.round(audio.currentTime * 1000);
      yield call(resetToInstant, player.get('current'), audioTime, true);
      audio.play();
      yield put({type: deps.playerStarted});
    } catch (error) {
      yield put({type: deps.error, source: 'playerStart', error});
    }
  }

  function* playerPause () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'playing')
        return;
      yield put({type: deps.playerPausing});
      const audio = player.get('audio');
      audio.pause();
      const audioTime = Math.round(audio.currentTime * 1000);
      // Call resetToInstant to bring the global state in line with the current
      // state.  This is required in particular for the editors that have
      // been updated incrementally by sending them events without updating
      // the global state.  The stepper is enabled if applicable.
      yield call(resetToInstant, player.get('current'), audioTime, true);
      yield put({type: deps.playerPaused});
    } catch (error) {
      yield put({type: deps.error, source: 'playerPause', error});
    }
  }

  function* playerResume () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'paused')
        return;
      yield put({type: deps.playerResuming});
      // Reset to current instant, in case the user made changes while
      // playback was paused.
      const audio = player.get('audio');
      const audioTime = Math.round(audio.currentTime * 1000);
      yield call(resetToInstant, player.get('current'), audioTime, true);
      audio.play();
      yield put({type: deps.playerResumed});
    } catch (error) {
      yield put({type: deps.error, source: 'playerResume', error});
    }
  }

  function* playerStop () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'playing')
        return;
      // Signal that the player is stopping.
      yield put({type: deps.playerStopping});
      // TODO: Stop the audio player.
      yield put({type: deps.playerStopped});
    } catch (error) {
      yield put({type: deps.error, source: 'playerStop', error});
    }
  }

  function* computeInstants (events) {
    // TODO: avoid hogging the CPU, emit progress events.
    let state = null;
    let context = null;
    let instants = [];
    for (let pos = 0; pos < events.length; pos += 1) {
      const event = events[pos];
      const t = event[0];
      switch (event[1]) {
        case 'start': {
          const init = event[2];
          const sourceModel = loadBufferModel(init.buffers.source);
          const inputModel = loadBufferModel(init.buffers.input);
          const outputModel = DocumentModel();
          const translateModel = translateClear();
          const stepperModel = stepperClear();
          state = Immutable.Map({
            buffers: Immutable.Map({
              source: Immutable.Map({model: sourceModel}),
              input: Immutable.Map({model: inputModel}),
              output: Immutable.Map({model: outputModel})
            }),
            ioPaneMode: init.ioPaneMode,
            translate: translateModel,
            stepper: stepperModel
          });
          break;
        }
        case 'buffer.select': {
          // XXX use reducer imported from common/buffers
          state = state.setIn(['buffers', event[2], 'model', 'selection'], expandRange(event[3]));
          break;
        }
        case 'buffer.insert': case 'buffer.delete': {
          // XXX use reducer imported from common/buffers
          const delta = eventToDelta(event);
          if (delta) {
            state = state.updateIn(['buffers', event[2], 'model', 'document'],
              doc => doc.applyDelta(delta));
          }
          break;
        }
        case 'buffer.scroll': {
          // XXX use reducer imported from common/buffers
          state = state.setIn(['buffers', event[2], 'model', 'firstVisibleRow'], event[3]);
          break;
        }
        case 'stepper.translate': case 'translate.start': {
          const action = {source: event[2]};
          state = state.update('translate', st => translateStarted(st, action));
          break;
        }
        case 'stepper.translateSuccess': case 'translate.success': {
          const action = {diagnostics: event[2].diagnostics, syntaxTree: event[2].ast};
          state = state.update('translate', st => translateSucceeded(st, action));
          // Clear the output buffer.
          state = state.setIn(['buffers', 'output', 'model'], DocumentModel());
          break;
        }
        case 'stepper.translateFailure': case 'translate.failure': {
          const action = {diagnostics: event[2].diagnostics, error: event[2].error};
          state = state.update('translate', st => translateFailed(st, action));
          break;
        }
        case 'translate.clearDiagnostics': {
          state = state.update('translate', st => translateClearDiagnostics(st, {}));
          break;
        }
        case 'stepper.exit': {
          state = state
            .update('translate', translateClear)
            .update('stepper', stepperClear);
          break;
        }
        case 'stepper.restart': {
          const init = deps.getStepperInit(state);
          const stepperState = deps.buildStepperState(state, init);
          state = state.update('stepper', st => stepperRestart(st, {stepperState}));
          break;
        }
        case 'stepper.step': {
          const mode = event[2];
          state = state.update('stepper', st => stepperStarted(st, {mode}));
          context = beginStep(state.getIn(['stepper', 'current']));
          break;
        }
        case 'stepper.idle': {
          context = runToStep(context, event[2]);
          state = state.update('stepper', st => stepperIdle(st, {context}));
          break;
        }
        case 'stepper.progress': {
          context = runToStep(context, event[2]);
          state = state.update('stepper', st => stepperProgress(st, {context}));
          break;
        }
        case 'stepper.undo': {
          state = state.update('stepper', st => stepperUndo(st));
          break;
        }
        case 'stepper.redo': {
          state = state.update('stepper', st => stepperRedo(st));
          break;
        }
        case 'stepper.stack.up': {
          state = state.update('stepper', st => stepperStackUp(st));
          break;
        }
        case 'stepper.stack.down': {
          state = state.update('stepper', st => stepperStackDown(st));
          break;
        }
        case 'stepper.view.update': {
          const key = event[2];
          const update = event[3];
          state = state.update('stepper', st => stepperViewControlsChanged(st, {key, update}));
          break;
        }
        case 'ioPane.mode': {
          const mode = event[2];
          state = ioPaneModeChanged(state, {mode});
          break;
        }
        case 'terminal.wait': {
          state = state.update('stepper', st => terminalInputNeeded(st));
          break;
        }
        case 'terminal.key': {
          const key = event[2];
          state = state.update('stepper', st => terminalInputKey(st, {key}));
          break;
        }
        case 'terminal.backspace': {
          state = state.update('stepper', st => terminalInputBackspace(st));
          break;
        }
        case 'terminal.enter': {
          state = state.update('stepper', st => terminalInputEnter(st));
          if (context) {
            /* Update the context so that the step completes with the added input */
            context.state = state.getIn(['stepper', 'current']);
          }
          break;
        }
        case 'end': {
          state = state.set('stopped', true);
          break;
        }
        default: {
          console.log(`[${event[0]}]: unknown event type ${event[1]}`);
          break;
        }
      }
      instants.push({t, eventIndex: pos, state});
    }
    return instants;
  }

  function loadBufferModel (dump) {
    return DocumentModel({
      document: documentFromString(dump.document),
      selection: expandRange(dump.selection),
      firstVisibleRow: dump.firstVisibleRow || 0
    });
  }

  function beginStep (state) {
    return {
      state: {
        ...state,
        core: C.clearMemoryLog(state.core)
      },
      stepCounter: 0
    };
  }

  function runToStep (context, targetStepCounter) {
    let {state, stepCounter} = context;
    while (stepCounter < targetStepCounter) {
      state = C.step(state, runtime.options);
      stepCounter += 1;
    }
    return {state, stepCounter};
  }

  bundle.addSaga(function* watchPlayerPrepare () {
    while (true) {
      const action = yield take(deps.playerPrepare);
      try {
        yield call(playerPrepare, action);
      } catch (error) {
        yield put({type: deps.error, source: 'playerPrepare', error});
      }
    }
  });

  bundle.addSaga(function* watchPlayerStart () {
    while (true) {
      yield take(deps.playerStart);
      yield call(playerStart);
    }
  });

  bundle.addSaga(function* watchPlayerPause () {
    while (true) {
      yield take(deps.playerPause);
      yield call(playerPause);
    }
  });

  bundle.addSaga(function* watchPlayerResume () {
    while (true) {
      yield take(deps.playerResume);
      yield call(playerResume);
    }
  });

  bundle.addSaga(function* watchPlayerStop () {
    while (true) {
      yield take(deps.playerStop);
      yield call(playerStop);
    }
  });

  function* resetToInstant (instant, audioTime, jump) {
    // console.log('resetToInstant', instant.t, audioTime, jump);
    const {state} = instant;
    if (jump) {
      /* Disable the stepper. */
      yield put({type: deps.stepperDisabled});
    }
    /* Reset all buffers. */
    for (let buffer of ['source', 'input', 'output']) {
      const model = state.getIn(['buffers', buffer, 'model']);
      yield put({type: deps.bufferReset, buffer, model, quiet: !jump});
    }
    /* Reset the stepper's state. */
    const translateState = state.get('translate');
    yield put({type: deps.translateReset, state: translateState});
    const stepperState = state.get('stepper');
    yield put({type: deps.stepperReset, state: stepperState});
    const ioPaneMode = state.get('ioPaneMode');
    yield put({type: deps.ioPaneModeChanged, mode: ioPaneMode});
    if (jump && stepperState.get('status') === 'idle') {
      /* Re-enable the stepper. */
      const {options} = yield select(deps.getStepperInit);
      yield put({type: deps.stepperEnabled, options});
    }
    const range = runtime.getNodeRange(deps.getStepperDisplay(state));
    yield put({type: deps.bufferHighlight, buffer: 'source', range});
    yield put({type: deps.playerTick, audioTime, current: instant});
  }

  bundle.addSaga(function* playerTick () {
    while (true) {
      yield take(deps.playerReady);
      while (true) {  // XXX should be 'not stopped' condition
        const outcome = yield race({
          tick: call(delay, 50),
          stopped: take(deps.playerStopping)
        });
        if ('stopped' in outcome)
          break;
        const player = yield select(deps.getPlayerState);
        const instants = player.get('instants');
        const audio = player.get('audio');
        // Process a pending seek.
        const seekTo = player.get('seekTo');
        if (typeof seekTo === 'number') {
          const instant = findInstant(instants, seekTo);
          yield call(resetToInstant, instant, seekTo, true);
          audio.currentTime = seekTo / 1000;
          yield put({type: deps.playerSeeked, current: instant, seekTo});
          continue;
        }
        // If playing, replay the events from the current state to the next.
        const status = player.get('status');
        if (status !== 'playing') {
          continue;
        }
        let ended = false;
        let audioTime = Math.round(audio.currentTime * 1000);
        if (audio.ended) {
          audioTime = player.get('duration');
          ended = true;
        }
        const prevInstant = player.get('current');
        const nextInstant = findInstant(instants, audioTime);
        if (nextInstant.eventIndex < prevInstant.eventIndex) {
          // Event index jumped backwards.
          yield call(resetToInstant, nextInstant, audioTime, true);
        } else if (nextInstant.t > prevInstant.t + 1000 && prevInstant.eventIndex + 10 < nextInstant.eventIndex) {
          // Time between last state and new state jumped by more than 1 second,
          // and there are more than 10 events to replay.
          yield call(resetToInstant, nextInstant, audioTime, true);
        } else {
          // Play incremental events between prevInstant (exclusive) and
          // nextInstant (inclusive).
          // Small time delta, attempt to replay events.
          const events = player.get('events');
          // XXX Assumption: 1-to-1 correspondance between indexes in
          //                 events and instants: instants[pos] is the state
          //                 immediately after replaying events[pos],
          //                 and pos === instants[pos].eventIndex
          for (let pos = prevInstant.eventIndex + 1; pos <= nextInstant.eventIndex; pos += 1) {
            const event = events[pos];
            switch (event[1]) {
              case 'buffer.select':
                yield put({type: deps.bufferModelSelect, buffer: event[2], selection: expandRange(event[3])});
                break;
              case 'buffer.insert': case 'buffer.delete':
                yield put({type: deps.bufferModelEdit, buffer: event[2], delta: eventToDelta(event)});
                break;
              case 'buffer.scroll':
                yield put({type: deps.bufferModelScroll, buffer: event[2], firstVisibleRow: event[3]});
                break;
              case 'end':
                ended = true;
                audioTime = player.get('duration');
                break;
            }
          }
          // Perform a quick reset, unless playback has ended, in which case
          // we want a full reset to also update the editors' models.
          yield call(resetToInstant, nextInstant, audioTime, ended);
          if (ended) {
            audio.pause();
            audio.currentTime = audio.duration;
            yield put({type: deps.playerPaused});
          }
        }
      }
    }
  });

};
