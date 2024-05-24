import AbstractRunner from "../abstract_runner";
import {getNodeStartRow, StepperContext, isStuck, StepperError, inUserCode, StepperApi} from "../api";
import * as C from '@france-ioi/persistent-c';
import {StepperState} from "../index";
import log from 'loglevel';
import {ActionTypes, ContextEnrichingTypes} from '../actionTypes';
import {analyseState, convertUnixStateToAnalysisSnapshot} from './analysis';
import {TaskAnswer} from '../../task/task_types';
import {appSelect} from '../../hooks';
import {documentToString} from '../../buffers/document';
import {call, put} from 'typed-redux-saga';
import {asyncRequestJson} from '../../utils/api';
import {LibraryTestResult} from '../../task/libs/library_test_result';
import {CodecastPlatform} from '../codecast_platform';
import {Block, BlockType} from '../../task/blocks/block_types';
import {getContextBlocksDataSelector} from '../../task/blocks/blocks';
import {quickAlgoLibraries} from '../../task/libs/quick_algo_libraries_model';
import {convertAnalysisDAPToCodecastFormat} from '../analysis/analysis';
import {parseDirectives} from '../python/directives';
import UnixVariableFetcher from './unix_variable_fetcher';

const RETURN_TYPE_CONVERSION = {
    'bool': 'int',
    'string': 'const char*',
    'int': 'int',
};

const PARAM_TYPE_CONVERSION = {
    'Boolean': 'int',
    'String': 'char*',
    'Number': 'int',
};

export default class UnixRunner extends AbstractRunner {
    private builtinHandlers = new Map<string, (stepperContext: StepperContext, ...args) => void>();
    private effectHandlers = new Map<string, (stepperContext: StepperContext, ...args) => void>();
    private blockBuiltins: Record<string, (stepperContext: StepperContext, ...args) => void> = {};
    private availableBlocks: Block[] = [];
    private quickAlgoCallsExecutor;
    private functionHeaders: Record<string, string> = {};

    public static needsCompilation(): boolean {
        return true;
    }

    public static hasMicroSteps(): boolean {
        return true;
    }

    public async programInitialization(stepperContext: StepperContext): Promise<void> {
        this.registerNewThread();

        while (!inUserCode(stepperContext.state)) {
            /* Mutate the stepper context to advance execution by a single step. */
            const effects = C.step(stepperContext.state.programState);
            if (effects) {
                await this.executeEffects(stepperContext, effects[Symbol.iterator]());
            }
        }
    }

    public injectFunctions() {
        let blocksByGeneratorName: {[generatorName: string]: Block[]} = {};
        for (let block of this.availableBlocks) {
            if (block.generatorName) {
                if (!(block.generatorName in blocksByGeneratorName)) {
                    blocksByGeneratorName[block.generatorName] = [];
                }
                blocksByGeneratorName[block.generatorName].push(block);
            }
        }

        this.functionHeaders = {};
        const blockBuiltins = {};

        for (let [generatorName, blocks] of Object.entries(blocksByGeneratorName)) {
            const headers = {};

            for (let block of blocks.filter(block => block.type === BlockType.Function)) {
                const {code} = block;
                blockBuiltins[code] = this._createBuiltin(block);
                const argsSection = block.params.map(param => {
                    return param in PARAM_TYPE_CONVERSION ? PARAM_TYPE_CONVERSION[param] : 'int';
                }).join(', ');
                headers[code] = `${block.returnType in RETURN_TYPE_CONVERSION ? RETURN_TYPE_CONVERSION[block.returnType] : 'void'} ${code}(${argsSection});`;
            }

            this.functionHeaders[generatorName + '.h'] = Object.values(headers).join("\n");
        }

        this.blockBuiltins = blockBuiltins;
    }

    private _createBuiltin(block: Block) {
        const self = this;

        return function* (stepperContext: StepperContext, ...args) {
            let result;
            const formattedArgs = args.map(arg => {
                if (arg instanceof C.IntegralValue) {
                    return arg.toInteger();
                }
                if (arg instanceof C.PointerValue) {
                    return C.readString(stepperContext.state.programState.memory, arg);
                }

                return arg;
            });

            const executorPromise = self.quickAlgoCallsExecutor(block.generatorName, block.name, formattedArgs, res => result = res);
            yield ['promise', executorPromise];

            if ('int' === block.returnType) {
                yield ['result', new C.IntegralValue(C.builtinTypes['int'], result)];
            } else if (block.returnType) {
                yield ['result', result];
            }
        }
    };

    public enrichStepperContext(stepperContext: StepperContext, state: StepperState) {
        stepperContext.state.programState = C.clearMemoryLog(state.programState);
        stepperContext.state.lastProgramState = {...state.programState};
        super.enrichStepperContext(stepperContext, state);
    }

    public enrichStepperState(stepperState: StepperState, context: ContextEnrichingTypes, stepperContext?: StepperContext) {
        const {programState, controls} = stepperState;
        if (!programState) {
            return;
        }

        stepperState.isFinished = !stepperState.programState.control;
        stepperState.analysis = convertUnixStateToAnalysisSnapshot(stepperState.programState, stepperState.lastProgramState);
        stepperState.directives = parseDirectives(stepperState.analysis);

        if (!stepperState.lastAnalysis) {
            stepperState.lastAnalysis = {
                stackFrames: [],
                stepNum: 0,
            };
        }

        stepperState.codecastAnalysis = convertAnalysisDAPToCodecastFormat(stepperState.analysis, stepperState.lastAnalysis, {
            displayType: true,
        });

        super.enrichStepperState(stepperState, context, stepperContext);
    }

    public isStuck(stepperState: StepperState): boolean {
        return !stepperState.programState.control;
    }

    public async runNewStep(stepperContext: StepperContext, noInteractive = false) {
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
                position,
            });
            stepperContext.position = position;
            stepperContext.hasMadeFinalInteract = true;
        }
    }

    public *compileAnswer(answer: TaskAnswer, stepperApi: StepperApi) {
        const state = yield* appSelect();
        const context = quickAlgoLibraries.getContext(null, state.environment);
        const blocksData = getContextBlocksDataSelector({state, context});

        this.builtinHandlers = stepperApi.builtinHandlers;
        this.effectHandlers = stepperApi.effectHandlers;
        this.availableBlocks = blocksData;
        this.injectFunctions();

        let response;
        const platform = CodecastPlatform.Cpp;
        try {
            const logData = state.statistics.logData;
            const postData = {
                source: documentToString(answer.document),
                platform,
                logData,
                headers: this.functionHeaders,
            };
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

    public getVariableFetcher() {
        return new UnixVariableFetcher();
    }
}
