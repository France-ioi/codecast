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
    EditorSaveClear = 'Editor.Save.Clear',
    EditorSaveFailed = 'Editor.Save.Failed',
    EditorSaveSucceeded = 'Editor.Save.Succeeded',
    EditorSavingStep = 'Editor.Saving.Step',

    EditorTrimEnter = 'Editor.Trim.Enter',
    EditorTrimReturn = 'Editor.Trim.Return',
    EditorTrimSave = 'Editor.Trim.Save',
    EditorTrimMarkerAdded = 'Editor.Trim.MarkerAdded',
    EditorTrimMarkerRemoved = 'Editor.Trim.MarkerRemoved',
    EditorTrimIntervalChanged = 'Editor.Trim.Interval.Changed',
}
