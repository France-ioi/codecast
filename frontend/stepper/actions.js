
export default function (bundle, deps) {

  /* Sent when the stepper task is started */
  bundle.defineAction('stepperTaskStarted', 'Stepper.Task.Started');

  /* Sent when the stepper task is cancelled */
  bundle.defineAction('stepperTaskCancelled', 'Stepper.Task.Cancelled');

  // Sent when the stepper's state is initialized.
  bundle.defineAction('stepperRestart', 'Stepper.Restart');

  // Restore a saved or computed state.
  bundle.defineAction('stepperReset', 'Stepper.Reset');

  // Sent when the user requested stepping in a given mode.
  bundle.defineAction('stepperStep', 'Stepper.Step');

  // Sent when the stepper has started evaluating a step.
  bundle.defineAction('stepperStarted', 'Stepper.Start');

  // Sent when the stepper has been evaluating for a while without completing a step.
  bundle.defineAction('stepperProgress', 'Stepper.Progress');

  // Sent when the stepper has completed a step and is idle again.
  bundle.defineAction('stepperIdle', 'Stepper.Idle');

  // Sent when the user exits the stepper.
  bundle.defineAction('stepperExit', 'Stepper.Exit');

  // Sent when the user interrupts the stepper.
  bundle.defineAction('stepperInterrupt', 'Stepper.Interrupt');

  bundle.defineAction('stepperInterrupted', 'Stepper.Interrupted');

  bundle.defineAction('stepperUndo', 'Stepper.Undo');
  bundle.defineAction('stepperRedo', 'Stepper.Redo');

  bundle.defineAction('stepperConfigure', 'Stepper.Configure');

  bundle.defineAction('stepperStackUp', 'Stepper.Stack.Up');
  bundle.defineAction('stepperStackDown', 'Stepper.Stack.Down');
  bundle.defineAction('stepperViewControlsChanged', 'Stepper.View.ControlsChanged');

};