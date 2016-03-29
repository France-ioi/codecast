
export const recordingScreenSourceTextChanged = 'RecordingScreen.Source.Text.Changed';
export const recordingScreenSourceSelectionChanged = 'RecordingScreen.Source.Selection.Changed';

export const recordingScreenStepperRestart = {
  type: 'RecordingScreen.Stepper.Restart',
  description: "Sent when the stepper's state is initialized."
};

export const recordingScreenStepperStep = {
  type: 'RecordingScreen.Stepper.Step',
  description: "Sent when the user requested stepping in a given mode."
};

export const recordingScreenStepperStart = {
  type: 'RecordingScreen.Stepper.Start',
  description: "Sent when the stepper starts evaluating a step."
};

export const recordingScreenStepperProgress = {
  type: 'RecordingScreen.Stepper.Progress',
  description: "Sent when the stepper has been evaluating for a while without completing a step."
};

export const recordingScreenStepperIdle = {
  type: 'RecordingScreen.Stepper.Idle',
  description: "Sent when the stepper has completed a step and is idle again."
};

export const recordingScreenStepperExit = {
  type: 'RecordingScreen.Stepper.Exit',
  description: "Sent when the user exits the stepper."
};
