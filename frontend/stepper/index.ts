/*

XXX interrupting

The stepper bundle provides these views:

  StepperView
  StepperControls

The stepper's state has the following shape:

  {
    status: /clear|idle|starting|running/,
    mode: /expr|into|out|over/,
    initialStepperState: StepperState,
    currentStepperState: StepperState,
    undo: List<StepperState>,
    redo: List<StepperState>,
  }

  The 'initialStepperState' state is the one restored by a 'restart' action.
  The 'currentStepperState' state is the state from which the step* actions start,
  and also the state to be displayed to the user.

*/

import {apply, call, cancel, fork, put, race, select, take, takeEvery, takeLatest, throttle} from 'typed-redux-saga';
import * as C from '@france-ioi/persistent-c';

import {
    default as ApiBundle,
    makeContext,
    performStep, QuickalgoLibraryCall,
    StepperContext,
    StepperContextParameters,
    StepperError,
} from './api';
import CompileBundle, {CompileStatus} from './compile';
import EffectsBundle from './c/effects';

import DelayBundle from './delay';
import HeapBundle from './c/heap';
import IoBundle from './io/index';
import ViewsBundle from './views/index';
import ArduinoBundle, {ArduinoPort} from './arduino';
import PythonBundle from './python';
import BlocklyBundle, {hasBlockPlatform} from './js';
import {analyseState, AnalysisC, collectDirectives} from './c/analysis';
import {convertSkulptStateToAnalysisSnapshot, getSkulptSuspensionsCopy} from "./python/analysis";
import {Directive, parseDirectives} from "./python/directives";
import {
    ActionTypes as StepperActionTypes,
    ActionTypes,
    stepperDisplayError,
    stepperExecutionError,
    stepperExecutionSuccess, stepperRunBackground, stepperRunBackgroundFinished
} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as BufferActionTypes} from "../buffers/actionTypes";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {getCurrentStepperState, getStepper, getStepperControlsSelector, isStepperInterrupting} from "./selectors";
import {AppStore, AppStoreReplay} from "../store";
import {TermBuffer} from "./io/terminal";
import {delay} from "../player/sagas";
import {Bundle} from "../linker";
import {App, Codecast} from "../index";
import {mainQuickAlgoLogger, quickAlgoLibraries, QuickAlgoLibrariesActionType} from "../task/libs/quickalgo_libraries";
import {selectCurrentTestData, taskResetDone, updateCurrentTestId} from "../task/task_slice";
import {getCurrentImmerState} from "../task/utils";
import PythonRunner from "./python/python_runner";
import {getContextBlocksDataSelector} from "../task/blocks/blocks";
import {selectAnswer} from "../task/selectors";
import AbstractRunner from "./abstract_runner";
import {SagaIterator} from "redux-saga";
import BlocklyRunner from "./js/blockly_runner";
import UnixRunner from "./c/unix_runner";
import {AnalysisSnapshot, CodecastAnalysisSnapshot, convertAnalysisDAPToCodecastFormat} from "./analysis/analysis";
import log from "loglevel";
import {taskSubmissionExecutor} from "../submission/task_submission";
import {ActionTypes as LayoutActionTypes} from "../task/layout/actionTypes";
import {LayoutMobileMode} from "../task/layout/layout";
import {DeferredPromise} from "../utils/app";
import {addStepperRecordAndReplayHooks} from './replay';
import {appSelect} from '../hooks';
import {TaskSubmissionResultPayload} from '../submission/submission';
import {CodecastPlatform} from './platforms';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {QuickAlgoLibrary} from '../task/libs/quickalgo_library';

export const stepperThrottleDisplayDelay = 50; // ms
export const stepperMaxSpeed = 255; // 255 - speed in ms
export const stepperMaxStepsBetweenInteractBefore = 50;

export enum StepperStepMode {
    Run = 'run',
    Expr = 'expr',
    Into = 'into',
    Out = 'out',
    Over = 'over'
}

export enum StepperControlsType {
    Normal = 'normal',
    StepByStep = 'step_by_step',
}

export interface StepperDirectives {
    ordered: readonly Directive[],
    functionCallStack: any, // C
    functionCallStackMap: any // Python
}

export const initialStepperStateControls = {
    hide: false,
    fullView: false,
    stack: {
        focusDepth: 0,
    },
    hPan: 0,
    vPan: 0,
    cellPan: 0
};

let currentStepperTask;

/**
 * TODO: This type is used in directives but it may actually be a different type that is used there.
 */
export type StepperControls = typeof initialStepperStateControls;

// TODO: Separate the needs per platform (StepperStatePython, StepperStateC, etc)
const initialStateStepperState = {
    platform: CodecastPlatform.Unix,
    input: '',
    output: '', // Only used for python
    localVariables: {} as any, // Only used for blockly
    terminal: null as TermBuffer, // Only used for python
    suspensions: [] as readonly any[],  // Only used for python // TODO: Don't put this in the store
    programState: {} as any, // Only used for c
    lastProgramState: {} as any, // Only used for c
    ports: [] as ArduinoPort[], // Only used for arduino
    selectedPort: {} as any, // Only used for arduino
    controls: initialStepperStateControls, // Only used for c
    codecastAnalysis: null as CodecastAnalysisSnapshot,
    analysis: null as any,
    lastAnalysis: null as AnalysisSnapshot, // Only used for python
    directives: {
        ordered: [],
        functionCallStack: null,
        functionCallStackMap: null
    } as StepperDirectives,
    inputBuffer: '',
    error: '',
    serial: {
        speed: false
    },
    options: { // Only used for c
        memorySize: 0x10000,
        stackSize: 4096
    },
    isFinished: false, // Only used for python
    contextState: {} as any,
    currentBlockId: null, // Only used for Blockly
};

export type StepperState = typeof initialStateStepperState;

export enum StepperStatus {
    Clear = 'clear',
    Idle = 'idle',
    Starting = 'starting',
    Running = 'running'
}

export const initialStateStepper = {
    status: StepperStatus.Clear,
    speed: 0,
    undo: [],
    redo: [],
    initialStepperState: initialStateStepperState,
    currentStepperState: null as StepperState,
    interrupting: false,
    mode: null as StepperStepMode,
    options: {} as any, // TODO: Is this used ? If yes, put the type.
    controls: StepperControlsType.Normal,
    synchronizingAnalysis: false,
    error: null as string|LibraryTestResult,
    runningBackground: false,
    backgroundRunData: null as TaskSubmissionResultPayload,
};

