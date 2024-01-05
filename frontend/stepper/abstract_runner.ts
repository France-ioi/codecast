import {StepperApi, StepperContext} from "./api";
import {StepperState} from "./index";
import {ContextEnrichingTypes} from './actionTypes';
import {TaskAnswer} from '../task/task_types';
import log from 'loglevel';

export default abstract class AbstractRunner {
    //TODO: improve this
    public _isFinished: boolean = false;
    public _steps: number = 0;
    public _stepsWithoutAction: number = 0;
    public _lastNbActions = null;
    public _nbActions = 0;
    public _allowStepsWithoutDelay = 0;
    protected _timeouts = [];

    constructor(context) {
        context.runner = this;
    }

    public static needsCompilation(): boolean {
        return false;
    }

    public static hasMicroSteps(): boolean {
        return false;
    }

    public enrichStepperContext(stepperContext: StepperContext, state: StepperState): void {
        if (state.analysis) {
            stepperContext.state.lastAnalysis = Object.freeze(state.analysis);
        }
    }

    public enrichStepperState(stepperState: StepperState, context: ContextEnrichingTypes, stepperContext?: StepperContext): void {
    }

    public isStuck(stepperState: StepperState): boolean {
        return false;
    }

    public async runNewStep(stepperContext: StepperContext, noInteractive = false) {

    }

    // Run inside step without Codecast interaction
    public runStep(quickAlgoCallsExecutor) {

    }

    public initCodes(codes, availableBlocks = null) {

    }

    public stop() {

    }

    public onError(e): void {
        console.error(e);
    }

    public isSynchronizedWithAnalysis(analysis): boolean {
        return true;
    }

    public isRunning(): boolean {
        // TODO: implement this if necessary
        return false;
    }

    waitDelay(callback, value, delay) {
        log.getLogger('python_runner').debug('WAIT DELAY', value, delay);
        if (delay > 0) {
            let _noDelay = this.noDelay.bind(this, callback, value);
            this._setTimeout(_noDelay, delay);
        } else {
            this.noDelay(callback, value);
        }
    }

    _setTimeout(func, time) {
        let timeoutId = window.setTimeout(() => {
            let idx = this._timeouts.indexOf(timeoutId);
            if (idx > -1) {
                this._timeouts.splice(idx, 1);
            }

            func();
        }, time);

        this._timeouts.push(timeoutId);
    }

    waitCallback(callback) {
        return (value) => {
            this.noDelay(callback, value);
        };
    }

    noDelay(callback, value) {
        callback(value);
    }

    public signalAction() {
        // Allows a context to signal an "action" happened
        this._stepsWithoutAction = 0;
    }

    public *compileAnswer(answer: TaskAnswer, stepperApi: StepperApi): Generator<any, void> {
    }

    public async programInitialization(stepperContext: StepperContext): Promise<void> {
    }
}
