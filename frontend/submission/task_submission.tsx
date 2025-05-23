import {apply, call, cancel, cancelled, fork, put, race, spawn} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes, stepperDisplayError} from "../stepper/actionTypes";
import log from "loglevel";
import {
    getNextLevelIndex,
    PlatformTaskGradingParameters,
    PlatformTaskGradingResult,
} from "../task/platform/platform";
import {selectAnswer} from "../task/selectors";
import {delay} from "../player/sagas";
import {
    submissionAddNewTaskSubmission,
    submissionChangeCurrentSubmissionId,
    submissionChangeDisplayedError,
    submissionChangePaneOpen,
    SubmissionErrorType,
    SubmissionExecutionScope,
    submissionSetTestResult,
    submissionStartExecutingTest,
    submissionUpdateTaskSubmission,
} from "./submission_slice";
import {longPollServerSubmissionResults, makeServerSubmission} from "./task_platform";
import {appSelect} from '../hooks';
import {getTaskPlatformMode, recordingProgressSteps, TaskPlatformMode} from '../task/utils';
import {TaskActionTypes, updateCurrentTestId} from '../task/task_slice';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {DeferredPromise} from '../utils/app';
import {getTaskLevelTests, selectSubmissionsPaneEnabled} from './submission_selectors';
import {isServerTask, isTestPublic, TaskAnswer, TaskTestGroupType} from '../task/task_types';
import {platformAnswerGraded} from '../task/platform/actionTypes';
import {getMessage} from '../lang';
import {
    TaskSubmissionEvaluateOn,
    TaskSubmissionResultPayload,
    TaskSubmissionServer,
    TaskSubmissionServerResult
} from './submission_types';
import {Codecast} from '../app_types';
import {documentToString} from '../buffers/document';
import {murmurhash3_32_gc} from '../common/utils';
import {bufferAssociateToSubmission} from '../buffers/buffers_slice';
import {TaskLevelName} from '../task/platform/platform_slice';
import {callPlatformValidate} from './submission_actions';
import {doesPlatformHaveClientRunner} from '../stepper';
import {displayModal} from '../common/prompt_modal';
import {ModalType} from '../common/modal_slice';

const executionsCache = {};
const submissionExecutionTasks = {};

class TaskSubmissionExecutor {
    private afterExecutionCallback: Function = null;

    *afterExecution(result: TaskSubmissionResultPayload) {
        log.getLogger('tests').debug('After execution', result);
        if (this.afterExecutionCallback) {
            this.afterExecutionCallback(result);
            this.afterExecutionCallback = null;
            return;
        }

        const state = yield* appSelect();
        let currentSubmissionId = state.submission.currentSubmissionId;
        const level = state.task.currentLevel;
        const answer = selectAnswer(state);
        const tests = yield* appSelect(getTaskLevelTests);
        if (!tests || 0 === Object.values(tests).length || result.noGrading) {
            return;
        }

        if (!currentSubmissionId) {
            const hasCompilationError = result.testResult && 'compilation' === result.testResult.type;

            log.getLogger('submission').log('[submission] Create new submission', tests);
            yield* put(submissionAddNewTaskSubmission({
                evaluated: false,
                date: new Date().toISOString(),
                platform: answer.platform,
                type: TaskSubmissionEvaluateOn.Client,
                result: {
                    tests: tests.map((test, testIndex) => ({executing: false, score: 0, testId: test.id ? test.id : String(testIndex), errorCode: null})),
                    ...(hasCompilationError ? {
                        compilationError: true,
                        compilationMessage: result.testResult.props.content,
                    } : {}),
                },
            }));

            currentSubmissionId = yield* appSelect(state => state.submission.taskSubmissions.length - 1);
            yield* put(submissionChangeCurrentSubmissionId({submissionId: currentSubmissionId, withoutTestChange: true}));

            if (hasCompilationError) {
                yield* put(submissionChangeDisplayedError(SubmissionErrorType.CompilationError));
            }
        }

        yield* put(submissionSetTestResult({submissionId: currentSubmissionId, testId: result.testId, result}));
        log.getLogger('submission').log('[submission] Set first test result');

        if (!result.result) {
            // We execute other tests only if the current one has succeeded
            const currentSubmission = yield* appSelect(state => state.submission.taskSubmissions[currentSubmissionId]);
            yield* put(submissionUpdateTaskSubmission({id: currentSubmissionId, submission: {...currentSubmission, evaluated: true}, withoutTestChange: true}));

            return;
        }

        const displayedResults = [result];
        for (let testIndex = 0; testIndex < tests.length; testIndex++) {
            const test = tests[testIndex];
            if (result.testId === testIndex) {
                continue;
            }
            if (!isTestPublic(test) || !doesPlatformHaveClientRunner(answer.platform)) {
                continue;
            }

            yield* put(submissionStartExecutingTest({submissionId: currentSubmissionId, testId: testIndex}));
            log.getLogger('tests').debug('[Tests] Start new execution for test', testIndex);
            const payload: TaskSubmissionResultPayload = yield this.makeBackgroundExecution(level, testIndex, answer);
            log.getLogger('tests').debug('[Tests] End execution, result=', payload);
            yield* put(submissionSetTestResult({submissionId: currentSubmissionId, testId: testIndex, result: payload}));
            displayedResults.push(payload);
            if (false === payload.result) {
                // Stop at first test that doesn't work
                break;
            }
        }

        const currentSubmission = yield* appSelect(state => state.submission.taskSubmissions[currentSubmissionId]);

        let worstRate = 1;
        for (let testResult of currentSubmission.result.tests) {
            worstRate = Math.min(worstRate, testResult.score);
        }

        yield* put(submissionUpdateTaskSubmission({id: currentSubmissionId, submission: {...currentSubmission, evaluated: true}, withoutTestChange: true}));

        const finalScore = worstRate;
        if (state.task.currentTask && isServerTask(state.task.currentTask) && displayedResults.length > 0 && !displayedResults.find(result => result.successRate !== 1)) {
            yield* put(displayModal({
                message: getMessage('TASK_CLIENT_TESTS_SUCCESS'),
                mode: ModalType.message,
                yesButtonText: getMessage('TASK_CLIENT_TESTS_SUCCESS_YES'),
                noButtonText: getMessage('CANCEL'),
                callback: (result: boolean) => {
                    if (result) {
                        const mainStore = Codecast.environments['main'].store;
                        mainStore.dispatch(callPlatformValidate());
                    }
                },
            }));
        } else if (finalScore > 0) {
            const levels = yield* appSelect(state => state.platform.levels);
            const nextLevel = getNextLevelIndex(levels, level);
            let stay = finalScore < 1 || null !== nextLevel;

            yield* put(callPlatformValidate(stay ? 'stay' : 'done'));
            if (1 <= finalScore && window.SrlLogger) {
                window.SrlLogger.validation(100, 'none', 0);
            }
        } else {
            log.getLogger('tests').debug('Submission execution over', currentSubmission.result.tests);
            if (currentSubmission.result.tests.find(testResult => testResult.score !== 1)) {
                const error = new LibraryTestResult(null, 'task-tests-submission-results-overview', {
                    results: displayedResults,
                });

                yield* put(stepperDisplayError(error));
            }
        }
    }

