
import Immutable from 'immutable';

export function stepperRestart (state, action) {
  const stepperState = action.stepperState || state.getIn(['recorder', 'stepper', 'initial']);
  console.log("stepperRestart", stepperState);
  return state
    .update('recorder', recorder => recorder
      .set('stepper', Immutable.Map({state: 'idle', initial: stepperState, display: stepperState})));
};

export function stepperExit (state, action) {
  return state.update('recorder', recorder => recorder
    .delete('stepper')
    .delete('translate'));
};

export function stepperStep (state, action) {
  if (state.getIn(['recorder', 'stepper', 'state']) !== 'idle') {
    return state;
  } else {
    return state.updateIn(['recorder', 'stepper'], stepper => stepper
      .set('state', 'starting')
      .set('current', stepper.get('display')));
  }
};

export function stepperStart (state, action) {
  return state.setIn(['recorder', 'stepper', 'state'], 'running');
};

export function stepperProgress (state, action) {
  // Copy the new state to the recording screen's state, so that
  // the view reflects the current progress.
  return state.setIn(['recorder', 'stepper', 'display'], action.context.state);
};

export function stepperIdle (state, action) {
  // Copy stepper state into recording screen and clean up the stepper.
  state = stepperProgress(state, action);
  return state.setIn(['recorder', 'stepper', 'state'], 'idle');
};

export function translateSucceeded (state, action) {
  const {diagnostics} = action;
  return state
    .setIn(['recorder', 'translate'], Immutable.Map({diagnostics}));
};

export function translateFailed (state, action) {
  const {error, diagnostics} = action;
  return state
    .setIn(['recorder', 'translate'], Immutable.Map({error, diagnostics}));
};
