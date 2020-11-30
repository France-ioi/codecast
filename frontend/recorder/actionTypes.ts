export enum ActionTypes {
    VumeterMounted = 'Vumeter.Mounted',
    
    SaveScreenEncodingStart = 'Save.Screen.Encoding.Start',
    SaveScreenEncodingProgress = 'Save.Screen.Encoding.Progress',
    SaveScreenEncodingDone = 'Save.Screen.Encoding.Done',
    SaveScreenUpload = 'Save.Screen.Upload',
    SaveScreenPreparing = 'Save.Screen.Preparing',
    SaveScreenEventsUploading = 'Save.Screen.Events.Uploading',
    SaveScreenEventsUploaded = 'Save.Screen.Events.Uploaded',
    SaveScreenAudioUploading = 'Save.Screen.Audio.Uploading',
    SaveScreenAudioUploaded = 'Save.Screen.Audio.Uploaded',
    SaveScreenUploadSucceeded = 'Save.Screen.Upload.Succeeded',
    SaveScreenUploadFailed = 'Save.Screen.Upload.Failed',

    MemoryUsageChanged = 'Memory.Usage.Changed',

    RecorderPrepare = 'Recorder.Prepare',
    SwitchToRecordScreen = 'Recorder.Switch',
    RecorderStart = 'Recorder.Start',
    RecorderPause = 'Recorder.Pause',
    RecorderStop = 'Recorder.Stop',
    RecorderBack = 'Recorder.Back',
    RecorderPreparing = 'Recorder.Preparing',
    RecorderReady = 'Recorder.Ready',
    RecorderStarting = 'Recorder.Starting',
    RecorderStarted = 'Recorder.Started',
    RecorderStartFailed = 'Recorder.Start.Failed',
    RecorderStopping = 'Recorder.Stopping',
    RecorderStopped = 'Recorder.Stopped',
    RecorderPausing = 'Recorder.Pausing',
    RecorderPaused = 'Recorder.Paused',
    RecorderTick = 'Recorder.Tick',

    RecorderResume = 'Recorder.Resume',
    RecorderResuming = 'Recorder.Resuming',
    RecorderResumed = 'Recorder.Resumed',

    RecorderAddEvent = 'Recorder.Add.Event',
    RecorderTruncate = 'Recorder.Truncate',

    AudioContextSuspended = 'Audio.Context.Suspended'
}