    *makeBackgroundExecution(level: TaskLevelName, testId: number, answer: TaskAnswer) {
        const backgroundStore = Codecast.environments['background'].store;
        const state = yield* appSelect();
        const task = state.task.currentTask;
        const tests = state.task.taskTests;
        const taskVariant = state.options.taskVariant;

        const taskParameters = [
            documentToString(answer.document),
            level,
            testId,
            taskVariant,
            JSON.stringify(tests[testId].data),
        ];
        const serialized = taskParameters.join('§');
        let h1 = murmurhash3_32_gc(serialized, 0);
        const cacheKey = h1 + murmurhash3_32_gc(h1 + serialized, 0); // Extend to 64-bit hash

        if (!(cacheKey in executionsCache)) {
            log.getLogger('tests').debug('Executions cache MISS', taskParameters, cacheKey);
            executionsCache[cacheKey] = yield new Promise<TaskSubmissionResultPayload>(resolve => {
                backgroundStore.dispatch({type: TaskActionTypes.TaskRunExecution, payload: {options: state.options, task, level, testId, tests, answer, resolve}});
            });
        } else {
            log.getLogger('tests').debug('Executions cache HIT', {level, testId, taskVariant}, cacheKey);
        }

        return executionsCache[cacheKey];
    }

    *cancelBackgroundExecution() {
        const backgroundStore = Codecast.environments['background'].store;
        backgroundStore.dispatch({type: StepperActionTypes.StepperExit});
    }

    *gradeAnswer(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const state = yield* appSelect();

        if (isServerTask(state.task.currentTask)) {
            return yield* apply(this, this.gradeAnswerServer, [parameters]);
        } else {
            return yield* apply(this, this.gradeAnswerClient, [parameters]);
        }
    }

