
import * as C from 'persistent-c';
import * as builtins from '../builtins';

export function recordingScreenSourceTextChanged (state, action) {
  return {
    ...state,
    recordingScreen: {
      ...state.recordingScreen,
      source: action.source
    }
  };
};

export function recordingScreenSourceSelectionChanged (state, action) {
  return {
    ...state,
    recordingScreen: {
      ...state.recordingScreen,
      selection: action.selection
    }
  };
};

export function recordingScreenStepperRestart (state, action) {
  const {syntaxTree} = state.translated;
  const decls = syntaxTree[2];
  const context = {decls, builtins};
  return {
    ...state,
    recordingScreen: {
      ...state.recordingScreen,
      stepperState: C.start(context)
    },
    stepper: {
      mode: 'idle'
    }
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
