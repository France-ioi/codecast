/*

  Extensibility API for the C stepper.

  CONSIDER: The only remaining distinction between effects and builtins is that
  they live in different namespaces.  They could be merged.

*/

import * as C from '@france-ioi/persistent-c';
import {all, call} from 'typed-redux-saga';
import {clearLoadedReferences} from "./python/analysis/analysis";
import {AppStore, AppStoreReplay, CodecastPlatform} from "../store";
import {initialStepperStateControls, Stepper, StepperState} from "./index";
import {Bundle} from "../linker";
import {quickAlgoLibraries} from "../task/libs/quickalgo_librairies";
import {createDraft} from "immer";
import {getCurrentImmerState} from "../task/utils";
import {ActionTypes as CompileActionTypes} from "./actionTypes";
import {Codecast} from "../index";

export interface QuickalgoLibraryCall {
    module: string,
    action: string,
    args: any[],
}

export interface StepperContext {
    state?: StepperState,
    interrupted?: boolean,
    interactBefore?: Function,
    interactAfter: Function,
    waitForProgress?: Function,
    onStepperDone?: Function,
    dispatch?: Function,
    quickAlgoCallsLogger?: Function,
    quickAlgoCallsExecutor?: Function,
    resume?: Function | null,
    position?: any,
    lineCounter?: number,
    speed?: number,
    unixNextStepCondition?: 0,
    makeDelay?: boolean,
    quickAlgoContext?: any,
    environment?: string,
    executeEffects?: Function,
}

export interface StepperContextParameters {
    interactBefore?: Function,
    interactAfter?: Function,
    waitForProgress?: Function,
    onStepperDone?: Function,
    dispatch?: Function,
    quickAlgoCallsLogger?: Function,
    environment?: string,
    speed?: number,
    executeEffects?: Function,
}

export const delay = delay => new Promise((resolve) => setTimeout(resolve, delay));

export interface StepperApi {
    onInit?: Function,
    addSaga?: Function,
    onEffect?: Function,
    addBuiltin?: Function,
    buildState?: (state: AppStoreReplay, environment: string) => Promise<StepperState>,
    rootStepperSaga?: any,
    executeEffects?: Function,
}

