
import * as C from 'persistent-c';
import {TermBuffer} from 'epic-vt';

import * as builtins from '../builtins';
import {getRangeFromOffsets} from '../translator/utils';
import {stepperOptions} from '../builtins';

// TODO: split record screen / stepper reducers

export function recordScreenStepperRestart (state, action) {
  const translated = action.result || state.screens.get('record').get('translated');
  const decls = translated.syntaxTree[2];
  const context = {decls, builtins};
  let stepperState = C.start(context);
  stepperState.terminal = new TermBuffer();
  stepperState = stepIntoUserCode(stepperState);
  return {
    ...state,
    stepper: {mode: 'idle'},
    screens: state.screens.update('record', screen =>
      updateSelection(
        screen.set('translated', translated)
              .set('stepperState', stepperState)))
  };
};

export function recordScreenStepperExit (state, action) {
  return {
    ...state,
    stepper: undefined,
    screens: state.screens.update('record', screen =>
      screen.set('stepperState', undefined).set('translated', undefined))
  };
};

export function recordScreenStepperStep (state, action) {
  if (state.stepper.mode !== 'idle') {
    return state;
  } else {
    return {
      ...state,
      stepper: {
        mode: 'starting',
        state: state.screens.get('record').get('stepperState')
      }
    };
  }
};

export function recordScreenStepperStart (state, action) {
  return {
    ...state,
    stepper: {
      ...state.stepper,
      mode: 'running'
    }
  };
};

export function recordScreenStepperProgress (state, action) {
  // Copy the new state to the recording screen's state, so that
  // the view reflects the current progress.
  const {context} = action;
  // const {elapsed, stepCounter} = context;
  const stepperState = context.state;
  return {
    ...state,
    screens: state.screens.update('record', screen =>
      updateSelection(screen.set('stepperState', stepperState)))
  };
}

export function recordScreenStepperIdle (state, action) {
  // Copy stepper state into recording screen and clean up the stepper.
  state = recordScreenStepperProgress(state, action);
  return {
    ...state,
    stepper: {mode: 'idle'}
  };
};

function stepIntoUserCode (stepperState) {
  while (stepperState.control && !stepperState.control.node[1].begin) {
    stepperState = C.step(stepperState, stepperOptions);
  }
  return stepperState;
}

function updateSelection (recordScreen) {
  const {control} = recordScreen.get('stepperState');
  const translated = recordScreen.get('translated');
  let selection = null;
  if (control && control.node) {
    const attrs = control.node[1];
    selection = getRangeFromOffsets(translated, attrs.begin, attrs.end);
  }
  return recordScreen.set('selection', selection);
}