export function* createRunnerSaga(): SagaIterator<AbstractRunner> {
    const environment = yield* appSelect(state => state.environment);
    const platform = yield* appSelect(state => state.options.platform);
    const context = quickAlgoLibraries.getContext(null, environment);
    const runnerClass = getRunnerClassFromPlatform(platform);

    return new runnerClass(context, {});
}

export function getRunnerClassFromPlatform(platform: CodecastPlatform) {
    if (CodecastPlatform.Python === platform) {
        return PythonRunner;
    }
    if (CodecastPlatform.Unix === platform) {
        return UnixRunner;
    }
    if (hasBlockPlatform(platform)) {
        return BlocklyRunner;
    }

    throw "This platform does not have a runner: " + platform;
}

export type Stepper = typeof initialStateStepper;

function initReducer(state: AppStoreReplay): void {
    state.stepper = {...initialStateStepper};
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, initReducer);

    /* Sent when the stepper task is cancelled */
    bundle.defineAction(ActionTypes.StepperTaskCancelled);
    bundle.addReducer(ActionTypes.StepperTaskCancelled, stepperTaskCancelledReducer);

    // Sent when the stepper's state is initialized.
    bundle.defineAction(ActionTypes.StepperRestart);
    bundle.addReducer(ActionTypes.StepperRestart, stepperRestartReducer);

    // Restore a saved or computed state.
    bundle.defineAction(ActionTypes.StepperReset);
    bundle.addReducer(ActionTypes.StepperReset, stepperResetReducer);

    // Sent when the user requested stepping in a given mode.
    bundle.defineAction(ActionTypes.StepperStep);
    bundle.addReducer(ActionTypes.StepperStep, stepperStepReducer);

    // Sent when the stepper has started evaluating a step.
    bundle.defineAction(ActionTypes.StepperStarted);
    bundle.addReducer(ActionTypes.StepperStarted, stepperStartedReducer);

    bundle.defineAction(ActionTypes.StepperInteract);
    bundle.defineAction(ActionTypes.StepperInteractBefore);

    // Sent when the stepper has been evaluating for a while without completing a step.
    bundle.defineAction(ActionTypes.StepperProgress);
    bundle.addReducer(ActionTypes.StepperProgress, stepperProgressReducer);

    // Sent when the stepper has completed a step and is idle again.
    bundle.defineAction(ActionTypes.StepperIdle);
    bundle.addReducer(ActionTypes.StepperIdle, stepperIdleReducer);

    // Sent when the user exits the stepper.
    bundle.defineAction(ActionTypes.StepperExit);
    bundle.addReducer(ActionTypes.StepperExit, stepperExitReducer);

    bundle.defineAction(ActionTypes.StepperInterrupting);
    bundle.addReducer(ActionTypes.StepperInterrupting, stepperInterruptReducer);

    // Sent when the user interrupts the stepper.
    bundle.defineAction(ActionTypes.StepperInterrupt);
    bundle.addReducer(ActionTypes.StepperInterrupt, stepperInterruptReducer);

    bundle.defineAction(ActionTypes.StepperInterrupted);
    bundle.addReducer(ActionTypes.StepperInterrupted, stepperInterruptedReducer);

    bundle.defineAction(ActionTypes.StepperUndo);
    bundle.addReducer(ActionTypes.StepperUndo, stepperUndoReducer);

    bundle.defineAction(ActionTypes.StepperRedo);
    bundle.addReducer(ActionTypes.StepperRedo, stepperRedoReducer);

    bundle.defineAction(ActionTypes.StepperConfigure);
    bundle.addReducer(ActionTypes.StepperConfigure, stepperConfigureReducer);

    bundle.defineAction(ActionTypes.StepperSpeedChanged);
    bundle.addReducer(ActionTypes.StepperSpeedChanged, stepperSpeedChangedReducer);

    bundle.defineAction(ActionTypes.StepperControlsChanged);
    bundle.addReducer(ActionTypes.StepperControlsChanged, stepperControlsChangedReducer);

    /* BEGIN view stuff to move out of here */

    bundle.defineAction(ActionTypes.StepperStackUp);
    bundle.addReducer(ActionTypes.StepperStackUp, stepperStackUpReducer);

    bundle.defineAction(ActionTypes.StepperStackDown);
    bundle.addReducer(ActionTypes.StepperStackDown, stepperStackDownReducer);

    bundle.defineAction(ActionTypes.StepperViewControlsChanged);
    bundle.addReducer(ActionTypes.StepperViewControlsChanged, stepperViewControlsChangedReducer);

    bundle.defineAction(ActionTypes.StepperSynchronizingAnalysisChanged);
    bundle.addReducer(ActionTypes.StepperSynchronizingAnalysisChanged, stepperSynchronizingAnalysisChangedReducer);

    bundle.defineAction(ActionTypes.StepperExecutionSuccess);
    bundle.addReducer(ActionTypes.StepperExecutionSuccess, stepperExitReducer);

    bundle.defineAction(ActionTypes.StepperExecutionError);
    bundle.addReducer(ActionTypes.StepperExecutionError, stepperExecutionErrorReducer);

    bundle.defineAction(ActionTypes.StepperDisplayError);
    bundle.addReducer(ActionTypes.StepperDisplayError, stepperDisplayErrorReducer);

    bundle.defineAction(ActionTypes.StepperClearError);
    bundle.addReducer(ActionTypes.StepperClearError, stepperClearErrorReducer);

    bundle.defineAction(ActionTypes.StepperRunBackground);
    bundle.addReducer(ActionTypes.StepperRunBackground, stepperRunBackgroundReducer);

    bundle.defineAction(ActionTypes.StepperRunBackgroundFinished);
    bundle.addReducer(ActionTypes.StepperRunBackgroundFinished, stepperRunBackgroundFinishedReducer);

    /* END view stuff to move out of here */

    bundle.defineAction(ActionTypes.StepperEnabled);
    bundle.defineAction(ActionTypes.StepperDisabled);

    bundle.addSaga(stepperSaga);

    bundle.defer(postLink);

    /* Include bundles late so post-link functions that register with replayApi
       (in particular in IoBundle) are called after our own (just above). */
    bundle.include(ApiBundle);
    bundle.include(CompileBundle);
    bundle.include(EffectsBundle);
    bundle.include(DelayBundle);
    bundle.include(HeapBundle);
    bundle.include(IoBundle);
    bundle.include(ViewsBundle);
    bundle.include(ArduinoBundle);
    bundle.include(PythonBundle);
    bundle.include(BlocklyBundle);
};

