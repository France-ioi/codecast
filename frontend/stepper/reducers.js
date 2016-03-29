
import {getRangeFromOffsets} from '../translator/utils';

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

