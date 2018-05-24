
import Immutable from 'immutable';

export default function (bundle, deps) {

  bundle.addReducer('init', function (state, _action) {
    return playerClearReducer(state);
  });

  bundle.addReducer('playerClear', playerClearReducer);

  bundle.addReducer('playerPreparing', function (state, action) {
    return state.setIn(['player', 'status'], 'preparing');
  });

  bundle.addReducer('playerPrepareFailure', function (state, {payload: {position, exception}}) {
    return state.setIn(['player', 'error'], {source: 'prepare', message: exception.toString(), details: `at ${position}`});
  });

  function updateStatus (player) {
    if (player.get('data') && player.get('duration')) {
      player = player.set('status', 'ready');
    }
    return player;
  }

  bundle.addReducer('playerReady', function (state, action) {
    const {payload: {data, instants}} = action;
    return state.update('player', player => updateStatus(player
      .set('data', data)
      .set('instants', instants)
      .set('current', instants[0])));
  });

  bundle.addReducer('playerAudioReady', function (state, action) {
    const {duration} = action;
    return state.update('player', player => updateStatus(player
      .set('audioTime', 0)
      .set('duration', duration)));
  });

  bundle.addReducer('playerAudioError', function (state, action) {
    return state.setIn(['player', 'status'], 'broken');
  });

  bundle.addReducer('playerStarting', function (state, action) {
    return state.setIn(['player', 'status'], 'starting');
  });

  bundle.addReducer('playerStarted', function (state, action) {
    return state.setIn(['player', 'status'], 'playing');
  });

  bundle.addReducer('playerPausing', function (state, action) {
    return state.setIn(['player', 'status'], 'pausing');
  });

  bundle.addReducer('playerPaused', function (state, action) {
    return state.update('player', player => player
      .set('status', 'paused')
      .set('resume', player.get('current')));
  });

  bundle.addReducer('playerResuming', function (state, action) {
    return state.setIn(['player', 'status'], 'resuming');
  });

  bundle.addReducer('playerResumed', function (state, action) {
    return state.update('player', player => player
      .set('status', 'playing')
      .set('current', player.get('resume'))
      .delete('resume'));
  });

  bundle.addReducer('playerStopping', function (state, action) {
    return state.setIn(['player', 'status'], 'stopping');
  });

  bundle.addReducer('playerStopped', function (state, action) {
    return state.setIn(['player', 'status'], 'idle');
  });

  bundle.addReducer('playerTick', function (state, action) {
    // action shape: {type, current: {t, eventIndex, state}, audioTime}
    const {current, audioTime} = action;
    return state.update('player', player => player
      .set('current', current)
      .set('audioTime', audioTime));
  });

  bundle.addReducer('playerSeek', function (state, {payload}) {
    const {audioTime} = payload;
    return state.update('player', player => player
      .set('seekTo', Math.min(player.get('duration'), Math.max(0, audioTime))));
  });

  bundle.addReducer('playerSeeked', function (state, action) {
    // action shape: {type, current, audioTime}
    const {current, seekTo} = action;
    return state.update('player', function (player) {
      // Only delete seekTo if it matches the time seeked to.
      if (player.get('seekTo') === seekTo) {
        player = player.delete('seekTo');
      }
      return player.set('current', current).set('audioTime', seekTo);
    });
  });

};

function playerClearReducer (state) {
  return state.set('player', Immutable.Map({
    status: 'idle',
    audio: document.createElement('video')
  }));
}
