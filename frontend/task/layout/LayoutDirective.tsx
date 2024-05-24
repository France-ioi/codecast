import React from "react";
import {initialStepperStateControls} from "../../stepper";
import {DirectivePanel} from "../../stepper/views/DirectivePanel";
import {getCurrentStepperState} from "../../stepper/selectors";
import {ActionTypes} from "../../stepper/actionTypes";
import {directiveDimensionsDict} from "../../stepper/views";
import {LayoutElementMetadata} from "./layout";
import {useAppSelector} from "../../hooks";
import {useDispatch} from "react-redux";
import {CodecastAnalysisSnapshot} from "../../stepper/analysis/analysis";
import log from 'loglevel';

import {CodecastPlatform} from '../../stepper/codecast_platform';
import AbstractRunner from '../../stepper/abstract_runner';
import {Codecast} from '../../app_types';
import AbstractVariableFetcher from '../../stepper/analysis/abstract_variable_fetcher';

interface LayoutDirectiveProps {
    directive: any,
    metadata: LayoutElementMetadata,
}

export interface LayoutDirectiveContext {
    analysis: CodecastAnalysisSnapshot,
    programState: any,
    lastProgramState: any,
    variableFetcher: AbstractVariableFetcher,
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

    const {codecastAnalysis, programState, lastProgramState, controls, platform} = stepperState;

    const variableFetcher = Codecast.runner.getVariableFetcher();
    const context: LayoutDirectiveContext = {
        analysis: codecastAnalysis,
        programState,
        lastProgramState,
        variableFetcher,
    };
    const {key} = props.directive;
    const dirControls = (controls.hasOwnProperty(key)) ? controls[key] : initialStepperStateControls;

    log.getLogger('layout').debug('layout directive context', context, props.directive);

    return (
        <DirectivePanel
            key={key}
            directive={props.directive}
            controls={dirControls}
            scale={zoomLevel}
            context={context}
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
