import React from "react";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {getPlayerState} from "../../player/selectors";
import {createLayout, LayoutProps} from "./layout";
import {StepperStatus} from "../../stepper";
import {ActionTypes} from "./actionTypes";

interface LayoutLoaderStateToProps extends LayoutProps {
    advisedVisualization: string,
}

function mapStateToProps(state: AppStore): LayoutLoaderStateToProps {
    const getMessage = state.getMessage;
    const fullScreenActive = state.fullscreen.active;
    const currentStepperState = state.stepper.currentStepperState;
    const readOnly = false;
    const {platform} = state.options;
    const diagnostics = state.compile.diagnosticsHtml;
    const error = currentStepperState && currentStepperState.error;
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

    const advisedVisualization = !state.stepper || state.stepper.status === StepperStatus.Clear ? 'instructions' : 'variables';

    return {
        readOnly, error, getMessage, sourceRowHeight, sourceMode,
        currentStepperState, fullScreenActive, diagnostics, preventInput, advisedVisualization,
    };
}

interface LayoutLoaderDispatchToProps {
    dispatch: Function
}

interface LayoutLoaderProps extends LayoutLoaderStateToProps, LayoutLoaderDispatchToProps {
}

class _LayoutLoader extends React.PureComponent<LayoutLoaderProps> {
    componentDidUpdate(prevProps) {
        if (prevProps.advisedVisualization !== this.props.advisedVisualization && this.props.advisedVisualization) {
            this.props.dispatch({
                type: ActionTypes.LayoutVisualizationSelected,
                payload: {visualization: this.props.advisedVisualization}
            });
        }
    }

    render() {
        return createLayout(this.props);
    }
}

export const LayoutLoader = connect(mapStateToProps)(_LayoutLoader);