/**
 * Enrich, analysis the current stepper state.
 *
 * @param stepperState The stepper state.
 * @param {string} context The context (Stepper.Progress, Stepper.Restart, Stepper.Idle).
 * @param stepperContext
 */
function enrichStepperState(stepperState: StepperState, context: 'Stepper.Restart' | 'Stepper.Progress' | 'Stepper.Idle', stepperContext: StepperContext = null): void {
    const {programState, controls} = stepperState;
    if (!programState) {
        return;
    }

    log.getLogger('stepper').debug('make enrich', stepperState, Codecast.runner);
    if (hasBlockPlatform(stepperState.platform)) {
        stepperState.currentBlockId = (Codecast.runner as BlocklyRunner).getCurrentBlockId();
        log.getLogger('stepper').debug('got block id', stepperState.currentBlockId);
        if (context === 'Stepper.Progress') {
            if (Codecast.runner._isFinished) {
                log.getLogger('stepper').debug('bim is finished');
                stepperState.isFinished = true;
            } else {
                stepperState.analysis = (Codecast.runner as BlocklyRunner).fetchLatestBlocklyAnalysis(stepperState.localVariables, stepperState.lastAnalysis, stepperState.analysis.stepNum + 1);
            }
        }

        if (!stepperState.analysis) {
            stepperState.analysis =  {
                stackFrames: [],
                code: (Codecast.runner as BlocklyRunner)._code,
                stepNum: 0
            };

            stepperState.lastAnalysis = {
                stackFrames: [],
                code: (Codecast.runner as BlocklyRunner)._code,
                stepNum: 0
            };
        }

        log.getLogger('stepper').debug('blockly analysis', stepperState.analysis);
        log.getLogger('stepper').debug('last analysis', stepperState.lastAnalysis);
        stepperState.codecastAnalysis = convertAnalysisDAPToCodecastFormat(stepperState.analysis, stepperState.lastAnalysis);
        log.getLogger('stepper').debug('codecast analysis', stepperState.codecastAnalysis);
    } else if (stepperState.platform === CodecastPlatform.Python) {
        if (context === 'Stepper.Progress') {
            // Don't reanalyse after program is finished :
            // keep the last state of the stack and set isFinished state.
            if (Codecast.runner._isFinished) {
                stepperState.isFinished = true;
            } else {
                log.getLogger('stepper').debug('INCREASE STEP NUM TO ', stepperState.analysis.stepNum + 1);
                stepperState.analysis = convertSkulptStateToAnalysisSnapshot(stepperState.suspensions, stepperState.lastAnalysis, stepperState.analysis.stepNum + 1);
                stepperState.directives = {
                    ordered: parseDirectives(stepperState.analysis),
                    functionCallStackMap: null,
                    functionCallStack: null
                };
            }
        }

        if (!stepperState.analysis) {
            stepperState.analysis =  {
                stackFrames: [],
                code: (Codecast.runner as PythonRunner)._code,
                lines: (Codecast.runner as PythonRunner)._code.split("\n"),
                stepNum: 0
            };

            stepperState.lastAnalysis = {
                stackFrames: [],
                code: (Codecast.runner as PythonRunner)._code,
                lines: (Codecast.runner as PythonRunner)._code.split("\n"),
                stepNum: 0
            };
        }

        log.getLogger('stepper').debug('python analysis', stepperState.analysis);
        stepperState.codecastAnalysis = convertAnalysisDAPToCodecastFormat(stepperState.analysis, stepperState.lastAnalysis);
        log.getLogger('stepper').debug('codecast analysis', stepperState.codecastAnalysis);
    } else {
        const analysis = stepperState.analysis = analyseState(programState);
        const focusDepth = controls.stack.focusDepth;
        stepperState.directives = collectDirectives(analysis.functionCallStack, focusDepth);

        // TODO? initialize controls for each directive added, clear controls for each directive removed (except 'stack').
    }
}

export function clearStepper(stepper: Stepper) {
    stepper.status = StepperStatus.Clear;
    stepper.runningBackground = false;
    stepper.backgroundRunData = null;
    stepper.undo = [];
    stepper.redo = [];
    stepper.interrupting = false;
    stepper.initialStepperState = null;
    stepper.currentStepperState = null;
}

export function getNodeRange(stepperState?: StepperState) {
    if (!stepperState) {
        return null;
    }

    if (stepperState.platform === CodecastPlatform.Python) {
        const {stackFrames} = stepperState.analysis;
        const stackFrame = stackFrames[stackFrames.length - 1];
        if (!stackFrame) {
            return null;
        }

        const line = stackFrame.line;
        const columnNumber = stackFrame.column;

        return {
            start: {
                row: (line - 1),
                column: columnNumber,
            },
            end: {
                row: (line - 1),
                column: 100,
            }
        };
    } else if (hasBlockPlatform(stepperState.platform)) {
        //TODO
        return null;
    } else {
        const {control} = stepperState.programState;
        if (!control || !control.node) {
            return null;
        }

        const focusDepth = stepperState.controls.stack.focusDepth;
        if (focusDepth === 0) {
            return control.node[1].range;
        } else {
            const {stackFrames} = stepperState.analysis;
            const stackFrame = stackFrames[stackFrames.length - focusDepth];

            // @ts-ignore
            return stackFrame.scopes[0].cont.node[1].range;
        }
    }
}

function stringifyError(error) {
    if (process.env['NODE_ENV'] === 'production' || typeof error === 'string') {
        return error.toString();
    }
    if (error && error.stack) {
        return error.stack.toString();
    }
    return JSON.stringify(error);
}

/* Reducers */

