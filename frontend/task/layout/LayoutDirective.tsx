import React from "react";
import {CodecastPlatform} from "../../store";
import {initialStepperStateControls} from "../../stepper";
import {DirectivePanel} from "../../stepper/views/DirectivePanel";
import {getCurrentStepperState} from "../../stepper/selectors";
import {ActionTypes} from "../../stepper/actionTypes";
import {directiveDimensionsDict} from "../../stepper/views";
import {LayoutElementMetadata} from "./layout";
import {useAppSelector} from "../../hooks";
import {useDispatch} from "react-redux";
import {CodecastAnalysisSnapshot} from "../../stepper/analysis";

interface LayoutDirectiveProps {
    directive: any,
    metadata: LayoutElementMetadata,
}

interface LayoutDirectiveContext {
    analysis: CodecastAnalysisSnapshot,
    programState: any,
    lastProgramState: any,
}

export function LayoutDirective(props: LayoutDirectiveProps) {
    const {metadata} = props;

    const stepperState = useAppSelector(state => getCurrentStepperState(state));
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);

    const dispatch = useDispatch();

    const onControlsChange = (directive, update) => {
        const {key} = directive;
        dispatch({type: ActionTypes.StepperViewControlsChanged, key, update});
    };

    if (!stepperState || !stepperState.analysis) {
        return false;
    }

    const {codecastAnalysis, programState, lastProgramState, controls, directives, platform} = stepperState;
    const {functionCallStackMap} = directives;
    const context: LayoutDirectiveContext = {analysis: codecastAnalysis, programState, lastProgramState};
    const {key} = props.directive;
    const dirControls = (controls.hasOwnProperty(key)) ? controls[key] : initialStepperStateControls;
    let functionCallStack = null;
    if (platform === CodecastPlatform.Unix || platform === CodecastPlatform.Arduino) {
        functionCallStack = functionCallStackMap[key];
    }

    console.log('layout directive context', context);

    return (
        <DirectivePanel
            key={key}
            directive={props.directive}
            controls={dirControls}
            scale={zoomLevel}
            context={context}
            functionCallStack={functionCallStack}
            platform={platform}
            allocatedWidth={metadata.allocatedWidth}
            allocatedHeight={metadata.allocatedHeight}
            onChange={onControlsChange}
        />
    );
}

LayoutDirective.computeDimensions = (width: number, height: number, props: any) => {
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
