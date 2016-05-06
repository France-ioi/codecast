
export function getStepperState (state) {
  return state.get('stepper');
};

export function getTranslateState (state) {
  return state.get('translate');
};

export const getStepperInterrupted = function (state) {
  return state.getIn(['stepper', 'interrupt']);
};

export function StackView (state, props) {
  return {state: state.getIn(['stepper', 'display'])};
};

export function DirectivesPane (state, props) {
  return {state: state.getIn(['stepper', 'display'])};
};