    *gradeAnswerServer(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const {level, answer, answerToken, scope} = parameters;
        const state = yield* appSelect();
        const platform = answer.platform;
        const userTests = SubmissionExecutionScope.MyTests === scope ? getTaskLevelTests(state).filter(test => TaskTestGroupType.User === test.groupType) : [];

        const serverSubmission: TaskSubmissionServer = {
            evaluated: false,
            date: new Date().toISOString(),
            platform,
            type: TaskSubmissionEvaluateOn.Server,
            scope: scope ?? SubmissionExecutionScope.Submit,
        };
        yield* put(submissionAddNewTaskSubmission(serverSubmission));

        const submissionIndex = yield* appSelect(state => state.submission.taskSubmissions.length - 1);
        const activeBufferName = state.buffers.activeBufferName;
        yield* put(bufferAssociateToSubmission({buffer: activeBufferName, submissionIndex}));

        const submissionsPaneEnabled = yield* appSelect(selectSubmissionsPaneEnabled);
        if (submissionsPaneEnabled) {
            yield* put(submissionChangePaneOpen(true));
        }

        yield* put(submissionChangeCurrentSubmissionId({submissionId: submissionIndex}));

        try {
            const submissionData = yield* makeServerSubmission(answer, answerToken, platform, userTests);
            if (!submissionData.success) {
                yield* put(submissionUpdateTaskSubmission({id: submissionIndex, submission: {...serverSubmission, crashed: true}}));

                return {score: 0};
            }

            const submissionId = submissionData.submissionId;
            submissionExecutionTasks[submissionIndex] = yield* fork([this, this.gradeAnswerLongPolling], submissionIndex, serverSubmission, submissionId);
            yield submissionExecutionTasks[submissionIndex].toPromise();

            return submissionExecutionTasks[submissionIndex].result();
        } catch (ex: any) {
            yield* put(submissionUpdateTaskSubmission({
                id: submissionIndex,
                submission: {...serverSubmission, crashed: true}
            }));

            console.error(ex);

            const message = ex.message === 'Network request failed' ? getMessage('SUBMISSION_RESULTS_CRASHED_NETWORK').s
                : getMessage('SUBMISSION_RESULTS_CRASHED_UNKNOWN').s;
            yield* put(platformAnswerGraded({error: message}));

            return {
                error: message,
            }
        }
    }

    *gradeAnswerLongPolling(submissionIndex: number, serverSubmission: TaskSubmissionServer, submissionId: string) {
        let longPollingTask;
        try {
            const deferredPromise = new DeferredPromise<TaskSubmissionServerResult>();
            longPollingTask = yield* spawn(longPollServerSubmissionResults, submissionId, submissionIndex, serverSubmission, deferredPromise.resolve);

            const outcome = yield* race({
                result: call(() => deferredPromise.promise),
                timeout: delay(60*60*1000), // 60 min
            });

            if (outcome.result) {
                const submissionResult = outcome.result;
                if (submissionResult.compilationError) {
                    yield* put(submissionChangeDisplayedError(SubmissionErrorType.CompilationError));
                } else {
                    const selectedTestId = yield* appSelect(state => state.task.currentTestId);
                    // Refresh display by showing the test id that was previously selected
                    if (null !== selectedTestId) {
                        yield* put(updateCurrentTestId({testId: selectedTestId}));
                    }
                }

                return {
                    score: outcome.result.score / 100,
                    message: outcome.result.errorMessage,
                };
            } else {
                yield* put(submissionUpdateTaskSubmission({id: submissionIndex, submission: {...serverSubmission, crashed: true}}));

                return {
                    score: 0,
                };
            }
        } finally {
            if (yield* cancelled()) {
                if (longPollingTask) {
                    yield* cancel(longPollingTask);
                }
                yield* put(submissionUpdateTaskSubmission({id: submissionIndex, submission: {...serverSubmission, crashed: true, cancelled: true}}));
            }
        }
    }

    *gradeAnswerClient(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        log.getLogger('tests').debug('[Tests] Client grade answer', parameters);
        const {level, answer} = parameters;
        const state = yield* appSelect();
        const environment = state.environment;
        let lastMessage = null;
        const currentTask = state.task.currentTask;
        const tests = currentTask ? getTaskLevelTests(state, level) : state.task.taskTests;
        if (!tests || 0 === Object.values(tests).length || !doesPlatformHaveClientRunner(answer.platform)) {
            return {
                score: 0,
                message: '',
            };
        }

        let testResults: TaskSubmissionResultPayload[] = [];
        for (let testIndex = 0; testIndex < tests.length; testIndex++) {
            if ('main' === environment) {
                yield* delay(0);
            }
            log.getLogger('tests').debug('[Tests] Start new execution grading for test', testIndex);
            const payload: TaskSubmissionResultPayload = yield this.makeBackgroundExecution(level, testIndex, answer);
            log.getLogger('tests').debug('[Tests] End execution grading, result=', payload);
            if ('main' === environment) {
                yield* delay(0);
            }
            lastMessage = payload.message;
            testResults.push(payload);
            if (false === payload.result) {
                // Stop at first test that doesn't work
                break;
            }
        }

        log.getLogger('tests').debug('end grading answer');

        let worstRate = 1;
        for (let result of testResults) {
            worstRate = Math.min(worstRate, result.successRate ?? 0);
        }

        return {
            score: worstRate,
            message: lastMessage,
        };
    }

    *cancelSubmission(submissionIndex: number) {
        if (submissionIndex in submissionExecutionTasks) {
            yield* cancel(submissionExecutionTasks[submissionIndex]);
        }
    }

    setAfterExecutionCallback(callback) {
        this.afterExecutionCallback = callback;
    }
}

export const taskSubmissionExecutor = new TaskSubmissionExecutor();
