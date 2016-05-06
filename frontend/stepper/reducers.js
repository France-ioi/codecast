
import Immutable from 'immutable';

export function stepperRestart (state, action) {
  const stepperState = action.stepperState || state.getIn(['stepper', 'initial']);
  return state.set('stepper',
    Immutable.Map({
      state: 'idle',
      initial: stepperState,
      display: stepperState
    }));
};

export function stepperExit (state, action) {
  return state
    .delete('translate')
    .delete('stepper');
};

export function stepperStep (state, action) {
  if (state.getIn(['stepper', 'state']) !== 'idle') {
    return state;
  } else {
    return state.updateIn(['stepper'], stepper => stepper
      .set('state', 'starting')
      .set('current', stepper.get('display')));
  }
};

export function stepperStart (state, action) {
  return state.setIn(['stepper', 'state'], 'running');
};

export function stepperProgress (state, action) {
  // Set an intermediate stepping state to be displayed.
  return state.setIn(['stepper', 'display'], action.context.state);
};

export function stepperIdle (state, action) {
  // Progress + go back to idle.
  state = stepperProgress(state, action);
  return state.setIn(['stepper', 'state'], 'idle');
};

export function stepperInterrupt (state, action) {
  // Cannot interrupt while idle.
  if (state.getIn(['stepper', 'state']) === 'idle') {
    return state;
  }
  return state.setIn(['stepper', 'interrupt'], true);
};

export function stepperInterrupted (state, action) {
  return state.setIn(['stepper', 'interrupt'], false);
};

export function translateSucceeded (state, action) {
  const {diagnostics} = action;
  return state.set('translate', Immutable.Map({diagnostics}));
};

export function translateFailed (state, action) {
  const {error, diagnostics} = action;
  return state.set('translate', Immutable.Map({error, diagnostics}));
};
