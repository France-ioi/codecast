
import Immutable from 'immutable';

export default function (m) {

  m.reducer('stepperRestart', function (state, action) {
    const stepperState = action.stepperState || state.getIn(['stepper', 'initial']);
    return state.set('stepper',
      Immutable.Map({
        state: 'idle',
        initial: stepperState,
        display: stepperState
      }));
  });

  m.reducer('stepperExit', function (state, action) {
    return state
      .delete('translate')
      .delete('stepper');
  });

  m.reducer('stepperStep', function (state, action) {
    if (state.getIn(['stepper', 'state']) !== 'idle') {
      return state;
    } else {
      return state.updateIn(['stepper'], stepper => stepper
        .set('state', 'starting')
        .set('current', stepper.get('display')));
    }
  });

  m.reducer('stepperStart', function (state, action) {
    return state.setIn(['stepper', 'state'], 'running');
  });

  function stepperProgress (state, action) {
    // Set an intermediate stepping state to be displayed.
    return state.setIn(['stepper', 'display'], action.context.state);
  }

  m.reducer('stepperProgress', stepperProgress);

  m.reducer('stepperIdle', function (state, action) {
    // Progress + go back to idle.
    state = stepperProgress(state, action);
    return state.setIn(['stepper', 'state'], 'idle');
  });

  m.reducer('stepperInterrupt', function (state, action) {
    // Cannot interrupt while idle.
    if (state.getIn(['stepper', 'state']) === 'idle') {
      return state;
    }
    return state.setIn(['stepper', 'interrupt'], true);
  });

  m.reducer('stepperInterrupted', function (state, action) {
    return state.setIn(['stepper', 'interrupt'], false);
  });

  m.reducer('translateSucceeded', function (state, action) {
    const {diagnostics} = action;
    return state.set('translate', Immutable.Map({diagnostics}));
  });

  m.reducer('translateFailed', function (state, action) {
    const {error, diagnostics} = action;
    return state.set('translate', Immutable.Map({error, diagnostics}));
  });

};
