
import {take, put, call, race, fork, select} from 'redux-saga/effects';
import * as C from 'persistent-c';
import request from 'superagent';
import Immutable from 'immutable';

import {use, addSaga} from '../utils/linker';

import {RECORDING_FORMAT_VERSION} from '../version';
import Document from '../utils/document';
import {addNodeRanges} from '../stepper/translate';
import * as runtime from '../stepper/runtime';

export default function* (deps) {

  yield use(
    'error',
    'playerPrepare', 'playerPreparing', 'playerReady',
    'playerStart', 'playerStarting', 'playerStarted',
    'playerPause', 'playerPausing', 'playerPaused',
    'playerResume', 'playerResuming', 'playerResumed',
    'playerStop', 'playerStopping', 'playerStopped',
    'playerTick',
    'getPlayerState'
  );

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
  // State shape: {source: {document, selection}, syntaxTree, stepper}

  function* playerPrepare (action) {
    const {audioUrl, eventsUrl} = action;
    try {
      // Check that the player is idle.
      const player = yield select(deps.getPlayerState);
      if (player.get('state') !== 'idle') {
        return;
      }
      // Emit a Preparing action.
      yield put({type: deps.playerPreparing});
      // TODO: Clean up any old resources
      // Create the audio player and start buffering.
      const audio = new Audio();
      audio.src = audioUrl;
      // TODO: audio.onended = ...
      // Download the events URL
      const events = yield call(getJson, eventsUrl);
      // Compute the future state after every event.
      const states = yield call(computeStates, events);
      // TODO: watch audioElement.buffered?
      yield put({type: deps.playerReady, audio, events, states});
      yield call(setCurrent, states[0]);
    } catch (error) {
      yield put({type: deps.error, source: 'playerPrepare', error});
    }
  }

  function* playerStart () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('state') !== 'ready')
        return;
      yield put({type: deps.playerStarting});
      // TODO: Find the state immediately before current audio position, put that state.
      player.get('audio').play();
      yield put({type: deps.playerStarted});
    } catch (error) {
      yield put({type: deps.error, source: 'playerStart', error});
    }
  }

  function* playerPause () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('state') !== 'playing')
        return;
      yield put({type: deps.playerPausing});
      player.get('audio').pause();
      yield put({type: deps.playerPaused});
    } catch (error) {
      yield put({type: deps.error, source: 'playerPause', error});
    }
  }

  function* playerResume () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('state') !== 'paused')
        return;
      yield put({type: deps.playerResuming});
      player.get('audio').play();
      yield put({type: deps.playerResumed});
    } catch (error) {
      yield put({type: deps.error, source: 'playerResume', error});
    }
  }

  function* playerStop () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('state') !== 'playing')
        return;
      // Signal that the player is stopping.
      yield put({type: deps.playerStopping});
      // TODO: Stop the audio player.
      yield put({type: deps.playerStopped});
    } catch (error) {
      yield put({type: deps.error, source: 'playerStop', error});
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
              selection: Document.expandRange(init.source.selection),
              scrollTop: init.source.scrollTop || 0
            }),
            input: init.input ? Immutable.Map({
              document: Document.fromString(init.input.document),
              selection: Document.expandRange(init.input.selection),
              scrollTop: init.input.scrollTop || 0
            }) : Immutable.Map({
              document: Document.fromString(''),
              selection: Document.expandRange([0,0,0,0]),
              scrollTop: 0
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
        case 'source.scroll': {
          state = state.setIn(['source', 'scrollTop'], event[2]);
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
        case 'input.scroll': {
          state = state.setIn(['input', 'scrollTop'], event[2]);
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
          // addNodeRanges destructively updates syntaxTree, which fine.
          addNodeRanges(source, syntaxTree);
          state = state
            .delete('translate')
            .set('syntaxTree', syntaxTree);
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
            .delete('syntaxTree')
            .delete('stepper');
          break;
        }
        case 'stepper.restart': case 'stepperRestart': {
          const syntaxTree = state.get('syntaxTree');
          const input = state.get('input') && Document.toString(state.get('input').get('document'));
          const stepperState = C.clearMemoryLog(runtime.start(syntaxTree, {input}));
          state = state.set('stepper', stepperState).set('stepCounter', 0);
          break;
        }
        case 'stepper.expr': case 'stepExpr': {
          state = beginStep(state, 'expr');
          break;
        }
        case 'stepper.into': case 'stepInto': {
          state = beginStep(state, 'into');
          break;
        }
        case 'stepper.out': {
          state = beginStep(state, 'out');
          break;
        }
        case 'stepper.over': {
          state = beginStep(state, 'over');
          break;
        }
        case 'stepper.idle': case 'stepIdle': {
          state = runToStep(state, event[2]);
          state = state.delete('pendingStep');
          break;
        }
        case 'stepper.progress': case 'stepProgress': {
          state = runToStep(state, event[2]);
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

  function beginStep(state, step) {
    return state
      .set('pendingStep', step)
      .set('stepCounter', 0)
      .update('stepper', C.clearMemoryLog);
  }

  function runToStep (state, targetStepCounter) {
    let stepperState = state.get('stepper');
    let stepCounter = state.get('stepCounter');
    while (stepCounter < targetStepCounter) {
      stepperState = C.step(stepperState, runtime.options);
      stepCounter += 1;
    }
    return state
      .set('stepper', stepperState)
      .set('stepCounter', stepCounter);
  }

  yield addSaga(function* watchPlayerPrepare () {
    while (true) {
      const action = yield take(deps.playerPrepare);
      yield call(playerPrepare, action);
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

  function* setCurrent (state) {
    const player = yield select(deps.getPlayerState);
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
    yield put({type: deps.playerTick, current: state});
  }

  yield addSaga(function* playerTick () {
    while (true) {
      yield take(deps.playerStarted);
      play_loop: while (true) {
        const outcome = yield race({
          tick: call(delay, 20),
          stopped: take(deps.playerStopping)
        });
        if ('stopped' in outcome)
          break;
        const player = yield select(deps.getPlayerState);
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
              case 'source.scroll':
                sourceEditor.setScrollTop(event[2]);
                break;
              case 'input.select':
                inputEditor.setSelection(Document.expandRange(event[2]))
                break;
              case 'input.insert': case 'input.delete':
                inputEditor.applyDeltas([eventToDelta(event)]);
                break;
              case 'input.scroll':
                inputEditor.setScrollTop(event[2]);
                break;
              case 'stepper.idle': case 'stepper.progress': case 'stepIdle': case 'stepProgress': {
                const stepper = state.get('stepper');
                const range = runtime.getNodeRange(stepper);
                sourceEditor.setSelection(range);
                break;
              }
              case 'end':
                // May never be reached if the audio is a little bit shorter.
                yield put({type: deps.playerTick, current: nextState});
                break play_loop;
            }
          }
          yield put({type: deps.playerTick, current: nextState});
        }
      }
    }
  });

};
