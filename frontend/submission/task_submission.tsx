import {apply, call, put, race, spawn} from "typed-redux-saga";
import {Codecast} from "../index";
import {ActionTypes as StepperActionTypes, stepperDisplayError} from "../stepper/actionTypes";
import log from "loglevel";
import React from "react";
import {
    platformApi,
    PlatformTaskGradingParameters,
    PlatformTaskGradingResult,
    taskGetNextLevelToIncreaseScore,
} from "../task/platform/platform";
import {selectAnswer} from "../task/selectors";
import {delay} from "../player/sagas";
import {
    submissionAddNewTaskSubmission,
    submissionChangeCurrentSubmissionId,
    submissionChangeDisplayedError,
    submissionChangePaneOpen,
    SubmissionErrorType,
    submissionSetTestResult,
    submissionStartExecutingTest,
    submissionUpdateTaskSubmission,
} from "./submission_slice";
import {longPollServerSubmissionResults, makeServerSubmission} from "./task_platform";
import {getAnswerTokenForLevel, getTaskTokenForLevel} from "../task/platform/task_token";
import stringify from 'json-stable-stringify-without-jsonify';
import {appSelect} from '../hooks';
import {extractTestsFromTask} from './tests';
import {
    selectSubmissionsPaneEnabled,
    TaskSubmissionEvaluateOn,
    TaskSubmissionResultPayload,
    TaskSubmissionServer,
    TaskSubmissionServerResult
} from './submission';
import {getTaskPlatformMode, recordingProgressSteps, TaskPlatformMode} from '../task/utils';
import {isServerTask, TaskActionTypes, updateCurrentTestId} from '../task/task_slice';
import {LibraryTestResult} from '../task/libs/library_test_result';

