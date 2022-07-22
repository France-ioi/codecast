import React, {ReactElement, useState} from "react";
import {Button, Intent, Slider, Spinner} from "@blueprintjs/core";
import {IconName} from "@blueprintjs/icons";
import {ActionTypes} from "../actionTypes";
import {useDispatch} from "react-redux";
import {StepperControlsType, stepperMaxSpeed, StepperStepMode} from "../index";
import {formatTime} from "../../common/utils";
import {CompileStatus} from "../compile";
import {LayoutType} from "../../task/layout/layout";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faFastForward,
    faPause,
    faPlay,
    faRunning,
    faShoePrints,
    faSpinner,
    faStop,
    faTachometerAlt,
    faWalking,
} from '@fortawesome/free-solid-svg-icons';
import {getMessage} from "../../lang";
import {getStepperControlsSelector} from "../selectors";
import {useAppSelector} from "../../hooks";

interface StepperControlsProps {
    enabled: boolean,
}

export function StepperControls(props: StepperControlsProps) {
    const [speedDisplayedState, setSpeedDisplayedState] = useState(false);
    const stepperControlsState = useAppSelector(state => {
        return getStepperControlsSelector(state, props);
    });
    const {showControls, showCompile, compileOrExecuteMessage, speed, controlsType, canInterrupt, showStepper, layoutType} = stepperControlsState;
    const dispatch = useDispatch();

    const _button = (key: string, onClick: any, title: string, icon: IconName|JSX.Element, text?: string, classNames?: string): ReactElement => {
        const {controls} = stepperControlsState;

        let disabled = false;
        const style: React.CSSProperties = {};

        let intent: Intent = Intent.NONE;
        if (key === 'compile') {
            intent = Intent.PRIMARY;
        }

        switch (key) {
            case 'interrupt':
                disabled = !stepperControlsState.canInterrupt;
                break;
            case 'restart':
                disabled = !stepperControlsState.canRestart;
                break;
            case 'undo':
                disabled = !stepperControlsState.canUndo;
                break;
            case 'redo':
                disabled = !stepperControlsState.canRedo;
                break;
            case 'run':
                disabled = !stepperControlsState.canStep;
                break;
            case 'into':
                disabled = !stepperControlsState.canStep;
                break;
            case 'over':
                disabled = !stepperControlsState.canStepOver;
                break;
            case 'expr':
                disabled = !stepperControlsState.canStep;
                if (!stepperControlsState.showExpr) {
                    style.display = 'none';
                }
                break;
            case 'out':
                disabled = !(stepperControlsState.canStep && stepperControlsState.canStepOut);
                break;
            case 'edit':
                disabled = !stepperControlsState.canExit;
                break;
            case 'compile':
                disabled = !stepperControlsState.canCompile;
                break;
            case 'gotoend':
                disabled = !stepperControlsState.canStep || stepperControlsState.isFinished;
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
            if (mod) {
                intent = mod === '+' ? Intent.PRIMARY : Intent.NONE;
            }
        }

        if (!title) {
            title = undefined;
        }

        return (
            <div className="control-button-container" style={style}>
                <Button
                    className={classNames}
                    onClick={onClick}
                    disabled={disabled}
                    intent={intent}
                    title={title}
                    icon={icon}
                    text={text}
                />
            </div>
        );
    };

    const onStepRun = async () => {
        if (!await compileIfNecessary()) {
            return;
        }

        if (stepperControlsState.controlsType !== StepperControlsType.Normal) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        }

        dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Run, useSpeed: true}});
    };
    const onStepExpr = () => dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Expr, useSpeed: true}});
    const onStepInto = () => dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Into, useSpeed: true}});
    const onStepOut = () => dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Out, useSpeed: true}});
    const onStepOver = () => dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Over, useSpeed: true}});
    const onToggleSpeed = () => {
        setSpeedDisplayedState(!speedDisplayedState);
    }
    const onInterrupt = () => dispatch({type: ActionTypes.StepperInterrupting, payload: {}});
    const onRestart = () => dispatch({type: ActionTypes.StepperRestart, payload: {}});
    const onStop = async () => {
        dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        dispatch({type: ActionTypes.StepperExit, payload: {fromControls: true}});
    };

    const onEdit = () => dispatch({type: ActionTypes.StepperExit, payload: {}});
    const onUndo = () => dispatch({type: ActionTypes.StepperUndo, payload: {}});
    const onRedo = () => dispatch({type: ActionTypes.StepperRedo, payload: {}});
    const onCompile = () => dispatch({type: ActionTypes.Compile, payload: {}});
    const onStepByStep = async () => {
        if (!await compileIfNecessary()) {
            return;
        }

        if (stepperControlsState.controlsType !== StepperControlsType.StepByStep) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.StepByStep}});
        }
        if (stepperControlsState.canStep) {
            dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Into, useSpeed: true}});
        } else {
            dispatch({type: ActionTypes.StepperInterrupting, payload: {}});
        }
    };
    const onGoToEnd = async () => {
        if (!await compileIfNecessary()) {
            return;
        }
        if (stepperControlsState.controlsType !== StepperControlsType.Normal) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        }
        if (!stepperControlsState.canStep) {
            dispatch({type: ActionTypes.StepperInterrupting, payload: {}});
        }
        //TODO: await interruption
        setTimeout(() => {
            dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Run}});
        }, 300);
    };
    const onChangeSpeed = (speed) => dispatch({type: ActionTypes.StepperSpeedChanged, payload: {speed}});

    const compileIfNecessary = () => {
        return new Promise<boolean>((resolve) => {
            if (stepperControlsState.showCompile) {
                dispatch({
                    type: ActionTypes.StepperCompileFromControls,
                    payload: {
                        callback: resolve,
                    },
                });
            } else {
                resolve(true);
            }
        });
    };

    if (!showStepper) {
        return null;
    }

    const speedDisplayed = LayoutType.MobileVertical !== layoutType || speedDisplayedState;

    return (!showControls && showCompile ?
        <div className="controls-compile">
            {_button('compile', onCompile, null, null, compileOrExecuteMessage)}
        </div>
        :
        (<div className={`controls controls-stepper ${controlsType}`}>
            {showControls && <React.Fragment>
                {(LayoutType.MobileVertical !== layoutType || !speedDisplayedState) &&
                    <React.Fragment>
                        {_button('restart', onStop, getMessage('CONTROL_RESTART'), <FontAwesomeIcon icon={faStop}/>, null, 'is-small')}
                        {!canInterrupt && _button('run', onStepRun, getMessage('CONTROL_RUN'), stepperControlsState.runningBackground ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : <FontAwesomeIcon icon={faPlay}/>, null, 'is-big')}
                        {canInterrupt && _button('interrupt', onInterrupt, getMessage('CONTROL_INTERRUPT'), <FontAwesomeIcon icon={faPause}/>, null, 'is-big')}
                        {_button('into', onStepByStep, getMessage('CONTROL_STEP_BY_STEP'), <FontAwesomeIcon icon={faShoePrints}/>, null, 'is-big')}
                    </React.Fragment>
                }
                {controlsType === StepperControlsType.Normal && LayoutType.MobileVertical === layoutType &&
                    _button('speed', onToggleSpeed, getMessage('CONTROL_SPEED'), <FontAwesomeIcon icon={faTachometerAlt}/>, null, 'is-big')
                }
                {speedDisplayed && controlsType === StepperControlsType.Normal && <div className="speed-slider is-extended">
                    <div className="player-slider-container">
                        <FontAwesomeIcon icon={faWalking} className="extremity extremity-left"/>
                        <Slider
                            value={speed}
                            onChange={onChangeSpeed}
                            min={0}
                            max={stepperMaxSpeed}
                            stepSize={1}
                            labelStepSize={stepperMaxSpeed}
                            labelRenderer={formatTime}
                        />
                        <FontAwesomeIcon icon={faRunning} className="extremity extremity-right"/>
                    </div>
                </div>}
                {controlsType === StepperControlsType.StepByStep &&
                    <React.Fragment>
                        {_button('expr', onStepExpr, getMessage('CONTROL_EXPR'), <i
                            className="control-icon fi fi-step-expr"/>, null, 'is-small')}
                        {_button('out', onStepOut, getMessage('CONTROL_OUT'), <i
                            className="control-icon fi fi-step-out"/>, null, 'is-small')}
                        {_button('over', onStepOver, getMessage('CONTROL_OVER'), <i
                            className="control-icon fi fi-step-over"/>, null, 'is-small')}
                        {_button('undo', onUndo, getMessage('CONTROL_UNDO'), 'undo', null, 'is-small')}
                        {_button('redo', onRedo, getMessage('CONTROL_REDO'), 'redo', null, 'is-small')}
                    </React.Fragment>
                }
                {(LayoutType.MobileVertical !== layoutType || (!speedDisplayedState && controlsType === StepperControlsType.Normal)) &&
                    <React.Fragment>
                        {_button('gotoend', onGoToEnd, getMessage('CONTROL_GO_TO_END'), <FontAwesomeIcon icon={faFastForward}/>, null, 'is-small')
                        }
                    </React.Fragment>
                }
            </React.Fragment>}
        </div>)
    );
}