function stepperRestartReducer(state: AppStoreReplay, {payload: {stepperState}}): void {
    const {platform} = state.options;

    if (stepperState) {
        enrichStepperState(stepperState, 'Stepper.Restart');
        /**
         * StepperState comes from an action so it's not an immer draft.
         */
        stepperState = {...stepperState};
    } else {
        if (platform === CodecastPlatform.Python) {
            stepperState = state.stepper.initialStepperState;

            const source = selectAnswer(state);

            /**
             * Add a last instruction at the end of the code so Skupt will generate a Suspension state
             * for after the user's last instruction. Otherwise it would be impossible to retrieve the
             * modifications made by the last user's line.
             *
             * @type {string} pythonSource
             */
            const pythonSource = source + "\npass";

            const context = quickAlgoLibraries.getContext(null, state.environment);
            const blocksData = getContextBlocksDataSelector({state, context});

            Codecast.runner.initCodes([pythonSource], blocksData);
        } else {
            stepperState = state.stepper.initialStepperState;
        }
    }

    state.stepper.status = StepperStatus.Idle;
    state.stepper.initialStepperState = stepperState;
    state.stepper.currentStepperState = stepperState;
    state.stepper.redo = [];
    state.task.resetDone = false;
    state.task.inputs = [];
}

function stepperTaskCancelledReducer(): void {
    currentStepperTask = null;
}

function stepperResetReducer(state: AppStore, {payload: {stepperState}}): void {
    state.stepper = Object.freeze(stepperState);
}

function stepperStepReducer(state: AppStore): void {
    /* No check for 'idle' status, the player must be able to step while
       the status is 'running'. */
    state.stepper.status = StepperStatus.Starting;
    state.stepper.interrupting = false;
}

function stepperStartedReducer(state: AppStoreReplay, action): void {
    state.stepper.status = StepperStatus.Running;
    state.stepper.mode = action.mode;
    state.stepper.redo = [];
    state.stepper.undo.unshift(state.stepper.currentStepperState);
}

function stepperProgressReducer(state: AppStoreReplay, {payload: {stepperContext, progress}}): void {
    /**
     * TODO: stepperState comes from an action so it's not an immer draft.
     */
    // log.getLogger('stepper').debug('previous state', stepperContext.state.contextState, 'and progress', progress);
    stepperContext.state = {...stepperContext.state};

    if (false !== progress) {
        if (hasBlockPlatform(stepperContext.state.platform)) {
            stepperContext.state.localVariables = (Codecast.runner as BlocklyRunner).getLocalVariables();
        } else if (stepperContext.state.platform === CodecastPlatform.Python) {
            stepperContext.state.suspensions = getSkulptSuspensionsCopy((Codecast.runner as PythonRunner)._debugger.suspension_stack);
        }

        // Set new currentStepperState state and go back to idle.
        enrichStepperState(stepperContext.state, 'Stepper.Progress', stepperContext);
    }

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context) {
        state.task.state = getCurrentImmerState(context.getInnerState());
    }

    state.stepper.currentStepperState = stepperContext.state;
    if (state.compile.status === CompileStatus.Error) {
        state.stepper.currentStepperState.isFinished = false;
    }
}

function stepperIdleReducer(state: AppStoreReplay, {payload: {stepperContext}}): void {
    // Set new currentStepperState state and go back to idle.
    /* XXX Call enrichStepperState prior to calling the reducer. */
    enrichStepperState(stepperContext.state, 'Stepper.Idle', stepperContext);
    /**
     * TODO: stepperState comes from an action so it's not an immer draft.
     */
    stepperContext.state = {...stepperContext.state};

    state.stepper.currentStepperState = stepperContext.state;
    state.stepper.status = StepperStatus.Idle;
    state.stepper.mode = null;
}

export function stepperExitReducer(state: AppStoreReplay): void {
    clearStepper(state.stepper);
    state.task.inputNeeded = false;
}

function stepperInterruptReducer(state: AppStore): void {
    // Cannot interrupt while idle.
    if (state.stepper.status !== StepperStatus.Idle) {
        state.stepper.interrupting = true;
    }
}

function stepperInterruptedReducer(state: AppStore): void {
    state.stepper.interrupting = false;
}

function stepperUndoReducer(state: AppStoreReplay): void {
    const undo = state.stepper.undo;
    if (undo.length) {
        const currentStepperState = state.stepper.currentStepperState;

        state.stepper.currentStepperState = undo.shift();
        state.stepper.redo.unshift(currentStepperState);
    }
}

function stepperRedoReducer(state: AppStoreReplay): void {
    const redo = state.stepper.redo;
    if (redo.length) {
        const currentStepperState = state.stepper.currentStepperState;

        state.stepper.currentStepperState = redo.shift();
        state.stepper.undo.unshift(currentStepperState);
    }
}

function stepperConfigureReducer(state: AppStore, action): void {
    const {options} = action;

    return state.stepper.options = options;
}

function stepperSpeedChangedReducer(state: AppStoreReplay, {payload: {speed}}): void {
    return state.stepper.speed = speed;
}

function stepperControlsChangedReducer(state: AppStoreReplay, {payload: {controls}}): void {
    return state.stepper.controls = controls;
}

function stepperStackUpReducer(state: AppStoreReplay): void {
    let {controls, analysis} = state.stepper.currentStepperState;
    let focusDepth = controls.stack.focusDepth;
    if (focusDepth > 0) {
        focusDepth -= 1;

        controls.stack.focusDepth = focusDepth;

        const directives = collectDirectives(analysis.stackFrames, focusDepth);
        state.stepper.currentStepperState.controls = controls;
        state.stepper.currentStepperState.directives = directives;
    }
}

function stepperStackDownReducer(state: AppStoreReplay): void {
    let {controls, analysis} = state.stepper.currentStepperState;
    const stackDepth = analysis.stackFrames.length;
    let focusDepth = controls.stack.focusDepth;
    if (focusDepth + 1 < stackDepth) {
        focusDepth += 1;

        controls.stack.focusDepth = focusDepth;

        const directives = collectDirectives(analysis.stackFrames, focusDepth);
        state.stepper.currentStepperState.controls = controls;
        state.stepper.currentStepperState.directives = directives;
    }
}

function stepperViewControlsChangedReducer(state: AppStoreReplay, action): void {
    const {key, update} = action;

    let {controls} = state.stepper.currentStepperState;
    if (controls[key]) {
        Object.keys(update).forEach(function(name) {
            controls[key][name] = update[name];
        });
    } else {
        controls[key] = update;
    }
}

