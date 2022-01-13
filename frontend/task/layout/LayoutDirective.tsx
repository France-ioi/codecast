import React from "react";
import {connect} from "react-redux";
import {AppStore, CodecastPlatform} from "../../store";
import {initialStepperStateControls, StepperState} from "../../stepper";
import {DirectivePanel} from "../../stepper/views/DirectivePanel";
import {getCurrentStepperState} from "../../stepper/selectors";
import {ActionTypes} from "../../stepper/actionTypes";
import {directiveDimensionsDict} from "../../stepper/views";

interface LayoutDirectiveStateToProps {
    stepperState: any,
    zoomLevel: number,
}

function mapStateToProps(state: AppStore): LayoutDirectiveStateToProps {
    const stepperState = getCurrentStepperState(state);
    const zoomLevel = state.layout.zoomLevel;

    return {
        stepperState,
        zoomLevel,
    };
}

interface LayoutDirectiveProps extends LayoutDirectiveStateToProps {
    dispatch: Function,
    currentStepperState: StepperState,
    directive: any,
}

export class _LayoutDirective extends React.PureComponent<LayoutDirectiveProps> {
    render() {
        const {stepperState, zoomLevel} = this.props;
        if (!stepperState || !stepperState.analysis) {
            return false;
        }

        const {analysis, programState, lastProgramState, controls, directives, platform} = stepperState;
        const {functionCallStackMap} = directives;
        const context = {analysis, programState, lastProgramState};
        const {key} = this.props.directive;
        const dirControls = (controls.hasOwnProperty(key)) ? controls[key] : initialStepperStateControls;
        let functionCallStack = null;
        if (platform === CodecastPlatform.Unix || platform === CodecastPlatform.Arduino) {
            functionCallStack = functionCallStackMap[key];
        }

        return (
            <DirectivePanel
                key={key}
                directive={this.props.directive}
                controls={dirControls}
                scale={zoomLevel}
                context={context}
                functionCallStack={functionCallStack}
                platform={platform}
                onChange={this.onControlsChange}
            />
        );
    }

    onControlsChange = (directive, update) => {
        const {key} = directive;
        this.props.dispatch({type: ActionTypes.StepperViewControlsChanged, key, update});
    };

    static computeDimensions(width: number, height: number, props: any) {
        const {kind} = props.directive;

        if (kind in directiveDimensionsDict) {
            return directiveDimensionsDict[kind](width, height, props.directive.byName);
        } else {
            return {
                taken: {width, height},
                minimum: {width, height},
            }
        }
    }
}

export const LayoutDirective = connect(mapStateToProps)(_LayoutDirective);
