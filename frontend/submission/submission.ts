import {Bundle} from "../linker";
import {call, put, takeEvery} from "typed-redux-saga";
import {AppAction, AppStore} from "../store";
import {
    platformApi,
} from "../task/platform/platform";
import {
    SubmissionNormalized,
    SubmissionSubtaskNormalized,
    SubmissionTestErrorCode,
    SubmissionTestNormalized
} from './task_platform';
import {appSelect} from '../hooks';
import {updateCurrentTestId} from '../task/task_slice';
import {stepperClearError, stepperDisplayError} from '../stepper/actionTypes';
import {
    quickAlgoLibraries,
    quickAlgoLibraryResetAndReloadStateSaga
} from '../task/libs/quickalgo_libraries';
import {CodecastPlatform} from '../stepper/platforms';
import {
    submissionChangeCurrentSubmissionId,
    submissionChangeDisplayedError,
    SubmissionErrorType,
    submissionSlice
} from './submission_slice';
import {getMessage} from '../lang';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {createAction} from '@reduxjs/toolkit';
import {TaskLevelName} from '../task/platform/platform_slice';
import {App} from '../index';
import {addAutoRecordingBehaviour} from '../recorder/record';
import {analysisTogglePath} from '../stepper/analysis/analysis_slice';

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
    platform: CodecastPlatform,
    result?: TaskSubmissionResult,
}

export function isServerSubmission(object: TaskSubmission): object is TaskSubmissionServer {
    return TaskSubmissionEvaluateOn.Server === object.type;
}

export interface TaskSubmissionResult {
    tests: TaskSubmissionTestResult[],
    compilationError?: boolean,
    compilationMessage?: string|null,
    errorMessage?: string|null,
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
    testResult?: LibraryTestResult,
    noGrading?: boolean,
}

export const callPlatformValidate = createAction('submission/callPlatformValidate', (action?: string) => ({
    payload: {
        action,
    },
}));



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
    bundle.addSaga(function* (app: App) {
        yield* takeEvery(callPlatformValidate, function* (action) {
            const platformAction = action.payload.action ?? 'done';
            yield* call([platformApi, platformApi.validate], platformAction);
        });

        yield* takeEvery(updateCurrentTestId, function* ({payload}) {
            const newTest = yield* appSelect(state => state.task.taskTests[state.task.currentTestId]);
            const submission = yield* appSelect(selectCurrentServerSubmission);
            const submissionDisplayedError = yield* appSelect(state => state.submission.submissionDisplayedError);
            if (null !== submissionDisplayedError) {
                yield* put(submissionChangeDisplayedError(null));
            }
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

        yield* takeEvery(submissionChangeCurrentSubmissionId, function* ({payload}) {
            const submissionId = yield* appSelect(state => state.submission.currentSubmissionId);
            if (null === submissionId) {
                yield* call(quickAlgoLibraryResetAndReloadStateSaga);
                yield* put(stepperClearError());
            }
        });

        yield* takeEvery(submissionChangeDisplayedError, function* ({payload}) {
            if (SubmissionErrorType.CompilationError === payload) {
                const error = getMessage('SUBMISSION_ERROR_COMPILATION').s;
                yield* put(stepperDisplayError(error));
            } else if (null === payload) {
                yield* put(stepperClearError());
            }
        });
    });

    bundle.defer(function (app: App) {
        if ('main' !== app.environment) {
            return;
        }

        addAutoRecordingBehaviour(app, {
            sliceName: submissionSlice.name,
            actions: [],
        });
    });
}
