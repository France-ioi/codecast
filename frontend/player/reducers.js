
import {addReducer} from '../utils/linker';

export default function* (deps) {

  yield addReducer('error', function (state, action) {
    return state.set('lastError', {
      source: action.source,
      message: action.error.toString()
    });
  });

  yield addReducer('playerPreparing', function (state, action) {
    return state.setIn(['player', 'state'], 'preparing');
  });

  yield addReducer('playerReady', function (state, action) {
    const {audio, events, states} = action;
    return state.update('player', player => player
      .set('state', 'ready')
      .set('audio', audio)
      .set('events', events)
      .set('states', states)
      .set('current', states[0]));
  });

  yield addReducer('playerSourceInit', function (state, action) {
    return state.setIn(['player', 'source', 'editor'], action.editor);
  });

  yield addReducer('playerInputInit', function (state, action) {
    return state.setIn(['player', 'input', 'editor'], action.editor);
  });

  yield addReducer('playerStarting', function (state, action) {
    return state.setIn(['player', 'state'], 'starting');
  });

  yield addReducer('playerStarted', function (state, action) {
    return state.setIn(['player', 'state'], 'playing');
  });

  yield addReducer('playerPausing', function (state, action) {
    return state.setIn(['player', 'state'], 'pausing');
  });

  yield addReducer('playerPaused', function (state, action) {
    return state.update('player', player => player
      .set('state', 'paused')
      .set('resume', player.get('current')));
  });

  yield addReducer('playerResuming', function (state, action) {
    return state.setIn(['player', 'state'], 'resuming');
  });

  yield addReducer('playerResumed', function (state, action) {
    return state.update('player', player => player
      .set('state', 'playing')
      .set('current', player.get('resume'))
      .delete('resume'));
  });

  yield addReducer('playerStopping', function (state, action) {
    return state.setIn(['player', 'state'], 'stopping');
  });

  yield addReducer('playerStopped', function (state, action) {
    return state; // set player state to ready or stopped?
  });

  yield addReducer('playerTick', function (state, action) {
    // {current: {t, eventIndex, state}}
    // Restore the given current state.
    // Some properties (e.g., stepper) are copied into the
    // global state to be read by shared components.
    const {current} = action;
    const currentState = current.state;
    const stepperState = currentState.get('stepper');
    return state
      .setIn(['player', 'current'], current)
      .setIn(['stepper', 'display'], stepperState);
  });

};
