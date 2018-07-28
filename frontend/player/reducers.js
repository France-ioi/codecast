
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
  bundle.addReducer('playerVolumeChanged', playerVolumeChangedReducer);
  bundle.addReducer('playerMutedChanged', playerMutedChangedReducer);
}

function initReducer (state, _action) {
  return playerClearReducer(state);
}

function playerClearReducer (state, _action) {
  const audio = document.createElement('video');
  const volume = audio.volume; /* XXX: load from localStorage? */
  const isMuted = audio.muted; /* XXX: load from localStorage? */
  const progress = 0;
  return state.set('player', Immutable.Map({audio, volume, isMuted, progress}));
}

function playerPreparingReducer (state, _action) {
  return state.setIn(['player', 'isReady'], false);
}

function playerPrepareProgressReducer (state, {payload: {progress}}) {
  return state.setIn(['player', 'progress'], progress);
}

function playerPrepareFailureReducer (state, {payload: {message}}) {
  return state.setIn(['player', 'error'], {source: 'prepare', message});
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

function playerVolumeChangedReducer (state, {payload: {volume}}) {
  return state.update('player', function (player) {
    const audio = player.get('audio');
    audio.volume = volume;
    return player.set('volume', audio.volume);
  });
}

function playerMutedChangedReducer (state, {payload: {isMuted}}) {
  return state.update('player', function (player) {
    const audio = player.get('audio');
    audio.muted = isMuted;
    return player.set('isMuted', audio.muted);
  });
}
