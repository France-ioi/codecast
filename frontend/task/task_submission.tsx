import {
    taskCreateSubmission,
    TaskSubmissionResultPayload,
    taskSubmissionSetTestResult,
    taskSubmissionStartTest,
} from "./task_slice";
import {call, delay, put, select} from "typed-redux-saga";
import {AppStore} from "../store";
import {Codecast} from "../index";
import {getBufferModel} from "../buffers/selectors";
import {TaskActionTypes} from "./index";
import log from "loglevel";
import {stepperDisplayError} from "../stepper/actionTypes";
import React from "react";
import {
    platformApi,
    PlatformTaskGradingParameters,
    PlatformTaskGradingResult,
} from "./platform/platform";
import {selectAnswer} from "./selectors";

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

        const state: AppStore = yield* select();
        let currentSubmission = state.task.currentSubmission;
        const environment = state.environment;
        const level = state.task.currentLevel;
        const answer = selectAnswer(state);
        const tests = yield* select(state => state.task.taskTests);
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

            const currentSubmission = yield* select((state: AppStore) => state.task.currentSubmission);
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

        currentSubmission = yield* select((state: AppStore) => state.task.currentSubmission);
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
            yield* call([platformApi, platformApi.validate], 'done');
        } else {
            log.getLogger('tests').debug('Submission execution over', currentSubmission.results);
            console.log(currentSubmission.results.reduce((agg, next) => agg && next.result, true));
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
        const state: AppStore = yield* select();
        const tests = state.task.taskTests.map(test => test.data);

        return yield new Promise<TaskSubmissionResultPayload>(resolve => {
            backgroundStore.dispatch({type: TaskActionTypes.TaskRunExecution, payload: {options: state.options, level, testId, tests, answer, resolve}});
        });
    }

    *gradeAnswer(parameters: PlatformTaskGradingParameters): Generator<any, PlatformTaskGradingResult, any> {
        const {level, answer, maxScore, minScore} = parameters;
        let lastMessage = null;
        const state: AppStore = yield* select();
        const environment = state.environment;
        console.log('start grading answer', environment);
        const tests = yield* select(state => state.task.taskTests);
        if (!tests || 0 === Object.values(tests).length) {
            return {
                score: 0,
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

        console.log('end grading answer');

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
