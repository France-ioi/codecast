import AbstractRunner from "../abstract_runner";
import {getNodeStartRow, StepperContext, isStuck, StepperError, inUserCode, StepperApi} from "../api";
import * as C from '@france-ioi/persistent-c';
import {StepperState} from "../index";
import log from 'loglevel';
import {ActionTypes, ContextEnrichingTypes} from '../actionTypes';
import {analyseState, collectDirectives} from './analysis';
import {TaskAnswer} from '../../task/task_types';
import {appSelect} from '../../hooks';
import {documentToString} from '../../buffers/document';
import {call, put} from 'typed-redux-saga';
import {asyncRequestJson} from '../../utils/api';
import {LibraryTestResult} from '../../task/libs/library_test_result';
import {CodecastPlatform} from '../codecast_platform';
import {Block, BlockType} from '../../task/blocks/block_types';

export default class UnixRunner extends AbstractRunner {
    private builtinHandlers = new Map<string, (stepperContext: StepperContext, ...args) => void>();
    private effectHandlers = new Map<string, (stepperContext: StepperContext, ...args) => void>();
    private blockBuiltins: Record<string, (stepperContext: StepperContext, ...args) => void> = {};
    private availableBlocks: Block[] = [];
    private quickAlgoCallsExecutor;

    public static needsCompilation(): boolean {
        return true;
    }

    public static hasMicroSteps(): boolean {
        return true;
    }

    public initCodes(codes, availableBlocks, stepperApi: StepperApi) {
        this.builtinHandlers = stepperApi.builtinHandlers;
        this.effectHandlers = stepperApi.effectHandlers;
        this.availableBlocks = availableBlocks;
        this.injectFunctions();
    }

    public async programInitialization(stepperContext: StepperContext): Promise<void> {
        console.log('[unix] stepper context unix');
        while (!inUserCode(stepperContext.state)) {
            /* Mutate the stepper context to advance execution by a single step. */
            console.log('[unix] execute step');
            const effects = C.step(stepperContext.state.programState);
            if (effects) {
                await this.executeEffects(stepperContext, effects[Symbol.iterator]());
            }
        }
    }

    public injectFunctions() {
        console.log('inject functions unix');

        let blocksByGeneratorName: {[generatorName: string]: Block[]} = {};
        for (let block of this.availableBlocks) {
            if (block.generatorName) {
                if (!(block.generatorName in blocksByGeneratorName)) {
                    blocksByGeneratorName[block.generatorName] = [];
                }
                blocksByGeneratorName[block.generatorName].push(block);
            }
        }

        const blockBuiltins = {};

        for (let [generatorName, blocks] of Object.entries(blocksByGeneratorName)) {
            for (let block of blocks.filter(block => block.type === BlockType.Function)) {
                const {code, generatorName, name, params, type} = block;
                blockBuiltins[code] = this._createBuiltin(code, generatorName, name, params, type);
            }
        }

        this.blockBuiltins = blockBuiltins;
    }

    private _createBuiltin(name, generatorName, blockName, nbArgs, type) {
        const self = this;

        console.log('create builtin', {name, generatorName, blockName})

        return function* (stepperContext: StepperContext, ...args) {
            console.log('inside builtin', args);
            let result;
            const executorPromise = self.quickAlgoCallsExecutor(generatorName, blockName, args, res => result = res);
            yield ['promise', executorPromise];

            return result;
        }
    };

    public enrichStepperContext(stepperContext: StepperContext, state: StepperState) {
        stepperContext.state.programState = C.clearMemoryLog(state.programState);
        stepperContext.state.lastProgramState = {...state.programState}
    }

    public enrichStepperState(stepperState: StepperState, context: ContextEnrichingTypes, stepperContext?: StepperContext) {
        const {programState, controls} = stepperState;
        if (!programState) {
            return;
        }

        stepperState.isFinished = !stepperState.programState.control;
        const analysis = stepperState.analysis = analyseState(programState);
        const focusDepth = controls.stack.focusDepth;
        stepperState.directives = collectDirectives(analysis.functionCallStack, focusDepth);

        // TODO? initialize controls for each directive added, clear controls for each directive removed (except 'stack').
    }

