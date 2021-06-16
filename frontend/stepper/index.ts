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

import {apply, call, cancel, delay, fork, put, race, select, take, takeEvery, takeLatest} from 'redux-saga/effects';
import * as C from 'persistent-c';

import {
    buildState,
    default as ApiBundle,
    makeContext,
    performStep,
    rootStepperSaga,
    StepperContext,
    StepperError
} from './api';
import CompileBundle, {CompileStatus} from './compile';
import EffectsBundle from './c/effects';

import DelayBundle from './delay';
import HeapBundle from './c/heap';
import IoBundle from './io/index';
import ViewsBundle from './views/index';
import ArduinoBundle, {ArduinoPort} from './arduino';
import PythonBundle, {getNewOutput, getNewTerminal} from './python';
import {analyseState, collectDirectives} from './c/analysis';
import {analyseSkulptState, getSkulptSuspensionsCopy, SkulptAnalysis} from "./python/analysis/analysis";
import {Directive, parseDirectives} from "./python/directives";
import {ActionTypes as CompileActionTypes, ActionTypes} from "./actionTypes";
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
import {App} from "../index";
import {produce} from "immer";
import {quickAlgoLibraries} from "../task/libs/quickalgo_librairies";
import {taskSuccess} from "../task/task_slice";

export interface StepperTask {

}

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

/**
 * TODO: This type is used in directives but it may actually be a different type that is used there.
 */
export type StepperControls = typeof initialStepperStateControls;

// TODO: Separate the needs per platform (StepperStatePython, StepperStateC, etc)
const initialStateStepperState = {
    platform: 'unix' as CodecastPlatform,
    inputPos: 0, // Only used for python
    input: '',
    output: '', // Only used for python
    terminal: null as TermBuffer, // Only used for python
    suspensions: [] as readonly any[],  // Only used for python // TODO: Don't put this in the store
    programState: {} as any, // Only used for c
    lastProgramState: {} as any, // Only used for c
    ports: [] as ArduinoPort[], // Only used for arduino
    selectedPort: {} as any, // Only used for arduino
    controls: initialStepperStateControls, // Only used for c
    analysis: null as SkulptAnalysis | any,
    lastAnalysis: null as SkulptAnalysis, // Only used for python
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
};

export type Stepper = typeof initialStateStepper;

function initReducer(state: AppStoreReplay): void {
    state.stepper = initialStateStepper;
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, initReducer);

    /* Sent when the stepper task is started */
    bundle.defineAction(ActionTypes.StepperTaskStarted);
    bundle.addReducer(ActionTypes.StepperTaskStarted, stepperTaskStartedReducer);

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
};

/**
 * Enrich, analysis the current stepper state.
 *
 * @param stepperState The stepper state.
 * @param {string} context The context (Stepper.Progress, Stepper.Restart, Stepper.Idle).
 */
