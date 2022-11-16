import React, {ReactElement, useState} from "react";
import {Button, Intent, Slider} from "@blueprintjs/core";
import {IconName} from "@blueprintjs/icons";
import {ActionTypes} from "../actionTypes";
import {useDispatch} from "react-redux";
import {StepperControlsType, stepperMaxSpeed, StepperStepMode} from "../index";
import {formatTime} from "../../common/utils";
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

    const onStepRun = () => {
        if (stepperControlsState.controlsType !== StepperControlsType.Normal) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        }

        dispatch({type: ActionTypes.StepperStepFromControls, payload: {mode: StepperStepMode.Run, useSpeed: true}})
    };
    const onStepExpr = () => dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Expr, useSpeed: true}});
    const onStepOut = () => dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Out, useSpeed: true}});
    const onStepOver = () => dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Over, useSpeed: true}});
    const onToggleSpeed = () => {
        setSpeedDisplayedState(!speedDisplayedState);
    }
    const onInterrupt = () => dispatch({type: ActionTypes.StepperInterrupting, payload: {}});
    const onStop = () => {
        dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        dispatch({type: ActionTypes.StepperExit, payload: {fromControls: true}});
    };

    const onUndo = () => dispatch({type: ActionTypes.StepperUndo, payload: {}});
    const onRedo = () => dispatch({type: ActionTypes.StepperRedo, payload: {}});
    const onCompile = () => dispatch({type: ActionTypes.Compile, payload: {}});
    const onStepByStep = () => {
        if (stepperControlsState.controlsType !== StepperControlsType.StepByStep) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.StepByStep}});
        }

        dispatch({type: ActionTypes.StepperStepFromControls, payload: {mode: StepperStepMode.Into, useSpeed: true}})
    };
    const onGoToEnd = () => {
        if (stepperControlsState.controlsType !== StepperControlsType.Normal) {
            dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        }

        dispatch({type: ActionTypes.StepperStepFromControls, payload: {mode: StepperStepMode.Run}})
    };
    const onChangeSpeed = (speed) => dispatch({type: ActionTypes.StepperSpeedChanged, payload: {speed}});

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
                        {_button('expr', onStepExpr, getMessage('CONTROL_EXPR'), <svg xmlns="http://www.w3.org/2000/svg" viewBox="100 -250 900 900" className="svg-inline--fa fa-w-16" style={{transform: 'scaleY(-1)'}}>
                            <path fill="currentColor" d="M693 0h451v-138h-451v138zM0 0h451v-138h-451v138zM584 450c-21.2861 5.40625 -42.8008 7.84375 -64.1201 7.84375c-104.873 0 -205.003 -58.9941 -249.88 -113.844c-52 -62 -92 -146 -130 -246l-140 78.5c42 134 123 240.5 195 306.5c57 54 183 136 330 136 c162 0 280.5 -73.5 344.5 -154.5c48 -54 86.5 -112.5 132.5 -226.5l146 98l-132 -321l-323 178h177c-33 75 -140.656 220.088 -286 257z"/>
                        </svg>, null, 'is-small')}
                        {_button('out', onStepOut, getMessage('CONTROL_OUT'), <svg xmlns="http://www.w3.org/2000/svg" viewBox="-150 -200 900 900" className="svg-inline--fa fa-w-16" style={{transform: 'scaleY(-1)'}}>
                            <path fill="currentColor" d="M124 0c0 75 62 136 137 136s136 -61 136 -136s-61 -138 -136 -138s-137 63 -137 138zM158 205v341h-204l308 273l306 -273l-208 -1v-340h-202z"/>
                        </svg>, null, 'is-small')}
                        {_button('over', onStepOver, getMessage('CONTROL_OVER'), <svg xmlns="http://www.w3.org/2000/svg" viewBox="100 -200 900 900" className="svg-inline--fa fa-w-16" style={{transform: 'scaleY(-1)'}}>
                            <path fill="currentColor" d="M369 147c0 75 62 136 137 136s136 -61 136 -136s-61 -138 -136 -138s-137 63 -137 138zM584 450c-21.2861 5.40625 -42.8008 7.84375 -64.1201 7.84375c-104.873 0 -205.003 -58.9941 -249.88 -113.844c-52 -62 -92 -146 -130 -246l-140 78.5c42 134 123 240.5 195 306.5 c57 54 183 136 330 136c162 0 280.5 -73.5 344.5 -154.5c48 -54 86.5 -112.5 132.5 -226.5l146 98l-132 -321l-323 178h177c-33 75 -140.656 220.088 -286 257z"/>
                        </svg>
                        , null, 'is-small')}
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
