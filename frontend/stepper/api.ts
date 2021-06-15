/*

  Extensibility API for the C stepper.

  CONSIDER: The only remaining distinction between effects and builtins is that
  they live in different namespaces.  They could be merged.

*/

import * as C from 'persistent-c';
import {all, call} from 'redux-saga/effects';
import {getNewOutput, getNewTerminal} from "./python";
import {clearLoadedReferences} from "./python/analysis/analysis";
import {AppStore, AppStoreReplay} from "../store";
import {initialStepperStateControls, Stepper, StepperState} from "./index";
import {Bundle} from "../linker";

export interface StepperContext {
    state: StepperState,
    interrupted?: boolean,
    interact: Function | null,
    resume: Function | null,
    position: any,
    lineCounter: number,
    speed?: number,
}

const stepperApi = {
    onInit,
    addSaga,
    onEffect,
    addBuiltin,
};

const delay = delay => new Promise((resolve) => setTimeout(resolve, delay));

export type StepperApi = typeof stepperApi;

export default function(bundle: Bundle) {
    bundle.defineValue('stepperApi', stepperApi);
}

const initCallbacks = [];
const stepperSagas = [];
const effectHandlers = new Map();
const builtinHandlers = new Map();

/* Register a setup callback for the stepper's initial state. */
function onInit(callback: (stepperState: StepperState, state: AppStore) => void): void {
    initCallbacks.push(callback);
}

/* Build a stepper state from the given init data. */
export async function buildState(state: AppStoreReplay, replay: boolean = false): Promise<StepperState> {
    const {platform} = state.options;

    /*
     * Call all the init callbacks. Pass the global state so the player can
     * build stepper states without having to install the pre-computed state
     * into the store.
     */
    const curStepperState: StepperState = {
        platform
    } as StepperState;
    for (let callback of initCallbacks) {
        callback(curStepperState, state, replay);
    }

    // TODO: Make something so that the initCallbacks doesn't obscure the creation of stepperState.
    const stepperState = curStepperState as StepperState;

    /* Run until in user code */
    const stepperContext: StepperContext = {
        state: stepperState,
        interact,
        resume: null,
        position: 0,
        lineCounter: 0,
        speed: state.stepper.speed,
    } as StepperContext;

    if (stepperContext.state.platform === 'python') {
        return stepperContext.state;
    } else {
        while (!inUserCode(stepperContext.state)) {
            /* Mutate the stepper context to advance execution by a single step. */
            const effects = C.step(stepperContext.state.programState);
            if (effects) {
                await executeEffects(stepperContext, effects[Symbol.iterator]());
            }
        }

        return stepperContext.state;
    }

    function interact({saga}) {
        return new Promise((resolve, reject) => {
            if (saga) {
                return reject(new StepperError('error', 'cannot interact in buildState'));
            }

            resolve(true);
        });
    }
}

/* Register a saga to run inside the stepper task. */
function addSaga(saga): void {
    stepperSagas.push(saga);
}

/* The root stepper saga does a parallel call of registered stepper sagas. */
export function* rootStepperSaga(...args) {
    yield all(stepperSagas.map(saga => call(saga, ...args)));
}

/* An effect is a generator that may alter the stepperContext/state/programState, and
   yield further effects. */
function onEffect(name: string, handler: (stepperContext: StepperContext, ...args) => void): void {
    /* TODO: guard against duplicate effects? allow multiple handlers for a single effect? */
    effectHandlers.set(name, handler);
}

/* Register a builtin. A builtin is a generator that yields effects. */
function addBuiltin(name: string, handler: (stepperContext: StepperContext, ...args) => void): void {
    /* TODO: guard against duplicate builtins */
    builtinHandlers.set(name, handler);
}

function getNodeStartRow(stepperState: StepperState) {
    if (!stepperState) {
        return undefined;
    }

    const {control} = stepperState.programState;
    if (!control || !control.node) {
        return undefined;
    }

    const {range} = control.node[1];

    return range && range.start.row;
}

export function makeContext(stepper: Stepper, interact: Function): StepperContext {
    /**
     * We create a new state object here instead of mutating the state. This is intended.
     */

    const state = stepper.currentStepperState;

    if (state.platform === 'python') {
        return {
            state: {
                ...state,
                lastAnalysis: Object.freeze(clearLoadedReferences(state.analysis)),
                controls: resetControls(state.controls)
            },
            interact,
            resume: null,
            position: getNodeStartRow(state),
            lineCounter: 0,
            speed: stepper.speed,
        };
    } else {
        return {
            state: {
                ...state,
                programState: C.clearMemoryLog(state.programState),
                lastProgramState: {...state.programState},
                controls: resetControls(state.controls)
            },
            interact,
            resume: null,
            position: getNodeStartRow(state),
            lineCounter: 0,
            speed: stepper.speed,
        }
    }
}