export const levelScoringData = {
    basic: {
        stars: 1,
        scoreCoefficient: 0.25,
    },
    easy: {
        stars: 2,
        scoreCoefficient: 0.5,
    },
    medium: {
        stars: 3,
        scoreCoefficient: 0.75,
    },
    hard: {
        stars: 4,
        scoreCoefficient: 1,
    },
}

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
        const environment = state.environment;
        const level = state.task.currentLevel;
        const answer = selectAnswer(state);
        const tests = yield* appSelect(state => state.task.taskTests);
        if (!tests || 0 === Object.values(tests).length) {
            return;
        }

        if (!currentSubmissionId) {
            const hasCompilationError = result.testResult && 'compilation' === result.testResult.type;

            log.getLogger('submission').log('[submission] Create new submission', tests);
            yield* put(submissionAddNewTaskSubmission({
                evaluated: false,
                date: new Date().toISOString(),
                platform: state.options.platform,
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
            yield* put(submissionChangeCurrentSubmissionId(currentSubmissionId));

            if (hasCompilationError) {
                yield* put(submissionChangeDisplayedError(SubmissionErrorType.CompilationError));
            }
        }
        yield* put(submissionSetTestResult({submissionId: currentSubmissionId, testId: result.testId, result}));
        log.getLogger('submission').log('[submission] Set first test result');

        if (!result.result) {
            // We execute other tests only if the current one has succeeded
            const currentSubmission = yield* appSelect(state => state.submission.taskSubmissions[currentSubmissionId]);
            yield* put(submissionUpdateTaskSubmission({id: currentSubmissionId, submission: {...currentSubmission, evaluated: true}}));

            return;
        }

        const displayedResults = [result];

        let lastMessage = result.message;
        for (let testIndex = 0; testIndex < tests.length; testIndex++) {
            if (result.testId === testIndex) {
                continue;
            }

            yield* put(submissionStartExecutingTest({submissionId: currentSubmissionId, testId: testIndex}));
            if ('main' === environment) {
                yield* delay(0);
            }
            log.getLogger('tests').debug('[Tests] Start new execution for test', testIndex);
            const payload: TaskSubmissionResultPayload = yield this.makeBackgroundExecution(level, testIndex, answer);
            log.getLogger('tests').debug('[Tests] End execution, result=', payload);
            yield* put(submissionSetTestResult({submissionId: currentSubmissionId, testId: testIndex, result: payload}));
            if ('main' === environment) {
                yield* delay(0);
            }
            lastMessage = payload.message;
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

        yield* put(submissionUpdateTaskSubmission({id: currentSubmissionId, submission: {...currentSubmission, evaluated: true}}));

        const finalScore = worstRate;
        if (finalScore > 0) {
            const nextVersion = yield* call(taskGetNextLevelToIncreaseScore, level);

            yield* call([platformApi, platformApi.validate], null !== nextVersion || finalScore < 1 ? 'stay' : 'done');
            if (1 <= finalScore && window.SrlLogger) {
                window.SrlLogger.validation(100, 'none', 0);
            }
        } else {
            log.getLogger('tests').debug('Submission execution over', currentSubmission.result.tests);
            if (currentSubmission.result.tests.find(testResult => testResult.score < 1)) {
                const error = new LibraryTestResult(null, 'task-tests-submission-results-overview', {
                    results: displayedResults,
                });

                yield* put(stepperDisplayError(error));
            }
        }
    }

    *makeBackgroundExecution(level, testId, answer) {
        const backgroundStore = Codecast.environments['background'].store;
        const state = yield* appSelect();
        const currentTask = state.task.currentTask;
        const tests = extractTestsFromTask(currentTask, level);

        return yield new Promise<TaskSubmissionResultPayload>(resolve => {
            backgroundStore.dispatch({type: TaskActionTypes.TaskRunExecution, payload: {options: state.options, level, testId, tests, answer, resolve}});
        });
    }

    *cancelBackgroundExecution() {
        const backgroundStore = Codecast.environments['background'].store;
        backgroundStore.dispatch({type: StepperActionTypes.StepperExit});
    }

    *gradeAnswer(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const {answer} = parameters;
        const state = yield* appSelect();

        if (TaskPlatformMode.RecordingProgress === getTaskPlatformMode(state)) {
            return {
                score: Number(answer) / recordingProgressSteps,
                message: '',
            }
        }

        if (isServerTask(state.task.currentTask)) {
            return yield* apply(this, this.gradeAnswerServer, [parameters]);
        } else {
            return yield* apply(this, this.gradeAnswerClient, [parameters]);
        }
    }

    *gradeAnswerServer(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const {level, answer} = parameters;
        const state = yield* appSelect();

        const randomSeed = state.platform.taskRandomSeed;
        const newTaskToken = getTaskTokenForLevel(level, randomSeed);
        const answerToken = getAnswerTokenForLevel(stringify(answer), level, randomSeed);
        const platform = state.options.platform;

        const serverSubmission: TaskSubmissionServer = {
            evaluated: false,
            date: new Date().toISOString(),
            platform,
            type: TaskSubmissionEvaluateOn.Server,
        };
        yield* put(submissionAddNewTaskSubmission(serverSubmission));

        const submissionIndex = yield* appSelect(state => state.submission.taskSubmissions.length - 1);

        const submissionsPaneEnabled = yield* appSelect(selectSubmissionsPaneEnabled);
        if (submissionsPaneEnabled) {
            yield* put(submissionChangePaneOpen(true));
        }

        yield* put(submissionChangeCurrentSubmissionId(submissionIndex));

        const submissionData = yield* makeServerSubmission(answer, newTaskToken, answerToken, platform);
        if (!submissionData.success) {
            yield* put(submissionUpdateTaskSubmission({id: submissionIndex, submission: {...serverSubmission, crashed: true}}));

            return {score: 0};
        }

        const submissionId = submissionData.submissionId;

        let promiseResolve;
        const promise = new Promise<TaskSubmissionServerResult>((resolve) => {
            promiseResolve = resolve;
        });

        yield* spawn(longPollServerSubmissionResults, submissionId, submissionIndex, serverSubmission, promiseResolve);

        const outcome = yield* race({
            result: call(() => promise),
            timeout: delay(10*60*1000), // 10 min
        });

        if (outcome.result) {
            const submissionResult = outcome.result;
            if (submissionResult.compilationError) {
                yield* put(submissionChangeDisplayedError(SubmissionErrorType.CompilationError));
            } else if (!submissionsPaneEnabled) {
                const tests = submissionResult.tests;
                if (tests.length) {
                    yield* put(updateCurrentTestId({testId: 0}));
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
    }

    *gradeAnswerClient(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const {level, answer} = parameters;
        const state = yield* appSelect();
        const environment = state.environment;
        let lastMessage = null;
        const tests = yield* appSelect(state => state.task.taskTests);
        if (!tests || 0 === Object.values(tests).length) {
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
            log.getLogger('tests').debug('[Tests] Start new execution for test', testIndex);
            const payload: TaskSubmissionResultPayload = yield this.makeBackgroundExecution(level, testIndex, answer);
            log.getLogger('tests').debug('[Tests] End execution, result=', payload);
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
            worstRate = Math.min(worstRate, result.successRate);
        }

        return {
            score: worstRate,
            message: lastMessage,
        };
    }

    setAfterExecutionCallback(callback) {
        this.afterExecutionCallback = callback;
    }
}

export const taskSubmissionExecutor = new TaskSubmissionExecutor();
