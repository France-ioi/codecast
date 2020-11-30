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

    SystemSwitchToScreen = 'System.Switch.To.Screen',

    PlatformChanged = 'Platform.Changed',

    WindowResized = 'Window.Resized'
}
