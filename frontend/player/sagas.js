
import {take, put, call, race, fork, select} from 'redux-saga/effects';
import * as C from 'persistent-c';
import request from 'superagent';
import Immutable from 'immutable';

import {RECORDING_FORMAT_VERSION} from '../common/version';
import Document from '../common/document';
import {loadTranslated, getRangeFromOffsets} from '../stepper/translate';
import * as runtime from '../stepper/runtime';

export default function (actions, selectors) {

  const {getPlayerState} = selectors;

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

  const findState = function (states, time) {
    let low = 0, high = states.length;
    while (low + 1 < high) {
      const mid = (low + high) / 2 | 0;
      const state = states[mid];
      if (state.t <= time) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return states[low];
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
      if (player.get('state') !== 'idle') {
        return;
      }
      // Emit a Preparing action.
      yield put({type: actions.playerPreparing});
      // TODO: Clean up any old resources
      // Create the audio player and start buffering.
      const audio = new Audio();
      audio.src = audioUrl;
      // Download the events URL
      const events = yield call(getJson, eventsUrl);
      // Compute the future state after every event.
      const states = yield call(computeStates, events);
      // TODO: watch audioElement.buffered?
      yield put({type: actions.playerReady, audio, events, states});
      yield call(setCurrent, states[0]);
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
      player.get('audio').play();
      yield put({type: actions.playerStarted});
    } catch (error) {
      yield put({type: actions.error, source: 'playerStart', error});
    }
  }

  function* playerPause () {
    try {
      const player = yield select(getPlayerState);
      if (player.get('state') !== 'playing')
        return;
      yield put({type: actions.playerPausing});
      player.get('audio').pause();
      yield put({type: actions.playerPaused});
    } catch (error) {
      yield put({type: actions.error, source: 'playerPause', error});
    }
  }

  function* playerResume () {
    try {
      const player = yield select(getPlayerState);
      if (player.get('state') !== 'paused')
        return;
      yield put({type: actions.playerResuming});
      player.get('audio').play();
      yield put({type: actions.playerResumed});
    } catch (error) {
      yield put({type: actions.error, source: 'playerResume', error});
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

  function* computeStates (events) {
    // TODO: avoid hogging the CPU, emit progress events.
    let state = null;
    let states = [];
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
              selection: Document.expandRange(init.source.selection)
            }),
            input: init.input ? Immutable.Map({
              document: Document.fromString(init.input.document),
              selection: Document.expandRange(init.input.selection)
            }) : Immutable.Map({
              document: Document.fromString(''),
              selection: Document.expandRange([0,0,0,0])
            })
          });
          break;
        }
        case 'source.select': case 'select': {
          state = state.setIn(['source', 'selection'], Document.expandRange(event[2]));
          break;
        }
        case 'source.insert': case 'source.delete': case 'insert': case 'delete': {
          const delta = eventToDelta(event);
          if (delta) {
            state = state.updateIn(['source', 'document'], document =>
              Document.applyDelta(document, delta));
          }
          break;
        }
        case 'input.select': {
          state = state.setIn(['input', 'selection'], Document.expandRange(event[2]));
          break;
        }
        case 'input.insert': case 'input.delete': {
          const delta = eventToDelta(event);
          if (delta) {
            state = state.updateIn(['input', 'document'], document =>
              Document.applyDelta(document, delta));
          }
          break;
        }
        case 'stepper.translate': case 'translate': {
          // TODO: check that Document.toString(source.document) === event[2]
          state = state.set('translate', event[2]);
          break;
        }
        case 'stepper.translateSuccess': case 'translateSuccess': {
          const source = state.get('translate');
          const data = event[2];
          let syntaxTree;
          if (Array.isArray(event[2])) {
            // Old style without diagnostics, data is the syntax tree.
            syntaxTree = data;
          } else {
            // New style with diagnostics, data is an object.
            syntaxTree = event[2].ast;
          }
          const input = state.get('input') && Document.toString(state.get('input').get('document'));
          const stepperState = runtime.start(syntaxTree, {input});
          state = state
            .delete('translate')
            .set('translated', loadTranslated(source, syntaxTree))
            .set('stepper', stepperState);
          break;
        }
        case 'stepper.translateFailure': case 'translateFailure': {
          state = state
            .delete('translate')
            .set('translateError', event[2]);
          break;
        }
        case 'stepper.exit': case 'translateClear': {
          state = state
            .delete('translated')
            .delete('stepper');
          break;
        }
        case 'stepper.restart': case 'stepperRestart': {
          const syntaxTree = state.get('translated').syntaxTree;
          state = state.set('stepper', runtime.start(syntaxTree));
          break;
        }
        case 'stepper.expr': case 'stepExpr': {
          state = state.set('pendingStep', 'expr');
          break;
        }
        case 'stepper.into': case 'stepInto': {
          state = state.set('pendingStep', 'into');
          break;
        }
        case 'stepper.out': case 'stepOut': {
          state = state.set('pendingStep', 'out');
          break;
        }
        case 'stepper.idle': case 'stepIdle': {
          let stepCounter = event[2];
          let stepperState = C.clearMemoryLog(state.get('stepper'));
          while (stepCounter > 0) {
            stepperState = C.step(stepperState, runtime.options);
            stepCounter -= 1;
          }
          state = state.delete('pendingStep').set('stepper', stepperState);
          break;
        }
        case 'stepper.progress': case 'stepProgress': {
          let stepCounter = event[2];
          let stepperState = state.get('stepper');
          while (stepCounter > 0) {
            stepperState = C.step(stepperState, runtime.options);
            stepCounter -= 1;
          }
          state = state.set('stepper', stepperState);
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
      states.push({t, eventIndex: pos, state});
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

  function* watchPlayerPause () {
    while (true) {
      yield take(actions.playerPause);
      yield call(playerPause);
    }
  }

  function* watchPlayerResume () {
    while (true) {
      yield take(actions.playerResume);
      yield call(playerResume);
    }
  }

  function* watchPlayerStop () {
    while (true) {
      yield take(actions.playerStop);
      yield call(playerStop);
    }
  }

  function* setCurrent (state) {
    const player = yield select(getPlayerState);
    const sourceEditor = player.getIn(['source', 'editor']);
    if (sourceEditor) {
      const source = state.state.get('source');
      const text = Document.toString(source.get('document'));
      sourceEditor.reset(text, source.get('selection'));
    }
    const inputEditor = player.getIn(['input', 'editor']);
    if (inputEditor) {
      const input = state.state.get('input');
      const text = Document.toString(input.get('document'));
      inputEditor.reset(text, input.get('selection'));
    }
    yield put({type: actions.playerTick, current: state});
  }

  function* playerTick () {
    while (true) {
      yield take(actions.playerStarted);
      play_loop: while (true) {
        const outcome = yield race({
          tick: call(delay, 20),
          stopped: take(actions.playerStopping)
        });
        if ('stopped' in outcome)
          break;
        const player = yield select(getPlayerState);
        const audio = player.get('audio');
        const audioTime = Math.round(audio.currentTime * 1000);
        const prevState = player.get('current');
        const states = player.get('states');
        const nextState = findState(states, audioTime);
        if (nextState.eventIndex < prevState.eventIndex) {
          // Event index jumped backwards.
          console.log("<< seek", nextState.t);
          yield call(setCurrent, nextState);
        } else if (nextState.t > prevState.t + 1000 && prevState.eventIndex + 10 < nextState.eventIndex) {
          // Time between last state and new state jumped by more than 1 second,
          // and there are more than 10 events to replay.
          console.log("seek >>", nextState.t);
          yield call(setCurrent, nextState);
        } else {
          // Small time delta, attempt to replay events.
          const events = player.get('events');
          const sourceEditor = player.getIn(['source', 'editor']);
          const inputEditor = player.getIn(['input', 'editor']);
          // XXX Assumption: 1-to-1 correspondance between indexes in
          //                 events and states: states[pos] is the state
          //                 immediately after replaying events[pos],
          //                 and pos === states[pos].eventIndex
          for (let pos = prevState.eventIndex; pos < nextState.eventIndex; pos += 1) {
            // console.log(event);
            const event = events[pos];
            if (pos >= states.length) {
              // Ticked past last state, stop ticking.
              break play_loop;
            }
            const state = states[pos].state;  // state reached after event is replayed
            switch (event[1]) {
              case 'source.select': case 'select':
                sourceEditor.setSelection(Document.expandRange(event[2]))
                break;
              case 'source.insert': case 'source.delete': case 'insert': case 'delete':
                sourceEditor.applyDeltas([eventToDelta(event)]);
                break;
              case 'input.select':
                inputEditor.setSelection(Document.expandRange(event[2]))
                break;
              case 'input.insert': case 'input.delete':
                inputEditor.applyDeltas([eventToDelta(event)]);
                break;
              case 'stepper.idle': case 'stepper.progress': case 'stepIdle': case 'stepProgress': {
                const stepper = state.get('stepper');
                const translated = state.get('translated');
                const range = runtime.getNodeRange(stepper);
                sourceEditor.setSelection(range);
                break;
              }
              case 'end':
                yield put({type: actions.playerTick, current: nextState});
                break play_loop;
            }
          }
          yield put({type: actions.playerTick, current: nextState});
        }
      }
    }
  }

  return [
    watchPlayerPrepare,
    watchPlayerStart,
    watchPlayerPause,
    watchPlayerResume,
    watchPlayerStop,
    playerTick
  ];

};