function stepperSynchronizingAnalysisChangedReducer(state: AppStoreReplay, {payload}): void {
    state.stepper.synchronizingAnalysis = payload;
}

export function stepperExecutionErrorReducer(state: AppStoreReplay): void {
    clearStepper(state.stepper);
}

export function stepperDisplayErrorReducer(state: AppStoreReplay, {payload}): void {
    state.stepper.error = payload.error;
}

function stepperClearErrorReducer(state: AppStore): void {
    state.stepper.error = null;
}

function stepperRunBackgroundReducer(state: AppStore): void {
    state.stepper.runningBackground = true;
}

function stepperRunBackgroundFinishedReducer(state: AppStore, {payload: {backgroundRunData}}): void {
    state.stepper.runningBackground = false;
    state.stepper.backgroundRunData = backgroundRunData;
}

/* saga */

function* compileSucceededSaga(app: App) {
    try {
        yield* put({type: ActionTypes.StepperDisabled});

        // TODO: Check to see if we can move this into compilation step
        Codecast.runner = yield* call(createRunnerSaga);

        /* Build the stepper state. This automatically runs into user source code. */
        let state = yield* appSelect();

        let stepperState = yield* call(app.stepperApi.buildState, state, state.environment);
        log.getLogger('stepper').debug('[stepper init] current state', state.task.state, 'context state', stepperState.contextState);
        const newState = yield* appSelect();
        log.getLogger('stepper').debug('[stepper init] new state', newState.task.state);

        // buildState may have triggered an error.
        state = yield* appSelect();
        if (state.compile.status !== 'error') {
            /* Enable the stepper */
            yield* put({type: ActionTypes.StepperEnabled});
            yield* put({type: ActionTypes.StepperRestart, payload: {stepperState}});
        }
    } catch (error) {
        yield* put({type: CommonActionTypes.Error, payload: {source: 'stepper', error}});
        console.error(error);
    }
}

function* recorderStoppingSaga() {
    /* Disable the stepper when recording stops. */
    yield* put({type: ActionTypes.StepperExit});
}

function* stepperEnabledSaga(app: App) {
    /* Start the new stepper task. */
    currentStepperTask = yield* fork(app.stepperApi.rootStepperSaga, app);
}

export function* stepperDisabledSaga(action, leaveContext = false, clearSourceHighlight = true) {
    /* Cancel the stepper task if still running. */
    const oldTask = currentStepperTask;
    log.getLogger('stepper').debug('try to disable stepper', oldTask, action, leaveContext, clearSourceHighlight, arguments);

    if (leaveContext) {
        yield* put(taskResetDone(false));
    }

    if (clearSourceHighlight) {
        yield* call(clearSourceHighlightSaga);
    }

    if (oldTask) {
        yield* put({type: ActionTypes.StepperTaskCancelled});

        // @ts-ignore
        yield* cancel(oldTask);

        // Warning: put no code after this, because the cancel will instantly kill this saga
    }
}

function* stepperInteractBeforeSaga(app: App, {payload: {stepperContext}, meta: {resolve, reject}}: {payload: {stepperContext: StepperContext}, meta: {resolve: any, reject: any}}) {
    let state = yield* appSelect();
    /* Has the stepper been interrupted? */
    if (isStepperInterrupting(state) || StepperStatus.Clear === state.stepper.status) {
        log.getLogger('stepper').debug('stepper is still interrupting');
        yield* call(reject, new StepperError('interrupt', 'interrupted'));

        return;
    }

    // Update speed if we use speed
    const context = quickAlgoLibraries.getContext(null, state.environment);
    let newDelay = stepperContext.delayToWait ? stepperContext.delayToWait : 0;
    if ('main' === state.environment) {
        if (null !== stepperContext.speed && undefined !== stepperContext.speed) {
            stepperContext.speed = getStepper(state).speed;
            newDelay = stepperMaxSpeed - stepperContext.speed;
        }
        // log.getLogger('stepper').debug('stepper interact before background run data', stepperContext.backgroundRunData);
        if (stepperContext.backgroundRunData && stepperContext.backgroundRunData.steps) {
            const runData = stepperContext.backgroundRunData;
            // if (runData.result || (!runData.result && runData.steps && runData.steps >= Codecast.runner._steps + 10)) {
            //     newDelay = newDelay / 4;
            // }
            const t = Codecast.runner._steps / (runData.steps - 1);
            const y0 = newDelay;
            const y1 = newDelay / 40;
            const y2 = newDelay / 40;
            const y3 = newDelay;

            // We create a cubic Bézier curve with 4 control points
            // to create an acceleration from y0 to y1 at the beginning of the execution
            // and a deceleration from y2 to y3 at the end of the execution
            // See https://en.wikipedia.org/wiki/B%C3%A9zier_curve for the formula

            newDelay = (1-t)*((1-t)*((1-t)*y0+t*y1)+t*((1-t)*y1+t*y2))+t*((1-t)*((1-t)*y1+t*y2)+t*((1-t)*y2+t*y3));
            // log.getLogger('stepper').debug('new delay definition', {runData, steps: Codecast.runner._steps, maxSteps: runData.steps, t, newDelay})
        }
        stepperContext.delayToWait = Math.round(newDelay);
    }

    if (context && context.changeDelay) {
        context.changeDelay(newDelay);
    }

    if (context && context.changeSoundEnabled) {
        context.changeSoundEnabled('main' === state.environment ? state.task.soundEnabled : false);
    }

    // This is a way to allow some time to refresh the display
    yield* delay(0);

    stepperContext.noInteractive = null === stepperContext.speed || stepperMaxSpeed === stepperContext.speed;
    stepperContext.noInteractiveSteps = 1;

    yield* call(resolve, true);
}

