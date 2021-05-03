import React from "react";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {createLayout, LayoutType} from "./layout";
import {StepperStatus} from "../../stepper";
import {ActionTypes} from "./actionTypes";
import {withResizeDetector} from 'react-resize-detector/build/withPolyfill';
import {Directive} from "../../stepper/python/directives";

interface LayoutLoaderStateToProps {
    advisedVisualization: string,
    orderedDirectives: readonly Directive[],
    fullScreenActive: boolean,
    getMessage: Function,
    preferredVisualizations: string[],
    layoutType: LayoutType,
}

function mapStateToProps(state: AppStore): LayoutLoaderStateToProps {
    const getMessage = state.getMessage;
    const fullScreenActive = state.fullscreen.active;
    const currentStepperState = state.stepper.currentStepperState;
    const orderedDirectives = currentStepperState ? currentStepperState.directives.ordered : [];
    const advisedVisualization = !state.stepper || state.stepper.status === StepperStatus.Clear ? 'instructions' : 'variables';
    const preferredVisualizations = state.layout.preferredVisualizations;
    const layoutType = state.layout.type;

    return {
        getMessage, orderedDirectives, fullScreenActive, advisedVisualization, preferredVisualizations, layoutType,
    };
}

interface LayoutLoaderDispatchToProps {
    dispatch: Function
}

interface LayoutLoaderProps extends LayoutLoaderStateToProps, LayoutLoaderDispatchToProps {
    width: number,
    height: number,
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

// We need to manually check if directives are the same because the current stepper state is rewritten
// at each stepper execution step
function areEqual(prevProps, nextProps) {
    if (Object.keys(prevProps).length !== Object.keys(nextProps).length) {
        return false;
    }

    for (let key of Object.keys(prevProps)) {
        if ('orderedDirectives' === key) {
            if (JSON.stringify(prevProps.orderedDirectives) !== JSON.stringify(nextProps.orderedDirectives)) {
                return false;
            }
        } else {
            if (prevProps[key] !== nextProps[key]) {
                return false;
            }
        }
    }

    return true;
}

export const LayoutLoader = connect(mapStateToProps)(withResizeDetector(React.memo(_LayoutLoader, areEqual)));
