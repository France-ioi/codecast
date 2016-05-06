
export const translate = {
  type: 'Stepper.Translate',
  description: "Requested translation of given {source}."
};

export const translateStart = {
  type: 'Stepper.Translate.Start',
  description: "Started translation of {source}."
};

export const translateSucceeded = {
  type: 'Stepper.Translate.Succeeded',
  description: "Succeeded translating {source} to {syntaxTree}."
};

export const translateFailed = {
  type: 'Stepper.Translate.Failed',
  description: "Failed to translate {source} with {error}."
};

export const stepperRestart = {
  type: 'Stepper.Restart',
  description: "Sent when the stepper's state is initialized."
};

export const stepperStep = {
  type: 'Stepper.Step',
  description: "Sent when the user requested stepping in a given mode."
};

export const stepperStart = {
  type: 'Stepper.Start',
  description: "Sent when the stepper starts evaluating a step."
};

export const stepperProgress = {
  type: 'Stepper.Progress',
  description: "Sent when the stepper has been evaluating for a while without completing a step."
};

export const stepperIdle = {
  type: 'Stepper.Idle',
  description: "Sent when the stepper has completed a step and is idle again."
};

export const stepperExit = {
  type: 'Stepper.Exit',
  description: "Sent when the user exits the stepper."
};

export const stepperInterrupt = {
  type: 'Stepper.Interrupt',
  description: "Sent when the user interrupts the stepper."
};

export const stepperInterrupted = {
  type: 'Stepper.Interrupted',
  description: "Sent when the stepper has halted after an interrupt."
};
