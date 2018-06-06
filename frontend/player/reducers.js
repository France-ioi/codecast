
import Immutable from 'immutable';

export default function (bundle, deps) {
  bundle.addReducer('init', initReducer);
  bundle.addReducer('playerClear', playerClearReducer);
  bundle.addReducer('playerPreparing', playerPreparingReducer);
  bundle.addReducer('playerPrepareProgress', playerPrepareProgressReducer);
  bundle.addReducer('playerPrepareFailure', playerPrepareFailureReducer);
  bundle.addReducer('playerReady', playerReadyReducer);
  bundle.addReducer('playerStarted', playerStartedReducer);
  bundle.addReducer('playerPaused', playerPausedReducer);
  bundle.addReducer('playerTick', playerTickReducer);
}

function initReducer (state, _action) {
  return playerClearReducer(state);
}

function playerClearReducer (state, _action) {
  return state.set('player', Immutable.Map({
    audio: document.createElement('video')
  }));
}

function playerPreparingReducer (state, _action) {
  return state.setIn(['player', 'isReady'], false);
}

function playerPrepareProgressReducer (state, {payload: {progress}}) {
  return state.setIn(['player', 'progress'], progress);
}

function playerPrepareFailureReducer (state, {payload: {position, exception}}) {
  return state.setIn(['player', 'error'], {
    source: 'prepare',
    message: exception.toString(),
    details: `at ${position}`
  });
}

function playerReadyReducer (state, {payload: {duration, data, instants}}) {
  return state.update('player', player => updateStatus(player
    .set('audioTime', 0)
    .set('duration', duration)
    .set('data', data)
    .set('instants', instants)
    .set('current', instants[0])));
}

function updateStatus (player) {
  if (player.get('data') && player.get('duration')) {
    player = player.set('isReady', true);
  }
  return player;
}

function playerStartedReducer (state, _action) {
  return state.setIn(['player', 'isPlaying'], true);
}

function playerPausedReducer (state, _action) {
 return state.setIn(['player', 'isPlaying'], false);
}

function playerTickReducer (state, {payload: {current, audioTime}}) {
  return state.update('player', player => player
    .set('current', current) /* current instant */
    .set('audioTime', audioTime));
}
