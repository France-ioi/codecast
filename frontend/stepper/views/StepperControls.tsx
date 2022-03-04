import React, {ReactElement} from "react";
import {Button, ButtonGroup, Intent, Slider} from "@blueprintjs/core";
import {IconName} from "@blueprintjs/icons";
import {ActionTypes} from "../actionTypes";
import {connect} from "react-redux";
import {AppStore, CodecastPlatform} from "../../store";
import {getStepper, isStepperInterrupting} from "../selectors";
import * as C from '@france-ioi/persistent-c';
import {StepperControlsType, StepperStepMode} from "../index";
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
    faStop,
    faTachometerAlt,
    faWalking
} from '@fortawesome/free-solid-svg-icons';
import {getMessage} from "../../lang";
import {RECORDING_FORMAT_VERSION} from "../../version";

interface StepperControlsStateToProps {
    showStepper: boolean,
    showControls: boolean,
    showEdit: boolean,
    showCompile: boolean,
    compileOrExecuteMessage: string,
    controls: any,
    canInterrupt: boolean,
    canStep: boolean,
    canExit: boolean,
    canStepOut: boolean,
    canCompile: boolean,
    canRestart: boolean,
    canUndo: boolean,
    canRedo: boolean,
    showExpr: boolean,
    speed: number,
    isFinished: boolean,
    controlsType: StepperControlsType,
    compileStatus: CompileStatus,
    layoutType: LayoutType,
}

function mapStateToProps(state: AppStore, props): StepperControlsStateToProps {
    const {enabled} = props;
    const {controls, showStepper, platform} = state.options;
    const compileStatus = state.compile.status;
    const layoutType = state.layout.type;
    const inputNeeded = state.task.inputNeeded;

    let showCompile = false, showControls = true, showEdit = false;
    let canCompile = false, canExit = false, canRestart = false, canStep = false, canStepOut = false;
    let canInterrupt = false, canUndo = false, canRedo = false;
    let isFinished = false;
    let showExpr = platform !== CodecastPlatform.Python;
    let compileOrExecuteMessage = '';
    let speed = 0;
    let controlsType = StepperControlsType.Normal;

    if (state.player && state.player.data && state.player.data.version) {
        let versionComponents = state.player.data.version.split('.').map(Number);
        if (versionComponents[0] < 7) {
            // Backwards compatibility: for v7 don't show controls by default. Instead show a Compile button
            showControls = false;
        }
    }

    if (platform === CodecastPlatform.Python) {
        compileOrExecuteMessage = getMessage('EXECUTE');
    } else {
        compileOrExecuteMessage = getMessage('COMPILE');
    }

    const stepper = getStepper(state);
    if (stepper) {
        const status = stepper.status;
        speed = stepper.speed;
        controlsType = stepper.controls;
        canRestart = (enabled && 'clear' !== status) || !state.task.resetDone;

        if (status === 'clear') {
            showCompile = true;
            canCompile = enabled;
            canStep = true;
        } else if (status === 'idle') {
            const currentStepperState = stepper.currentStepperState;

            isFinished = !!currentStepperState.isFinished;
            showEdit = true;
            showControls = true;
            canExit = enabled;
            if (platform === CodecastPlatform.Python) {
                // We can step out only if we are in >= 2 levels of functions (the global state + in a function).
                canStepOut = (currentStepperState.suspensions && (currentStepperState.suspensions.length > 1));
                canStep = !currentStepperState.isFinished;
                canUndo = enabled && (stepper.undo.length > 0);
                canRedo = enabled && (stepper.redo.length > 0);
            } else {
                if (currentStepperState && currentStepperState.programState) {
                    const {control, scope} = currentStepperState.programState;

                    canStepOut = !!C.findClosestFunctionScope(scope);
                    canStep = control && !!control.node;
                    canRestart = enabled && (stepper.currentStepperState !== stepper.initialStepperState);
                    canUndo = enabled && (stepper.undo.length > 0);
                    canRedo = enabled && (stepper.redo.length > 0);
                }
            }
        } else if (status === 'starting') {
            showEdit = true;
            showControls = true;
        } else if (status === 'running') {
            showEdit = true;
            showControls = true;
            canInterrupt = enabled && !isStepperInterrupting(state) && !inputNeeded;
        }
    }

    return {
        showStepper, showControls, controls,
        showEdit, canExit,
        showExpr,
        showCompile, canCompile,
        canRestart, canStep, canStepOut, canInterrupt,
        canUndo, canRedo,
        compileOrExecuteMessage,
        isFinished,
        speed,
        controlsType,
        compileStatus,
        layoutType,
    };
}

