import {createAction} from '@reduxjs/toolkit';
import {FileDescriptor} from '../task/libs/remote_lib_handler';

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
    SaveScreenAdditionalFilesUploading = 'Save.Screen.AdditionalFiles.Uploading',
    SaveScreenAdditionalFilesUploaded = 'Save.Screen.AdditionalFiles.Uploaded',
    SaveScreenUploadSucceeded = 'Save.Screen.Upload.Succeeded',
    SaveScreenUploadFailed = 'Save.Screen.Upload.Failed',

    MemoryUsageChanged = 'Memory.Usage.Changed',

    RecorderPrepare = 'Recorder.Prepare',
    RecorderStart = 'Recorder.Start',
    RecorderPause = 'Recorder.Pause',
    RecorderStop = 'Recorder.Stop',
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
    RecorderPopEvent = 'Recorder.Pop.Event',
    RecorderTruncate = 'Recorder.Truncate',

    AudioContextSuspended = 'Audio.Context.Suspended'
}
