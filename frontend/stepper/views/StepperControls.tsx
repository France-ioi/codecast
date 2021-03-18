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
    controlsType: StepperControlsType,
}

function mapStateToProps(state: AppStore, props): StepperControlsStateToProps {
    const {enabled} = props;
    const getMessage = state.getMessage;
    const {controls, showStepper, platform} = state.options;

    let showCompile = false, showControls = false, showEdit = false;
    let canCompile = false, canExit = false, canRestart = false, canStep = false, canStepOut = false;
    let canInterrupt = false, canUndo = false, canRedo = false;
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
        speed,
        controlsType,
    };
}

interface StepperControlsDispatchToProps {
    dispatch: Function
}

interface StepperControlsProps extends StepperControlsStateToProps, StepperControlsDispatchToProps {
    enabled?: boolean,
    newControls?: boolean,
}

class _StepperControls extends React.PureComponent<StepperControlsProps> {
    render = () => {
        const {showStepper, newControls} = this.props;
        if (!showStepper) {
            return null;
        }

        const {getMessage, showControls, showEdit, showCompile, compileOrExecuteMessage, speed, controlsType, canInterrupt} = this.props;

        return newControls ?
            (<div className="controls controls-stepper">
                <div className="controls-stepper-wrapper">
                    {showControls && <div className="controls-stepper-execution">
                        <div className="small-buttons">
                            {this._button('restart', this.onStop, getMessage('CONTROL_RESTART'), 'stop')}
                        </div>
                        <div className="big-buttons">
                            {!canInterrupt && this._button('run', this.onStepRun, getMessage('CONTROL_RUN'), 'play')}
                            {canInterrupt && this._button('interrupt', this.onInterrupt, getMessage('CONTROL_INTERRUPT'), <i
                                className="control-icon fi fi-interrupt"/>)}
                            {this._button('step_by_step', this.onStepByStep, getMessage('CONTROL_STEP_BY_STEP'), <span className="bp3-icon"><svg
                                data-icon="shoe-prints" viewBox="0 0 640 512"><path fill="currentColor" d="M192 160h32V32h-32c-35.35 0-64 28.65-64 64s28.65 64 64 64zM0 416c0 35.35 28.65 64 64 64h32V352H64c-35.35 0-64 28.65-64 64zm337.46-128c-34.91 0-76.16 13.12-104.73 32-24.79 16.38-44.52 32-104.73 32v128l57.53 15.97c26.21 7.28 53.01 13.12 80.31 15.05 32.69 2.31 65.6.67 97.58-6.2C472.9 481.3 512 429.22 512 384c0-64-84.18-96-174.54-96zM491.42 7.19C459.44.32 426.53-1.33 393.84.99c-27.3 1.93-54.1 7.77-80.31 15.04L256 32v128c60.2 0 79.94 15.62 104.73 32 28.57 18.88 69.82 32 104.73 32C555.82 224 640 192 640 128c0-45.22-39.1-97.3-148.58-120.81z"/>
                            </svg></span>)}
                        </div>
                        {controlsType === StepperControlsType.Normal && <div className="speed-slider">
                            <div className="player-slider-container">
                                <span className="bp3-icon extremity extremity-left">
                                  <svg
                                    data-icon="walking" viewBox="0 0 320 512"><path fill="currentColor" d="M208 96c26.5 0 48-21.5 48-48S234.5 0 208 0s-48 21.5-48 48 21.5 48 48 48zm94.5 149.1l-23.3-11.8-9.7-29.4c-14.7-44.6-55.7-75.8-102.2-75.9-36-.1-55.9 10.1-93.3 25.2-21.6 8.7-39.3 25.2-49.7 46.2L17.6 213c-7.8 15.8-1.5 35 14.2 42.9 15.6 7.9 34.6 1.5 42.5-14.3L81 228c3.5-7 9.3-12.5 16.5-15.4l26.8-10.8-15.2 60.7c-5.2 20.8.4 42.9 14.9 58.8l59.9 65.4c7.2 7.9 12.3 17.4 14.9 27.7l18.3 73.3c4.3 17.1 21.7 27.6 38.8 23.3 17.1-4.3 27.6-21.7 23.3-38.8l-22.2-89c-2.6-10.3-7.7-19.9-14.9-27.7l-45.5-49.7 17.2-68.7 5.5 16.5c5.3 16.1 16.7 29.4 31.7 37l23.3 11.8c15.6 7.9 34.6 1.5 42.5-14.3 7.7-15.7 1.4-35.1-14.3-43zM73.6 385.8c-3.2 8.1-8 15.4-14.2 21.5l-50 50.1c-12.5 12.5-12.5 32.8 0 45.3s32.7 12.5 45.2 0l59.4-59.4c6.1-6.1 10.9-13.4 14.2-21.5l13.5-33.8c-55.3-60.3-38.7-41.8-47.4-53.7l-20.7 51.5z"/>
                                  </svg></span>
                                <Slider
                                    value={speed}
                                    onChange={this.onChangeSpeed}
                                    min={0}
                                    max={225}
                                    stepSize={1}
                                    labelStepSize={255}
                                    labelRenderer={formatTime}
                                />
                              <span className="bp3-icon extremity extremity-right"><svg
                                data-icon="running" viewBox="0 0 416 512"><path fill="currentColor" d="M272 96c26.51 0 48-21.49 48-48S298.51 0 272 0s-48 21.49-48 48 21.49 48 48 48zM113.69 317.47l-14.8 34.52H32c-17.67 0-32 14.33-32 32s14.33 32 32 32h77.45c19.25 0 36.58-11.44 44.11-29.09l8.79-20.52-10.67-6.3c-17.32-10.23-30.06-25.37-37.99-42.61zM384 223.99h-44.03l-26.06-53.25c-12.5-25.55-35.45-44.23-61.78-50.94l-71.08-21.14c-28.3-6.8-57.77-.55-80.84 17.14l-39.67 30.41c-14.03 10.75-16.69 30.83-5.92 44.86s30.84 16.66 44.86 5.92l39.69-30.41c7.67-5.89 17.44-8 25.27-6.14l14.7 4.37-37.46 87.39c-12.62 29.48-1.31 64.01 26.3 80.31l84.98 50.17-27.47 87.73c-5.28 16.86 4.11 34.81 20.97 40.09 3.19 1 6.41 1.48 9.58 1.48 13.61 0 26.23-8.77 30.52-22.45l31.64-101.06c5.91-20.77-2.89-43.08-21.64-54.39l-61.24-36.14 31.31-78.28 20.27 41.43c8 16.34 24.92 26.89 43.11 26.89H384c17.67 0 32-14.33 32-32s-14.33-31.99-32-31.99z"/>
                                </svg></span>
                            </div>
                        </div>}
                        <div className="small-buttons">
                            {controlsType === StepperControlsType.StepByStep && <React.Fragment>
                                {this._button('expr', this.onStepExpr, getMessage('CONTROL_EXPR'), <i
                                    className="control-icon fi fi-step-expr"/>)}
                                {this._button('into', this.onStepInto, getMessage('CONTROL_INTO'), <i
                                    className="control-icon fi fi-step-into"/>, null, 'is-small')}
                                {this._button('out', this.onStepOut, getMessage('CONTROL_OUT'), <i
                                    className="control-icon fi fi-step-out"/>, null, 'is-small')}
                                {this._button('over', this.onStepOver, getMessage('CONTROL_OVER'), <i
                                    className="control-icon fi fi-step-over"/>, null, 'is-small')}
                                {this._button('undo', this.onUndo, getMessage('CONTROL_UNDO'), 'undo', null, 'is-small')}
                                {this._button('redo', this.onRedo, getMessage('CONTROL_REDO'), 'redo', null, 'is-small')}
                            </React.Fragment>}
                            {this._button('fast_forward', this.onStepByStep, getMessage('CONTROL_GO_TO_END'), <span className="bp3-icon"><svg
                                data-icon="fast-forward" viewBox="0 0 640 512">
                                <path fill="currentColor" d="M512 76v360c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12V284.1L276.5 440.6c-20.6 17.2-52.5 2.8-52.5-24.6V284.1L52.5 440.6C31.9 457.8 0 443.4 0 416V96c0-27.4 31.9-41.7 52.5-24.6L224 226.8V96c0-27.4 31.9-41.7 52.5-24.6L448 226.8V76c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12z"/>
                            </svg></span>)}
                        </div>
                    </div>}
                </div>
                {/*<div className="controls-compile">*/}
                {/*    {showEdit && this._button('edit', this.onEdit, null, null, getMessage('EDIT'))}*/}
                {/*    {showCompile && this._button('compile', this.onCompile, null, null, compileOrExecuteMessage)}*/}
                {/*</div>*/}
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
            <Button
                className={classNames}
                onClick={onClick}
                style={style}
                disabled={disabled}
                intent={intent}
                title={title}
                icon={icon}
                text={text}
            />
        );
    };

