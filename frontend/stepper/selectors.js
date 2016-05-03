
export function getStepperState (state) {
  return state.get('stepper');
};

export function getTranslateState (state) {
  return state.get('translate');
};

export const getStepperInterrupted = function (state) {
  return false;  // Feature not implemented yet
};