interface StepperControlsDispatchToProps {
    dispatch: Function
}

interface StepperControlsState {
    speedDisplayed: boolean,
}

interface StepperControlsProps extends StepperControlsStateToProps, StepperControlsDispatchToProps {
    enabled?: boolean,
}

class _StepperControls extends React.PureComponent<StepperControlsProps, StepperControlsState> {
    state = {
        speedDisplayed: false,
    };

    render = () => {
        const {showStepper, layoutType} = this.props;
        if (!showStepper) {
            return null;
        }

        const {showControls, showCompile, compileOrExecuteMessage, speed, controlsType, canInterrupt} = this.props;
        const speedDisplayed = LayoutType.MobileVertical !== layoutType || this.state.speedDisplayed;

        return (!showControls && showCompile ?
            <div className="controls-compile">
                {this._button('compile', this.onCompile, null, null, compileOrExecuteMessage)}
            </div>
        :
            (<div className={`controls controls-stepper ${controlsType}`}>
                {showControls && <React.Fragment>
                    {(LayoutType.MobileVertical !== layoutType || !this.state.speedDisplayed) &&
                        <React.Fragment>
                              {this._button('restart', this.onStop, getMessage('CONTROL_RESTART'), <FontAwesomeIcon icon={faStop}/>, null, 'is-small')}
                              {!canInterrupt && this._button('run', this.onStepRun, getMessage('CONTROL_RUN'), <FontAwesomeIcon icon={faPlay}/>, null, 'is-big')}
                              {canInterrupt && this._button('interrupt', this.onInterrupt, getMessage('CONTROL_INTERRUPT'), <FontAwesomeIcon icon={faPause}/>, null, 'is-big')}
                              {this._button('into', this.onStepByStep, getMessage('CONTROL_STEP_BY_STEP'), <FontAwesomeIcon icon={faShoePrints}/>, null, 'is-big')}
                        </React.Fragment>
                    }
                    {controlsType === StepperControlsType.Normal && LayoutType.MobileVertical === layoutType &&
                        this._button('speed', this.onToggleSpeed, getMessage('CONTROL_SPEED'), <FontAwesomeIcon icon={faTachometerAlt}/>, null, 'is-big')
                    }
                    {speedDisplayed && controlsType === StepperControlsType.Normal && <div className="speed-slider is-extended">
                        <div className="player-slider-container">
                            <FontAwesomeIcon icon={faWalking} className="extremity extremity-left"/>
                            <Slider
                                value={speed}
                                onChange={this.onChangeSpeed}
                                min={0}
                                max={225}
                                stepSize={1}
                                labelStepSize={255}
                                labelRenderer={formatTime}
                            />
                            <FontAwesomeIcon icon={faRunning} className="extremity extremity-right"/>
                        </div>
                    </div>}
                    {controlsType === StepperControlsType.StepByStep &&
                        <React.Fragment>
                            {this._button('expr', this.onStepExpr, getMessage('CONTROL_EXPR'), <i
                                className="control-icon fi fi-step-expr"/>, null, 'is-small')}
                            {this._button('out', this.onStepOut, getMessage('CONTROL_OUT'), <i
                                className="control-icon fi fi-step-out"/>, null, 'is-small')}
                            {this._button('over', this.onStepOver, getMessage('CONTROL_OVER'), <i
                                className="control-icon fi fi-step-over"/>, null, 'is-small')}
                            {this._button('undo', this.onUndo, getMessage('CONTROL_UNDO'), 'undo', null, 'is-small')}
                            {this._button('redo', this.onRedo, getMessage('CONTROL_REDO'), 'redo', null, 'is-small')}
                        </React.Fragment>
                    }
                    {(LayoutType.MobileVertical !== layoutType || (!this.state.speedDisplayed && controlsType === StepperControlsType.Normal)) &&
                        <React.Fragment>
                            {this._button('gotoend', this.onGoToEnd, getMessage('CONTROL_GO_TO_END'), <FontAwesomeIcon icon={faFastForward}/>, null, 'is-small')
                            }
                        </React.Fragment>
                    }
                </React.Fragment>}
            </div>)
        );
    };

