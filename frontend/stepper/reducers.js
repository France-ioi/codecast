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

export const stepperClear = function (state) {
  return Immutable.Map({
    status: 'clear',
    undo: Immutable.List(),
    redo: Immutable.List()
  });
};

export const stepperStarted = function (state, action) {
  return state
    .set('status', 'running')
    .set('mode', action.mode)
    .set('redo', Immutable.List())
    .update('undo', undo => undo.unshift(state.get('current')));
};

export const stepperRestart = function (state, action) {
  const stepperState = action.stepperState || state.get('initial');
  return Immutable.Map({
    status: 'idle',
    initial: stepperState,
    current: stepperState,
    display: stepperState,
    undo: state.get('undo'),
    redo: Immutable.List()
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

export const stepperUndo = function (state, action) {
  const undo = state.get('undo');
  if (undo.isEmpty()) {
    return state;
  }
  const current = state.get('current');
  const stepperState = undo.first();
  return state
    .set('current', stepperState)
    .set('display', stepperState)
    .set('undo', undo.shift())
    .set('redo', state.get('redo').unshift(current));
};

export const stepperRedo = function (state, action) {
  const redo = state.get('redo');
  if (redo.isEmpty()) {
    return state;
  }
  const stepperState = redo.first();
  const current = state.get('current');
  return state
    .set('current', stepperState)
    .set('display', stepperState)
    .set('redo', redo.shift())
    .set('undo', state.get('undo').unshift(current));
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
    return state.update('stepper', st => stepperClear(st));
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

  yield addReducer('stepperUndo', function (state, action) {
    return state.update('stepper', st => stepperUndo(st, action));
  });

  yield addReducer('stepperRedo', function (state, action) {
    return state.update('stepper', st => stepperRedo(st, action));
  });

  yield addReducer('stepperConfigure', function (state, action) {
    const {options} = action;
    return state.set('stepper.options', Immutable.Map(options));
  });

  yield addReducer('stepperStackUp', function (state, action) {
    return state.updateIn(['stepper', 'display'], function (stepperState) {
      let {controls} = stepperState;
      const focusDepth = controls.getIn(['stack', 'focusDepth']);
      if (focusDepth > 0) {
        controls = controls.setIn(['stack', 'focusDepth'], focusDepth - 1);
        stepperState = {...stepperState, controls};
      }
      return stepperState;
    });
  });

  yield addReducer('stepperStackDown', function (state, action) {
    return state.updateIn(['stepper', 'display'], function (stepperState) {
      let {controls} = stepperState;
      const stackDepth = stepperState.analysis.frames.size;
      const focusDepth = controls.getIn(['stack', 'focusDepth']);
      if (focusDepth + 1 < stackDepth) {
        controls = controls.setIn(['stack', 'focusDepth'], focusDepth + 1);
        stepperState = {...stepperState, controls};
      }
      return stepperState;
    });
  });

};
