import {LibraryTestResult} from '../task/libs/library_test_result';
import {createAction} from '@reduxjs/toolkit';

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
    StepperExecutionEnd = 'Stepper.Execution.End', // End of program without success nor error (for experiment mode)
    StepperDisplayError = 'Stepper.Execution.DisplayError',
    StepperClearError = 'Stepper.Execution.ClearError',
    Compile = 'Compile',
    CompileWait = 'Compile.Wait',
    CompileClear = 'Compile.Clear',
    CompileStarted = 'Compile.Started',
    CompileSucceeded = 'Compile.Succeeded',
    CompileFailed = 'Compile.Failed',
}

export const stepperExecutionSuccess = (testResult: LibraryTestResult) => ({
    type: ActionTypes.StepperExecutionSuccess,
    payload: {
        testResult,
    },
});

export const stepperExecutionError = (testResult: LibraryTestResult) => ({
    type: ActionTypes.StepperExecutionError,
    payload: {
        testResult,
    },
});

export const stepperExecutionEnd = () => ({
    type: ActionTypes.StepperExecutionEnd,
});

export const stepperExecutionEndConditionReached = createAction('stepper/endConditionReached', (executionResult: unknown) => ({
    payload: {
        executionResult,
    },
}));

export const stepperDisplayError = (error: string|LibraryTestResult) => ({
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
