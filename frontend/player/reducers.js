
import {addReducer} from '../utils/linker';

export default function* (deps) {

  yield addReducer('error', function (state, action) {
    return state.set('lastError', {
      source: action.source,
      message: action.error.toString()
    });
  });

  yield addReducer('playerPreparing', function (state, action) {
    return state.setIn(['player', 'status'], 'preparing');
  });

  yield addReducer('playerReady', function (state, action) {
    const {audio, events, instants} = action;
    return state.update('player', player => player
      .set('status', 'ready')
      .set('audio', audio)
      .set('events', events)
      .set('instants', instants)
      .set('current', instants[0]));
  });

  yield addReducer('playerStarting', function (state, action) {
    return state.setIn(['player', 'status'], 'starting');
  });

  yield addReducer('playerStarted', function (state, action) {
    return state.setIn(['player', 'status'], 'playing');
  });

  yield addReducer('playerPausing', function (state, action) {
    return state.setIn(['player', 'status'], 'pausing');
  });

  yield addReducer('playerPaused', function (state, action) {
    return state.update('player', player => player
      .set('status', 'paused')
      .set('resume', player.get('current')));
  });

  yield addReducer('playerResuming', function (state, action) {
    return state.setIn(['player', 'status'], 'resuming');
  });

  yield addReducer('playerResumed', function (state, action) {
    return state.update('player', player => player
      .set('status', 'playing')
      .set('current', player.get('resume'))
      .delete('resume'));
  });

  yield addReducer('playerStopping', function (state, action) {
    return state.setIn(['player', 'status'], 'stopping');
  });

  yield addReducer('playerStopped', function (state, action) {
    return state; // set player state to ready or stopped?
  });

  yield addReducer('playerTick', function (state, action) {
    // action shape: {type, current: {t, eventIndex, state}}
    return state.setIn(['player', 'current'], action.current);
  });

};
