import log from 'loglevel';
import {stepperThrottleDisplayDelay} from './index';
import {
    ActionTypes as CompileActionTypes,
    stepperExecutionEndConditionReached,
    stepperExecutionError, stepperRecordLibraryCall
} from './actionTypes';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {QuickalgoLibraryCall, StepperContext} from './api';
import {QuickAlgoLibrary} from '../task/libs/quickalgo_library';
import {Codecast} from '../app_types';
import {getMessage} from '../lang';

const EXECUTOR_TIMEOUT = 60*1000; // ms

class TimeoutError extends Error {
}

class QuickalgoExecutor {
    private stepperContext: StepperContext;
    
    constructor(stepperContext: StepperContext) {
        this.stepperContext = stepperContext;
    }
    
    async execute(module: string, action: string, args: any[], callback?: Function) {
        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] call quickalgo', module, action, args, callback, Codecast.runner.getCurrentThreadId());
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

                return;
            }
        }

        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] ready for call');
        if (null !== context.plannedNewDelay && undefined !== context.plannedNewDelay) {
            context.infos.actionDelay = context.plannedNewDelay;
        }

        const callingMethod = this.getCallingMethod(context, module, action);

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
                    context.planNewDelay(0);
                    this.stepperContext.taskDisplayNoneStatus = null;
                }
            }

            if (callingMethod.recordCallResults) {
                // Replay call from recording if possible and available
                libraryCallResult = await this.recordReplayTimedLibraryCall(context, module, action, args);
            } else {
                libraryCallResult = await this.makeTimedLibraryCall(context, module, action, args);
            }
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] after make async lib call', libraryCallResult);

            if (hideDisplay) {
                // context.display = true;
                // } else {
                context.planNewDelay(previousDelay);
            }

            // Leave stepperThrottleDisplayDelay ms before displaying again the context
            if (!this.stepperContext.taskDisplayNoneStatus) {
                this.stepperContext.taskDisplayNoneStatus = 'running';
                setTimeout(() => {
                    this.stepperContext.taskDisplayNoneStatus = 'end';
                }, stepperThrottleDisplayDelay);
            }
        } catch (e: unknown) {
            // If execution of this step has been terminated during the running of this executor, don't do anything
            if (this.stepperContext.finished) {
                return;
            }

            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] context error 2', e);
            if (e instanceof Error) {
                console.error(e);
            }
            if (hideDisplay) {
                // context.display = true;
                // } else {
                context.planNewDelay(previousDelay);
            }

            await this.stepperContext.dispatch({
                type: CompileActionTypes.StepperInterrupting,
            });

            Codecast.runner?.stop();

            let errorMessage = String(e);
            if (e instanceof TimeoutError) {
                errorMessage = getMessage('SUBMISSION_ERROR_TIMEOUT').s;
            }

            await this.stepperContext.dispatch(stepperExecutionError(LibraryTestResult.fromString(errorMessage)));
        }

        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] after make async library call', libraryCallResult);

        libraryCallResult = Codecast.runner?.createValuePrimitive(libraryCallResult);

        if (this.stepperContext.quickAlgoCallsLogger) {
            const quickAlgoLibraryCall: QuickalgoLibraryCall = {module, action, args};
            this.stepperContext.quickAlgoCallsLogger(quickAlgoLibraryCall, callingMethod.recordCallResults ? libraryCallResult : undefined);
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] call quickalgo calls logger', module, action, args, libraryCallResult);
        }

        if (context.callsToExecute.length) {
            const newCall = context.callsToExecute.pop();
            libraryCallResult = await this.execute(module, newCall.action, newCall.args, newCall.callback);
        }

        if (callback) {
            log.getLogger('quickalgo_executor').debug('[quickalgo_executor] call callback arguments', libraryCallResult);
            callback(libraryCallResult);
        }

        log.getLogger('quickalgo_executor').debug('[quickalgo_executor] return library call result', libraryCallResult);

        return libraryCallResult;
    }

    makeTimedLibraryCall(context: QuickAlgoLibrary, module: string, action: string, args: any) {
        let timer: NodeJS.Timeout;

        return Promise.race([
            this.makeLibraryCall(context, module, action, args),
            new Promise((_r, rej) => timer = setTimeout(rej, EXECUTOR_TIMEOUT, new TimeoutError())),
        ]).finally(() => clearTimeout(timer));
    }

    makeLibraryCall(context: QuickAlgoLibrary, module: string, action: string, args: any) {
        const callingMethod = this.getCallingMethod(context, module, action);

        return new Promise((resolve, reject) => {
            let callbackArguments = [];
            let result = callingMethod.apply(context, [...args, function () {
                log.getLogger('quickalgo_executor').debug('[quickalgo_executor] receive callback', arguments);
                callbackArguments = [...arguments];
                let argumentResult = callbackArguments.length ? callbackArguments[0] : undefined;
                log.getLogger('quickalgo_executor').debug('[quickalgo_executor] set result', argumentResult);
                resolve(argumentResult);
            }]);
            if (result instanceof Promise) {
                result.then(resolve).catch(reject);
            } else {
                Promise.resolve(result).catch(reject);
            }

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

    getCallingMethod(context: QuickAlgoLibrary, module: string, action: string) {
        if (!(module in context)) {
            throw new Error(`Error calling ${module}->${action}: this module does not exist: ${module}`);
        }

        let method = context[module][action];
        if (-1 !== action.indexOf('->')) {
            const [className, classMethod] = action.split('->');
            if (!(className in context[module])) {
                throw new Error(`Error calling ${module}->${className}->${classMethod}: this class is not defined: ${className}`);
            }
            if (!(classMethod in context[module][className])) {
                throw new Error(`Error calling ${module}->${className}->${classMethod}: this class method is not defined: ${classMethod}`);
            }
            method = context[module][className][classMethod];
        } else {
            if (!(action in context[module])) {
                throw new Error(`Error calling ${module}->${action}: this action is not defined: ${action}`);
            }
        }

        return method;
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

    private async recordReplayTimedLibraryCall(context: QuickAlgoLibrary, module: string, action: string, args: any[]) {
        console.log('stepper context library calls', this.stepperContext.libraryCallsLog)
        if (this.stepperContext.libraryCallsLog && this.stepperContext.libraryCallsLog.length) {
            const nextCall = this.stepperContext.libraryCallsLog.shift();
            if (this.checkLibraryCallsEquality(nextCall.call, {module, action, args})) {
                console.log('use hit response');
                return nextCall.result;
            }
        }

        const libraryCallResult = await this.makeTimedLibraryCall(context, module, action, args);

        const libraryCall: QuickalgoLibraryCall = {
            module,
            action,
            args,
        };

        console.log('record call results', this.stepperContext.libraryCallsLog, {module, action, args});

        await this.stepperContext.dispatch(stepperRecordLibraryCall(libraryCall, libraryCallResult));

        return libraryCallResult;

        // if result is a complex type like an image, store it independently
        // 1. download it from the task platform url
        // 2.
    }

    private checkLibraryCallsEquality(call1: QuickalgoLibraryCall, call2: QuickalgoLibraryCall): boolean {
        return call1.module === call2.module
            && call1.action === call2.action
            && JSON.stringify(call1.args) === JSON.stringify(call2.args);
    }
}

export function createQuickAlgoLibraryExecutor(stepperContext: StepperContext) {
    const executor = new QuickalgoExecutor(stepperContext);

    return async function (...args: [module: string, action: string, args: any[], callback?: Function]) {
        return executor.execute.apply(executor, args);
    }
}
