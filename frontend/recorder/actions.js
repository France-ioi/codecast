
export default function (bundle) {

  // Switch to the specified screen.
  bundle.defineAction('switchToScreen', 'System.SwitchToScreen');

  // Sent when the application starts to prepare the recorder's resources.
  bundle.defineAction('recorderPrepare', 'Recorder.Prepare');

  // Sent by a saga when the recorder has initialized and switches
  // to the record screen.
  bundle.defineAction('switchToRecordScreen', 'Recorder.Switch');

  // Sent by the user to actually start recording.
  bundle.defineAction('recorderStart', 'Recorder.Start');

  // Sent by the user to pause recording.
  bundle.defineAction('recorderPause', 'Recorder.Pause');

  // Sent by the user to stop and finalize recording.
  bundle.defineAction('recorderStop', 'Recorder.Stop');

  // Sent by the user, while recording is paused, to remove the last recorded segment from the recording.
  bundle.defineAction('recorderBack', 'Recorder.Back');

  // Sent by a saga in reaction to recorderPrepare, when preparation for recording starts.
  bundle.defineAction('recorderPreparing', 'Recorder.Preparing');

  // Sent by a saga when ready to record.
  bundle.defineAction('recorderReady', 'Recorder.Ready');

  // Sent to acknowledge a recorder Start action.
  bundle.defineAction('recorderStarting', 'Recorder.Starting');

  // Sent when recording effectively starts.
  bundle.defineAction('recorderStarted', 'Recorder.Started');

  // Sent when the recorder failed to start (probably because the audio device is busy).
  bundle.defineAction('recorderStartFailed', 'Recorder.Start.Failed');

  // Sent to acknowledge a recorder Stop action.
  bundle.defineAction('recorderStopping', 'Recorder.Stopping');

  // Sent has stopped and the recorder is ready to start a new recording.
  bundle.defineAction('recorderStopped', 'Recorder.Stopped');

  // Sent every second while recording.
  bundle.defineAction('recorderTick', 'Recorder.Tick');

};
