import AbstractRunner from "../abstract_runner";
import {getNodeStartRow, StepperContext, isStuck} from "../api";
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

export default class UnixRunner extends AbstractRunner {
    public static needsCompilation(): boolean {
        return true;
    }

    public static hasMicroSteps(): boolean {
        return true;
    }

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
        const effects = C.step(stepperContext.state.programState);
        await stepperContext.executeEffects(stepperContext, effects[Symbol.iterator]());

        if (noInteractive) {
            return;
        }

        /* Update the current position in source code. */
        const position = getNodeStartRow(stepperContext.state);

        if (0 === stepperContext.unixNextStepCondition % 3 && C.outOfCurrentStmt(stepperContext.state.programState)) {
            stepperContext.unixNextStepCondition++;
        }
        if (1 === stepperContext.unixNextStepCondition % 3 && C.intoNextStmt(stepperContext.state.programState)) {
            stepperContext.unixNextStepCondition++;
        }

        if (stepperContext.unixNextStepCondition % 3 === 2 || isStuck(stepperContext.state)) {
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
}