function* stepperInteractSaga(app: App, {payload: {stepperContext, arg}, meta: {resolve, reject}}) {
    let state = yield* appSelect();

    if (!state.stepper.synchronizingAnalysis) {
        // log.getLogger('stepper').debug('current stepper state', stepperContext.state.contextState);

        /* Emit a progress action so that an up-to-date state gets displayed. */

        yield* put({type: ActionTypes.StepperProgress, payload: {stepperContext, progress: arg.progress}});
    }

    /* Run the provided saga if any, or wait until next animation frame. */
    const saga = arg.saga || ('main' === stepperContext.environment ? stepperWaitSaga : null);
    let completed = true;
    if (saga) {
        // @ts-ignore
        completed = yield* call(saga, stepperContext);
    }

    // log.getLogger('stepper').debug('current stepper state2', stepperContext.state.contextState);

    if (state.stepper.synchronizingAnalysis) {
        yield* call(resolve, completed);
        return;
    }

    /* Update stepperContext.state from the global state to avoid discarding
       the effects of user interaction. */
    state = yield* appSelect();
    stepperContext.state = {...getCurrentStepperState(state)};

    // log.getLogger('stepper').debug('current stepper state3', stepperContext.state.contextState);

    /* Continue stepper execution, passing the saga's return value as the
       result of yielding the interact effect. */
    yield* call(resolve, completed);
}

function* stepperWaitSaga() {
    // Yield until the next tick (XXX use requestAnimationFrame through channel).
    log.getLogger('stepper').debug('stepper wait');
    yield* delay(0);
}

function* stepperInterruptSaga(app: App) {
    const state = yield* appSelect();

    const curStepperState = getCurrentStepperState(state);
    if (!curStepperState) {
        return;
    }

    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});

    const stepperContext = createStepperContext(getStepper(state), {
        dispatch: app.dispatch,
        environment: app.environment,
        quickAlgoCallsLogger: ('main' === state.environment || 'replay' === state.environment ? (quickAlgoCall: QuickalgoLibraryCall) => {
            mainQuickAlgoLogger.logQuickAlgoLibraryCall(quickAlgoCall);
        } : null),
    });

    yield* call(stepperRunFromBeginningIfNecessary, stepperContext);

    yield* put({type: ActionTypes.StepperIdle, payload: {stepperContext}});
}

function createStepperContext(stepper: Stepper, stepperContextParameters: StepperContextParameters) {
    const {dispatch} = stepperContextParameters;

    let stepperContext = makeContext(stepper, {
        interactBefore: (arg) => {
            return new Promise((resolve, reject) => {
                dispatch({
                    type: ActionTypes.StepperInteractBefore,
                    payload: {stepperContext, arg},
                    meta: {resolve, reject}
                });
            });
        },
        interactAfter: (arg) => {
            return new Promise((resolve, reject) => {
                dispatch({
                    type: ActionTypes.StepperInteract,
                    payload: {stepperContext, arg},
                    meta: {resolve, reject}
                });
            });
        },
        ...stepperContextParameters,
    });

    return stepperContext;
}

function* stepperStepSaga(app: App, action) {
    let stepperContext: StepperContext;
    try {
        const state = yield* appSelect();
        const {waitForProgress, quickAlgoCallsLogger} = action.payload;

        const stepper = getStepper(state);
        if (stepper.status === StepperStatus.Starting) {
            yield* put({type: ActionTypes.StepperStarted, mode: action.payload.mode, useSpeed: action.payload.useSpeed});

            stepperContext = createStepperContext(stepper, {
                dispatch: app.dispatch,
                waitForProgress,
                waitForProgressOnlyAfterIterationsCount: action.payload.immediate ? 10000 : null, // For BC, we let at maximum 10.000 actions before forcing waiting a stepper.progress event
                quickAlgoCallsLogger: quickAlgoCallsLogger ? quickAlgoCallsLogger : ('main' === state.environment || 'replay' === state.environment ? (quickAlgoCall: QuickalgoLibraryCall) => {
                    mainQuickAlgoLogger.logQuickAlgoLibraryCall(quickAlgoCall);
                } : null),
                environment: state.environment,
                speed: action.payload.useSpeed && !action.payload.immediate ? stepper.speed : null,
                executeEffects: app.stepperApi.executeEffects,
            });
            log.getLogger('stepper').debug('execution stepper context', stepperContext);

            if (action.payload.setStepperContext) {
                action.payload.setStepperContext(stepperContext);
            }

            log.getLogger('stepper').debug('[stepper.step] Creating new stepper context', stepperContext, stepperContext.resume, state.environment, stepperContext.environment);

            yield* call(stepperRunFromBeginningIfNecessary, stepperContext);

            try {
                yield* call(performStep, stepperContext, action.payload.mode);
            } catch (ex) {
                log.getLogger('stepper').debug('stepperStepSaga has catched', ex);
                if (!(ex instanceof StepperError)) {
                    ex = new StepperError('error', stringifyError(ex));
                }
                if (ex instanceof StepperError) {
                    if (ex.condition === 'interrupt') {
                        stepperContext.interrupted = true;

                        yield* put({type: ActionTypes.StepperInterrupted});
                    }
                    if (ex.condition === 'error') {
                        yield* put(stepperExecutionError(LibraryTestResult.fromString(ex.message), false));
                    }
                }
            }

            log.getLogger('stepper').debug('end stepper step');

            if (hasBlockPlatform(stepperContext.state.platform)) {
                stepperContext.state.localVariables = (Codecast.runner as BlocklyRunner).getLocalVariables();
            } else if (stepperContext.state.platform === CodecastPlatform.Python) {
                stepperContext.state.suspensions = getSkulptSuspensionsCopy((Codecast.runner as PythonRunner)._debugger.suspension_stack);
            } else if (stepperContext.state.platform === CodecastPlatform.Unix) {
                stepperContext.state.isFinished = !stepperContext.state.programState.control;
            }

            if (stepperContext.state.isFinished) {
                const taskContext = quickAlgoLibraries.getContext(null, state.environment);

                // Wait the end of animations and context delays before checking end condition and displaying success/error
                yield new Promise((resolve) => {
                    taskContext.executeWhenReady(resolve);
                });

                log.getLogger('stepper').debug('check end condition');
                if (taskContext && taskContext.needsRedrawDisplay) {
                    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
                }
                if (taskContext && taskContext.infos.checkEndCondition) {
                    try {
                        taskContext.infos.checkEndCondition(taskContext, true);
                    } catch (executionResult: unknown) {
                        // checkEndCondition can throw the message or an object with more details
                        const message: string = executionResult instanceof LibraryTestResult ? executionResult.getMessage() : executionResult as string;

                        const computeGrade = taskContext.infos.computeGrade ? taskContext.infos.computeGrade : (context: QuickAlgoLibrary, message: string) => {
                            let rate = 0;
                            if (context.success) {
                                rate = 1;
                            }

                            return {
                                successRate: rate,
                                message: message
                            };
                        };

                        const gradeResult: {successRate: number, message: string} = computeGrade(taskContext, message);
                        const aggregatedLibraryTestResult = executionResult instanceof LibraryTestResult
                            ? executionResult : LibraryTestResult.fromString(message);
                        aggregatedLibraryTestResult.successRate = gradeResult.successRate;
                        aggregatedLibraryTestResult.message = gradeResult.message;

                        // @ts-ignore
                        if (taskContext.success) {
                            yield* put(stepperExecutionSuccess(aggregatedLibraryTestResult));
                        } else {
                            yield* put(stepperExecutionError(aggregatedLibraryTestResult));
                        }
                    }
                }
            }

            const newState = yield* appSelect();
            const newStepper = getStepper(newState);
            if (StepperStatus.Clear !== newStepper.status) {
                yield* put({type: ActionTypes.StepperIdle, payload: {stepperContext}});
            }
        }
    } finally {
        log.getLogger('stepper').debug('end stepper saga, call onStepperDone', stepperContext.onStepperDone);
        // We make a final call to waitForProgress to start over the execution
        // of the replay thread
        if (stepperContext.onStepperDone) {
            stepperContext.onStepperDone(stepperContext);
        }
    }
}

