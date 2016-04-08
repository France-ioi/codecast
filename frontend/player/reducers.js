
export const error = function (state, action) {
  return state.set('lastError', action.error);
};

export const playerPreparing = function (state, action) {
  return state;
};

export const playerReady = function (state, action) {
  return state;
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
