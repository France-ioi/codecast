
export function getStepperState (state) {
  return state.get('stepper');
};

export const getStepperInterrupted = function (state) {
  return false;
};
