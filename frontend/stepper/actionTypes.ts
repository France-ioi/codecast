export enum ActionTypes {
    StepperTaskCancelled = 'Stepper.Task.Cancelled',
    StepperRestart = 'Stepper.Restart',
    StepperReset = 'Stepper.Reset',
    StepperCompileAndStep = 'Stepper.CompileAndStep',
    StepperStepFromControls = 'Stepper.StepFromControls',
    StepperRunBackground = 'Stepper.RunBackground',
    StepperRunBackgroundFinished = 'Stepper.RunBackgroundFinished',
    StepperStep = 'Stepper.Step',
    StepperStarted = 'Stepper.Started',
    StepperInteractBefore = 'Stepper.Interact.Before',
    StepperInteract = 'Stepper.Interact',
    StepperProgress = 'Stepper.Progress',
    StepperIdle = 'Stepper.Idle',
    StepperExit = 'Stepper.Exit',
    StepperInterrupting = 'Stepper.Interrupting',
    StepperInterrupt = 'Stepper.Interrupt',
    StepperInterrupted = 'Stepper.Interrupted',
    StepperUndo = 'Stepper.Undo',
    StepperRedo = 'Stepper.Redo',
    StepperConfigure = 'Stepper.Configure',
    StepperStackUp = 'Stepper.StackUp',
    StepperStackDown = 'Stepper.Stack.Down',
    StepperViewControlsChanged = 'Stepper.View.Controls.Changed',
    StepperEnabled = 'Stepper.Enabled',
    StepperDisabled = 'Stepper.Disabled',
    StepperSpeedChanged = 'Stepper.Speed.Changed',
    StepperControlsChanged = 'Stepper.Controls.Changed',
    StepperSynchronizingAnalysisChanged = 'Stepper.Synchronizing.Analysis.Changed',
    StepperExecutionSuccess = 'Stepper.Execution.Success',
    StepperExecutionError = 'Stepper.Execution.Error',
    StepperDisplayError = 'Stepper.Execution.DisplayError',
    StepperClearError = 'Stepper.Execution.ClearError',
    Compile = 'Compile',
    CompileWait = 'Compile.Wait',
    CompileClear = 'Compile.Clear',
    CompileStarted = 'Compile.Started',
    CompileSucceeded = 'Compile.Succeeded',
    CompileFailed = 'Compile.Failed',
}

export const stepperExecutionSuccess = (message) => ({
    type: ActionTypes.StepperExecutionSuccess,
    payload: {
        message,
    },
});

export const stepperExecutionError = (error, clearHighlight = true) => ({
    type: ActionTypes.StepperExecutionError,
    payload: {
        error,
        clearHighlight,
    },
});

export const stepperDisplayError = (error) => ({
    type: ActionTypes.StepperDisplayError,
    payload: {
        error,
    },
});

export const stepperClearError = () => ({
    type: ActionTypes.StepperClearError,
});

export const stepperRunBackground = (callback) => ({
    type: ActionTypes.StepperRunBackground,
    payload: {
        callback,
    },
});

export const stepperRunBackgroundFinished = (backgroundRunData) => ({
    type: ActionTypes.StepperRunBackgroundFinished,
    payload: {
        backgroundRunData,
    },
});
