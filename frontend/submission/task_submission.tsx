import {
    taskCreateSubmission,
    TaskSubmissionResultPayload,
    taskSubmissionSetTestResult,
    taskSubmissionStartTest,
} from "../task/task_slice";
import {call, put, select} from "typed-redux-saga";
import {AppStore} from "../store";
import {Codecast} from "../index";
import {getTaskPlatformMode, recordingProgressSteps, TaskActionTypes, TaskPlatformMode} from "../task";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import log from "loglevel";
import {stepperDisplayError} from "../stepper/actionTypes";
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
    submissionAddNewServerSubmission, submissionChangeCurrentSubmissionId,
    submissionChangePaneOpen,
    SubmissionExecutionMode,
    submissionUpdateServerSubmission
} from "./submission_slice";
import {getServerSubmissionResults, makeServerSubmission} from "./task_platform";
import {getAnswerTokenForLevel, getTaskTokenForLevel} from "../task/platform/task_token";
import stringify from 'json-stable-stringify-without-jsonify';
import {appSelect} from '../hooks';

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
        let currentSubmission = state.task.currentSubmission;
        const environment = state.environment;
        const level = state.task.currentLevel;
        const answer = selectAnswer(state);
        const tests = yield* appSelect(state => state.task.taskTests);
        if (!tests || 0 === Object.values(tests).length) {
            return;
        }

        if (!currentSubmission) {
            yield* put(taskCreateSubmission());
        }
        yield* put(taskSubmissionSetTestResult(result));

        if (!result.result) {
            // We execute other tests only if the current one has succeeded
            return;
        }

        const displayedResults = [result];

        let lastMessage = result.message;
        for (let testIndex = 0; testIndex < tests.length; testIndex++) {
            if (result.testId === testIndex) {
                continue;
            }

            const currentSubmission = yield* appSelect(state => state.task.currentSubmission);
            if (!currentSubmission) {
                // Submission has been cancelled during progress
                return;
            }

            yield* put(taskSubmissionStartTest(testIndex));
            if ('main' === environment) {
                yield* delay(0);
            }
            log.getLogger('tests').debug('[Tests] Start new execution for test', testIndex);
            const payload: TaskSubmissionResultPayload = yield this.makeBackgroundExecution(level, testIndex, answer);
            log.getLogger('tests').debug('[Tests] End execution, result=', payload);
            yield* put(taskSubmissionSetTestResult(payload));
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

        currentSubmission = yield* appSelect(state => state.task.currentSubmission);
        if (!currentSubmission) {
            // Submission has been cancelled during progress
            return;
        }

        let worstRate = 1;
        for (let result of currentSubmission.results) {
            worstRate = Math.min(worstRate, result.result ? 1 : 0);
        }

        const finalScore = worstRate;
        if (finalScore >= 1) {
            const nextVersion = yield* call(taskGetNextLevelToIncreaseScore, level);

            yield* call([platformApi, platformApi.validate], null !== nextVersion ? 'stay' : 'done');
            if (window.SrlLogger) {
                window.SrlLogger.validation(100, 'none', 0);
            }
        } else {
            log.getLogger('tests').debug('Submission execution over', currentSubmission.results);
            log.getLogger('tests').debug(currentSubmission.results.reduce((agg, next) => agg && next.result, true));
            if (!currentSubmission.results.reduce((agg, next) => agg && next.result, true)) {
                const error = {
                    type: 'task-tests-submission-results-overview',
                    props: {
                        results: displayedResults,
                    }
                };

                yield* put(stepperDisplayError(error));
            }
        }
    }

    *makeBackgroundExecution(level, testId, answer) {
        const backgroundStore = Codecast.environments['background'].store;
        const state = yield* appSelect();
        const currentTask = state.task.currentTask;
        const tests = currentTask.data[level];

        return yield new Promise<TaskSubmissionResultPayload>(resolve => {
            backgroundStore.dispatch({type: TaskActionTypes.TaskRunExecution, payload: {options: state.options, level, testId, tests, answer, resolve}});
        });
    }

    *cancelBackgroundExecution() {
        const backgroundStore = Codecast.environments['background'].store;
        backgroundStore.dispatch({type: StepperActionTypes.StepperExit});
    }

    *gradeAnswer(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const {answer, maxScore, minScore} = parameters;
        const state = yield* appSelect();

        log.getLogger('tests').debug('do grade answer');
        if (TaskPlatformMode.RecordingProgress === getTaskPlatformMode(state)) {
            return {
                score: minScore + (maxScore - minScore) * Number(answer) / recordingProgressSteps,
                message: '',
            }
        }

        if (SubmissionExecutionMode.Server === state.submission.executionMode) {
            return yield* call(this.gradeAnswerServer, parameters);
        } else {
            return yield* call(this.gradeAnswerClient, parameters);
        }
    }

    *gradeAnswerServer(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const {level, answer, maxScore, minScore} = parameters;
        const state = yield* appSelect();

        const randomSeed = state.platform.taskRandomSeed;
        const newTaskToken = getTaskTokenForLevel(level, randomSeed);
        const answerToken = getAnswerTokenForLevel(stringify(answer), level, randomSeed);

        console.log('start grading answer on server', {randomSeed, newTaskToken, answerToken});

        const serverSubmission = {evaluated: false, date: new Date().toISOString()};
        yield* put(submissionAddNewServerSubmission(serverSubmission));

        const submissionIndex = yield* appSelect(state => state.submission.serverSubmissions.length - 1);

        yield* put(submissionChangePaneOpen(true));
        yield* put(submissionChangeCurrentSubmissionId(submissionIndex));

        const submissionData = yield* makeServerSubmission(answer, newTaskToken, answerToken);
        if (!submissionData.success) {
            yield* put(submissionUpdateServerSubmission({id: submissionIndex, submission: {...serverSubmission, crashed: true}}));

            return {score: 0};
        }

        console.log('submission data', submissionData);

        const submissionId = submissionData.submissionId;

        let submissionResult;
        try {
            submissionResult = yield* getServerSubmissionResults(submissionId);
        } catch (e) {
            yield* put(submissionUpdateServerSubmission({id: submissionIndex, submission: {...serverSubmission, crashed: true}}));

            return {score: 0};
        }

        console.log('submission results', submissionResult);
        yield* put(submissionUpdateServerSubmission({id: submissionIndex, submission: {...serverSubmission, evaluated: true, result: submissionResult}}));

        return {
            score: submissionResult.score,
            message: submissionResult.errorMessage,
        };
    }

    *gradeAnswerClient(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const {level, answer, maxScore, minScore} = parameters;
        const state = yield* appSelect();
        const environment = state.environment;
        let lastMessage = null;
        console.log('start grading answer', environment);
        const tests = yield* appSelect(state => state.task.taskTests);
        if (!tests || 0 === Object.values(tests).length) {
            return {
                score: 0,
                message: '',
            };
        }

        let testResults = [];
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
            worstRate = Math.min(worstRate, result.result ? 1 : 0);
        }

        const finalScore = Math.round(worstRate * (maxScore - minScore) + minScore);

        return {
            score: finalScore,
            message: lastMessage,
        };
    }

    setAfterExecutionCallback(callback) {
        this.afterExecutionCallback = callback;
    }
}

export const taskSubmissionExecutor = new TaskSubmissionExecutor();