    _button = (key: string, onClick: any, title: string, icon: IconName|JSX.Element, text?: string, classNames?: string): ReactElement => {
        const {controls} = this.props;

        let disabled = false;
        const style: React.CSSProperties = {};

        let intent: Intent = Intent.NONE;
        if (key === 'compile') {
            intent = Intent.PRIMARY;
        }

        switch (key) {
            case 'interrupt':
                disabled = !this.props.canInterrupt;
                break;
            case 'restart':
                disabled = !this.props.canRestart;
                break;
            case 'undo':
                disabled = !this.props.canUndo;
                break;
            case 'redo':
                disabled = !this.props.canRedo;
                break;
            case 'run':
                disabled = !this.props.canStep;
                break;
            case 'into':
                disabled = !this.props.canStep;
                break;
            case 'over':
                disabled = !this.props.canStep;
                break;
            case 'expr':
                disabled = !this.props.canStep;
                if (!this.props.showExpr) {
                    style.display = 'none';
                }
                break;
            case 'out':
                disabled = !(this.props.canStep && this.props.canStepOut);
                break;
            case 'edit':
                disabled = !this.props.canExit;
                break;
            case 'compile':
                disabled = !this.props.canCompile;
                break;
            case 'gotoend':
                disabled = !this.props.canStep || this.props.isFinished;
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

    onStepRun = async () => {
        this.props.dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        this.props.dispatch({type: ActionTypes.StepperCompileAndStep, payload: {mode: StepperStepMode.Run, useSpeed: true}});
    };
    onStepExpr = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Expr, useSpeed: true}});
    onStepInto = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Into, useSpeed: true}});
    onStepOut = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Out, useSpeed: true}});
    onStepOver = async () => {
        this.props.dispatch({type: ActionTypes.StepperCompileAndStep, payload: {mode: StepperStepMode.Over, useSpeed: true}});
    }
    onToggleSpeed = () => {
        this.setState((prevState) => {
            return {
                speedDisplayed: !prevState.speedDisplayed,
            };
        })
    }
    onInterrupt = () => this.props.dispatch({type: ActionTypes.StepperInterrupt, payload: {}});
    onRestart = () => this.props.dispatch({type: ActionTypes.StepperRestart, payload: {}});
    onStop = async () => {
        await this.props.dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        await this.props.dispatch({type: ActionTypes.StepperExit, payload: {}});
    };

    onEdit = () => this.props.dispatch({type: ActionTypes.StepperExit, payload: {}});
    onUndo = () => this.props.dispatch({type: ActionTypes.StepperUndo, payload: {}});
    onRedo = () => this.props.dispatch({type: ActionTypes.StepperRedo, payload: {}});
    onCompile = () => this.props.dispatch({type: ActionTypes.Compile, payload: {}});
    onStepByStep = async () => {
        if (!await this.compileIfNecessary()) {
            return;
        }

        if (this.props.controlsType !== StepperControlsType.StepByStep) {
            await this.props.dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.StepByStep}});
        }
        if (this.props.canStep) {
            this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Into, useSpeed: true}});
        } else {
            await this.props.dispatch({type: ActionTypes.StepperInterrupt, payload: {}});
        }
    };
    onGoToEnd = async () => {
        if (!await this.compileIfNecessary()) {
            return;
        }
        if (this.props.controlsType !== StepperControlsType.Normal) {
            await this.props.dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        }
        if (!this.props.canStep) {
            await this.props.dispatch({type: ActionTypes.StepperInterrupt, payload: {}});
        }
        setTimeout(() => {
            this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Run}});
        }, 250);
    };
    onChangeSpeed = (speed) => this.props.dispatch({type: ActionTypes.StepperSpeedChanged, payload: {speed}});

    compileIfNecessary = () => {
        return new Promise<boolean>((resolve) => {
            if (this.props.showCompile) {
                this.props.dispatch({type: ActionTypes.CompileWait, payload: {callback: (result) => {
                    resolve(CompileStatus.Done === result);
                }}});
            } else {
                resolve(true);
            }
        });
    };
}

export const StepperControls = connect(mapStateToProps)(_StepperControls);
