/*

The stepper's state has the following shape:

  {
    status: /clear|idle|starting|running/,
    mode: /expr|into|out|over/,
    initial: {...},
    current: {...},
    display: {...}
  }

  The 'initial' state is the one restored by a 'restart' action.
  The 'current' state is the state from which the step* actions start.
  The 'display' state is the state to be displayed to the user (which is
  the same as the 'current' state, except during steps long enough to emit
  'progress' actions).

*/

import Immutable from 'immutable';

import {addReducer} from '../utils/linker';

export const stepperClear = function (state, action) {
  return Immutable.Map({status: 'clear'});
};

export const stepperStarted = function (state, action) {
  return state.set('status', 'running').set('mode', action.mode);
};

export const stepperRestart = function (state, action) {
  const stepperState = action.stepperState || state.get('initial');
  return Immutable.Map({
    status: 'idle',
    initial: stepperState,
    current: stepperState,
    display: stepperState
  });
};

export const stepperIdle = function (state, action) {
  // Set new current state, also set it for display, and go back to idle.
  const stepperState = action.context.state;
  return state
    .set('current', stepperState)
    .set('display', stepperState)
    .set('status', 'idle')
    .delete('mode');
};

export const stepperProgress = function (state, action) {
  // Set new current state, also set it for display, and go back to idle.
  const stepperState = action.context.state;
  return state.set('display', stepperState);
};

export default function* () {

  yield addReducer('init', function (state, action) {
    return state.set('stepper', stepperClear());
  });

  yield addReducer('stepperRestart', function (state, action) {
    return state.update('stepper', st => stepperRestart(st, action));
  });

  yield addReducer('stepperReset', function (state, action) {
    return state.set('stepper', action.state);
  });

  yield addReducer('stepperExit', function (state, action) {
    return state.set('stepper', stepperClear());
  });

  yield addReducer('stepperStep', function (state, action) {
    if (state.getIn(['stepper', 'status']) !== 'idle') {
      return state;
    } else {
      return state.setIn(['stepper', 'status'], 'starting');
    }
  });

  yield addReducer('stepperStarted', function (state, action) {
    return state.update('stepper', st => stepperStarted(st, action));
  });

  yield addReducer('stepperProgress', function (state, action) {
    return state.update('stepper', st => stepperProgress(st, action));
  });

  yield addReducer('stepperIdle', function (state, action) {
    return state.update('stepper', st => stepperIdle(st, action));
  });

  yield addReducer('stepperInterrupt', function (state, action) {
    // Cannot interrupt while idle.
    if (state.getIn(['stepper', 'status']) === 'idle') {
      return state;
    }
    return state.setIn(['stepper', 'interrupt'], true);
  });

  yield addReducer('stepperInterrupted', function (state, action) {
    return state.setIn(['stepper', 'interrupt'], false);
  });

};
