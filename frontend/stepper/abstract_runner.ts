import {StepperApi, StepperContext} from "./api";
import {getNodeRange, StepperState} from "./index";
import {ContextEnrichingTypes} from './actionTypes';
import {TaskAnswer} from '../task/task_types';
import log from 'loglevel';
import {Codecast} from '../app_types';

export default abstract class AbstractRunner {
    //TODO: improve this
    public _isFinished: boolean = false;
    public _steps: number = 0;
    public _stepsWithoutAction: number = 0;
    public _lastNbActions = null;
    public _nbActions = 0;
    public _allowStepsWithoutDelay = 0;
    protected _timeouts = [];
    protected threads: {[threadId: string]: any} = {};
    protected currentThreadId: number|null = null;
    protected nextThreadId: number|null = null;
    protected maxThreadId = 0;

    constructor(context) {
        context.runner = this;
    }

    public static needsCompilation(): boolean {
        return false;
    }

    public static hasMicroSteps(): boolean {
        return false;
    }

    public static hasBlocks(): boolean {
        return false;
    }

    public enrichStepperContext(stepperContext: StepperContext, state: StepperState): void {
        if (state.analysis) {
            stepperContext.state.lastAnalysis = Object.freeze(state.analysis);
        }
    }

    public enrichStepperState(stepperState: StepperState, context: ContextEnrichingTypes, stepperContext?: StepperContext): void {
        // @ts-ignore
        if (!this.constructor.hasBlocks()) {
            const sourceHighlight = getNodeRange(stepperState);
            stepperState.sourceHighlight = sourceHighlight ? {range: sourceHighlight} : null;
        }

        if (!stepperState.threadsAnalysis) {
            stepperState.threadsAnalysis = {};
        }
        stepperState.threadsAnalysis[this.getCurrentThreadId()] = {
            ...(stepperState.threadsAnalysis[this.getCurrentThreadId()] ?? {}),
            sourceHighlight: stepperState.sourceHighlight,
        };

        Codecast.runner.decideNextThread();
        this.extractSourceHighlight(stepperState);
    }

    public extractSourceHighlight(stepperState: StepperState) {
        const computedSourceHighlight = [];
        const nextThreadId = Codecast.runner.getNextThreadId();
        for (let threadId of Object.keys(Codecast.runner.getAllThreads())) {
            if (threadId in stepperState.threadsAnalysis) {
                const sourceHighlight = stepperState.threadsAnalysis[threadId].sourceHighlight;
                if (sourceHighlight && !stepperState.isFinished) {
                    computedSourceHighlight.push({
                        highlight: sourceHighlight,
                        className: nextThreadId === Number(threadId) ? 'code-highlight' : 'other-thread-highlight',
                    });
                }
            }
        }

        stepperState.computedSourceHighlight = computedSourceHighlight;
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
        this.threads = {};
        this.maxThreadId = 0;
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

    createValuePrimitive(value: any): any {

    }

    public signalAction() {
        // Allows a context to signal an "action" happened
        this._stepsWithoutAction = 0;
    }

    public *compileAnswer(answer: TaskAnswer, stepperApi: StepperApi): Generator<any, void> {
    }

    public async programInitialization(stepperContext: StepperContext): Promise<void> {
    }

    public makeQuickalgoCall(quickalgoMethod, callback) {
        quickalgoMethod(callback);
    }

    public createNewThread(threadData: any): void {
        log.getLogger('multithread').debug('[multithread] default create new thread');
    }

    public registerNewThread(threadData: any = null, switchToNewThread: boolean = false): number {
        log.getLogger('multithread').debug('[multithread] register new thread', threadData);
        const newThreadId = this.maxThreadId;
        this.threads[newThreadId] = threadData ? [...threadData] : null;
        this.maxThreadId++;
        if (switchToNewThread) {
            this.currentThreadId = newThreadId;
        }

        return newThreadId;
    }

    public getAllThreads() {
        log.getLogger('multithread').debug('[multithread] all threads', {...this.threads});
        return this.threads;
    }

    public saveCurrentThreadData(threadData: any): void {
        if (!(this.currentThreadId in this.threads)) {
            return;
        }
        log.getLogger('multithread').debug('[multithread] save thread data', {threadId: this.currentThreadId, threadData});
        this.threads[this.currentThreadId] = threadData;
    }

    public getCurrentThreadId(): number {
        return this.currentThreadId;
    }

    public getNextThreadId(): number {
        return this.nextThreadId;
    }

    public swapCurrentThreadId(newThreadId: number): void {
        this.currentThreadId = newThreadId;
    }

    public currentThreadFinished(newThreadId: number): void {
        log.getLogger('multithread').debug('[multithread] thread finished', {finishedId: newThreadId, current: this.currentThreadId});
        delete this.threads[newThreadId];
        log.getLogger('multithread').debug('[multithread] new threads after finished', {...this.threads});
    }

    decideNextThread(): void {
        const threads = this.getAllThreads();
        let currentThreadId = this.getCurrentThreadId();
        const threadIds = Object.keys(threads);
        let currentThreadPosition = threadIds.indexOf(String(currentThreadId));
        if (-1 === currentThreadPosition) {
            currentThreadPosition = 0;
        }
        const nextThreadPosition = (currentThreadPosition + 1) % threadIds.length;
        this.nextThreadId = Number(threadIds[nextThreadPosition]);
    }
}
