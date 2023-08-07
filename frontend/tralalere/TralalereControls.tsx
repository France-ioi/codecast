import React, {ReactElement} from "react";
import {IconName} from "@blueprintjs/icons";
import {ActionTypes} from "../stepper/actionTypes";
import {useDispatch} from "react-redux";
import {StepperControlsType, StepperStepMode} from "../stepper";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faVolumeUp,
    faVolumeMute,
    faStepBackward,
    faPause,
    faSpinner,
    faForward,
    faEject,
} from '@fortawesome/free-solid-svg-icons';
import {getMessage} from "../lang";
import {getStepperControlsSelector} from "../stepper/selectors";
import {useAppSelector} from "../hooks";
import {taskChangeSoundEnabled} from "../task/task_slice";
import {TralalereBlocksUsage} from "./TralalereBlocksUsage";

import {LayoutType} from '../task/layout/layout_types';

interface StepperControlsProps {
    enabled: boolean,
}

export function TralalereControls(props: StepperControlsProps) {
    const stepperControlsState = useAppSelector(state => {
        return getStepperControlsSelector({state, enabled: props.enabled});
    });
    const {showControls, showCompile, compileOrExecuteMessage, controlsType, canInterrupt, showStepper} = stepperControlsState;
    const layoutType = useAppSelector(state => state.layout.type);
    const isMobile = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);

    const dispatch = useDispatch();

    const _button = (key: string, onClick: any, title: string, icon: IconName|JSX.Element, text?: string, classNames?: string): ReactElement => {
        const {controls} = stepperControlsState;

        let disabled = false;
        const style: React.CSSProperties = {};

        switch (key) {
            case 'interrupt':
                disabled = !stepperControlsState.canInterrupt;
                break;
            case 'restart':
                disabled = !stepperControlsState.canRestart;
                break;
            case 'run':
                disabled = !stepperControlsState.canStep;
                break;
            case 'into':
                disabled = !stepperControlsState.canStep;
                break;
            case 'gotoend':
                disabled = stepperControlsState.isFinished;
                break;
        }

        if (controls) {
            const mod = controls[key];
            if (mod === '_') {
                return null;
            }
            if (mod === '-') {
                disabled = true;
            }
        }

        return (
            <div className="tralalere-control-button-container" style={style}>
                <button className="tralalere-button" onClick={onClick} disabled={disabled}>
                    {icon}
                </button>
            </div>
        );
    };

    const onStepRun = () => {
        if (stepperControlsState.controlsType !== StepperControlsType.Normal) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        }

        dispatch({type: ActionTypes.StepperStepFromControls, payload: {mode: StepperStepMode.Run, useSpeed: true}})
    };
    const onStop = () => {
        dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        dispatch({type: ActionTypes.StepperExit, payload: {}});
    };
    const onInterrupt = () => dispatch({type: ActionTypes.StepperInterrupting, payload: {}});
    const onCompile = () => dispatch({type: ActionTypes.Compile, payload: {}});
    const onGoToEnd = () => {
        if (stepperControlsState.controlsType !== StepperControlsType.Normal) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        }

        dispatch({type: ActionTypes.StepperStepFromControls, payload: {mode: StepperStepMode.Run}})
    };
    const onStepByStep = () => {
        if (stepperControlsState.controlsType !== StepperControlsType.StepByStep) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.StepByStep}});
        }

        dispatch({type: ActionTypes.StepperStepFromControls, payload: {mode: StepperStepMode.Into, useSpeed: true}})
    };

    const toggleSound = () => {
        dispatch(taskChangeSoundEnabled(!stepperControlsState.soundEnabled));
    };

    if (!showStepper) {
        return null;
    }

    return (!showControls && showCompile ?
        <div className="controls-compile">
            {_button('compile', onCompile, null, null, compileOrExecuteMessage)}
        </div>
        :
        (<div className="tralalere-controls-container"><div className={`controls controls-stepper controls-left ${controlsType}`}>
            {showControls && <React.Fragment>
                {_button('restart', onStop, getMessage('CONTROL_RESTART'), <FontAwesomeIcon icon={faStepBackward}/>, null, 'is-small')}
                {!canInterrupt && _button('run', onStepRun, getMessage('CONTROL_RUN'), stepperControlsState.runningBackground ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : <FontAwesomeIcon icon={faPlay}/>, null, 'is-big')}
                {canInterrupt && _button('interrupt', onInterrupt, getMessage('CONTROL_INTERRUPT'), <FontAwesomeIcon icon={faPause}/>, null, 'is-big')}
                {_button('into', onStepByStep, getMessage('CONTROL_STEP_BY_STEP'), <FontAwesomeIcon icon={faEject} rotation={90}/>, null, 'is-big')}
                {_button('gotoend', onGoToEnd, getMessage('CONTROL_GO_TO_END'), <FontAwesomeIcon icon={faForward}/>, null, 'is-big')}
            </React.Fragment>}
        </div><div className={`controls controls-stepper ${controlsType} controls-right`}>
            {!isMobile && <TralalereBlocksUsage/>}
            {showControls && <React.Fragment>
                {_button('sound', toggleSound, getMessage('CONTROL_SOUND'), <FontAwesomeIcon icon={stepperControlsState.soundEnabled ? faVolumeUp : faVolumeMute}/>, null, 'is-big')}
            </React.Fragment>}
        </div></div>)
    );
}
