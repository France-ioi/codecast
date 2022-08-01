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

import {apply, call, cancel, delay, fork, put, race, select, take, takeEvery, takeLatest,} from 'typed-redux-saga';
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
    stepperExecutionSuccess
} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as BufferActionTypes} from "../buffers/actionTypes";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {getCurrentStepperState, getStepper, isStepperInterrupting} from "./selectors";
import {AppStore, AppStoreReplay, CodecastPlatform} from "../store";
import {TermBuffer} from "./io/terminal";
import {PlayerInstant} from "../player";
import {ReplayContext} from "../player/sagas";
import {Bundle} from "../linker";
import {App, Codecast} from "../index";
import {mainQuickAlgoLogger, quickAlgoLibraries, QuickAlgoLibrariesActionType} from "../task/libs/quickalgo_libraries";
import {selectCurrentTest, taskResetDone} from "../task/task_slice";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {getCurrentImmerState} from "../task/utils";
import PythonRunner from "./python/python_runner";
import {getContextBlocksDataSelector} from "../task/blocks/blocks";
import {selectAnswer} from "../task/selectors";
import AbstractRunner from "./abstract_runner";
import {SagaIterator} from "redux-saga";
import BlocklyRunner from "./js/blockly_runner";
import UnixRunner from "./c/unix_runner";
import {AnalysisSnapshot, CodecastAnalysisSnapshot, convertAnalysisDAPToCodecastFormat} from "./analysis/analysis";

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
    error: null as any,
};

