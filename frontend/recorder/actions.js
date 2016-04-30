
export const switchToRecordScreen = 'Recorder.Switch';

export const recordScreenStepperRestart = {
  type: 'Recorder.Stepper.Restart',
  description: "Sent when the stepper's state is initialized."
};

export const recordScreenStepperStep = {
  type: 'Recorder.Stepper.Step',
  description: "Sent when the user requested stepping in a given mode."
};

export const recordScreenStepperStart = {
  type: 'Recorder.Stepper.Start',
  description: "Sent when the stepper starts evaluating a step."
};

export const recordScreenStepperProgress = {
  type: 'Recorder.Stepper.Progress',
  description: "Sent when the stepper has been evaluating for a while without completing a step."
};

export const recordScreenStepperIdle = {
  type: 'Recorder.Stepper.Idle',
  description: "Sent when the stepper has completed a step and is idle again."
};

export const recordScreenStepperExit = {
  type: 'Recorder.Stepper.Exit',
  description: "Sent when the user exits the stepper."
};

export const recorderStart = {
  type: 'Recorder.Start',
  description: "Sent by the user to actually start recording."
};

export const recorderPause = {
  type: 'Recorder.Pause',
  description: "Sent by the user to pause recording."
};

export const recorderStop = {
  type: 'Recorder.Stop',
  description: "Sent by the user to stop and finalize recording."
};

export const recorderBack = {
  type: 'Recorder.Back',
  description: "Sent by the user, while recording is paused, to remove the last recorded segment from the recording."
};

export const recorderPreparing = {
  type: 'Recorder.Preparing',
  description: "Sent by a saga in reaction to recorderPrepare, when preparation for recording starts."
};

export const recorderReady = {
  type: 'Recorder.Ready',
  description: "Sent by a saga when ready to record."
};

export const recorderStarting = {
  type: 'Recorder.Starting',
  description: "Sent to acknowledge a recorder Start action."
};

export const recorderStarted = {
  type: 'Recorder.Started',
  description: "Sent when recording effectively starts."
};

export const recorderStartFailed = {
  type: 'Recorder.Start.Failed',
  description: "Sent when the recorder failed to start (probably because the audio device is busy)."
};

export const recorderStopping = {
  type: 'Recorder.Stopping',
  description: "Sent to acknowledge a recorder Stop action."
};

export const recorderStopped = {
  type: 'Recorder.Stopped',
  description: "Sent has stopped and the recorder is ready to start a new recording."
};

export const recorderTick = {
  type: 'Recorder.Tick',
  description: "Sent every second while recording."
};

export const recorderAddEvent = {
  type: 'Recorder.AddEvent',
  description: "Add an event to the current recording."
};

export const translateSource = {
  type: 'Translator.Translate',
  description: "Requested translation of given {source}."
};

export const translateSourceSucceeded = {
  type: 'Translator.Translate.Succeeded',
  description: "Succeeded translating {source} to {syntaxTree}."
};

export const translateSourceFailed = {
  type: 'Translator.Translate.Failed',
  description: "Failed to translate {source} with {error}."
};