    public isStuck(stepperState: StepperState): boolean {
        return !stepperState.programState.control;
    }

    public async runNewStep(stepperContext: StepperContext, noInteractive = false) {
        console.log('[unix runner] run new step', noInteractive);
        this.quickAlgoCallsExecutor = stepperContext.quickAlgoCallsExecutor;
        const effects = C.step(stepperContext.state.programState);
        await this.executeEffects(stepperContext, effects[Symbol.iterator]());

        /* Update the current position in source code. */
        const position = getNodeStartRow(stepperContext.state);

        if (0 === stepperContext.unixNextStepCondition % 3 && C.outOfCurrentStmt(stepperContext.state.programState)) {
            stepperContext.unixNextStepCondition++;
        }
        if (1 === stepperContext.unixNextStepCondition % 3 && C.intoNextStmt(stepperContext.state.programState)) {
            stepperContext.unixNextStepCondition++;
        }

        if (stepperContext.unixNextStepCondition % 3 === 2 || isStuck(stepperContext.state)) {
            if (noInteractive && !isStuck(stepperContext.state)) {
                return;
            }

            log.getLogger('stepper').debug('do interact');
            stepperContext.makeDelay = true;
            stepperContext.unixNextStepCondition = 0;
            await stepperContext.interactAfter({
                position
            });
            stepperContext.position = position;
        }
    }

    public *compileAnswer(answer: TaskAnswer) {
        let response;
        const state = yield* appSelect();
        const platform = CodecastPlatform.Cpp;
        try {
            const logData = state.statistics.logData;
            const postData = {source: documentToString(answer.document), platform, logData};
            const {baseUrl} = state.options;

            response = yield* call(asyncRequestJson, baseUrl + '/compile', postData);
        } catch (ex) {
            response = {error: ex.toString()};
        }

        response.platform = platform;
        if (response.ast) {
            yield* put({
                type: ActionTypes.CompileSucceeded,
                response,
            });
        } else {
            yield* put({type: ActionTypes.CompileFailed, payload: {testResult: new LibraryTestResult(null, 'compilation', {content: response.diagnostics})}});
        }
    }

    private async executeEffects(stepperContext: StepperContext, iterator) {
        console.log('[unix] execute effects');
        let lastResult;
        while (true) {
            /* Pull the next effect from the builtin's iterator. */
            const {done, value} = iterator.next(lastResult);
            if (done) {
                return value;
            }
            const name = value[0];
            console.log('[unix] execute effect ', name);
            if (name === 'interact') {
                lastResult = await stepperContext.interactAfter(value[1] || {});
            } else if (name === 'promise') {
                log.getLogger('stepper').debug('await promise');
                lastResult = await value[1];
                log.getLogger('stepper').debug('promise result', lastResult);
            } else if (name === 'builtin') {
                const builtin = value[1];
                if (this.builtinHandlers.has(builtin)) {
                    lastResult = await this.executeEffects(stepperContext, this.builtinHandlers.get(builtin)(stepperContext, ...value.slice(2)));
                } else if (builtin in this.blockBuiltins) {
                    lastResult = await this.executeEffects(stepperContext, this.blockBuiltins[builtin](stepperContext, ...value.slice(2)));
                } else {
                    throw new StepperError('error', `unknown builtin ${builtin}`);
                }
            } else {
                /* Call the effect handler, feed the result back into the iterator. */
                if (!this.effectHandlers.has(name)) {
                    throw new StepperError('error', `unhandled effect ${name}`);
                }

                lastResult = await this.executeEffects(stepperContext, this.effectHandlers.get(name)(stepperContext, ...value.slice(1)));
            }
        }
    }
}
