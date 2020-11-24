export enum ActionTypes {
    EditorPrepare = 'Editor.Prepare',
    EditorControlsChanged = 'Editor.Controls.Changed',
    EditorAudioLoadProgress = 'Editor.Audio.Load.Progress',
    EditorAudioLoaded = 'Editor.Audio.Loaded',
    EditorPlayerReady = 'Editor.Player.Ready',
    SetupScreenTabChanged = 'Setup.Screen.Tab.Changed',

    EditorPropertyChanged = 'Editor.Property.Changed',
    EditorSaveAudio = 'Editor.Save.Audio',
    EditorSave = 'Editor.Save',
    EditorSaveFailed = 'Editor.Save.Failed',
    EditorSaveSucceeded = 'Editor.Save.Succeeded',

    EditorTrimEnter = 'Editor.Trim.Enter',
    EditorTrimReturn = 'Editor.Trim.Return',
    EditorTrimSave = 'Editor.Trim.Save',
    EditorTrimIntervalsChanged = 'Editor.Trim.Intervals.Changed',
    EditorTrimMarkerAdded = 'Editor.Trim.MarkerAdded',
    EditorTrimMarkerRemoved = 'Editor.Trim.MarkerRemoved',
    EditorTrimIntervalChanged = 'Editor.Trim.Interval.Changed',
    EditorTrimSavingStep = 'Editor.Trim.Saving.Step',
    EditorTrimSavingDone = 'Editor.Trim.Saving.Done',
}