/**
 * Before we do a step, we check if the state in analysis is the same as the one in the python runner.
 *
 * If it is different, it means the analysis has been overwritten by playing a record, and so
 * we need to move the python runner to the same point before we can to a step.
 */
function* stepperRunFromBeginningIfNecessary(stepperContext: StepperContext) {
    log.getLogger('stepper').debug('check stepper run', stepperContext.state.analysis);
    if (!Codecast.runner.isSynchronizedWithAnalysis(stepperContext.state.analysis)) {
        log.getLogger('stepper').debug('Run from beginning is necessary');
        const state = yield* appSelect();
        const taskContext = quickAlgoLibraries.getContext(null, state.environment);
        yield* put({type: ActionTypes.StepperSynchronizingAnalysisChanged, payload: true});

        const changeDisplay = 'main' === state.environment;

        if (changeDisplay) {
            taskContext.display = false;
        }
        stepperContext.taskDisplayNoneStatus = 'running';
        taskContext.resetAndReloadState(selectCurrentTestData(state), state);
        stepperContext.state.contextState = getCurrentImmerState(taskContext.getInnerState());
        log.getLogger('stepper').debug('current task state', taskContext.getInnerState());

        if (!Codecast.runner) {
            Codecast.runner = yield* call(createRunnerSaga);
        }
        taskContext.runner = Codecast.runner;

        const blocksData = getContextBlocksDataSelector({state, context: taskContext});

        const interpreter = Codecast.runner;
        interpreter.initCodes([stepperContext.state.analysis.code], blocksData);
        while (interpreter._steps < stepperContext.state.analysis.stepNum) {
            log.getLogger('stepper').debug('Make new step', interpreter._steps);
            yield* apply(interpreter, interpreter.runStep, [stepperContext.quickAlgoCallsExecutor]);

            if (interpreter._isFinished) {
                break;
            }
        }
        yield* put({type: ActionTypes.StepperSynchronizingAnalysisChanged, payload: false});

        if (changeDisplay) {
            taskContext.display = true;
        }
        yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
        log.getLogger('stepper').debug('End run from beginning');
    }
}

function* stepperExitSaga() {
    /* Disabled the stepper. */
    yield* put({type: ActionTypes.StepperDisabled});

    /* Clear the compile state. */
    yield* put({type: ActionTypes.CompileClear});
}

export function* updateSourceHighlightSaga(state: AppStoreReplay) {
    log.getLogger('stepper').debug('update source hightlight');
    const stepperState = state.stepper.currentStepperState;
    if (!stepperState) {
        return;
    }

    if (hasBlockPlatform(state.options.platform)) {
        yield* put({
            type: BufferActionTypes.BufferHighlight,
            buffer: 'source',
            range: stepperState.currentBlockId,
        });
    } else {
        const range = getNodeRange(stepperState);

        yield* put({
            type: BufferActionTypes.BufferHighlight,
            buffer: 'source',
            range
        });
    }
}

export function* clearSourceHighlightSaga() {
    const state = yield* appSelect();

    if (hasBlockPlatform(state.options.platform)) {
        yield* put({type: BufferActionTypes.BufferHighlight, buffer: 'source', range: null});
    } else {
        yield* put({type: BufferActionTypes.BufferHighlight, buffer: 'source', range: null});
    }
}

function* stepperRunBackgroundSaga(app: App, {payload: {callback}}) {
    const state = yield* appSelect();
    const answer = selectAnswer(state);
    const level = state.task.currentLevel;
    const testId = state.task.currentTestId;

    const tests = yield* appSelect(state => state.task.taskTests);

    let preExecutionTests: number[] = [];
    if (null !== testId) {
        preExecutionTests.push(testId);
    }
    const context = quickAlgoLibraries.getContext(null, 'main');
    if (context && context.infos.hiddenTests) {
        preExecutionTests = [...tests.keys()];
    }

    let lastBackgroundResult = null;
    for (let preExecutionTestId of preExecutionTests) {
        const {success, exit} = yield* race({
            success: call([taskSubmissionExecutor, taskSubmissionExecutor.makeBackgroundExecution], level, preExecutionTestId, answer),
            exit: take(ActionTypes.StepperExit),
        });
        yield* delay(0);
        if (success) {
            log.getLogger('stepper').debug('run background result', success);
            lastBackgroundResult = success;
            // @ts-ignore
            if (!success.result) {
                break;
            }
        } else if (exit) {
            log.getLogger('stepper').debug('cancel background execution');
            yield* call([taskSubmissionExecutor, taskSubmissionExecutor.cancelBackgroundExecution]);
            break;
        }
    }

    log.getLogger('stepper').debug('return result');
    callback(lastBackgroundResult);
}