function resetControls(controls) {
    /* Reset the controls before a step is started. */
    return initialStepperStateControls;
}

async function executeEffects(stepperContext: StepperContext, iterator) {
    let lastResult;
    while (true) {
        /* Pull the next effect from the builtin's iterator. */
        const {done, value} = iterator.next(lastResult);
        if (done) {
            return value;
        }
        const name = value[0];
        if (name === 'interact') {
            lastResult = await stepperContext.interact(value[1] || {});
        } else if (name === 'promise') {
            lastResult = await value[1];
        } else if (name === 'builtin') {
            const builtin = value[1];
            if (!builtinHandlers.has(builtin)) {
                throw new StepperError('error', `unknown builtin ${builtin}`);
            }

            lastResult = await executeEffects(stepperContext, builtinHandlers.get(builtin)(stepperContext, ...value.slice(2)));
        } else {
            /* Call the effect handler, feed the result back into the iterator. */
            if (!effectHandlers.has(name)) {
                throw new StepperError('error', `unhandled effect ${name}`);
            }

            lastResult = await executeEffects(stepperContext, effectHandlers.get(name)(stepperContext, ...value.slice(1)));
        }
    }
}

async function executeSingleStep(stepperContext: StepperContext, makeInteract: () => boolean = null) {
    if (isStuck(stepperContext.state)) {
        throw new StepperError('stuck', 'execution cannot proceed');
    }

    if (stepperContext.state.platform === 'python') {
        window.currentPythonRunner._input = stepperContext.state.input;
        window.currentPythonRunner._inputPos = stepperContext.state.inputPos;
        window.currentPythonRunner._terminal = stepperContext.state.terminal;
        window.currentPythonRunner._interact = stepperContext.interact;

        await window.currentPythonRunner.runStep();

        /**
         * In player mode, empty _futureInputValue after it has been used.
         */
        if (window.currentPythonRunner._futureInputValue && window.currentPythonRunner._futureInputValue.value) {
            window.currentPythonRunner._futureInputValue = null;
        }

        const newOutput = getNewOutput(stepperContext.state, window.currentPythonRunner._printedDuringStep);
        const newInput = window.currentPythonRunner._input;
        const newInputPos = window.currentPythonRunner._inputPos;

        // Warning : The interact event retrieves the state from the global state again.
        // It means : we need to pass the changes so it can update it.
        await stepperContext.interact({
            position: 0,
            output: newOutput,
            //terminal: newTerminal,
            inputPos: newInputPos,
            input: newInput
        });

        const newTerminal = getNewTerminal(window.currentPythonRunner._terminal, window.currentPythonRunner._printedDuringStep);
        window.currentPythonRunner._terminal = newTerminal;

        // Put the output and terminal again so it works with the replay too.
        stepperContext.state.output = newOutput;
        stepperContext.state.inputPos = window.currentPythonRunner._inputPos;

        stepperContext.state.terminal = newTerminal;
    } else {
        const effects = C.step(stepperContext.state.programState);
        await executeEffects(stepperContext, effects[Symbol.iterator]());

        /* Update the current position in source code. */
        const position = getNodeStartRow(stepperContext.state);
        if (!makeInteract || makeInteract()) {
            await stepperContext.interact({
                position
            });
            stepperContext.position = position;
        }
    }
}

