
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
