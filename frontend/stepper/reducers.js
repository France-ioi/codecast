
import Immutable from 'immutable';

import {addReducer} from '../utils/linker';

export default function* () {

  yield addReducer('stepperRestart', function (state, action) {
    const stepperState = action.stepperState || state.getIn(['stepper', 'initial']);
    return state.set('stepper',
      Immutable.Map({
        state: 'idle',
        initial: stepperState,
        display: stepperState
      }));
  });

  yield addReducer('stepperExit', function (state, action) {
    return state
      .delete('translate')
      .delete('stepper');
  });

  yield addReducer('stepperStep', function (state, action) {
    if (state.getIn(['stepper', 'state']) !== 'idle') {
      return state;
    } else {
      return state.updateIn(['stepper'], stepper => stepper
        .set('state', 'starting')
        .set('current', stepper.get('display')));
    }
  });

  yield addReducer('stepperStart', function (state, action) {
    return state.setIn(['stepper', 'state'], 'running');
  });

  function stepperProgress (state, action) {
    // Set an intermediate stepping state to be displayed.
    return state.setIn(['stepper', 'display'], action.context.state);
  }

  yield addReducer('stepperProgress', stepperProgress);

  yield addReducer('stepperIdle', function (state, action) {
    // Progress + go back to idle.
    state = stepperProgress(state, action);
    return state.setIn(['stepper', 'state'], 'idle');
  });

  yield addReducer('stepperInterrupt', function (state, action) {
    // Cannot interrupt while idle.
    if (state.getIn(['stepper', 'state']) === 'idle') {
      return state;
    }
    return state.setIn(['stepper', 'interrupt'], true);
  });

  yield addReducer('stepperInterrupted', function (state, action) {
    return state.setIn(['stepper', 'interrupt'], false);
  });

};
