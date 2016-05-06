
export const error = function (state, action) {
  return state.set('lastError', {
    source: action.source,
    message: action.error.toString()
  });
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

export const playerPausing = function (state, action) {
  return state.setIn(['player', 'state'], 'pausing');
};

export const playerPaused = function (state, action) {
  return state.update('player', player => player
    .set('state', 'paused')
    .set('resume', player.get('current')));
};

export const playerResuming = function (state, action) {
  return state.setIn(['player', 'state'], 'resuming');
};

export const playerResumed = function (state, action) {
  return state.update('player', player => player
    .set('state', 'playing')
    .set('current', player.get('resume'))
    .delete('resume'));
};

export const playerStopping = function (state, action) {
  return state.setIn(['player', 'state'], 'stopping');
};

export const playerStopped = function (state, action) {
  return state; // set player state to ready or stopped?
};

export const playerTick = function (state, action) {
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
};
