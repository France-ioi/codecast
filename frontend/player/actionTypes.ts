export enum ActionTypes {
    PlayerClear = 'Player.Clear',
    PlayerPrepare = 'Player.Prepare',
    PlayerPreparing = 'Player.Preparing',
    PlayerPrepareProgress = 'Player.Prepare.Progress',
    PlayerPrepareFailure = 'Player.Prepare.Failure',
    PlayerReady = 'Player.Ready',

    PlayerStart = 'Player.Start',
    PlayerStarted = 'Player.Started',
    PlayerPause = 'Player.Pause',
    PlayerPaused = 'Player.Paused',
    PlayerSeek = 'Player.Seek',
    PlayerSeeked = 'Player.Seeked',

    PlayerTick = 'Player.Tick',

    PlayerVolumeChanged = 'Player.Volume.Changed',
    PlayerMutedChanged = 'Player.Muted.Changed',
    PlayerEditorMutedChanged = 'Player.Editor.Muted.Changed',

    PlayerReset = 'Player.Reset',
    PlayerResetFull = 'Player.ResetFull',
    PlayerApplyReplayEvent = 'Player.ApplyReplayEvent',
}
