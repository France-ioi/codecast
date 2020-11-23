import React from 'react';
import {StepperView} from "./StepperView";

function StepperViewSelector(state, props) {
    const {getPlayerState, getCompileDiagnostics, getCurrentStepperState} = state.get('scope');
    const {BufferEditor, StackView, ArduinoPanel, DirectivesPane, IOPane} = state.get('views');
    const {compileClearDiagnostics, stepperExit} = state.get('actionTypes');
    const getMessage = state.get('getMessage');
    const geometry = state.get('mainViewGeometry');
    const panes = state.get('panes');
    const diagnostics = getCompileDiagnostics(state);
    const stepperDisplay = getCurrentStepperState(state);
    const haveStepper = !!stepperDisplay;
    const error = haveStepper && stepperDisplay.error;
    const readOnly = haveStepper || props.preventInput;
    const {showIO, showViews, showStack, platform} = state.get('options');
    const arduinoEnabled = platform === 'arduino';
    /* TODO: make number of visible rows in source editor configurable. */
    const sourceRowHeight = `${Math.ceil(16 * 25)}px`; // 12*25 for /next

    let mode;
    switch (platform) {
        case 'arduino':
            mode = 'arduino';

            break;
        case 'python':
            mode = 'python';

            break;
        default:
            mode = 'c_cpp';

            break;
    }

    const sourceMode = mode;

    /* preventInput is set during playback to prevent the user from messing up
       the editors, and to disable automatic scrolling of the editor triggered
       by some actions (specifically, highlighting).
    */
    const player = getPlayerState(state);
    const preventInput = player.get('isPlaying');
    const windowHeight = state.get('windowHeight');
    return {
        diagnostics, haveStepper, readOnly, error, getMessage, geometry, panes, preventInput,
        compileClearDiagnostics, stepperExit,
        BufferEditor: BufferEditor, sourceRowHeight, sourceMode,
        StackView: showStack && StackView,
        ArduinoPanel: arduinoEnabled && ArduinoPanel,
        DirectivesPane: showViews && DirectivesPane,
        IOPane: showIO && IOPane,
        windowHeight,
        currentStepperState: stepperDisplay,
    };
}

export default function (bundle) {
    bundle.defineView('StepperView', StepperViewSelector, StepperView);
};
