export enum ActionTypes {
    Error = 'Error',
    ErrorClear = 'Error.Clear',

    FullscreenEnter = 'Fullscreen.Enter',
    FullscreenEnterSucceeded = 'Fullsreen.Enter.Succeeded',
    FullscreenEnterFailed = 'Fullscreen.Enter.Failed',
    FullscreenLeave = 'Fullscreen.Leave',
    FullscreenLeaveSucceeded = 'Fullscreen.Leave.Succeeded',
    FullscreenEnabled = 'Fullscreen.Enabled',

    LoginFeedback = 'Login.Feedback',
    LogoutFeedback = 'Logout.Feedback',

    AppSwitchToScreen = 'App.Switch.To.Screen',

    PlatformChanged = 'Platform.Changed',
    CanChangePlatformChanged = 'CanChangePlatform.Changed',

    TaskVariantChanged = 'TaskVariant.Changed',

    WindowResized = 'Window.Resized'
}
