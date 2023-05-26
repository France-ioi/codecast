import log from 'loglevel';
import {stepperThrottleDisplayDelay} from './index';
import {
    ActionTypes as CompileActionTypes,
    stepperExecutionEndConditionReached,
    stepperExecutionError
} from './actionTypes';
import {Codecast} from '../index';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {getCurrentImmerState} from '../task/utils';
import {QuickalgoLibraryCall, StepperContext} from './api';
import {QuickAlgoLibrary} from '../task/libs/quickalgo_library';

class QuickalgoExecutor {
    private stepperContext;
    
    constructor(stepperContext: StepperContext) {
        this.stepperContext = stepperContext;
    }
    
    async execute (module: string, action: string, args: any[], callback?: Function) {
        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] call quickalgo', module, action, args, callback);
        let libraryCallResult;
        const context = this.stepperContext.quickAlgoContext;

        // Wait that the context has finished all previous animations
        if (this.stepperContext.waitPreviousAnimations) {
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] before ready check');
            await new Promise((resolve) => {
                context.executeWhenReady(resolve);
            });
        }

        // If check end condition every turn, check it now before calling a new Quickalgo action
        if (context.infos.checkEndEveryTurn) {
            try {
                context.infos.checkEndCondition(context, false);
            } catch (executionResult: unknown) {
                log.getLogger('quickalgo_executor').debug('[quickalgo_executor] end condition fulfilled', executionResult);

                await this.stepperContext.dispatch({
                    type: CompileActionTypes.StepperInterrupting,
                });

                Codecast.runner.stop();

                await this.stepperContext.dispatch(stepperExecutionEndConditionReached(executionResult));
            }
        }

        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] ready for call');

        if (this.stepperContext.state) {
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] stepper context before', this.stepperContext.state.contextState);
        }

        if (this.stepperContext.quickAlgoCallsLogger) {
            const quickAlgoLibraryCall: QuickalgoLibraryCall = {module, action, args};
            this.stepperContext.quickAlgoCallsLogger(quickAlgoLibraryCall);
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] call quickalgo calls logger', module, action, args);
        }

        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] before make async library call', {module, action});
        let hideDisplay = false;
        let previousDelay = context.getDelay();
        try {
            if ('main' === this.stepperContext.environment) {
                if ('running' === this.stepperContext.taskDisplayNoneStatus) {
                    // context.display = false;
                    hideDisplay = true;
                    // context.needsRedrawDisplay = true;
                    // } else if ('end' === this.stepperContext.taskDisplayNoneStatus) {
                    context.changeDelay(0);
                    this.stepperContext.taskDisplayNoneStatus = null;
                }
            }

            libraryCallResult = await this.makeLibraryCall(context, module, action, args);
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] after make async lib call', libraryCallResult);

            if (hideDisplay) {
                // context.display = true;
                // } else {
                context.changeDelay(previousDelay);
            }

            // Leave stepperThrottleDisplayDelay ms before displaying again the context
            if (!this.stepperContext.taskDisplayNoneStatus) {
                this.stepperContext.taskDisplayNoneStatus = 'running';
                setTimeout(() => {
                    this.stepperContext.taskDisplayNoneStatus = 'end';
                }, stepperThrottleDisplayDelay);
            }
        } catch (e: unknown) {
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] context error 2', e);
            if (hideDisplay) {
                // context.display = true;
                // } else {
                context.changeDelay(previousDelay);
            }

            await this.stepperContext.dispatch({
                type: CompileActionTypes.StepperInterrupting,
            });

            Codecast.runner.stop();

            await this.stepperContext.dispatch(stepperExecutionError(LibraryTestResult.fromString(String(e)), false));
        }

        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] after make async library call', libraryCallResult);

        const newState = getCurrentImmerState(context.getInnerState());
        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] NEW LIBRARY STATE', newState);

        if (this.stepperContext.state) {
            this.stepperContext.state = {
                ...this.stepperContext.state,
                contextState: newState,
            };
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] stepper context after', this.stepperContext.state.contextState);
        }

        if (callback) {
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] call callback arguments', libraryCallResult);
            callback(libraryCallResult);
        }

        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] return library call result', libraryCallResult);

        return libraryCallResult;
    }

    makeLibraryCall(context: QuickAlgoLibrary, module: string, action: string, args: any) {
        return new Promise((resolve, reject) => {
            let callbackArguments = [];
            let result = context[module][action].apply(context, [...args, function (a) {
                log.getLogger('quickalgo_executor').debug('[quickalgo_executor] receive callback', arguments);
                callbackArguments = [...arguments];
                let argumentResult = callbackArguments.length ? callbackArguments[0] : undefined;
                log.getLogger('quickalgo_executor').debug('[quickalgo_executor] set result', argumentResult);
                resolve(argumentResult);
            }]);

            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] MODULE RESULT', result);
            if (Symbol.iterator in Object(result)) {
                this.iterateResult(module, action, result)
                    .then((argumentResult) => {
                        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] returned element', module, action, argumentResult);
                        // Use context.waitDelay to transform result to primitive when the library uses generators
                        context.waitDelay(resolve, argumentResult);
                    })
                    .catch(reject)
            }
        });
    }

    async iterateResult (module: string, action: string, result) {
        let lastResult;
        while (true) {
            /* Pull the next effect from the builtin's iterator. */
            const {done, value} = result.next();
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] ITERATOR RESULT', module, action, done, value);
            if (done) {
                return value;
            }

            const name = value[0];
            if (name === 'interact') {
                log.getLogger('quickalgo_executor').debug('[quickalgo_executor] ASK FOR INTERACT', this.stepperContext.interactAfter);
                lastResult = await this.stepperContext.interactAfter({...(value[1] || {}), progress: false});
                log.getLogger('quickalgo_executor').debug('[quickalgo_executor] last result', lastResult);
            } else if (name == 'put') {
                log.getLogger('quickalgo_executor').debug('[quickalgo_executor] ask put dispatch', value[1]);
                await this.stepperContext.dispatch(value[1]);
            }
        }
    }
}

export function createQuickAlgoLibraryExecutor(stepperContext: StepperContext) {
    const executor = new QuickalgoExecutor(stepperContext);

    return async function (...args: [module: string, action: string, args: any[], callback?: Function]) {
        return executor.execute.apply(executor, args);
    }
}