function enrichStepperState(stepperState: StepperState, context: 'Stepper.Restart' | 'Stepper.Progress' | 'Stepper.Idle'): void {
    const {programState, controls} = stepperState;
    if (!programState) {
        return;
    }

    /* TODO: extend stepper API to add enrichers that run here */
    if (stepperState.platform === 'python') {
        if (context === 'Stepper.Progress') {
            // Don't reanalyse after program is finished :
            // keep the last state of the stack and set isFinished state.
            if (window.currentPythonRunner._isFinished) {
                stepperState.isFinished = true;
            } else {
                stepperState.analysis = analyseSkulptState(stepperState.suspensions, stepperState.lastAnalysis, stepperState.analysis.stepNum + 1);
                stepperState.directives = {
                    ordered: parseDirectives(stepperState.analysis),
                    functionCallStackMap: null,
                    functionCallStack: null
                };
            }
        }

        if (!stepperState.analysis) {
            stepperState.analysis =  {
                functionCallStack: [],
                code: window.currentPythonRunner._code,
                lines: window.currentPythonRunner._code.split("\n"),
                stepNum: 0
            };

            stepperState.lastAnalysis = {
                functionCallStack: [],
                code: window.currentPythonRunner._code,
                lines: window.currentPythonRunner._code.split("\n"),
                stepNum: 0
            };
        }
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

function getNodeRange(stepperState: StepperState) {
    if (!stepperState) {
        return null;
    }

    if (stepperState.platform === 'python') {
        const {functionCallStack} = stepperState.analysis;
        const stackFrame = functionCallStack[functionCallStack.length - 1];
        if (!stackFrame) {
            return null;
        }

        const line = stackFrame.currentLine;
        const columnNumber = stackFrame.currentColumn;

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
    } else {
        const {control} = stepperState.programState;
        if (!control || !control.node) {
            return null;
        }

        const focusDepth = stepperState.controls.stack.focusDepth;
        if (focusDepth === 0) {
            return control.node[1].range;
        } else {
            const {functionCallStack} = stepperState.analysis;
            const stackFrame = functionCallStack[functionCallStack.length - focusDepth];

            // @ts-ignore
            return stackFrame.scope.cont.node[1].range;
        }
    }
}

function stringifyError(error) {
    if (process.env['NODE_ENV'] === 'production') {
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
        if (platform === 'python') {
            stepperState = state.stepper.initialStepperState;
            stepperState.inputPos = 0;

            const source = state.buffers['source'].model.document.toString();

            /**
             * Add a last instruction at the end of the code so Skupt will generate a Suspension state
             * for after the user's last instruction. Otherwise it would be impossible to retrieve the
             * modifications made by the last user's line.
             *
             * @type {string} pythonSource
             */
            const pythonSource = source + "\npass";

            window.currentPythonRunner.initCodes([pythonSource]);
        } else {
            stepperState = state.stepper.initialStepperState;
        }
    }

    state.stepper.status = StepperStatus.Idle;
    state.stepper.initialStepperState = stepperState;
    state.stepper.currentStepperState = stepperState;
    state.stepper.redo = [];
}

function stepperTaskStartedReducer(state: AppStore, {payload: {task}}): void {
    state.stepperTask = task;
}

function stepperTaskCancelledReducer(state: AppStore): void {
    state.stepperTask = null;
}

function stepperResetReducer(state: AppStore, {payload: {stepperState}}): void {
    state.stepper = stepperState;
}

function stepperStepReducer(state: AppStore): void {
    /* No check for 'idle' status, the player must be able to step while
       the status is 'running'. */
    state.stepper.status = StepperStatus.Starting;
}

function stepperStartedReducer(state: AppStoreReplay, action): void {
    state.stepper.status = StepperStatus.Running;
    state.stepper.mode = action.mode;
    state.stepper.redo = [];
    state.stepper.undo.unshift(state.stepper.currentStepperState);
}

function stepperProgressReducer(state: AppStoreReplay, {payload: {stepperContext}}): void {
    /**
     * TODO: stepperState comes from an action so it's not an immer draft.
     */
    stepperContext.state = {...stepperContext.state};

    if (stepperContext.state.platform === 'python') {
        // Save scope.
        stepperContext.state.suspensions = getSkulptSuspensionsCopy(window.currentPythonRunner._debugger.suspension_stack);
    }

    // Set new currentStepperState state and go back to idle.
    enrichStepperState(stepperContext.state, 'Stepper.Progress');

    // Python print calls are asynchronous so we need to update the terminal and output by the one in the store.
    if (stepperContext.state.platform === 'python') {
        stepperContext.state.terminal = window.currentPythonRunner._terminal;
        if (state.stepper.currentStepperState) {
            stepperContext.state.output = state.stepper.currentStepperState.output;
        }
    }

    state.task.state = quickAlgoLibraries.getContext() && quickAlgoLibraries.getContext().getCurrentState ? {...quickAlgoLibraries.getContext().getCurrentState()} : {};
    state.stepper.currentStepperState = stepperContext.state;
    if (state.compile.status === CompileStatus.Error) {
        state.stepper.currentStepperState.isFinished = false;
    }
}

function stepperIdleReducer(state: AppStoreReplay, {payload: {stepperContext}}): void {
    // Set new currentStepperState state and go back to idle.
    /* XXX Call enrichStepperState prior to calling the reducer. */
    enrichStepperState(stepperContext.state, 'Stepper.Idle');
    /**
     * TODO: stepperState comes from an action so it's not an immer draft.
     */
    stepperContext.state = {...stepperContext.state};

    state.stepper.currentStepperState = stepperContext.state;
    state.stepper.status = StepperStatus.Idle;
    state.stepper.mode = null;
}

function stepperExitReducer(state: AppStoreReplay): void {
    clearStepper(state.stepper);
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

        const directives = collectDirectives(analysis.functionCallStack, focusDepth);
        state.stepper.currentStepperState.controls = controls;
        state.stepper.currentStepperState.directives = directives;
    }
}

function stepperStackDownReducer(state: AppStoreReplay): void {
    let {controls, analysis} = state.stepper.currentStepperState;
    const stackDepth = analysis.functionCallStack.length;
    let focusDepth = controls.stack.focusDepth;
    if (focusDepth + 1 < stackDepth) {
        focusDepth += 1;

        controls.stack.focusDepth = focusDepth;

        const directives = collectDirectives(analysis.functionCallStack, focusDepth);
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

/* saga */

function* compileSucceededSaga() {
    try {
        yield put({type: ActionTypes.StepperDisabled});
        /* Build the stepper state. This automatically runs into user source code. */
        let state: AppStore = yield select();

        let stepperState = yield call(buildState, state);

        // buildState may have triggered an error.
        state = yield select();
        if (state.compile.status !== 'error') {
            /* Enable the stepper */
            yield put({type: ActionTypes.StepperEnabled});
            yield put({type: ActionTypes.StepperRestart, payload: {stepperState}});
        }
    } catch (error) {
        yield put({type: CommonActionTypes.Error, payload: {source: 'stepper', error}});
        console.error(error);
    }
}

function* recorderStoppingSaga() {
    /* Disable the stepper when recording stops. */
    yield put({type: ActionTypes.StepperInterrupt});
    yield put({type: ActionTypes.StepperDisabled});
}

function* stepperEnabledSaga(args) {
    /* Start the new stepper task. */
    const newTask = yield fork(rootStepperSaga, args);

    yield put({type: ActionTypes.StepperTaskStarted, payload: {task: newTask}});
}

export function* stepperDisabledSaga() {
    const state: AppStore = yield select();

    /* Cancel the stepper task if still running. */
    const oldTask = state.stepperTask;
    if (oldTask) {
        // @ts-ignore
        yield cancel(oldTask);

        yield put({type: ActionTypes.StepperTaskCancelled});
    }

    /* Clear source highlighting. */
    const startPos = {row: 0, column: 0};

    yield put({type: BufferActionTypes.BufferHighlight, buffer: 'source', range: {start: startPos, end: startPos}});
}

function* stepperInteractSaga(app: App, {payload: {stepperContext, arg}, meta: {resolve, reject}}) {
    let state: AppStore = yield select();

    /* Has the stepper been interrupted? */
    if (isStepperInterrupting(state) || StepperStatus.Clear === state.stepper.status) {
        yield call(reject, new StepperError('interrupt', 'interrupted'));

        return;
    }

    /* Emit a progress action so that an up-to-date state gets displayed. */
    yield put({type: ActionTypes.StepperProgress, payload: {stepperContext}});

    /* Run the provided saga if any, or wait until next animation frame. */
    const saga = arg.saga || stepperWaitSaga;
    const {completed, interrupted} = yield race({
        completed: call(saga, stepperContext),
        interrupted: take(ActionTypes.StepperInterrupt)
    });

    /* Update stepperContext.state from the global state to avoid discarding
       the effects of user interaction. */
    state = yield select();
    stepperContext.state = getCurrentStepperState(state);
    stepperContext.speed = getStepper(state).speed;
    if (stepperContext.state.platform === 'python' && arg) {
        // TODO: Immer: This here breaks when the state is frozen.
        // So this should probably be removed, if input, output and terminal are working without this.
        // Also try it with a record and replay to be sure.
        stepperContext.state.output = arg.output;
        stepperContext.state.terminal = arg.terminal;
        stepperContext.state.inputPos = arg.inputPos;
        stepperContext.state.input = arg.input;
    }

    /* Check whether to interrupt or resume the stepper. */
    if (interrupted) {
        /**
         * It is strange to use reject() for a behavior that is normal (pausing the stepper).
         */
        yield call(reject, new StepperError('interrupt', 'interrupted'));
    } else {
        /* Continue stepper execution, passing the saga's return value as the
           result of yielding the interact effect. */
        yield call(resolve, completed);
    }
}

function* stepperWaitSaga() {
    // Yield until the next tick (XXX use requestAnimationFrame through channel).
    yield delay(0);
}

function* stepperInterruptSaga() {
    const state = yield select();

    const curStepperState = getCurrentStepperState(state);
    if (!curStepperState) {
        return;
    }

    const stepperContext = makeContext(getStepper(state), () => {
        return new Promise((resolve) => {
            resolve(true);
        });
    });

    if (stepperContext.state.platform === 'python') {
        yield call(stepperPythonRunFromBeginningIfNecessary, stepperContext);
    }

    yield put({type: ActionTypes.StepperIdle, payload: {stepperContext}});
}

function* stepperStepSaga(app: App, action) {
    const state = yield select();

    const stepper = getStepper(state);
    if (stepper.status === StepperStatus.Starting) {
        yield put({type: ActionTypes.StepperStarted, mode: action.payload.mode});

        const stepperContext = makeContext(stepper, interact);
        if (stepperContext.state.platform === 'python') {
            yield call(stepperPythonRunFromBeginningIfNecessary, stepperContext);
        }

        try {
            yield call(performStep, stepperContext, action.payload.mode, action.payload.useSpeed);
        } catch (ex) {
            console.log('stepperStepSaga has catched', ex);
            if (!(ex instanceof StepperError)) {
                ex = new StepperError('error', stringifyError(ex));
            }
            if (ex.condition === 'interrupt') {
                stepperContext.interrupted = true;

                yield put({type: ActionTypes.StepperInterrupted});
            }
            if (ex.condition === 'error') {
                stepperContext.state.error = ex.message;
            }
        }

        if (stepperContext.state.platform === 'python') {
            // Save scope.
            stepperContext.state.suspensions = getSkulptSuspensionsCopy(window.currentPythonRunner._debugger.suspension_stack);
        } else if (stepperContext.state.platform === 'unix') {
            stepperContext.state.isFinished = !stepperContext.state.programState.control;
        }

        if (stepperContext.state.isFinished) {
            console.log('check end condition');
            const taskContext = quickAlgoLibraries.getContext();
            if (taskContext && taskContext.infos.checkEndCondition) {
                try {
                    taskContext.infos.checkEndCondition(taskContext, true);
                } catch (message) {
                    // @ts-ignore
                    if (taskContext.success) {
                        yield put(taskSuccess(message));
                    } else {
                        const response = {diagnostics: message};
                        yield put({
                            type: CompileActionTypes.CompileFailed,
                            response
                        });
                    }
                }
            }
        }

        const newState = yield select();
        const newStepper = getStepper(newState);
        if (StepperStatus.Clear !== newStepper.status) {
            yield put({type: ActionTypes.StepperIdle, payload: {stepperContext}});
        }

        function interact(arg) {
            return new Promise((resolve, reject) => {
                app.dispatch({
                    type: ActionTypes.StepperInteract,
                    payload: {stepperContext, arg},
                    meta: {resolve, reject}
                });
            });
        }
    }
}

/**
 * Before we do a step, we check if the state in analysis is the same as the one in the python runner.
 *
 * If it is different, it means the analysis has been overwritten by playing a record, and so
 * we need to move the python runner to the same point before we can to a step.
 */
function* stepperPythonRunFromBeginningIfNecessary(stepperContext: StepperContext) {
    if (!window.currentPythonRunner.isSynchronizedWithAnalysis(stepperContext.state.analysis)) {
        console.log('Run python from beginning is necessary');
        const taskContext = quickAlgoLibraries.getContext();
        taskContext.reset();
        yield delay(0);

        window.currentPythonRunner.initCodes([stepperContext.state.analysis.code]);

        window.currentPythonRunner._input = stepperContext.state.input;
        window.currentPythonRunner._inputPos = 0;
        window.currentPythonRunner._terminal = stepperContext.state.terminal;

        window.currentPythonRunner._synchronizingAnalysis = true;
        while (window.currentPythonRunner._steps < stepperContext.state.analysis.stepNum) {
            yield apply(window.currentPythonRunner, window.currentPythonRunner.runStep, []);

            if (window.currentPythonRunner._isFinished) {
                break;
            }
        }
        window.currentPythonRunner._synchronizingAnalysis = false;

        stepperContext.state.input = window.currentPythonRunner._input;
        stepperContext.state.terminal = window.currentPythonRunner._terminal;
        stepperContext.state.inputPos = window.currentPythonRunner._inputPos;
    }
}

function* stepperExitSaga() {
    /* Disabled the stepper. */
    yield put({type: ActionTypes.StepperDisabled});

    /* Clear the compile state. */
    yield put({type: ActionTypes.CompileClear});
}

function* updateSourceHighlightSaga() {
    const state: AppStore = yield select();
    const stepperState = state.stepper.currentStepperState;

    const range = getNodeRange(stepperState);

    yield put({
        type: BufferActionTypes.BufferHighlight,
        buffer: 'source',
        range
    });
}

function* stepperSaga(args) {
    yield takeLatest(ActionTypes.CompileSucceeded, compileSucceededSaga);
    yield takeLatest(RecorderActionTypes.RecorderStopping, recorderStoppingSaga);
    yield takeLatest(ActionTypes.StepperEnabled, stepperEnabledSaga, args);
    yield takeLatest(ActionTypes.StepperDisabled, stepperDisabledSaga);
}

/* Post-link, register record and replay hooks. */

function updateRange(replayContext: ReplayContext) {
    replayContext.instant.range = getNodeRange(getCurrentStepperState(replayContext.state));
}

function postLink(app: App) {
    const {recordApi, replayApi, stepperApi} = app;

    recordApi.onStart(function* () {
        /* TODO: store stepper options in init */
    });
    replayApi.on('start', function(replayContext: ReplayContext) {
        /* TODO: restore stepper options from event[2] */
        initReducer(replayContext.state);
    });
    replayApi.onReset(function* (instant: PlayerInstant) {
        const stepperState = instant.state.stepper;

        yield put({type: ActionTypes.StepperReset, payload: {stepperState}});
        yield put({type: BufferActionTypes.BufferHighlight, buffer: 'source', range: instant.range});
    });

    recordApi.on(ActionTypes.StepperExit, function* (addEvent) {
        yield call(addEvent, 'stepper.exit');
    });
    replayApi.on('stepper.exit', function(replayContext: ReplayContext) {
        stepperExitReducer(replayContext.state);

        /* Clear the highlighted range when the stepper terminates. */
        replayContext.instant.range = null;
    });

    recordApi.on(ActionTypes.StepperRestart, function* (addEvent) {
        yield call(addEvent, 'stepper.restart');
    });
    replayApi.on('stepper.restart', async function(replayContext: ReplayContext) {
        const stepperState = await buildState(replayContext.state, true);

        replayContext.state = produce(replayContext.state, (draft: AppStoreReplay) => {
            stepperRestartReducer(draft, {payload: {stepperState}});
        });
    });

    recordApi.on(ActionTypes.StepperStarted, function* (addEvent, action) {
        const {mode} = action;

        yield call(addEvent, 'stepper.step', mode);
    });
    replayApi.on('stepper.step', function(replayContext: ReplayContext, event) {
        return new Promise((resolve, reject) => {
            const mode = event[2];

            replayContext.stepperDone = resolve;
            replayContext.state = produce(replayContext.state, (draft: AppStoreReplay) => {
                stepperStartedReducer(draft, {mode});
            });

            replayContext.stepperContext = makeContext(replayContext.state.stepper, function interact(_) {
                return new Promise((cont) => {
                    stepperSuspend(replayContext.stepperContext, cont);

                    replayContext.state = produce(replayContext.state, (draft: AppStoreReplay) => {
                        stepperProgressReducer(draft, {payload: {stepperContext: replayContext.stepperContext}});
                    });

                    stepperEventReplayed(replayContext);
                });
            });

            performStep(replayContext.stepperContext, mode).then(function() {
                replayContext.state = produce(replayContext.state, (draft: AppStoreReplay) => {
                    let currentStepperState = draft.stepper.currentStepperState;

                    if (currentStepperState.platform === 'python' && window.currentPythonRunner._printedDuringStep) {
                        draft.stepper.currentStepperState.output = getNewOutput(currentStepperState, window.currentPythonRunner._printedDuringStep);
                        draft.stepper.currentStepperState.terminal = getNewTerminal(window.currentPythonRunner._terminal, window.currentPythonRunner._printedDuringStep);
                    }

                    stepperIdleReducer(draft, {payload: {stepperContext: replayContext.stepperContext}});
                });

                stepperEventReplayed(replayContext);
            }, function(error) {
                if (!(error instanceof StepperError)) {
                    return reject(error);
                }
                if (error.condition === 'interrupt') {
                    replayContext.stepperContext.interrupted = true;
                }
                if (error.condition === 'error') {
                    replayContext.stepperContext.state.error = error.message;
                }

                replayContext.state = produce(replayContext.state, (draft: AppStoreReplay) => {
                    stepperIdleReducer(draft, {payload: {stepperContext: replayContext.stepperContext}});
                });

                stepperEventReplayed(replayContext);
            });
        });
    });

    recordApi.on(ActionTypes.StepperProgress, function* (addEvent, {payload: {stepperContext}}) {
        yield call(addEvent, 'stepper.progress', stepperContext.lineCounter);
    });

    replayApi.on('stepper.progress', function(replayContext: ReplayContext) {
        return new Promise((resolve) => {
            replayContext.stepperDone = resolve;
            replayContext.stepperContext.state = getCurrentStepperState(replayContext.state);
            stepperResume(replayContext.stepperContext, function interact() {
                return new Promise((cont) => {
                    stepperSuspend(replayContext.stepperContext, cont);

                    replayContext.state = produce(replayContext.state, (draft: AppStoreReplay) => {
                        stepperProgressReducer(draft, {payload: {stepperContext: replayContext.stepperContext}});
                    });

                    stepperEventReplayed(replayContext);
                });
            }, function() {
                replayContext.state = produce(replayContext.state, (draft: AppStoreReplay) => {
                    stepperProgressReducer(draft, {payload: {stepperContext: replayContext.stepperContext}});
                });

                stepperEventReplayed(replayContext);
            });
        });
    });

    recordApi.on(ActionTypes.StepperInterrupt, function* (addEvent) {
        yield call(addEvent, 'stepper.interrupt');
    });
    replayApi.on('stepper.interrupt', function(replayContext: ReplayContext) {
        /* Prevent the subsequent stepper.idle event from running the stepper until
           completion. */
        const {stepperContext} = replayContext;

        stepperContext.interact = null;
        stepperContext.resume = null;
    });

    recordApi.on(ActionTypes.StepperIdle, function* (addEvent, {payload: {stepperContext}}) {
        yield call(addEvent, 'stepper.idle', stepperContext.lineCounter);
    });

    replayApi.on('stepper.idle', function(replayContext: ReplayContext) {
        return new Promise((resolve) => {
            replayContext.stepperDone = resolve;
            replayContext.stepperContext.state = getCurrentStepperState(replayContext.state);

            /* Set the interact callback to resume the stepper until completion. */
            stepperResume(replayContext.stepperContext, function interact(_) {
                return new Promise((cont) => {
                    cont(true);
                });
            }, function() {
                replayContext.state = produce(replayContext.state, (draft: AppStoreReplay) => {
                    stepperIdleReducer(draft, {payload: {stepperContext: replayContext.stepperContext}});
                });

                stepperEventReplayed(replayContext);
            });
        });
    });

    function stepperEventReplayed(replayContext: ReplayContext) {
        const done = replayContext.stepperDone;
        replayContext.stepperDone = null;
        updateRange(replayContext);
        done();
    }

    function stepperSuspend(stepperContext: StepperContext, cont) {
        stepperContext.interact = null;
        stepperContext.resume = cont;
    }

    function stepperResume(stepperContext: StepperContext, interact, notSuspended) {
        const {resume} = stepperContext;
        if (resume) {
            stepperContext.resume = null;
            stepperContext.interact = interact;
            resume();
        } else {
            notSuspended();
        }
    }

    recordApi.on(ActionTypes.StepperUndo, function* (addEvent) {
        yield call(addEvent, 'stepper.undo');
    });
    replayApi.on('stepper.undo', function(replayContext: ReplayContext) {
        stepperUndoReducer(replayContext.state);

        updateRange(replayContext);
    });

    recordApi.on(ActionTypes.StepperRedo, function* (addEvent) {
        yield call(addEvent, 'stepper.redo');
    });
    replayApi.on('stepper.redo', function(replayContext: ReplayContext) {
        stepperRedoReducer(replayContext.state);

        updateRange(replayContext);
    });

    recordApi.on(ActionTypes.StepperStackUp, function* (addEvent) {
        yield call(addEvent, 'stepper.stack.up');
    });
    replayApi.on('stepper.stack.up', function(replayContext: ReplayContext) {
        stepperStackUpReducer(replayContext.state);
        updateRange(replayContext);
    });

    recordApi.on(ActionTypes.StepperStackDown, function* (addEvent) {
        yield call(addEvent, 'stepper.stack.down');
    });
    replayApi.on('stepper.stack.down', function(replayContext: ReplayContext) {
        stepperStackDownReducer(replayContext.state);
        updateRange(replayContext);
    });

    recordApi.on(ActionTypes.StepperViewControlsChanged, function* (addEvent, action) {
        const {key, update} = action;

        yield call(addEvent, 'stepper.view.update', key, update);
    });
    replayApi.on('stepper.view.update', function(replayContext: ReplayContext, event) {
        const key = event[2];
        const update = event[3];

        stepperViewControlsChangedReducer(replayContext.state, {key, update});
    });

    recordApi.on(ActionTypes.StepperSpeedChanged, function* (addEvent, action) {
        const {payload: {speed}} = action;

        yield call(addEvent, 'stepper.speed.changed', speed);
    });
    replayApi.on('stepper.speed.changed', function(replayContext: ReplayContext, event) {
        const speed = event[2];

        stepperSpeedChangedReducer(replayContext.state, {payload: {speed}});
    });

    recordApi.on(ActionTypes.StepperControlsChanged, function* (addEvent, action) {
        const {payload: {controls}} = action;

        yield call(addEvent, 'stepper.controls.changed', controls);
    });
    replayApi.on('stepper.controls.changed', function(replayContext: ReplayContext, event) {
        const controls = event[2];

        stepperControlsChangedReducer(replayContext.state, {payload: {controls}});
    });

    stepperApi.onInit(function(stepperState: StepperState, state: AppStore) {
        const {platform} = state.options;

        switch (platform) {
            case 'python':
                stepperState.lastProgramState = {};
                stepperState.programState = {...stepperState.lastProgramState};

                break;
            default:
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
        yield takeEvery(ActionTypes.StepperInteract, stepperInteractSaga, args);
        yield takeEvery(ActionTypes.StepperStep, stepperStepSaga, args);
        yield takeEvery(ActionTypes.StepperInterrupt, stepperInterruptSaga);
        yield takeEvery(ActionTypes.StepperExit, stepperExitSaga);
        yield takeEvery(BufferActionTypes.BufferEdit, function* (action) {
            // @ts-ignore
            const {buffer} = action;
            if (buffer === 'source') {
                yield put({type: ActionTypes.StepperExit, payload: {}});
            }
        });

        /* Highlight the range of the current source fragment. */
        yield takeLatest([
            ActionTypes.StepperProgress,
            ActionTypes.StepperIdle,
            ActionTypes.StepperRestart,
            ActionTypes.StepperUndo,
            ActionTypes.StepperRedo,
            ActionTypes.StepperStackUp,
            ActionTypes.StepperStackDown
        ], updateSourceHighlightSaga);
    });
}
