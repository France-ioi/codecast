import {
    taskCreateSubmission,
    TaskSubmissionResultPayload,
    taskSubmissionSetTestResult, taskSubmissionStartTest, taskSuccess
} from "./task_slice";
import {delay, put, select} from "redux-saga/effects";
import {AppStore} from "../store";
import {Codecast} from "../index";
import {getBufferModel} from "../buffers/selectors";
import {TaskActionTypes} from "./index";
import log from "loglevel";
import {ActionTypes} from "../stepper/actionTypes";
import React from "react";
import {TaskTestsSubmissionResultOverview} from "./TaskTestsSubmissionResultOverview";

class TaskSubmissionExecutor {
    private afterExecutionCallback: Function = null;

    *afterExecution(result: TaskSubmissionResultPayload) {
        log.getLogger('tests').debug('After execution', result);
        if (this.afterExecutionCallback) {
            this.afterExecutionCallback(result);
            this.afterExecutionCallback = null;
            return;
        }

        let currentSubmission = yield select((state: AppStore) => state.task.currentSubmission);
        const replay = yield select((state: AppStore) => state.replay);
        if (!currentSubmission) {
            yield put(taskCreateSubmission());
        }
        yield put(taskSubmissionSetTestResult(result));

        if (!result.result) {
            // We execute other tests only if the current one has succeeded
            return;
        }

        const displayedResults = [result];

        const tests = yield select(state => state.task.taskTests);
        let lastMessage = null;
        for (let testIndex = 0; testIndex < tests.length; testIndex++) {
            if (result.testId === testIndex) {
                continue;
            }

            yield put(taskSubmissionStartTest(testIndex));
            if (!replay) {
                yield delay(0);
            }
            log.getLogger('tests').debug('[Tests] Start new execution for test', testIndex);
            const payload: TaskSubmissionResultPayload = yield this.makeBackgroundExecution(testIndex);
            log.getLogger('tests').debug('[Tests] End execution, result=', payload);
            yield put(taskSubmissionSetTestResult(payload));
            if (!replay) {
                yield delay(0);
            }
            lastMessage = payload.message;
            displayedResults.push(payload);
            if (false === payload.result) {
                // Stop at first test that doesn't work
                break;
            }
        }

        currentSubmission = yield select((state: AppStore) => state.task.currentSubmission);

        log.getLogger('tests').debug('Submission execution over', currentSubmission.results);
        console.log(currentSubmission.results.reduce((agg, next) => agg && next.result, true));
        if (currentSubmission.results.reduce((agg, next) => agg && next.result, true)) {
            yield put(taskSuccess(lastMessage));
        } else {
            const error = {
                element: 'task-tests-submission-results-overview',
                props: {
                    results: displayedResults,
                }
            };

            yield put({type: ActionTypes.StepperDisplayError, payload: {error}});
        }
    }

    *makeBackgroundExecution(testId) {
        const backgroundStore = Codecast.environments['background'].store;
        const state: AppStore = yield select();
        const source = getBufferModel(state, 'source').document.toString();

        return yield new Promise(resolve => {
            backgroundStore.dispatch({type: TaskActionTypes.TaskRunExecution, payload: {options: state.options, testId, source, resolve}});
        });
    }

    setAfterExecutionCallback(callback) {
        this.afterExecutionCallback = callback;
    }
}

export const taskSubmissionExecutor = new TaskSubmissionExecutor();