async function stepUntil(stepperContext: StepperContext, stopCond = undefined, useSpeed: boolean = false) {
    let stop = false;
    let first = true;
    let delayCondition = 0;
    let nextDelayC = false;
    while (true) {
        if (isStuck(stepperContext.state)) {
            return;
        }
        if (!stop && stopCond) {
            if (stepperContext.state.platform === 'python') {
                if (stopCond(stepperContext.state)) {
                    stop = true;
                }
            } else {
                if (stopCond(stepperContext.state.programState)) {
                    stop = true;
                }
            }
        }

        if (stop && inUserCode(stepperContext.state)) {
            return;
        }

        if (!first && useSpeed && null !== stepperContext.speed && undefined !== stepperContext.speed && stepperContext.speed < 255) {
            if (stepperContext.state.platform !== 'unix' || nextDelayC) {
                await delay(255 - stepperContext.speed);
                nextDelayC = false;
            }
        }

        await executeSingleStep(stepperContext, () => {
            if (stepperContext.state.platform === 'unix') {
                if (0 === delayCondition && C.outOfCurrentStmt(stepperContext.state.programState)) {
                    delayCondition++;
                }
                if (1 === delayCondition && C.intoNextStmt(stepperContext.state.programState)) {
                    delayCondition++;
                }

                if (delayCondition === 2) {
                    nextDelayC = true;
                    delayCondition = 0;

                    return true;
                } else if (isStuck(stepperContext.state)) {
                    return true;
                }

                return false;
            } else {
                return true;
            }
        });

        first = false;
    }
}

async function stepExpr(stepperContext: StepperContext) {
    // Take a first step.
    await executeSingleStep(stepperContext);
    // Step into the next expression.
    await stepUntil(stepperContext, C.intoNextExpr);
}

async function stepInto(stepperContext: StepperContext) {
    // Take a first step.
    await executeSingleStep(stepperContext);

    if (stepperContext.state.platform === 'unix' || stepperContext.state.platform === 'arduino') {
        // Step out of the current statement.
        await stepUntil(stepperContext, C.outOfCurrentStmt);
        // Step into the next statement.
        await stepUntil(stepperContext, C.intoNextStmt);
    }
}

async function stepOut(stepperContext: StepperContext) {
    // The program must be running.
    if (!isStuck(stepperContext.state)) {
        if (stepperContext.state.platform === 'python') {
            const nbSuspensions = stepperContext.state.suspensions.length;

            // Take a first step.
            await executeSingleStep(stepperContext);

            // The number of suspensions represents the number of layers of functions called.
            // We want it to be less, which means be got out of at least one level of function.
            await stepUntil(stepperContext, curState => {
                console.log(curState.suspensions.length, nbSuspensions);
                return (curState.suspensions.length < nbSuspensions);
            });
        } else {
            // Find the closest function scope.
            const refScope = stepperContext.state.programState.scope;
            const funcScope = C.findClosestFunctionScope(refScope);
            // Step until execution reach that scope's parent.
            await stepUntil(stepperContext, programState => programState.scope === funcScope.parent);
        }
    }

    return stepperContext;
}

async function stepOver(stepperContext: StepperContext) {
    if (stepperContext.state.platform === 'python') {
        if (stepperContext.state.suspensions) {
            const nbSuspensions = stepperContext.state.suspensions.length;

            // Take a first step.
            await executeSingleStep(stepperContext);

            // The number of suspensions represents the number of layers of functions called.
            // We want to be at the same number or less, not inside a new function.
            await stepUntil(stepperContext, curState => {
                return (curState.suspensions.length <= nbSuspensions);
            });
        } else {
            // The program hasn't started yet, just execute a step.
            await executeSingleStep(stepperContext);
        }
    } else {
        // Remember the current scope.
        const refCurrentScope = stepperContext.state.programState.scope;

        // Take a first step.
        await executeSingleStep(stepperContext);

        // Step until out of the current statement but not inside a nested
        // function call.
        await stepUntil(stepperContext, programState =>
            C.outOfCurrentStmt(programState) && C.notInNestedCall(programState.scope, refCurrentScope));

        // Step into the next statement.
        await stepUntil(stepperContext, C.intoNextStmt);
    }
}

export async function performStep(stepperContext: StepperContext, mode, useSpeed: boolean = false) {
    switch (mode) {
        case 'run':
            await stepUntil(stepperContext, undefined, useSpeed);
            break;
        case 'into':
            await stepInto(stepperContext);
            break;
        case 'expr':
            await stepExpr(stepperContext);
            break;
        case 'out':
            await stepOut(stepperContext);
            break;
        case 'over':
            await stepOver(stepperContext);
            break;
    }
}


function isStuck(stepperState: StepperState): boolean {
    if (stepperState.platform === 'python') {
        return stepperState.isFinished;
    } else {
        return !stepperState.programState.control;
    }
}

function inUserCode(stepperState: StepperState) {
    if (stepperState.platform === 'python') {
        return true;
    } else {
        return !!stepperState.programState.control.node[1].begin;
    }
}

export class StepperError extends Error {
    condition = null;

    constructor(condition, message) {
        super(message);
        this.name = this.constructor.name;
        this.condition = condition;
    }
}
