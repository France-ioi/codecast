import {AppStore, AppStoreReplay} from '../store';
import {Stepper, StepperControlsType, StepperState} from "./index";
import {getMessage} from "../lang";
import {hasBlockPlatform} from "./js";
import {CompileStatus} from "./compile";
import {LayoutType} from "../task/layout/layout";
import * as C from '@france-ioi/persistent-c';
import {CodecastPlatform, platformsList} from './platforms';

export function getStepper(state: AppStore): Stepper {
    return state.stepper;
}

export function getCurrentStepperState(state: AppStoreReplay): StepperState {
    return state.stepper.currentStepperState;
}

export function isStepperInterrupting(state: AppStore): boolean {
    return state.stepper.interrupting;
}

interface StepperControlsStateToProps {
    showStepper: boolean,
    showControls: boolean,
    showEdit: boolean,
    showCompile: boolean,
    compileOrExecuteMessage: string,
    controls: any,
    canInterrupt: boolean,
    canGoToEnd: boolean,
    canStep: boolean,
    canExit: boolean,
    canStepOut: boolean,
    canStepOver: boolean,
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
    runningBackground: boolean,
    soundEnabled: boolean,
}

export function getStepperControlsSelector(state: AppStore, {enabled}): StepperControlsStateToProps {
    const {controls, showStepper, platform} = state.options;
    const compileStatus = state.compile.status;
    const layoutType = state.layout.type;
    const inputNeeded = state.task.inputNeeded;
    const soundEnabled = state.task.soundEnabled;

    const platformData = platformsList[platform];
    const runningBackground = state.stepper.runningBackground;

    let showCompile = false, showControls = true, showEdit = false;
    let canCompile = false, canExit = false, canRestart = false, canStep = false, canStepOut = false;
    let canStepOver = false;
    let canInterrupt = false, canUndo = false, canRedo = false, canGoToEnd = false;
    let isFinished = false;
    let showExpr = !!platformData.hasMicroSteps;
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

    if (!!platformData.needsCompilation) {
        compileOrExecuteMessage = getMessage('COMPILE');
    } else {
        compileOrExecuteMessage = getMessage('EXECUTE');
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
            canGoToEnd = true;
        } else if (status === 'idle') {
            const currentStepperState = stepper.currentStepperState;

            isFinished = !!currentStepperState.isFinished;
            showEdit = true;
            showControls = true;
            canExit = enabled;
            canGoToEnd = !currentStepperState.isFinished;
            if (hasBlockPlatform(platform)) {
                canStep = !currentStepperState.isFinished;
            } else if (platform === CodecastPlatform.Python) {
                // We can step out only if we are in >= 2 levels of functions (the global state + in a function).
                canStepOut = (currentStepperState.suspensions && (currentStepperState.suspensions.length > 1));
                canStep = !currentStepperState.isFinished;
                canStepOver = canStep;
                canUndo = enabled && (stepper.undo.length > 0);
                canRedo = enabled && (stepper.redo.length > 0);
            } else {
                if (currentStepperState && currentStepperState.programState) {
                    const {control, scope} = currentStepperState.programState;

                    canStepOut = !!C.findClosestFunctionScope(scope);
                    canStep = control && !!control.node;
                    canStepOver = canStep;
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
            canGoToEnd = true;
        }
    }

    canStep = canStep && !runningBackground;
    canRestart = canRestart || runningBackground;
    canGoToEnd = canGoToEnd && !runningBackground;

    return {
        showStepper, showControls, controls,
        showEdit, canExit,
        showExpr,
        showCompile, canCompile,
        canRestart, canStep, canStepOut, canInterrupt, canStepOver,
        canUndo, canRedo, canGoToEnd,
        compileOrExecuteMessage,
        isFinished,
        speed,
        controlsType,
        compileStatus,
        layoutType,
        runningBackground,
        soundEnabled,
    };
}
