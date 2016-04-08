
import {take, put, call, race, fork, select} from 'redux-saga/effects';
import * as C from 'persistent-c';
import {TermBuffer} from 'epic-vt';
import request from 'superagent';
import Immutable from 'immutable';

import {RECORDING_FORMAT_VERSION} from '../common/version';
import {loadTranslated, getRangeFromOffsets} from '../common/translate';
import * as runtime from '../common/runtime';
import Document from '../document';


export default function (actions) {

  // pause, resume audio

  function delay (ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

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

  //
  // Sagas (generators)
  //

  // Map (second → index in state liste)
  // List of states sorted by timestamp
  // State shape: {source: {document, selection}, translated, stepper}

  function* playerPrepare (action) {
    const {audioUrl, eventsUrl} = action;
    try {
      // Check that the player is idle.
      const player = yield select(getPlayerState);
      if (player.get('state') !== 'idle')
        return;
      // Emit a Preparing action.
      yield put({type: actions.playerPreparing});
      // TODO: Clean up any old resources
      // Create the audio player and start buffering.
      audioElement = new Audio();
      audioElement.src = audioUrl;
      // Download the events URL
      const events = yield call(getJson, eventsUrl);
      // Compute the future state after every event.
      const states = yield call(computeStates, events);
      // TODO: watch audioElement.buffered?
      yield put({types: actions.playerReady, states});
    } catch (error) {
      yield put({type: actions.error, source: 'playerPrepare', error});
    }
  }

  function* playerStart () {
    try {
      const player = yield select(getPlayerState);
      if (player.get('state') !== 'ready')
        return;
      yield put({type: actions.playerStarting});
      // TODO: Find the state immediately before current audio position, put that state.
      // TODO: Resume the audio player.
      yield put({type: actions.playerStarted});
    } catch (error) {
      yield put({type: actions.error, source: 'playerStart', error});
    }
  }

  function* playerStop () {
    try {
      const player = yield select(getPlayerState);
      if (player.get('state') !== 'playing')
        return;
      // Signal that the player is stopping.
      yield put({type: actions.playerStopping});
      // TODO: Stop the audio player.
      yield put({type: actions.playerStopped});
    } catch (error) {
      yield put({type: actions.error, source: 'playerStop', error});
    }
  }

  function* computeStates (state, events) {
    // TODO: avoid hogging the CPU, emit progress events.
    const states = Immutable.List();
    for (let pos = 0; pos < events.length; pos += 1) {
      const event = events[pos];
      const t = event[0];
      switch (event[1]) {
        case 'start': {
          const init = event[2];
          // TODO: semver check on init.version
          state = Immutable.Map({
            source: Immutable.Map({
              document: Document.fromString(init.source.document),
              selection: expandRang(init.source.selection)
            })
          });
          break;
        }
        case 'select': {
          state = state.setIn(['source', 'selection'], expandRange(event[2]));
          break;
        }
        case 'insert': {
          const range = expandRange(event[2]);
          const delta = {
            action: 'insert',
            start: range.start,
            end: range.end,
            lines: event[3]
          };
          state = state.updateIn(['source', 'document'], document =>
            Document.applyDelta(document, delta));
          break;
        }
        case 'delete': {
          const range = expandRange(event[2]);
          const delta = {
            action: 'delete',
            start: range.start,
            end: range.end
          };
          state = state.updateIn(['source', 'document'], document =>
            Document.applyDelta(document, delta));
          break;
        }
        case 'translate': {
          // TODO: check that Document.toString(source.document) === event[2]
          state = state.set('translate', event[2]);
          break;
        }
        case 'translateSuccess': {
          const source = state.get('translate');
          const syntaxTree = event[2];
          const context = {decls: syntaxTree[2], builtins: runtime.builtins};
          let stepperState = C.start(context);
          stepperState.terminal = new TermBuffer();
          stepperState = stepIntoUserCode(stepperState);
          state = state
            .delete('translate')
            .set('translated', loadTranslated(source, ast))
            .set('stepper', stepperState);
          break;
        }
        case 'translateFailure': {
          state = state
            .delete('translate')
            .set('translateError', event[2]);
          break;
        }
        case 'translateClear': {
          state = state
            .delete('translated')
            .delete('stepper');
          break;
        }
        case 'stepExpr': {
          state = state.set('currentStep', 'expr');
          break;
        }
        case 'stepInto': {
          state = state.set('currentStep', 'into');
          break;
        }
        case 'stepOut': {
          state = state.set('currentStep', 'out');
          break;
        }
        case 'stepIdle': {
          let stepCounter = event[2];
          let stepperState = state.get('stepper');
          while (stepCounter > 0) {
            stepperState = C.step(stepperState, runtime.options);
            stepCounter -= 1;
          }
          state = state.delete('currentStep').set('stepper', stepperState);
          break;
        }
        case 'stepProgress': {
          let stepCounter = event[2];
          let stepperState = state.get('stepper');
          while (stepCounter > 0) {
            stepperState = C.step(stepperState, runtime.options);
            stepCounter -= 1;
          }
          state = state.set('stepper', stepperState);
          break;
        }
        default: {
          console.log(`unknown event type: ${event[2]}`);
          break;
        }
      }
      states.push(Immutable.Map({t, state}));
    }
    return states;
  }

  function* watchPlayerPrepare () {
    while (true) {
      const action = yield take(actions.playerPrepare);
      yield call(playerPrepare, action);
    }
  }

  function* watchPlayerStart () {
    while (true) {
      yield take(actions.playerStart);
      yield call(playerStart);
    }
  }

  function* watchPlayerStop () {
    while (true) {
      yield take(actions.playerStop);
      yield call(playerStop);
    }
  }

  function* playerTick () {
    while (true) {
      yield take(actions.playerStarted);
      while (true) {
        const outcome = yield race({
          tick: call(delay, 20),
          stopped: take(actions.playerStopping)
        });
        if ('stopped' in outcome)
          break;
        const position = 0; /* XXX audio position */
        yield put({type: actions.playerTick, position});
      }
    }
  }

  return [
    watchPlayerPrepare,
    watchPlayerStart,
    watchPlayerStop,
    playerTick
  ];

};
