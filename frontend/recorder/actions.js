
import {defineAction} from '../utils/linker';

export default function* () {

  // Sent when the application starts to prepare the recorder's resources.
  yield defineAction('recorderPrepare', 'Recorder.Prepare');

  // Sent by a saga when the recorder has initialized and switches
  // to the record screen.
  yield defineAction('switchToRecordScreen', 'Recorder.Switch');

  // Sent by the user to actually start recording.
  yield defineAction('recorderStart', 'Recorder.Start');

  // Sent by the user to pause recording.
  yield defineAction('recorderPause', 'Recorder.Pause');

  // Sent by the user to stop and finalize recording.
  yield defineAction('recorderStop', 'Recorder.Stop');

  // Sent by the user, while recording is paused, to remove the last recorded segment from the recording.
  yield defineAction('recorderBack', 'Recorder.Back');

  // Sent by a saga in reaction to recorderPrepare, when preparation for recording starts.
  yield defineAction('recorderPreparing', 'Recorder.Preparing');

  // Sent by a saga when ready to record.
  yield defineAction('recorderReady', 'Recorder.Ready');

  // Sent to acknowledge a recorder Start action.
  yield defineAction('recorderStarting', 'Recorder.Starting');

  // Sent when recording effectively starts.
  yield defineAction('recorderStarted', 'Recorder.Started');

  // Sent when the recorder failed to start (probably because the audio device is busy).
  yield defineAction('recorderStartFailed', 'Recorder.Start.Failed');

  // Sent to acknowledge a recorder Stop action.
  yield defineAction('recorderStopping', 'Recorder.Stopping');

  // Sent has stopped and the recorder is ready to start a new recording.
  yield defineAction('recorderStopped', 'Recorder.Stopped');

  // Sent every second while recording.
  yield defineAction('recorderTick', 'Recorder.Tick');

  // Add an event to the current recording.
  yield defineAction('recorderAddEvent', 'Recorder.AddEvent');

};
