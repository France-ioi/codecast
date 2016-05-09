
export default function (m) {

  // Sent by a saga when the recorder has initialized and switches
  // to the record screen.
  m.action('switchToRecordScreen', 'Recorder.Switch');

  // Sent by the user to actually start recording.
  m.action('recorderStart', 'Recorder.Start');

  // Sent by the user to pause recording.
  m.action('recorderPause', 'Recorder.Pause');

  // Sent by the user to stop and finalize recording.
  m.action('recorderStop', 'Recorder.Stop');

  // Sent by the user, while recording is paused, to remove the last recorded segment from the recording.
  m.action('recorderBack', 'Recorder.Back');

  // Sent by a saga in reaction to recorderPrepare, when preparation for recording starts.
  m.action('recorderPreparing', 'Recorder.Preparing');

  // Sent by a saga when ready to record.
  m.action('recorderReady', 'Recorder.Ready');

  // Sent to acknowledge a recorder Start action.
  m.action('recorderStarting', 'Recorder.Starting');

  // Sent when recording effectively starts.
  m.action('recorderStarted', 'Recorder.Started');

  // Sent when the recorder failed to start (probably because the audio device is busy).
  m.action('recorderStartFailed', 'Recorder.Start.Failed');

  // Sent to acknowledge a recorder Stop action.
  m.action('recorderStopping', 'Recorder.Stopping');

  // Sent has stopped and the recorder is ready to start a new recording.
  m.action('recorderStopped', 'Recorder.Stopped');

  // Sent every second while recording.
  m.action('recorderTick', 'Recorder.Tick');

  // Add an event to the current recording.
  m.action('recorderAddEvent', 'Recorder.AddEvent');

};