export default function(bundle: Bundle) {
    const stepperApi = {
        onInit,
        addSaga,
        onEffect,
        addBuiltin,
        buildState,
        rootStepperSaga,
        executeEffects,
    };

    const initCallbacks = [];
    const stepperSagas = [];
    const effectHandlers = new Map();
    const builtinHandlers = new Map();

    /* Register a setup callback for the stepper's initial state. */
    function onInit(callback: (stepperState: StepperState, state: AppStore) => void): void {
        initCallbacks.push(callback);
    }

    /* Register a saga to run inside the stepper task. */
    function addSaga(saga): void {
        stepperSagas.push(saga);
    }

    /* The root stepper saga does a parallel call of registered stepper sagas. */
    function* rootStepperSaga(...args) {
        yield* all(stepperSagas.map(saga => call(saga, ...args)));
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


    /* Build a stepper state from the given init data. */
    async function buildState(state: AppStoreReplay, environment: string): Promise<StepperState> {
        const {platform} = state.options;

        console.log('do build state', state, environment);

        /*
         * Call all the init callbacks. Pass the global state so the player can
         * build stepper states without having to install the pre-computed state
         * into the store.
         */
        const curStepperState: StepperState = {
            platform
        } as StepperState;
        for (let callback of initCallbacks) {
            await callback(curStepperState, state, environment);
        }


        const stepper: Stepper = {
            ...state.stepper,
            currentStepperState: curStepperState,
        };

        /* Run until in user code */
        const stepperContext = makeContext(stepper, {
            interactBefore: () => {
                return Promise.resolve(true);
            },
            interactAfter: ({saga}) => {
                return new Promise((resolve, reject) => {
                    if (saga) {
                        return reject(new StepperError('error', 'cannot interact in buildState'));
                    }

                    resolve(true);
                });
            },
            environment,
            executeEffects,
        });

        if (stepperContext.state.platform === CodecastPlatform.Unix || stepperContext.state.platform === CodecastPlatform.Arduino) {
            while (!inUserCode(stepperContext.state)) {
                /* Mutate the stepper context to advance execution by a single step. */
                const effects = C.step(stepperContext.state.programState);
                if (effects) {
                    await executeEffects(stepperContext, effects[Symbol.iterator]());
                }
            }
        }

        return stepperContext.state;
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
                lastResult = await stepperContext.interactAfter(value[1] || {});
            } else if (name === 'promise') {
                console.log('await promise');
                lastResult = await value[1];
                console.log('promise result', lastResult);
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

    bundle.defineValue('stepperApi', stepperApi);
}

export function getNodeStartRow(stepperState: StepperState) {
    if (!stepperState || !stepperState.programState) {
        return undefined;
    }

    const {control} = stepperState.programState;
    if (!control || !control.node) {
        return undefined;
    }

    const {range} = control.node[1];

    return range && range.start.row;
}

export function makeContext(stepper: Stepper, {interactBefore, interactAfter, waitForProgress, dispatch, quickAlgoCallsLogger, environment, speed, executeEffects}: StepperContextParameters): StepperContext {
    /**
     * We create a new state object here instead of mutating the state. This is intended.
     */

    const state = stepper.currentStepperState;

    const stepperContext: StepperContext = {
        interactBefore: interactBefore ? interactBefore : () => {
            return Promise.resolve(true);
        },
        interactAfter: interactAfter ? interactAfter : () => {
            return Promise.resolve(true);
        },
        waitForProgress,
        dispatch,
        quickAlgoCallsLogger,
        resume: null,
        position: getNodeStartRow(state),
        lineCounter: 0,
        speed: undefined !== speed ? speed : stepper.speed,
        unixNextStepCondition: 0,
        state: {
            ...state,
            controls: resetControls(state.controls),
        },
        quickAlgoContext: quickAlgoLibraries.getContext(null, environment),
        environment,
        executeEffects,
    };

    stepperContext.quickAlgoCallsExecutor = createQuickAlgoLibraryExecutor(stepperContext);

    Codecast.runner.enrichStepperContext(stepperContext, state);

    return stepperContext;
}

function resetControls(controls) {
    /* Reset the controls before a step is started. */
    return initialStepperStateControls;
}

async function executeSingleStep(stepperContext: StepperContext) {
    if (isStuck(stepperContext.state)) {
        throw new StepperError('stuck', 'execution cannot proceed');
    }

    await stepperContext.interactBefore();
    if (stepperContext.waitForProgress) {
        console.log('wait for progress');
        await stepperContext.waitForProgress(stepperContext);
        console.log('end wait for progress, continuing');
    }

    await Codecast.runner.runNewStep(stepperContext);
}

async function stepUntil(stepperContext: StepperContext, stopCond = undefined) {
    let stop = false;
    let first = true;
    while (true) {
        if (isStuck(stepperContext.state)) {
            return;
        }
        if (!stop && stopCond) {
            if (stepperContext.state.platform === CodecastPlatform.Python) {
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

        if (!first && null !== stepperContext.speed && undefined !== stepperContext.speed && stepperContext.speed < 255 && stepperContext.makeDelay) {
            stepperContext.makeDelay = false;
            await delay(255 - stepperContext.speed);
        }

        await executeSingleStep(stepperContext);

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

    if (stepperContext.state.platform === CodecastPlatform.Unix || stepperContext.state.platform === CodecastPlatform.Arduino) {
        // Step out of the current statement.
        await stepUntil(stepperContext, C.outOfCurrentStmt);
        // Step into the next statement.
        await stepUntil(stepperContext, C.intoNextStmt);
    }
}

async function stepOut(stepperContext: StepperContext) {
    // The program must be running.
    if (!isStuck(stepperContext.state)) {
        if (stepperContext.state.platform === CodecastPlatform.Python) {
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
    if (stepperContext.state.platform === CodecastPlatform.Python) {
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

export async function performStep(stepperContext: StepperContext, mode) {
    switch (mode) {
        case 'run':
            await stepUntil(stepperContext);
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

export function isStuck(stepperState: StepperState): boolean {
    return Codecast.runner.isStuck(stepperState);
}

function inUserCode(stepperState: StepperState) {
    if (stepperState.platform === CodecastPlatform.Python) {
        return true;
    } else {
        return !!stepperState.programState.control.node[1].begin;
    }
}

export function createQuickAlgoLibraryExecutor(stepperContext: StepperContext, reloadState = false) {
    return async (module: string, action: string, args: any[], callback?: Function) => {
        console.log('call quickalgo', module, action, args, callback);
        let libraryCallResult;
        const context = stepperContext.quickAlgoContext;

        if (stepperContext.state) {
            console.log('stepper context before', stepperContext.state.contextState);
        }

        if (stepperContext.quickAlgoCallsLogger) {
            const quickAlgoLibraryCall: QuickalgoLibraryCall = {module, action, args};
            stepperContext.quickAlgoCallsLogger(quickAlgoLibraryCall);
            console.log('LOG ACTION', module, action, args);
        }

        if (reloadState) {
            // console.log('RELOAD CONTEXT STATE', draft.contextState, original(draft.contextState));
            const draft = createDraft(stepperContext.state.contextState);
            context.reloadInnerState(draft);
            context.redrawDisplay();
        }


        const makeLibraryCall = async () => {
            let callbackArguments = [];
            let result = context[module][action].apply(context, [...args, function (a) {
                console.log('receive callback', arguments);
                callbackArguments = [...arguments];
            }]);
            if (callbackArguments.length && !result) {
                result = callbackArguments[0];
                console.log('set result', result);
            }

            console.log('MODULE RESULT', result);
            if (!(Symbol.iterator in Object(result))) {
                console.log('return result');
                return result;
            }

            let lastResult;
            while (true) {
                /* Pull the next effect from the builtin's iterator. */
                const {done, value} = result.next();
                console.log('ITERATOR RESULT', done, value);
                if (done) {
                    return value;
                }

                const name = value[0];
                if (name === 'interact') {
                    console.log('ASK FOR INTERACT', stepperContext.interactAfter);
                    lastResult = await stepperContext.interactAfter({...(value[1] || {}), progress: false});
                    console.log('last result', lastResult);
                } else if (name == 'put') {
                    console.log('ask put dispatch', value[1]);
                    await stepperContext.dispatch(value[1]);
                }
            }
        }

        console.log('before make async library call', {module, action});
        try {
            libraryCallResult = await makeLibraryCall();
            console.log('after make async lib call', libraryCallResult);
        } catch (e) {
            console.log('context error 2', e);
            await stepperContext.dispatch({
                type: CompileActionTypes.StepperInterrupting,
            });

            await stepperContext.dispatch({
                type: CompileActionTypes.StepperExecutionError,
                payload: {
                    error: e,
                },
            });
        }
        console.log('after make async library call', libraryCallResult);

        const newStateValue = context.getInnerState();
        const newState = getCurrentImmerState(newStateValue);
        console.log('NEW LIBRARY STATE', newState);

        if (stepperContext.state) {
            stepperContext.state = {
                ...stepperContext.state,
                contextState: newState,
            };
            console.log('stepper context after', stepperContext.state.contextState);
        }

        // let primitiveValue;
        // if (libraryCallResult) {
        //     context.waitDelay((primitive) => {
        //         console.log('receive primitive value', primitive);
        //         primitiveValue = primitive;
        //
        //
        //     }, libraryCallResult);
        // }

        if (callback) {
            console.log('call callback arguments', libraryCallResult);
            callback(libraryCallResult);
        }

        console.log('return library call result', libraryCallResult);

        return libraryCallResult;
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
