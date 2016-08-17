
// An instant has shape {t, eventIndex, state},
// where state is an Immutable Map of shape {source, input, syntaxTree, stepper, stepperInitial}
// where source and input are buffer models (of shape {document, selection, firstVisibleRow}).

import {delay} from 'redux-saga';
import {take, put, call, race, fork, select} from 'redux-saga/effects';
import * as C from 'persistent-c';
import request from 'superagent';
import Immutable from 'immutable';

import {use, addSaga} from '../utils/linker';

import {RECORDING_FORMAT_VERSION} from '../version';
import Document from '../buffers/document';
import {DocumentModel} from '../buffers/index';
import {translateClear, translateStarted, translateSucceeded, translateFailed, translateClearDiagnostics} from '../stepper/translate';
import {stepperClear, stepperRestart, stepperStarted, stepperIdle, stepperProgress, stepperUndo, stepperRedo, stepperStackUp, stepperStackDown, stepperViewControlsChanged} from '../stepper/reducers';
import * as runtime from '../stepper/runtime';


export default function* (deps) {

  yield use(
    'error',
    'playerPrepare', 'playerPreparing', 'playerReady',
    'playerStart', 'playerStarting', 'playerStarted',
    'playerPause', 'playerPausing', 'playerPaused',
    'playerResume', 'playerResuming', 'playerResumed',
    'playerStop', 'playerStopping', 'playerStopped',
    'playerTick', 'playerSeek', 'playerSeeked',
    'playerAudioReady', 'playerAudioError',
    'getPlayerState', 'getStepperDisplay',
    'translateReset',
    'stepperIdle', 'stepperProgress', 'stepperExit', 'stepperReset',
    'sourceReset', 'sourceModelSelect', 'sourceModelEdit', 'sourceModelScroll', 'sourceHighlight',
    'inputReset', 'inputModelSelect', 'inputModelEdit', 'inputModelScroll'
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
    const range = Document.expandRange(event[2]);
    if (event[1].endsWith('insert')) {
      return {
        action: 'insert',
        start: range.start,
        end: range.end,
        lines: event[3]
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
    yield call(resetToInstant, instants[0], 0);
  }

  function* playerStart () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'ready')
        return;
      yield put({type: deps.playerStarting});
      // Reset to current instant, in case the user made changes before
      // starting playback.
      const audio = player.get('audio');
      const audioTime = Math.round(audio.currentTime * 1000);
      yield call(resetToInstant, player.get('current'), audioTime);
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
      // the global state.
      yield call(resetToInstant, player.get('current'), audioTime);
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
      yield call(resetToInstant, player.get('current'), audioTime);
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
          const sourceModel = DocumentModel({
            document: Document.fromString(init.source.document),
            selection: Document.expandRange(init.source.selection),
            firstVisibleRow: init.source.firstVisibleRow || 0
          });
          const inputModel = DocumentModel({
            document: Document.fromString(init.input ? init.input.document : ''),
            selection: Document.expandRange(init.input ? init.input.selection : [0,0,0,0]),
            firstVisibleRow: (init.input && init.input.firstVisibleRow) || 0
          });
          const translateModel = translateClear();
          const stepperModel = stepperClear();
          state = Immutable.Map({
            source: sourceModel,
            input: inputModel,
            translate: translateModel,
            stepper: stepperModel
          })
          break;
        }
        case 'source.select': case 'select': {
          // XXX use reducer imported from common/buffers
          state = state.setIn(['source', 'selection'], Document.expandRange(event[2]));
          break;
        }
        case 'source.insert': case 'source.delete': case 'insert': case 'delete': {
          // XXX use reducer imported from common/buffers
          const delta = eventToDelta(event);
          if (delta) {
            state = state.updateIn(['source', 'document'], document =>
              Document.applyDelta(document, delta));
          }
          break;
        }
        case 'source.scroll': {
          // XXX use reducer imported from common/buffers
          state = state.setIn(['source', 'firstVisibleRow'], event[2]);
          break;
        }
        case 'input.select': {
          // XXX use reducer imported from common/buffers
          state = state.setIn(['input', 'selection'], Document.expandRange(event[2]));
          break;
        }
        case 'input.insert': case 'input.delete': {
          // XXX use reducer imported from common/buffers
          const delta = eventToDelta(event);
          if (delta) {
            state = state.updateIn(['input', 'document'], document =>
              Document.applyDelta(document, delta));
          }
          break;
        }
        case 'input.scroll': {
          // XXX use reducer imported from common/buffers
          state = state.setIn(['input', 'firstVisibleRow'], event[2]);
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
          const syntaxTree = state.getIn(['translate', 'syntaxTree']);
          const input = state.get('input') && Document.toString(state.getIn(['input', 'document']));
          const stepperState = runtime.start(syntaxTree, {input});
          stepperState.core = C.clearMemoryLog(stepperState.core);
          const action = {stepperState};
          state = state.update('stepper', st => stepperRestart(st, action));
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

  yield addSaga(function* watchPlayerPrepare () {
    while (true) {
      const action = yield take(deps.playerPrepare);
      try {
        yield call(playerPrepare, action);
      } catch (error) {
        yield put({type: deps.error, source: 'playerPrepare', error});
      }
    }
  });

  yield addSaga(function* watchPlayerStart () {
    while (true) {
      yield take(deps.playerStart);
      yield call(playerStart);
    }
  });

  yield addSaga(function* watchPlayerPause () {
    while (true) {
      yield take(deps.playerPause);
      yield call(playerPause);
    }
  });

  yield addSaga(function* watchPlayerResume () {
    while (true) {
      yield take(deps.playerResume);
      yield call(playerResume);
    }
  });

  yield addSaga(function* watchPlayerStop () {
    while (true) {
      yield take(deps.playerStop);
      yield call(playerStop);
    }
  });

  function* resetToInstant (instant, audioTime, quick) {
    const {state} = instant;
    if (!quick) {
      yield put({type: deps.sourceReset, model: state.get('source')});
      yield put({type: deps.inputReset, model: state.get('input')});
    }
    const translateState = state.get('translate');
    yield put({type: deps.translateReset, state: translateState});
    const stepperState = state.get('stepper');
    yield put({type: deps.stepperReset, state: stepperState});
    const range = runtime.getNodeRange(deps.getStepperDisplay(state));
    yield put({type: deps.sourceHighlight, range});
    yield put({type: deps.playerTick, audioTime, current: instant});
  }

  yield addSaga(function* playerTick () {
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
          yield call(resetToInstant, instant, seekTo);
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
          yield call(resetToInstant, nextInstant, audioTime);
        } else if (nextInstant.t > prevInstant.t + 1000 && prevInstant.eventIndex + 10 < nextInstant.eventIndex) {
          // Time between last state and new state jumped by more than 1 second,
          // and there are more than 10 events to replay.
          yield call(resetToInstant, nextInstant, audioTime);
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
              case 'source.select':
                yield put({type: deps.sourceModelSelect, selection: Document.expandRange(event[2])});
                break;
              case 'source.insert': case 'source.delete':
                yield put({type: deps.sourceModelEdit, delta: eventToDelta(event)});
                break;
              case 'source.scroll':
                yield put({type: deps.sourceModelScroll, firstVisibleRow: event[2]});
                break;
              case 'input.select':
                yield put({type: deps.inputModelSelect, selection: Document.expandRange(event[2])});
                break;
              case 'input.insert': case 'input.delete':
                yield put({type: deps.inputModelEdit, delta: eventToDelta(event)});
                break;
              case 'input.scroll':
                yield put({type: deps.inputModelScroll, firstVisibleRow: event[2]});
                break;
              case 'end':
                ended = true;
                audioTime = player.get('duration');
                break;
            }
          }
          // Perform a quick reset, unless playback has ended, in which case
          // we want a full reset to also update the editors' models.
          const quick = !ended;
          yield call(resetToInstant, nextInstant, audioTime, quick);
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
