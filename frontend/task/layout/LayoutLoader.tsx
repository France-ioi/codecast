import React from "react";
import {connect} from "react-redux";
import {AppStore, CodecastOptions} from "../../store";
import {getPlayerState} from "../../player/selectors";
import {StepperStatus} from "../../stepper";
import {PlayerError} from "../../player";
import {createLayout} from "./layout";

interface LayoutLoaderStateToProps {
    readOnly: boolean,
    sourceMode: string,
    sourceRowHeight: number,
    error: string,
    geometry: any,
    panes: any,
    showStack: boolean,
    arduinoEnabled: boolean,
    showViews: boolean,
    showIO: boolean,
    windowHeight: any,
    currentStepperState: any,
    preventInput: any,
    fullScreenActive: boolean,
    diagnostics: any,
    recordingEnabled: boolean,
    playerEnabled: boolean,
    isPlayerReady: boolean,
    playerProgress: number,
    playerError: PlayerError,
    getMessage: Function,
    options: CodecastOptions,
    taskSuccess: boolean,
    taskSuccessMessage: string,
    advisedVisualization: string,
}

function mapStateToProps(state: AppStore): LayoutLoaderStateToProps {
    const getMessage = state.getMessage;
    const geometry = state.mainViewGeometry;
    const panes = state.panes;
    const fullScreenActive = state.fullscreen.active;
    const currentStepperState = state.stepper.currentStepperState;
    const readOnly = false;
    const {showIO, showViews, showStack, platform} = state.options;
    const arduinoEnabled = platform === 'arduino';
    const diagnostics = state.compile.diagnosticsHtml;
    const error = currentStepperState && currentStepperState.error;
    const recordingEnabled = state.task.recordingEnabled;
    const playerEnabled = !!state.options.baseDataUrl;
    const taskSuccess = state.task.success;
    const taskSuccessMessage = state.task.successMessage;

    /* TODO: make number of visible rows in source editor configurable. */
    const sourceRowHeight = Math.ceil(16 * 25); // 12*25 for /next

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

    const player = getPlayerState(state);
    const preventInput = player.isPlaying;
    const isPlayerReady = player.isReady;
    const playerProgress = player.progress;
    const playerError = player.error;
    const windowHeight = state.windowHeight;
    const options = state.options;

    const advisedVisualization = !state.stepper || state.stepper.status === StepperStatus.Clear ? 'instructions' : 'variables';

    return {
        readOnly, error, getMessage, geometry, panes, sourceRowHeight,
        sourceMode, showStack, arduinoEnabled, showViews, showIO, windowHeight,
        currentStepperState, fullScreenActive, diagnostics, recordingEnabled,
        preventInput, isPlayerReady, playerProgress, playerError, playerEnabled,
        options, taskSuccess, taskSuccessMessage, advisedVisualization,
    };
}

interface LayoutLoaderProps extends LayoutLoaderStateToProps {
}

class _LayoutLoader extends React.PureComponent<LayoutLoaderProps> {
    render() {
        return createLayout(this.props);
    }
}

export const LayoutLoader = connect(mapStateToProps)(_LayoutLoader);
