import {Bundle} from "../linker";
import {call, put, takeEvery} from "typed-redux-saga";
import {AppAction, AppStore} from "../store";
import {
    getTaskAnswerAggregated,
    platformApi,
    PlatformTaskGradingParameters,
    taskGetNextLevelToIncreaseScore
} from "../task/platform/platform";
import {
    SubmissionNormalized,
    SubmissionSubtaskNormalized,
    SubmissionTestErrorCode,
    SubmissionTestNormalized
} from './task_platform';
import {taskSubmissionExecutor} from './task_submission';
import {appSelect} from '../hooks';
import stringify from 'json-stable-stringify-without-jsonify';
import {taskSetBlocksPanelCollapsed, taskSlice, updateCurrentTestId} from '../task/task_slice';
import {stepperClearError, stepperDisplayError} from '../stepper/actionTypes';
import {quickAlgoLibraries} from '../task/libs/quickalgo_libraries';
import {submissionChangePaneOpen} from './submission_slice';

export interface TaskSubmissionTestResult {
    executing?: boolean,
    testId: string,
    message?: string,
    score: number,
    errorCode: SubmissionTestErrorCode,
}

export enum TaskSubmissionEvaluateOn {
    Client = 'client',
    Server = 'server',
}

export interface TaskSubmission {
    type: TaskSubmissionEvaluateOn,
    date: string, // ISO format
    evaluated: boolean,
    crashed?: boolean,
    result?: TaskSubmissionResult,
}

export function isServerSubmission(object: TaskSubmission): object is TaskSubmissionServer {
    return TaskSubmissionEvaluateOn.Server === object.type;
}

export interface TaskSubmissionResult {
    tests: TaskSubmissionTestResult[],
}

export interface TaskSubmissionClient extends TaskSubmission {
    type: TaskSubmissionEvaluateOn.Client,
}

export interface TaskSubmissionServer extends TaskSubmission {
    result?: TaskSubmissionServerResult,
    type: TaskSubmissionEvaluateOn.Server,
}

export interface TaskSubmissionServerResult extends SubmissionNormalized {
    subTasks?: SubmissionSubtaskNormalized[],
    tests: TaskSubmissionServerTestResult[],
}

export interface TaskSubmissionServerTestResult extends TaskSubmissionTestResult, SubmissionTestNormalized {

}

export interface TaskSubmissionResultPayload {
    testId: number,
    result: boolean,
    successRate?: number, // Between 0 and 1
    message?: string,
    steps?: number,
}

export enum SubmissionActionTypes {
    SubmissionTriggerPlatformValidate = 'submission/triggerPlatformValidate',
}

export interface SubmissionTriggerPlatformValidateAction extends AppAction {
    type: SubmissionActionTypes.SubmissionTriggerPlatformValidate,
}

export const submissionTriggerPlatformValidate = (): SubmissionTriggerPlatformValidateAction => ({
    type: SubmissionActionTypes.SubmissionTriggerPlatformValidate,
});

export function selectCurrentServerSubmission(state: AppStore) {
    if (null === state.submission.currentSubmissionId) {
        return null;
    }

    const currentSubmission = state.submission.taskSubmissions[state.submission.currentSubmissionId];

    return TaskSubmissionEvaluateOn.Server === currentSubmission.type ? currentSubmission : null;
}

export interface TestResultDiffLog {
    remainingInput?: string,
    msg?: string,
    solutionOutputLength?: number,
    diffRow: number,
    diffCol: number,
    displayedSolutionOutput: string,
    displayedExpectedOutput: string,
    truncatedBefore?: boolean,
    truncatedAfter?: boolean,
    excerptRow: number,
    excerptCol: number,
}

export function selectSubmissionsPaneEnabled(state: AppStore) {
    if (!state.task.currentTask || state.task.currentTask.gridInfos.hiddenTests) {
        return false;
    }

    return !!(state.options.viewTestDetails || state.options.canAddUserTests || (state.task.currentTask && state.task.taskTests.length > 1))
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield* takeEvery(SubmissionActionTypes.SubmissionTriggerPlatformValidate, function* (action: SubmissionTriggerPlatformValidateAction) {
            yield* call([platformApi, platformApi.validate], 'done');
            if (window.SrlLogger) {
                window.SrlLogger.validation(100, 'none', 0);
            }
        });

        yield* takeEvery(updateCurrentTestId, function* ({payload}) {
            const newTest = yield* appSelect(state => state.task.taskTests[state.task.currentTestId]);
            const submission = yield* appSelect(selectCurrentServerSubmission);
            if (null !== submission && null !== newTest && isServerSubmission(submission)) {
                const testResult = submission.result.tests.find(test => test.testId === newTest.id);
                if (undefined !== testResult) {
                    let error = null;
                    const context = quickAlgoLibraries.getContext(null, 'main');
                    if (!testResult.noFeedback && testResult.log && context.getErrorFromTestResult) {
                        error = context.getErrorFromTestResult(testResult);
                    }
                    if (null === error && testResult.errorMessage) {
                        error = testResult.errorMessage;
                    }

                    if (null !== error) {
                        yield* put(stepperDisplayError(error));
                    } else {
                        yield* put(stepperClearError());
                    }
                }
            }
        });
    });
}
