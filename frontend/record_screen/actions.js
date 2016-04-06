
export const switchToRecordScreen = 'RecordScreen.Switch';

export const recordScreenSourceEdit = 'RecordScreen.Source.Edit';
export const recordScreenSourceSelect = 'RecordScreen.Source.Select';

export const recordScreenStepperRestart = {
  type: 'RecordScreen.Stepper.Restart',
  description: "Sent when the stepper's state is initialized."
};

export const recordScreenStepperStep = {
  type: 'RecordScreen.Stepper.Step',
  description: "Sent when the user requested stepping in a given mode."
};

export const recordScreenStepperStart = {
  type: 'RecordScreen.Stepper.Start',
  description: "Sent when the stepper starts evaluating a step."
};

export const recordScreenStepperProgress = {
  type: 'RecordScreen.Stepper.Progress',
  description: "Sent when the stepper has been evaluating for a while without completing a step."
};

export const recordScreenStepperIdle = {
  type: 'RecordScreen.Stepper.Idle',
  description: "Sent when the stepper has completed a step and is idle again."
};

export const recordScreenStepperExit = {
  type: 'RecordScreen.Stepper.Exit',
  description: "Sent when the user exits the stepper."
};
