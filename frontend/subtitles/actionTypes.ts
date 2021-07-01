export enum ActionTypes {
    SubtitlesEditingChanged = 'Subtitles.Editing.Changed',
    SubtitlesPaneEnabledChanged = 'Subtitles.Pane.Enabled.Changed',
    SubtitlesBandEnabledChanged = 'Subtitles.Band.Enabled.Changed',

    SubtitlesBandBeginMove = 'Subtitles.Band.BeginMove',
    SubtitlesBandEndMove = 'Subtitles.Band.EndMove',
    SubtitlesBandMoved = 'Subtitles.Band.Moved',

    SubtitlesSelected = 'Subtitles.Selected',
    SubtitlesOptionAdd = 'Subtitles.Option.Add',
    SubtitlesOptionRemove = 'Subtitles.Option.Remove',
    SubtitlesOptionSave = 'Subtitles.Option.Save',
    SubtitlesTextReverted = 'Subtitles.Text.Reverted',
    SubtitlesTextLoaded = 'Subtitles.Text.Load',
    SubtitlesTextChanged = 'Subtitles.Text.Changed',
    SubtitlesEditorEnter = 'Subtitles.Editor.Enter',
    SubtitlesEditorReturn = 'Subtitles.Editor.Return',
    SubtitlesItemChanged = 'Subtitles.Item.Changed',
    SubtitlesItemInserted = 'Subtitles.Item.Inserted',
    SubtitlesItemRemoved = 'Subtitles.Item.Removed',
    SubtitlesItemShifted = 'Subtitles.Item.Shifted',
    SubtitlesSave = 'Subtitles.Save',

    SubtitlesCleared = 'Subtitles.Cleared',
    SubtitlesLoadFromText = 'Subtitles.LoadFromText',
    SubtitlesLoadFromUrl = 'Subtitles.LoadFromUrl',
    SubtitlesLoadFromFile = 'Subtitles.LoadFromFile',
    SubtitlesReload = 'Subtitles.Reload',
    SubtitlesLoadStarted = 'Subtitles.LoadStarted',
    SubtitlesLoadSucceeded = 'Subtitles.LoadSucceeded',
    SubtitlesLoadFailed = 'Subtitles.LoadFailed',
    SubtitlesLoadForTrimSucceeded = 'Subtitles.Load.Trim.Succeeded',
    SubtitlesTrimDone = 'Subtitles.Trim.Done',

    SubtitlesFilterTextChanged = 'Subtitles.Filter.Text.Changed'
}