function* stepperCompileFromControlsSaga(app: App) {
    const stepperStatus = yield* appSelect(state => state.stepper.status);

    let backgroundRunData: TaskSubmissionResultPayload = null;
    if (StepperStatus.Clear === stepperStatus) {
        let runBackgroundOver;
        const promise = new Promise((resolve) => {
            runBackgroundOver = resolve;
        });

        yield* put(stepperRunBackground(runBackgroundOver));

        backgroundRunData = yield promise;
        log.getLogger('stepper').debug('background execution result', backgroundRunData);
        if (null !== backgroundRunData) {
            const context = quickAlgoLibraries.getContext(null, 'main');
            const currentTestId = yield* appSelect(state => state.task.currentTestId);
            if (context && context.infos.hiddenTests && !backgroundRunData.result && backgroundRunData.testId !== currentTestId) {
                log.getLogger('stepper').debug('change test', backgroundRunData.testId);
                yield* put(updateCurrentTestId({testId: backgroundRunData.testId}));
            }
        }
    }

    const deferredPromise = new DeferredPromise();

    yield* put({
        type: ActionTypes.CompileWait,
        payload: {
            callback(result) {
                app.dispatch(stepperRunBackgroundFinished(backgroundRunData));
                deferredPromise.resolve(CompileStatus.Done === result);
            }
        },
    });

    yield* call(() => deferredPromise.promise);
}

function* stepperStepFromControlsSaga(app: App, {payload: {mode, useSpeed}}) {
    const state = yield* appSelect();
    if ('tralalere' === state.options.app) {
        yield* put({type: LayoutActionTypes.LayoutMobileModeChanged, payload: {mobileMode: LayoutMobileMode.EditorPlayer}});
    }

    const stepperControlsState = getStepperControlsSelector(state, {enabled: true});
    const stepper = getStepper(state);
    const mustCompile = StepperStatus.Clear === stepper.status;

    if (mustCompile) {
        yield* call(stepperCompileFromControlsSaga, app);
    }

    if (!stepperControlsState.canStep) {
        yield* put({type: ActionTypes.StepperInterrupting, payload: {}});
        yield* take(ActionTypes.StepperInterrupted);
    }

    yield* put({type: ActionTypes.StepperStep, payload: {mode, useSpeed}});
}

function* stepperSaga(app: App) {
    yield* takeLatest(ActionTypes.CompileSucceeded, compileSucceededSaga, app);
    yield* takeLatest(RecorderActionTypes.RecorderStopping, recorderStoppingSaga);
    yield* takeLatest(ActionTypes.StepperEnabled, stepperEnabledSaga, app);
    yield* takeLatest(ActionTypes.StepperDisabled, stepperDisabledSaga);
    yield* takeLatest(ActionTypes.StepperCompileAndStep, function*(app: App, {payload}) {
        const stepperState = yield* appSelect(state => state.stepper.status);
        if (StepperStatus.Clear === stepperState) {
            const result = yield new Promise((callback) => {
                app.dispatch({
                    type: StepperActionTypes.CompileWait,
                    payload: {
                        callback,
                        ...payload,
                    },
                });
            });

            if (CompileStatus.Done !== result) {
                return;
            }
        }

        yield* put({type: StepperActionTypes.StepperStep, payload});
    }, app);

    // @ts-ignore
    yield* takeLatest(ActionTypes.StepperRunBackground, stepperRunBackgroundSaga, app);
    // @ts-ignore
    yield* takeLatest(ActionTypes.StepperStepFromControls, stepperStepFromControlsSaga, app);

    // @ts-ignore
    yield* takeEvery([StepperActionTypes.StepperExecutionError, StepperActionTypes.CompileFailed], function*({payload}) {
        log.getLogger('stepper').debug('receive an error, display it');
        yield* put(stepperDisplayError(payload.testResult));
    });
}

/* Post-link, register record and replay hooks. */

function postLink(app: App) {
    const {stepperApi} = app;

    addStepperRecordAndReplayHooks(app);

    stepperApi.onInit(function(stepperState: StepperState, state: AppStore) {
        const {platform} = state.options;

        switch (platform) {
            case CodecastPlatform.Python:
            case CodecastPlatform.Blockly:
            case CodecastPlatform.Scratch:
                stepperState.lastProgramState = {};
                stepperState.programState = {...stepperState.lastProgramState};

                break;
            case CodecastPlatform.Arduino:
            case CodecastPlatform.Unix:
                const syntaxTree = state.compile.syntaxTree;
                const options = stepperState.options = {
                    memorySize: 0x10000,
                    stackSize: 4096,
                };

                /* Set up the programState. */
                const emptyProgramState = stepperState.lastProgramState = C.makeCore(options.memorySize);

                /* Execute declarations and copy strings into memory */
                const initialProgramState = stepperState.programState = {...emptyProgramState};
                const decls = syntaxTree[2];
                C.execDecls(initialProgramState, decls);

                /* Set up the call to the main function. */
                C.setupCall(initialProgramState, 'main');

                break;
        }
    });

    stepperApi.addSaga(function* mainStepperSaga(args) {
        // @ts-ignore
        yield* takeEvery(ActionTypes.StepperInteract, stepperInteractSaga, args);
        // @ts-ignore
        yield* takeEvery(ActionTypes.StepperInteractBefore, stepperInteractBeforeSaga, args);
        yield* takeEvery(ActionTypes.StepperStep, stepperStepSaga, args);
        yield* takeEvery(ActionTypes.StepperInterrupt, stepperInterruptSaga, args);
        // @ts-ignore
        yield* takeEvery(ActionTypes.StepperExit, stepperExitSaga);

        yield* takeEvery([
            StepperActionTypes.StepperExecutionSuccess,
            StepperActionTypes.StepperExecutionError,
            StepperActionTypes.CompileFailed,
        // @ts-ignore
        ], function*({payload}) {
            let state = yield* appSelect();
            if (state.stepper && state.stepper.status === StepperStatus.Running && !isStepperInterrupting(state)) {
                yield* put({type: ActionTypes.StepperInterrupting, payload: {}});
            }
            // yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
            yield* call(stepperDisabledSaga, null, true, false !== payload.clearHighlight);
        });

        /* Highlight the range of the current source fragment. */
        yield* throttle(stepperThrottleDisplayDelay, [
            ActionTypes.StepperProgress,
            ActionTypes.StepperIdle,
            ActionTypes.StepperRestart,
            ActionTypes.StepperUndo,
            ActionTypes.StepperRedo,
            ActionTypes.StepperStackUp,
            ActionTypes.StepperStackDown
        ], function* () {
            const state = yield* appSelect();
            yield* call(updateSourceHighlightSaga, state);
        });
    });
}
