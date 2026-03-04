import {AllowExecutionOverBlocksLimit, AppStore, AppStoreReplay} from '../store';
import {Stepper, StepperControlsType, StepperState} from "./index";
import {getMessage} from "../lang";
import {CompileStatus} from "./compile";
import * as C from '@france-ioi/persistent-c';
import {createSelector} from '@reduxjs/toolkit';
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

type GetStepperControlsSelectorArgs = {state: AppStore, enabled: boolean, currentTestHiddenProgression: boolean};

export const getStepperControlsSelector = createSelector(
    ({state}: GetStepperControlsSelectorArgs) => state.options,
    ({state}: GetStepperControlsSelectorArgs) => state.compile.status,
    ({state}: GetStepperControlsSelectorArgs) => state.layout.type,
    ({state}: GetStepperControlsSelectorArgs) => state.task.inputNeeded,
    ({state}: GetStepperControlsSelectorArgs) => state.task.soundEnabled,
    ({state}: GetStepperControlsSelectorArgs) => state.task.resetDone,
    ({state}: GetStepperControlsSelectorArgs) => state.task.blocksUsage,
    ({state}: GetStepperControlsSelectorArgs) => state.submission.executionMode,
    ({state}: GetStepperControlsSelectorArgs) => state.stepper,
    ({state}: GetStepperControlsSelectorArgs) => state.player,
    ({enabled}: GetStepperControlsSelectorArgs) => enabled,
    ({currentTestHiddenProgression}: GetStepperControlsSelectorArgs) => currentTestHiddenProgression,
    (options, compileStatus, layoutType, inputNeeded, soundEnabled, resetDone, blocksUsage, executionMode, stepper, player, enabled, currentTestHiddenProgression): StepperControlsStateToProps => {
        let {showStepper, platform, allowExecutionOverBlocksLimit} = options;

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

        let controls = options.controls;
        if (TaskSubmissionEvaluateOn.RemoteDebugServer === executionMode) {
            controls = {
                ...controls,
                gotoend: false,
                // speed: false,
                // run: false,
                // interrupt: false,
                expr: false,
            };
        }

        const isRunning = CompileStatus.Running === compileStatus || stepper.runningBackground || 'running' === stepper?.status;

        if (player && player.data && player.data.version) {
            let versionComponents = player.data.version.split('.').map(Number);
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

        if (stepper) {
            const status = stepper.status;
            speed = stepper.speed;
            controlsType = stepper.controls;
            canRestart = (enabled && 'clear' !== status) || !resetDone;

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
                canInterrupt = enabled && !stepper.interrupting && !inputNeeded;
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
            if (blocksUsage?.error && blocksUsage.blocksCurrent > blocksUsage.blocksLimit) {
                canGoToEnd = false;
                canStep = false;
                canStepOver = false;
                canStepOut = false;
                canChangeSpeed = false;
            }
        }
        if (currentTestHiddenProgression) {
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
    }
);
