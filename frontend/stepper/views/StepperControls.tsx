import React, {ReactElement} from "react";
import {Button, ButtonGroup, Intent, Slider} from "@blueprintjs/core";
import {IconName} from "@blueprintjs/icons";
import {ActionTypes} from "../actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {getStepper, isStepperInterrupting} from "../selectors";
import * as C from 'persistent-c';
import {StepperControlsType, StepperStepMode} from "../index";
import {formatTime} from "../../common/utils";
import {CompileStatus} from "../compile";
import {LayoutType} from "../../task/layout/layout";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTachometerAlt, faPlay, faPause, faFastForward, faStop, faShoePrints, faWalking, faRunning} from '@fortawesome/free-solid-svg-icons';

interface StepperControlsStateToProps {
    getMessage: Function,
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
    const getMessage = state.getMessage;
    const {controls, showStepper, platform} = state.options;
    const compileStatus = state.compile.status;
    const layoutType = state.layout.type;

    let showCompile = false, showControls = false, showEdit = false;
    let canCompile = false, canExit = false, canRestart = false, canStep = false, canStepOut = false;
    let canInterrupt = false, canUndo = false, canRedo = false;
    let isFinished = false;
    let showExpr = platform !== 'python';
    let compileOrExecuteMessage = '';
    let speed = 0;
    let controlsType = StepperControlsType.Normal;

    if (platform === 'python') {
        compileOrExecuteMessage = getMessage('EXECUTE');
    } else {
        compileOrExecuteMessage = getMessage('COMPILE');
    }

    showControls = true;

    const stepper = getStepper(state);
    if (stepper) {
        const status = stepper.status;
        speed = stepper.speed;
        controlsType = stepper.controls;
        canRestart = enabled && 'clear' !== status && stepper.currentStepperState !== stepper.initialStepperState;

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
            if (platform === 'python') {
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
            canInterrupt = enabled && !isStepperInterrupting(state);
        }
    }

    return {
        getMessage,
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
    newControls?: boolean,
}

class _StepperControls extends React.PureComponent<StepperControlsProps, StepperControlsState> {
    state = {
        speedDisplayed: false,
    };

    render = () => {
        const {showStepper, newControls, layoutType} = this.props;
        if (!showStepper) {
            return null;
        }

        const {getMessage, showControls, showEdit, showCompile, compileOrExecuteMessage, speed, controlsType, canInterrupt} = this.props;
        const speedDisplayed = LayoutType.MobileVertical !== layoutType || this.state.speedDisplayed;

        return newControls ?
            (<div className={`controls controls-stepper ${controlsType}`}>
                {showControls && <React.Fragment>
                    {(LayoutType.MobileVertical !== layoutType || !this.state.speedDisplayed) &&
                        <React.Fragment>
                              {this._button('restart', this.onStop, getMessage('CONTROL_RESTART'), <FontAwesomeIcon icon={faStop}/>, null, 'is-small')}
                              {!canInterrupt && this._button('run', this.onStepRun, getMessage('CONTROL_RUN'), <FontAwesomeIcon icon={faPlay}/>, null, 'is-big')}
                              {canInterrupt && this._button('interrupt', this.onInterrupt, getMessage('CONTROL_INTERRUPT'), <FontAwesomeIcon icon={faPause}/>, null, 'is-big')}
                              {this._button('step_by_step', this.onStepByStep, getMessage('CONTROL_STEP_BY_STEP'), <FontAwesomeIcon icon={faShoePrints}/>, null, 'is-big')}
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
                            {this._button('go_to_end', this.onGoToEnd, getMessage('CONTROL_GO_TO_END'), <FontAwesomeIcon icon={faFastForward}/>, null, 'is-small')
                            }
                        </React.Fragment>
                    }
                </React.Fragment>}
            </div>)
            :
            (<div className="controls controls-stepper">
                <div className="controls-stepper-wrapper">
                    {showControls && <ButtonGroup className="controls-stepper-execution">
                        {this._button('run', this.onStepRun, getMessage('CONTROL_RUN'), <i
                            className="bp3-icon fi fi-run"/>)}
                        {this._button('expr', this.onStepExpr, getMessage('CONTROL_EXPR'), <i
                            className="bp3-icon fi fi-step-expr"/>)}
                        {this._button('into', this.onStepInto, getMessage('CONTROL_INTO'), <i
                            className="bp3-icon fi fi-step-into"/>)}
                        {this._button('out', this.onStepOut, getMessage('CONTROL_OUT'), <i
                            className="bp3-icon fi fi-step-out"/>)}
                        {this._button('over', this.onStepOver, getMessage('CONTROL_OVER'), <i
                            className="bp3-icon fi fi-step-over"/>)}
                        {this._button('interrupt', this.onInterrupt, getMessage('CONTROL_INTERRUPT'), <i
                            className="bp3-icon fi fi-interrupt"/>)}
                        {this._button('restart', this.onRestart, getMessage('CONTROL_RESTART'), <i
                            className="bp3-icon fi fi-restart"/>)}
                        {this._button('undo', this.onUndo, getMessage('CONTROL_UNDO'), 'undo')}
                        {this._button('redo', this.onRedo, getMessage('CONTROL_REDO'), 'redo')}
                    </ButtonGroup>}
                </div>
                <div className="controls-compile">
                    {showEdit && this._button('edit', this.onEdit, null, null, getMessage('EDIT'))}
                    {showCompile && this._button('compile', this.onCompile, null, null, compileOrExecuteMessage)}
                </div>
            </div>)
            ;
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
            case 'go_to_end':
                disabled = this.props.isFinished;
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
        if (!await this.compileIfNecessary()) {
            return;
        }
        await this.props.dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        await this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Run, speed: this.props.speed}});
    };
    onStepExpr = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Expr}});
    onStepInto = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Into}});
    onStepOut = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Out}});
    onStepOver = async () => {
        if (!await this.compileIfNecessary()) {
            return;
        }
        this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Over}});
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
            this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Into}});
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

    compileIfNecessary = async () => {
        if (this.props.showCompile) {
            await this.props.dispatch({type: ActionTypes.Compile, payload: {}});
            if (this.props.compileStatus === CompileStatus.Error) {
                return false;
            }
        }

        return true;
    };
}

export const StepperControls = connect(mapStateToProps)(_StepperControls);
