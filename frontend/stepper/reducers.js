/*

The stepper's state has the following shape:

  {
    status: /clear|idle|starting|running/,
    mode: /expr|into|out|over/,
    initial: {...},
    current: {...}
  }

  The 'initial' state is the one restored by a 'restart' action.
  The 'current' state is the state from which the step* actions start,
  and also the state to be displayed to the user.

*/

import Immutable from 'immutable';

import {addReducer} from '../utils/linker';
import {analyseState, collectDirectives} from './analysis';

const enrichStepperState = function (stepperState) {
  stepperState = {...stepperState};
  if (!('controls' in stepperState)) {
    stepperState.controls = Immutable.Map();
  }
  const {core, controls} = stepperState;
  if (!core) {
    return stepperState;
  }
  const analysis = stepperState.analysis = analyseState(core);
  const focusDepth = controls.getIn(['stack', 'focusDepth'], 0);
  stepperState.directives = collectDirectives(analysis.frames, focusDepth);
  // TODO? initialize controls for each directive added,
  //       clear controls for each directive removed (except 'stack').
  return stepperState;
};

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
  let stepperState = action.stepperState;
  if (stepperState) {
    stepperState = enrichStepperState(stepperState);
  } else {
    stepperState = state.get('initial');
  }
  return Immutable.Map({
    status: 'idle',
    initial: stepperState,
    current: stepperState,
    undo: state.get('undo'),
    redo: Immutable.List()
  });
};

export const stepperIdle = function (state, action) {
  // Set new current state and go back to idle.
  const stepperState = enrichStepperState(action.context.state);
  return state
    .set('current', stepperState)
    .set('status', 'idle')
    .delete('mode');
};

export const stepperProgress = function (state, action) {
  // Set new current state and go back to idle.
  const stepperState = enrichStepperState(action.context.state);
  return state.set('current', stepperState);
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
    .set('redo', redo.shift())
    .set('undo', state.get('undo').unshift(current));
};

export const stepperStackUp = function (state, action) {
  return state.update('current', function (stepperState) {
    let {controls, analysis} = stepperState;
    let focusDepth = controls.getIn(['stack', 'focusDepth']);
    if (focusDepth > 0) {
      focusDepth -= 1;
      controls = controls.setIn(['stack', 'focusDepth'], focusDepth);
      const directives = collectDirectives(analysis.frames, focusDepth);
      stepperState = {...stepperState, controls, directives};
    }
    return stepperState;
  });
};

export const stepperStackDown = function (state, action) {
  return state.update('current', function (stepperState) {
    let {controls, analysis} = stepperState;
    const stackDepth = analysis.frames.size;
    let focusDepth = controls.getIn(['stack', 'focusDepth']);
    if (focusDepth + 1 < stackDepth) {
      focusDepth += 1;
      controls = controls.setIn(['stack', 'focusDepth'], focusDepth);
      const directives = collectDirectives(analysis.frames, focusDepth);
      stepperState = {...stepperState, controls, directives};
    }
    return stepperState;
  });
};

export const stepperViewControlsChanged = function (state, action) {
  const {key, update} = action;
  return state.update('current', function (stepperState) {
    let {controls} = stepperState;
    if (controls.has(key)) {
      controls = controls.update(key, function (viewControls) {
        // Do not use viewControls.merge as it applies Immutable.fromJS
        // to all values.
        Object.keys(update).forEach(function (name) {
          viewControls = viewControls.set(name, update[name]);
        });
        return viewControls;
      });
    } else {
      controls = controls.set(key, Immutable.Map(update));
    }
    return {...stepperState, controls};
  });
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
    return state.update('stepper', st => stepperStackUp(st, action));
  });

  yield addReducer('stepperStackDown', function (state, action) {
    return state.update('stepper', st => stepperStackDown(st, action));
  });

  yield addReducer('stepperViewControlsChanged', function (state, action) {
    return state.update('stepper', st => stepperViewControlsChanged(st, action));
  });

};
