
export const error = function (state, action) {
  return state.set('lastError', action.error);
};

export const playerPreparing = function (state, action) {
  return state.setIn(['player', 'state'], 'preparing');
};

export const playerReady = function (state, action) {
  const {audio, events, states} = action;
  return state.update('player', player => player
    .set('state', 'ready')
    .set('audio', audio)
    .set('events', events)
    .set('states', states)
    .set('current', states[0]));
};

export const playerSourceInit = function (state, action) {
  return state.setIn(['player', 'source', 'editor'], action.editor);
};

export const playerInputInit = function (state, action) {
  return state.setIn(['player', 'input', 'editor'], action.editor);
};

export const playerStarting = function (state, action) {
  return state.setIn(['player', 'state'], 'starting');
};

export const playerStarted = function (state, action) {
  return state.setIn(['player', 'state'], 'playing');
};

export const playerStopping = function (state, action) {
  return state.setIn(['player', 'state'], 'stopping');
};

export const playerStopped = function (state, action) {
  return state; // set player state to ready or stopped?
};

export const playerTick = function (state, action) {
  return state.setIn(['player', 'current'], action.current);
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
