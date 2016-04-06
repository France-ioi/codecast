
export function getStepperMode (state) {
  return state.stepper.mode;
};

export function getStepperState (state) {
  return state.stepper.state;
};

export function getRecorderState (state) {
  return state.recorder;
};

export function getHomeScreenState (state) {
  return state.screens.get('home');
};

export function getPrepareScreenState (state) {
  return state.screens.get('prepare');
};