    onStepRun = async () => {
        if (this.props.showCompile) {
            await this.props.dispatch({type: ActionTypes.Compile, payload: {}});
        }
        this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Run}})
    };
    onStepExpr = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Expr}});
    onStepInto = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Into}});
    onStepOut = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Out}});
    onStepOver = () => this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Over}});
    onInterrupt = () => this.props.dispatch({type: ActionTypes.StepperInterrupt, payload: {}});
    onRestart = () => this.props.dispatch({type: ActionTypes.StepperRestart, payload: {}});
    onStop = () => this.props.dispatch({type: ActionTypes.StepperExit, payload: {}});
    onEdit = () => this.props.dispatch({type: ActionTypes.StepperExit, payload: {}});
    onUndo = () => this.props.dispatch({type: ActionTypes.StepperUndo, payload: {}});
    onRedo = () => this.props.dispatch({type: ActionTypes.StepperRedo, payload: {}});
    onCompile = () => this.props.dispatch({type: ActionTypes.Compile, payload: {}});
    onStepByStep = () => {
        const newControls = this.props.controlsType === StepperControlsType.Normal ? StepperControlsType.StepByStep : StepperControlsType.Normal;
        this.props.dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: newControls}});
        if (this.props.showCompile) {
            this.props.dispatch({type: ActionTypes.Compile, payload: {}});
            this.props.dispatch({type: ActionTypes.StepperStep, payload: {mode: StepperStepMode.Run}});
        }
    };
    onChangeSpeed = (speed) => this.props.dispatch({type: ActionTypes.StepperSpeedChanged, payload: {speed}});
}

export const StepperControls = connect(mapStateToProps)(_StepperControls);
