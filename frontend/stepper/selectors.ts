import {AllowExecutionOverBlocksLimit, AppStore, AppStoreReplay} from '../store';
import {Stepper, StepperControlsType, StepperState} from "./index";
import {getMessage} from "../lang";
import {CompileStatus} from "./compile";
import * as C from '@france-ioi/persistent-c';
import {memoize} from 'proxy-memoize';
import {hasBlockPlatform, platformsList} from './platforms';
import {LayoutType} from '../task/layout/layout_types';
import {CodecastPlatform} from './codecast_platform';
import {TaskSubmissionEvaluateOn} from '../submission/submission_types';
import log from 'loglevel';

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
    canStepInto: boolean,
    canStepOut: boolean,
    canStepOver: boolean,
    canCompile: boolean,
    canRestart: boolean,
    canUndo: boolean,
    canRedo: boolean,
    canChangeSpeed: boolean,
    showExpr: boolean,
    speed: number,
    isFinished: boolean,
    controlsType: StepperControlsType,
    compileStatus: CompileStatus,
    layoutType: LayoutType,
    isRunning: boolean,
    soundEnabled: boolean,
}

export const getStepperControlsSelector = memoize(({state, enabled}: {state: AppStore, enabled: boolean}): StepperControlsStateToProps => {
    let {showStepper, platform, allowExecutionOverBlocksLimit} = state.options;
    const compileStatus = state.compile.status;
    const layoutType = state.layout.type;
    const inputNeeded = state.task.inputNeeded;
    const soundEnabled = state.task.soundEnabled;

    const platformData = platformsList[platform];

    let showCompile = false, showControls = true, showEdit = false;
    let canCompile = false, canExit = false, canRestart = false, canStep = false, canStepOut = false;
    let canStepOver = false, canStepInto = false, canChangeSpeed = true;
    let canInterrupt = false, canUndo = false, canRedo = false, canGoToEnd = false;
    let isFinished = false;
    let showExpr = !!platformData.hasMicroSteps;
    let compileOrExecuteMessage = '';
    let speed = 0;
    let controlsType = StepperControlsType.Normal;

    let controls = state.options.controls;
    if (TaskSubmissionEvaluateOn.RemoteDebugServer === state.submission.executionMode) {
        controls = {
            ...controls,
            gotoend: false,
            // speed: false,
            // run: false,
            // interrupt: false,
            expr: false,
        };
    }

    const isRunning = CompileStatus.Running === compileStatus || state.stepper.runningBackground || 'running' === state.stepper?.status;

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

        log.getLogger('stepper').debug('[Controls] ', {status, isRunning, controls});

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
            canStep = !currentStepperState.isFinished;
            // We can step out only if we are in >= 2 levels of functions (the global state + in a function).
            canStepOut = !!(currentStepperState.codecastAnalysis && currentStepperState.codecastAnalysis?.stackFrames?.length > 1);
            if (!hasBlockPlatform(platform)) {
                canStepOver = canStep;
            }
            if (currentStepperState && currentStepperState.programState && (CodecastPlatform.C === platform || CodecastPlatform.Cpp === platform)) {
                const {control, scope} = currentStepperState.programState;
                canStepOut = !!C.findClosestFunctionScope(scope);
                canStep = control && !!control.node;
                canStepOver = canStep;
                canRestart = enabled && (stepper.currentStepperState !== stepper.initialStepperState);
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

    canStepInto = canStep;

    if (hasBlockPlatform(platform)) {
        controls = {
            ...controls,
            over: false,
            out: false,
        };
    }
    if (AllowExecutionOverBlocksLimit.OnlyStepByStep === allowExecutionOverBlocksLimit) {
        const blocksUsage = state.task.blocksUsage;

        if (blocksUsage?.error && blocksUsage.blocksCurrent > blocksUsage.blocksLimit) {
            canGoToEnd = false;
            canStep = false;
            canStepOver = false;
            canStepOut = false;
            canChangeSpeed = false;
        }
    }
    if (selectCurrentTest(state)?.data?.hiddenProgression) {
        canStep = false;
        canStepOver = false;
        canStepOut = false;
        canChangeSpeed = false;
        canStepInto = false;
    }

    canStep = canStep && !isRunning;
    canGoToEnd = canGoToEnd && !isRunning;
    canRestart = canRestart || isRunning;

    return {
        showStepper, showControls, controls,
        showEdit, canExit,
        showExpr,
        showCompile, canCompile,
        canRestart, canStep, canStepOut, canInterrupt, canStepOver,
        canUndo, canRedo, canGoToEnd, canChangeSpeed,
        canStepInto,
        compileOrExecuteMessage,
        isFinished,
        speed,
        controlsType,
        compileStatus,
        layoutType,
        isRunning,
        soundEnabled,
    };
});
