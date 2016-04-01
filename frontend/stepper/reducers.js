
import * as C from 'persistent-c';
import {TermBuffer} from 'epic-vt';

import * as builtins from '../builtins';
import {getRangeFromOffsets} from '../translator/utils';
import {stepperOptions} from '../builtins';

export function recordingScreenStepperRestart (state, action) {
  const {syntaxTree} = state.translated;
  const decls = syntaxTree[2];
  const context = {decls, builtins};
  let stepperState = C.start(context);
  stepperState.terminal = new TermBuffer();
  while (stepperState.control && !stepperState.control.node[1].begin) {
    stepperState = C.step(stepperState, stepperOptions);
  }
  let selection = null;
  if (stepperState.control) {
    const attrs = stepperState.control.node[1];
    selection = getRangeFromOffsets(state.translated, attrs.begin, attrs.end);
  }
  return {
    ...state,
    recordingScreen: {
      ...state.recordingScreen,
      stepperState: stepperState,
      selection
    },
    stepper: {
      mode: 'idle'
    }
  };
};

export function recordingScreenStepperExit (state, action) {
  return {
    ...state,
    recordingScreen: {
      ...state.recordingScreen,
      stepperState: undefined
    },
    translated: undefined,
    stepper: undefined
  };
};

export function recordingScreenStepperStep (state, action) {
  if (state.stepper.mode !== 'idle') {
    return state;
  } else {
    return {
      ...state,
      stepper: {
        mode: 'starting',
        state: state.recordingScreen.stepperState
      }
    };
  }
};

export function recordingScreenStepperStart (state, action) {
  return {
    ...state,
    stepper: {
      ...state.stepper,
      mode: 'running'
    }
  };
};

export function recordingScreenStepperProgress (state, action) {
  // Copy the new state to the recording screen's state, so that
  // the view reflects the current progress.
  const {context} = action;
  // const {elapsed, stepCounter} = context;
  const stepperState = context.state;
  const {control} = stepperState;
  let selection = null;
  if (control && control.node) {
    const attrs = control.node[1];
    selection = getRangeFromOffsets(state.translated, attrs.begin, attrs.end);
  }
  return {
    ...state,
    recordingScreen: {
      ...state.recordingScreen,
      stepperState,
      selection
    }
  };
}

export function recordingScreenStepperIdle (state, action) {
  // Copy stepper state into recording screen and clean up the stepper.
  state = recordingScreenStepperProgress(state, action);
  return {
    ...state,
    stepper: {
      mode: 'idle'
    }
  };
};
