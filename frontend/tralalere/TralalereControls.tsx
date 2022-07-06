import React, {ReactElement} from "react";
import {IconName} from "@blueprintjs/icons";
import {ActionTypes, stepperRunBackground} from "../stepper/actionTypes";
import {useDispatch, useSelector} from "react-redux";
import {StepperControlsType, StepperStepMode} from "../stepper";
import {CompileStatus} from "../stepper/compile";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faStepForward,
    faStepBackward, faPause,
} from '@fortawesome/free-solid-svg-icons';
import {getMessage} from "../lang";
import {getStepperControlsSelector} from "../stepper/selectors";
import {AppStore} from "../store";
import {TaskSubmissionResultPayload} from "../task/task_slice";

interface StepperControlsProps {
    enabled: boolean,
}

export function TralalereControls(props: StepperControlsProps) {
    const stepperControlsState = useSelector((state: AppStore) => {
        return getStepperControlsSelector(state, props);
    });
    const {showControls, showCompile, compileOrExecuteMessage, controlsType, canInterrupt, showStepper} = stepperControlsState;
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
        }

        return (
            <div className="tralalere-control-button-container" style={style}>
                <button className="tralalere-button" onClick={onClick} disabled={disabled}>
                    {icon}
                </button>
            </div>
        );
    };

    const onStepRun = async () => {
        dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});

        const result: TaskSubmissionResultPayload = await new Promise<TaskSubmissionResultPayload>((resolve) => {
            dispatch(stepperRunBackground(resolve));
        });

        console.log('background execution result', result);

        dispatch({type: ActionTypes.StepperCompileAndStep, payload: {mode: StepperStepMode.Run, useSpeed: true, backgroundRunData: result}});
    };
    const onStop = async () => {
        dispatch({type: ActionTypes.StepperControlsChanged, payload: {controls: StepperControlsType.Normal}});
        dispatch({type: ActionTypes.StepperExit, payload: {}});
    };
    const onInterrupt = () => dispatch({type: ActionTypes.StepperInterrupting, payload: {}});
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

    const compileIfNecessary = () => {
        return new Promise<boolean>((resolve) => {
            if (stepperControlsState.showCompile) {
                dispatch({type: ActionTypes.CompileWait, payload: {callback: (result) => {
                    resolve(CompileStatus.Done === result);
                }}});
            } else {
                resolve(true);
            }
        });
    };

    if (!showStepper) {
        return null;
    }

    return (!showControls && showCompile ?
        <div className="controls-compile">
            {_button('compile', onCompile, null, null, compileOrExecuteMessage)}
        </div>
        :
        (<div className={`controls controls-stepper ${controlsType}`}>
            {showControls && <React.Fragment>
                {_button('restart', onStop, getMessage('CONTROL_RESTART'), <FontAwesomeIcon icon={faStepBackward}/>, null, 'is-small')}
                {!canInterrupt && _button('run', onStepRun, getMessage('CONTROL_RUN'), <FontAwesomeIcon icon={faPlay}/>, null, 'is-big')}
                {canInterrupt && _button('interrupt', onInterrupt, getMessage('CONTROL_INTERRUPT'), <FontAwesomeIcon icon={faPause}/>, null, 'is-big')}
                {_button('into', onStepByStep, getMessage('CONTROL_STEP_BY_STEP'), <FontAwesomeIcon icon={faStepForward}/>, null, 'is-big')}
            </React.Fragment>}
        </div>)
    );
}
