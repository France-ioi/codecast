
export default function (m) {

  // Requested translation of given {source}.
  m.action('translate', 'Stepper.Translate');

  // Started translation of {source}.
  m.action('translateStart', 'Stepper.Translate.Start');

  // Succeeded translating {source} to {syntaxTree}.
  m.action('translateSucceeded', 'Stepper.Translate.Succeeded');

  // Failed to translate {source} with {error}.
  m.action('translateFailed', 'Stepper.Translate.Failed');

  // Sent when the stepper's state is initialized.
  m.action('stepperRestart', 'Stepper.Restart');

  // Sent when the user requested stepping in a given mode.
  m.action('stepperStep', 'Stepper.Step');

  // Sent when the stepper starts evaluating a step.
  m.action('stepperStart', 'Stepper.Start');

  // Sent when the stepper has been evaluating for a while without completing a step.
  m.action('stepperProgress', 'Stepper.Progress');

  // Sent when the stepper has completed a step and is idle again.
  m.action('stepperIdle', 'Stepper.Idle');

  // Sent when the user exits the stepper.
  m.action('stepperExit', 'Stepper.Exit');

  // Sent when the user interrupts the stepper.
  m.action('stepperInterrupt', 'Stepper.Interrupt');

  m.action('stepperInterrupted', 'Stepper.Interrupted');

};