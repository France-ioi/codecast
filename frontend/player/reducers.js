
export const error = function (state, action) {
  return state.set('lastError', action.error);
};

export const playerPreparing = function (state, action) {
  return state.setIn(['player', 'state'], 'preparing');
};

export const playerReady = function (state, action) {
  const {audio, states} = action;
  return state.update('player', player => player
    .set('state', 'ready')
    .set('audio', audio)
    .set('states', states));
};

export const playerStart = function (state, action) {
  return state;
};

export const playerStarted = function (state, action) {
  return state;
};

export const playerStop = function (state, action) {
  return state;
};

export const playerStopping = function (state, action) {
  return state;
};

export const playerStopped = function (state, action) {
  return state;
};

export const playerTick = function (state, action) {
  return state.update('player', function (player) {
    const position = action.position;
    const prevPosition = player.get('position');
    if (prevPosition !== action.position) {
      const states = player.get('states');
      const currentState = findState(states, position);
      player = player.set('position', position).set('current', currentState.state);
    }
    return player;
  });
};

const findState = function (states, t) {
  let low = 0, high = states.length;
  while (low + 1 < high) {
    const mid = (low + high) / 2 | 0;
    const state = states[mid];
    if (state.t <= t) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return states[low];
};