export function* createRunnerSaga(): SagaIterator<AbstractRunner> {
    const environment = yield* select((state: AppStore) => state.environment);
    const platform = yield* select((state: AppStore) => state.options.platform);
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

    console.log('make enrich', stepperState, Codecast.runner);
    if (hasBlockPlatform(stepperState.platform)) {
        stepperState.currentBlockId = (Codecast.runner as BlocklyRunner).getCurrentBlockId();
        console.log('got block id', stepperState.currentBlockId);
        if (context === 'Stepper.Progress') {
            if (Codecast.runner._isFinished) {
                console.log('bim is finished');
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

        console.log('blockly analysis', stepperState.analysis);
        console.log('last analysis', stepperState.lastAnalysis);
        stepperState.codecastAnalysis = convertAnalysisDAPToCodecastFormat(stepperState.analysis, stepperState.lastAnalysis);
        console.log('codecast analysis', stepperState.codecastAnalysis);
    } else if (stepperState.platform === CodecastPlatform.Python) {
        if (context === 'Stepper.Progress') {
            // Don't reanalyse after program is finished :
            // keep the last state of the stack and set isFinished state.
            if (Codecast.runner._isFinished) {
                stepperState.isFinished = true;
            } else {
                console.log('INCREASE STEP NUM TO ', stepperState.analysis.stepNum + 1);
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

        console.log('python analysis', stepperState.analysis);
        stepperState.codecastAnalysis = convertAnalysisDAPToCodecastFormat(stepperState.analysis, stepperState.lastAnalysis);
        console.log('codecast analysis', stepperState.codecastAnalysis);
    } else {
        const analysis = stepperState.analysis = analyseState(programState);
        const focusDepth = controls.stack.focusDepth;
        stepperState.directives = collectDirectives(analysis.functionCallStack, focusDepth);

        // TODO? initialize controls for each directive added, clear controls for each directive removed (except 'stack').
    }
}

export function clearStepper(stepper: Stepper) {
    stepper.status = StepperStatus.Clear;
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
            const blocksData = getContextBlocksDataSelector(state, context);

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
    // console.log('previous state', stepperContext.state.contextState, 'and progress', progress);
    stepperContext.state = {...stepperContext.state};

    if (false !== progress) {
        if (stepperContext.state.platform === CodecastPlatform.Blockly) {
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

/* saga */

function* compileSucceededSaga(app: App) {
    try {
        yield* put({type: ActionTypes.StepperDisabled});

        // Create a runner for this
        Codecast.runner = yield* call(createRunnerSaga);

        /* Build the stepper state. This automatically runs into user source code. */
        let state: AppStore = yield* select();

        let stepperState = yield* call(app.stepperApi.buildState, state, state.environment);
        console.log('[stepper init] current state', state.task.state, 'context state', stepperState.contextState);
        const newState = yield* select();
        console.log('[stepper init] new state', newState.task.state);

        // buildState may have triggered an error.
        state = yield* select();
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
    yield* put({type: ActionTypes.StepperInterrupt});
    yield* put({type: ActionTypes.StepperExit});
}

function* stepperEnabledSaga(app: App) {
    /* Start the new stepper task. */
    currentStepperTask = yield* fork(app.stepperApi.rootStepperSaga, app);
}

export function* stepperDisabledSaga(action, leaveContext = false) {
    /* Cancel the stepper task if still running. */
    const oldTask = currentStepperTask;
    console.log('try to disable stepper', oldTask, leaveContext);

    if (leaveContext) {
        yield* put(taskResetDone(false));
    }

    if (oldTask) {
        // @ts-ignore
        yield* cancel(oldTask);

        yield* put({type: ActionTypes.StepperTaskCancelled});
    }

    yield* call(clearSourceHighlightSaga);
}

function* stepperInteractBeforeSaga(app: App, {meta: {resolve, reject}}) {
    let state: AppStore = yield* select();

    console.log('inside stepper interact before');

    /* Has the stepper been interrupted? */
    if (isStepperInterrupting(state) || StepperStatus.Clear === state.stepper.status) {
        console.log('stepper is still interrupting');
        yield* call(reject, new StepperError('interrupt', 'interrupted'));

        return;
    }

    yield* call(resolve, true);
}

function* stepperInteractSaga(app: App, {payload: {stepperContext, arg}, meta: {resolve, reject}}) {
    let state: AppStore = yield* select();

    if (!state.stepper.synchronizingAnalysis) {
        // console.log('current stepper state', stepperContext.state.contextState);

        /* Emit a progress action so that an up-to-date state gets displayed. */

        yield* put({type: ActionTypes.StepperProgress, payload: {stepperContext, progress: arg.progress}});

        /* Has the stepper been interrupted? */
        if (isStepperInterrupting(state) || StepperStatus.Clear === state.stepper.status) {
            console.log('stepper is still interrupting');
            yield* call(reject, new StepperError('interrupt', 'interrupted'));

            return;
        }
    }

    /* Run the provided saga if any, or wait until next animation frame. */
    const saga = arg.saga || ('main' === stepperContext.environment ? stepperWaitSaga : null);
    let completed = true;
    let interrupted = false;
    if (saga) {
        const result = yield* race({
            completed: call(saga, stepperContext),
            interrupted: take(ActionTypes.StepperInterrupt)
        });
        completed = !!result.completed;
        interrupted = !!result.interrupted;
    }

    // console.log('current stepper state2', stepperContext.state.contextState);

    if (state.stepper.synchronizingAnalysis) {
        yield* call(resolve, completed);
        return;
    }

    /* Update stepperContext.state from the global state to avoid discarding
       the effects of user interaction. */
    state = yield* select();
    stepperContext.state = {...getCurrentStepperState(state)};

    // Update speed if we use speed
    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (null !== stepperContext.speed) {
        stepperContext.speed = getStepper(state).speed;
        if (context && context.changeDelay) {
            context.changeDelay(255 - stepperContext.speed);
        }
    } else {
        if (context && context.changeDelay) {
            context.changeDelay(0);
        }
    }

    // console.log('current stepper state3', stepperContext.state.contextState);

    /* Check whether to interrupt or resume the stepper. */
    if (interrupted) {
        /**
         * It is strange to use reject() for a behavior that is normal (pausing the stepper).
         */
        yield* call(reject, new StepperError('interrupt', 'interrupted'));
    } else {
        /* Continue stepper execution, passing the saga's return value as the
           result of yielding the interact effect. */
        yield* call(resolve, completed);
    }
}

function* stepperWaitSaga() {
    // Yield until the next tick (XXX use requestAnimationFrame through channel).
    console.log('stepper wait');
    yield* delay(0);
}

function* stepperInterruptSaga(app: App) {
    const state = yield* select();

    const curStepperState = getCurrentStepperState(state);
    if (!curStepperState) {
        return;
    }

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

function createStepperContext(stepper: Stepper, {dispatch, waitForProgress, waitForProgressOnlyAfterIterationsCount, quickAlgoCallsLogger, environment, speed, executeEffects}: StepperContextParameters) {
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
        waitForProgress,
        waitForProgressOnlyAfterIterationsCount,
        quickAlgoCallsLogger,
        dispatch,
        environment,
        speed,
        executeEffects,
    });

    return stepperContext;
}

function* stepperStepSaga(app: App, action) {
    let stepperContext: StepperContext;
    try {
        const state: AppStore = yield* select();
        const {waitForProgress, quickAlgoCallsLogger} = action.payload;

        const stepper = getStepper(state);
        if (stepper.status === StepperStatus.Starting) {
            yield* put({type: ActionTypes.StepperStarted, mode: action.payload.mode});

            console.log('execution speed', action.payload.useSpeed ? stepper.speed : null)
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
            console.log('execution stepper context', stepperContext);

            if (action.payload.setStepperContext) {
                action.payload.setStepperContext(stepperContext);
            }

            console.log('[stepper.step] Creating new stepper context', stepperContext, stepperContext.resume, state.environment, stepperContext.environment);

            yield* call(stepperRunFromBeginningIfNecessary, stepperContext);

            try {
                yield* call(performStep, stepperContext, action.payload.mode);
            } catch (ex) {
                console.log('stepperStepSaga has catched', ex);
                if (!(ex instanceof StepperError)) {
                    ex = new StepperError('error', stringifyError(ex));
                }
                if (ex instanceof StepperError) {
                    if (ex.condition === 'interrupt') {
                        stepperContext.interrupted = true;

                        yield* put({type: ActionTypes.StepperInterrupted});
                    }
                    if (ex.condition === 'error') {
                        yield* put(stepperExecutionError(ex.message));
                    }
                }
            }

            if (stepperContext.state.platform === CodecastPlatform.Blockly) {
                stepperContext.state.localVariables = (Codecast.runner as BlocklyRunner).getLocalVariables();
            } else if (stepperContext.state.platform === CodecastPlatform.Python) {
                stepperContext.state.suspensions = getSkulptSuspensionsCopy((Codecast.runner as PythonRunner)._debugger.suspension_stack);
            } else if (stepperContext.state.platform === CodecastPlatform.Unix) {
                stepperContext.state.isFinished = !stepperContext.state.programState.control;
            }

            if (stepperContext.state.isFinished) {
                console.log('check end condition');
                const taskContext = quickAlgoLibraries.getContext(null, state.environment);
                if (taskContext && taskContext.infos.checkEndCondition) {
                    try {
                        taskContext.infos.checkEndCondition(taskContext, true);
                    } catch (message) {
                        // @ts-ignore
                        if (taskContext.success) {
                            yield* put(stepperExecutionSuccess(message));
                        } else {
                            yield* put(stepperExecutionError(message));
                        }
                    }
                }
            }

            const newState = yield* select();
            const newStepper = getStepper(newState);
            if (StepperStatus.Clear !== newStepper.status) {
                yield* put({type: ActionTypes.StepperIdle, payload: {stepperContext}});
            }
        }
    } finally {
        console.log('end stepper saga, call onStepperDone', stepperContext.onStepperDone);
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
    console.log('check stepper run', stepperContext.state.analysis);
    if (!Codecast.runner.isSynchronizedWithAnalysis(stepperContext.state.analysis)) {
        console.log('Run from beginning is necessary');
        const state = yield* select();
        const taskContext = quickAlgoLibraries.getContext(null, state.environment);
        yield* put({type: ActionTypes.StepperSynchronizingAnalysisChanged, payload: true});

        taskContext.display = false;
        taskContext.resetAndReloadState(selectCurrentTest(state), state);
        stepperContext.state.contextState = getCurrentImmerState(taskContext.getInnerState());
        console.log('current task state', taskContext.getInnerState());

        if (!Codecast.runner) {
            Codecast.runner = yield* call(createRunnerSaga);
        }
        taskContext.runner = Codecast.runner;

        const blocksData = getContextBlocksDataSelector(state, taskContext);

        const interpreter = Codecast.runner;
        interpreter.initCodes([stepperContext.state.analysis.code], blocksData);
        while (interpreter._steps < stepperContext.state.analysis.stepNum) {
            console.log('Make new step', interpreter._steps);
            yield* apply(interpreter, interpreter.runStep, [stepperContext.quickAlgoCallsExecutor]);

            if (interpreter._isFinished) {
                break;
            }
        }
        yield* put({type: ActionTypes.StepperSynchronizingAnalysisChanged, payload: false});

        taskContext.display = true;
        yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
        console.log('End run from beginning');
    }
}

function* stepperExitSaga() {
    /* Disabled the stepper. */
    yield* put({type: ActionTypes.StepperDisabled});

    /* Clear the compile state. */
    yield* put({type: ActionTypes.CompileClear});
}

export function* updateSourceHighlightSaga(state: AppStoreReplay) {
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

function* clearSourceHighlightSaga() {
    const state: AppStore = yield* select();

    if (hasBlockPlatform(state.options.platform)) {
        yield* put({type: BufferActionTypes.BufferHighlight, buffer: 'source', range: null});
    } else {
        const startPos = {row: 0, column: 0};
        yield* put({type: BufferActionTypes.BufferHighlight, buffer: 'source', range: {start: startPos, end: startPos}});
    }
}

function* stepperSaga(args) {
    yield* takeLatest(ActionTypes.CompileSucceeded, compileSucceededSaga, args);
    yield* takeLatest(RecorderActionTypes.RecorderStopping, recorderStoppingSaga);
    yield* takeLatest(ActionTypes.StepperEnabled, stepperEnabledSaga, args);
    yield* takeLatest(ActionTypes.StepperDisabled, stepperDisabledSaga);
    yield* takeLatest(ActionTypes.StepperCompileAndStep, function*(app: App, {payload}) {
        const stepperState = yield* select((state: AppStore) => state.stepper.status);
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
    }, args);

    // @ts-ignore
    yield* takeEvery([StepperActionTypes.StepperExecutionError, StepperActionTypes.CompileFailed], function*({payload}) {
        console.log('receive an error, display it');
        yield* put(stepperDisplayError(payload.error));
    });
}

/* Post-link, register record and replay hooks. */

function postLink(app: App) {
    const {recordApi, replayApi, stepperApi} = app;

    recordApi.onStart(function* (init) {
        const state: AppStore = yield* select();
        const stepperState = state.stepper;
        if (stepperState) {
            init.speed = stepperState.speed;
        }
    });
    replayApi.on('start', function*(replayContext: ReplayContext, event) {
        const options = event[2];
        yield* put({type: PlayerActionTypes.PlayerReset, payload: {sliceName: 'stepper', state: {...initialStateStepper}}});
        if (options.speed) {
            yield* put({type: ActionTypes.StepperSpeedChanged, payload: {speed: options.speed}});
        }
    });
    replayApi.onReset(function* (instant: PlayerInstant) {
        const stepperState = instant.state.stepper;

        yield* put({type: ActionTypes.StepperReset, payload: {stepperState}});
    });

    recordApi.on(ActionTypes.StepperExit, function* (addEvent) {
        yield* call(addEvent, 'stepper.exit');
    });
    replayApi.on('stepper.exit', function* (replayContext: ReplayContext) {
        yield* put({type: ActionTypes.StepperExit});
        replayContext.addSaga(function* () {
            console.log('make reset saga');
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context) {
                const state = yield* select();
                context.resetAndReloadState(selectCurrentTest(state), state);
            }
        })
    });

    recordApi.on(ActionTypes.StepperStarted, function* (addEvent, action) {
        const {mode} = action;

        yield* call(addEvent, 'stepper.step', mode);
    });
    replayApi.on('stepper.step', function* (replayContext: ReplayContext, event) {
        const mode = event[2];

        let promiseResolve;
        const promise = new Promise((resolve) => {
            promiseResolve = resolve;
        });

        const immediate = -1 !== event.indexOf('immediate');

        const waitForProgress = (stepperContext) => {
            return new Promise((cont) => {
                console.log('[stepper.step] stepper suspend', cont);
                stepperSuspend(stepperContext, cont);
                promiseResolve();
            });
        }

        const setStepperContext = (stepperContext) => {
            console.log('[stepper.step] set stepper context', stepperContext, promiseResolve);
            replayContext.stepperContext = stepperContext;
            replayContext.stepperContext.onStepperDone = promiseResolve;
        };


        console.log('[stepper.step] before put step', immediate);
        yield* put({
            type: ActionTypes.StepperStep,
            payload: {
                mode,
                waitForProgress,
                immediate,
                setStepperContext,
                quickAlgoCallsLogger: (call) => {
                    mainQuickAlgoLogger.logQuickAlgoLibraryCall(call);
                    replayContext.addQuickAlgoLibraryCall(call);
                },
            },
        });

        console.log('[stepper.step] before yield promise', promise);
        yield promise;
        console.log('[stepper.step] after yield promise', promise);

        replayContext.addSaga(function* () {
            const speed = yield* select((state: AppStore) => state.stepper.speed);
            console.log('[stepper.step] set speed', speed);
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context && context.changeDelay) {
                context.changeDelay(255 - speed);
            }
        });
    });

    recordApi.on(ActionTypes.StepperInteractBefore, function* (addEvent) {
        const state = yield* select();
        if (isStepperInterrupting(state) || StepperStatus.Clear === state.stepper.status) {
            console.log('stepper is still interrupting, not logging progress');
            return;
        }

        const range = getNodeRange(getCurrentStepperState(state));
        yield* call(addEvent, 'stepper.progress', range ? range.start : null);
    });

    replayApi.on('stepper.progress', function* (replayContext: ReplayContext, event) {
        console.log('[stepper.progress] start');

        const promise = new Promise((resolve) => {
            console.log('[stepper.progress] set onStepperDone', resolve);
            replayContext.stepperContext.waitForProgress = (stepperContext) => {
                return new Promise((cont) => {
                    console.log('[stepper.progress] stepper suspend', cont);
                    stepperSuspend(stepperContext, cont);
                    resolve(true);
                });
            };

            replayContext.stepperContext.onStepperDone = resolve;
        });

        const {resume} = replayContext.stepperContext;
        console.log('[stepper.progress] resume', resume);
        if (resume) {
            try {
                console.log('[stepper.progress] do resume');
                replayContext.stepperContext.resume = null;
                resume();
                yield promise;
                console.log('[stepper.progress] end resume');
            } catch (e) {
                console.error('exception', e);
            }
        } else {
            console.warn('There is no resume function for the stepper.progress event, skipping the event');
        }
    });

    recordApi.on(ActionTypes.StepperInterrupt, function* (addEvent) {
        yield* call(addEvent, 'stepper.interrupt');
    });
    replayApi.on('stepper.interrupt', function* (replayContext: ReplayContext) {
        const stepperContext = replayContext.stepperContext;

        yield* put({type: ActionTypes.StepperInterrupt, payload: {stepperContext}});
    });

    replayApi.on('stepper.restart', function* () {
        const state = yield* select();
        const stepperState = yield* call(app.stepperApi.buildState, state, state.environment);

        yield* put({type: ActionTypes.StepperEnabled});
        yield* put({type: ActionTypes.StepperRestart, payload: {stepperState}});
    });

    function stepperSuspend(stepperContext: StepperContext, cont) {
        console.log('[stepper.suspend]');
        stepperContext.resume = cont;
    }

    recordApi.on(ActionTypes.StepperUndo, function* (addEvent) {
        yield* call(addEvent, 'stepper.undo');
    });
    replayApi.on('stepper.undo', function* () {
        yield* put({type: ActionTypes.StepperUndo});
    });

    recordApi.on(ActionTypes.StepperRedo, function* (addEvent) {
        yield* call(addEvent, 'stepper.redo');
    });
    replayApi.on('stepper.redo', function* () {
        yield* put({type: ActionTypes.StepperRedo});
    });

    recordApi.on(ActionTypes.StepperStackUp, function* (addEvent) {
        yield* call(addEvent, 'stepper.stack.up');
    });
    replayApi.on('stepper.stack.up', function* () {
        yield* put({type: ActionTypes.StepperStackUp});
    });

    recordApi.on(ActionTypes.StepperStackDown, function* (addEvent) {
        yield* call(addEvent, 'stepper.stack.down');
    });
    replayApi.on('stepper.stack.down', function* () {
        yield* put({type: ActionTypes.StepperStackDown});
    });

    recordApi.on(ActionTypes.StepperViewControlsChanged, function* (addEvent, action) {
        const {key, update} = action;

        yield* call(addEvent, 'stepper.view.update', key, update);
    });
    replayApi.on('stepper.view.update', function* (replayContext: ReplayContext, event) {
        const key = event[2];
        const update = event[3];

        yield* put({type: ActionTypes.StepperViewControlsChanged, key, update});
    });

    recordApi.on(ActionTypes.StepperSpeedChanged, function* (addEvent, action) {
        const {payload: {speed}} = action;

        yield* call(addEvent, 'stepper.speed.changed', speed);
    });
    replayApi.on('stepper.speed.changed', function* (replayContext: ReplayContext, event) {
        const speed = event[2];

        yield* put({type: ActionTypes.StepperSpeedChanged, payload: {speed}});

        replayContext.addSaga(function* () {
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context && context.changeDelay) {
                context.changeDelay(255 - speed);
            }
        });
    });

    recordApi.on(ActionTypes.StepperControlsChanged, function* (addEvent, action) {
        const {payload: {controls}} = action;

        yield* call(addEvent, 'stepper.controls.changed', controls);
    });
    replayApi.on('stepper.controls.changed', function* (replayContext: ReplayContext, event) {
        const controls = event[2];

        yield* put({type: ActionTypes.StepperControlsChanged, payload: {controls}});
    });

    recordApi.on(ActionTypes.StepperClearError, function* (addEvent) {
        yield* call(addEvent, 'stepper.clear_error');
    });
    replayApi.on(['compile.clearDiagnostics', 'stepper.clear_error'], function* () {
        yield* put({type: ActionTypes.StepperClearError});
    });

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
        ], function*() {
            let state: AppStore = yield* select();
            if (state.stepper && state.stepper.status === StepperStatus.Running && !isStepperInterrupting(state)) {
                yield* put({type: ActionTypes.StepperInterrupt, payload: {}});
            }
            yield* call(stepperDisabledSaga, true);
        });

        /* Highlight the range of the current source fragment. */
        yield* takeLatest([
            ActionTypes.StepperProgress,
            ActionTypes.StepperIdle,
            ActionTypes.StepperRestart,
            ActionTypes.StepperUndo,
            ActionTypes.StepperRedo,
            ActionTypes.StepperStackUp,
            ActionTypes.StepperStackDown
        ], function* () {
            const state = yield* select();
            yield* call(updateSourceHighlightSaga, state);
        });
    });
}
