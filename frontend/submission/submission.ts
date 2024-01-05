import {Bundle} from "../linker";
import {call, delay, put, race, take, takeEvery} from "typed-redux-saga";
import {AppStore} from "../store";
import {platformApi} from "../task/platform/platform";
import {appSelect} from '../hooks';
import {addNewTaskTest, selectCurrentTest, removeTaskTest, updateCurrentTestId, updateTaskTest} from '../task/task_slice';
import {stepperClearError, stepperDisplayError} from '../stepper/actionTypes';
import {
    quickAlgoLibraryResetAndReloadStateSaga
} from '../task/libs/quickalgo_libraries';
import {
    submissionChangeCurrentSubmissionId,
    submissionChangeDisplayedError, submissionChangePaneOpen, submissionCloseCurrentSubmission,
    SubmissionErrorType,
    SubmissionExecutionScope,
    submissionSlice,
    submissionUpdateTaskSubmission,
} from './submission_slice';
import {getMessage} from '../lang';
import {addAutoRecordingBehaviour} from '../recorder/record';
import {selectSubmissionsPaneEnabled, selectTaskTests} from './submission_selectors';
import {taskSubmissionExecutor} from './task_submission';
import {selectAnswer} from '../task/selectors';
import {TaskTest, TaskTestGroupType} from '../task/task_types';
import {getRandomId} from '../utils/app';
import {
    SubmissionTestErrorCode,
    TaskSubmission,
    TaskSubmissionEvaluateOn,
    TaskSubmissionServer, TaskSubmissionServerExecutionMetadata, TaskSubmissionServerTestResult
} from './submission_types';
import {
    callPlatformValidate, submissionCancel,
    submissionCreateTest,
    submissionExecuteMyTests,
    submissionRemoveTest,
    submissionUpdateCurrentTest
} from './submission_actions';
import {App} from '../app_types';
import {quickAlgoLibraries} from '../task/libs/quick_algo_libraries_model';
import {testErrorCodeData} from './TestsPaneListTest';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {onEditSource} from '../task';
import {ActionTypes} from '../recorder/actionTypes';
import {memoize} from 'proxy-memoize';
import {Range} from '../buffers/buffer_types';
import {bufferDissociateFromSubmission} from '../buffers/buffers_slice';

export function isServerSubmission(object: TaskSubmission): object is TaskSubmissionServer {
    return TaskSubmissionEvaluateOn.Server === object.type;
}

export function selectCurrentServerSubmission(state: AppStore) {
    const currentSubmission= selectCurrentSubmission(state);

    return null !== currentSubmission && TaskSubmissionEvaluateOn.Server === currentSubmission.type ? currentSubmission : null;
}

export function selectCurrentSubmission(state: AppStore): TaskSubmission|null {
    if (null === state.submission.currentSubmissionId) {
        return null;
    }

    return state.submission.taskSubmissions[state.submission.currentSubmissionId];
}

export function selectCancellableSubmissionIndex(state: AppStore): number|null {
    if (null !== state.buffers.activeBufferName && null !== state.buffers.buffers[state.buffers.activeBufferName].submissionIndex) {
        const submissionIndex = state.buffers.buffers[state.buffers.activeBufferName].submissionIndex;
        const submission = state.submission.taskSubmissions[submissionIndex];
        if (submission && !submission.evaluated && !submission.crashed) {
            return submissionIndex;
        }
    }

    const pendingUserTestSubmissionIndex = state.submission.taskSubmissions.findIndex(submission => SubmissionExecutionScope.MyTests === submission.scope && !submission.evaluated && !submission.crashed);
    if (-1 !== pendingUserTestSubmissionIndex) {
        return pendingUserTestSubmissionIndex;
    }

    return null;
}

export function selectActiveBufferPendingSubmissionIndex(state: AppStore): number|null {
    if (null === state.buffers.activeBufferName || null === state.buffers.buffers[state.buffers.activeBufferName].submissionIndex) {
        return null;
    }

    const submissionIndex = state.buffers.buffers[state.buffers.activeBufferName].submissionIndex;
    const submission = state.submission.taskSubmissions[submissionIndex];
    if (submission && !submission.evaluated && !submission.crashed) {
        return submissionIndex;
    }

    return null;
}

export const selectErrorHighlightFromSubmission = (state: AppStore): Range|null => {
    if (null === state.submission.currentSubmissionId) {
        return null;
    }

    const currentSubmission = state.submission.taskSubmissions[state.submission.currentSubmissionId];
    if (!isServerSubmission(currentSubmission) || !currentSubmission.result) {
        return null;
    }

    const getRangeFromErrorLine = (metadata: TaskSubmissionServerExecutionMetadata) => {
        if (metadata.errorline) {
            return {start: {row: metadata.errorline - 1, column: 0}, end: {row: metadata.errorline - 1, column: 999}};
        }

        return null;
    }

    const currentTest = selectCurrentTest(state);
    if (null !== currentTest) {
        const testResult: TaskSubmissionServerTestResult = currentSubmission.result.tests.find(testResult => testResult.testId === currentTest.id) as TaskSubmissionServerTestResult;
        if (testResult?.metadata) {
            return getRangeFromErrorLine(testResult.metadata);
        }
    }

    if (currentSubmission.result.metadata?.errorline) {
        const metadata = currentSubmission.result.metadata;

        return getRangeFromErrorLine(metadata);
    }

    return null;
};

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

export default function (bundle: Bundle) {
    bundle.addSaga(function* (app: App) {
        yield* takeEvery(callPlatformValidate, function* (action) {
            const platformAction = action.payload.action ?? 'done';
            yield* call([platformApi, platformApi.validate], platformAction);
        });

        yield* takeEvery(updateCurrentTestId, function* ({payload}) {
            const newTest = yield* appSelect(state => selectTaskTests(state)[state.task.currentTestId]);
            const submission = yield* appSelect(selectCurrentServerSubmission);
            const submissionDisplayedError = yield* appSelect(state => state.submission.submissionDisplayedError);
            if (null !== submissionDisplayedError) {
                yield* put(submissionChangeDisplayedError(null));
            }

            let displayError = false;
            if (null !== submission && null !== newTest && isServerSubmission(submission) && submission.evaluated) {
                const testResult = submission.result.tests.find(test => test.testId === newTest.id);
                if (undefined !== testResult) {
                    let error = null;
                    if (testResult && null !== testResult.errorCode && undefined !== testResult.errorCode && SubmissionTestErrorCode.NoError !== testResult.errorCode) {
                        const errorCodeData = testErrorCodeData[testResult.errorCode];
                        if (errorCodeData.message) {
                            error = LibraryTestResult.fromString(getMessage(errorCodeData.message));
                        }
                    }
                    const context = quickAlgoLibraries.getContext(null, 'main');
                    if (!testResult.noFeedback && testResult.log && context.getErrorFromTestResult) {
                        error = context.getErrorFromTestResult(testResult);
                    }
                    if (null === error && testResult.errorMessage) {
                        error = testResult.errorMessage;
                    }

                    if (null !== error) {
                        displayError = true;
                        yield* put(stepperDisplayError(error));
                    }
                }
            }

            const stepperError = yield* appSelect(state => state.stepper.error);
            if (!displayError && stepperError) {
                yield* put(stepperClearError());
            }
        });

        yield* takeEvery([submissionChangeCurrentSubmissionId, submissionCloseCurrentSubmission], function* ({payload}: {payload: any}) {
            const submissionId = yield* appSelect(state => state.submission.currentSubmissionId);
            if (null === submissionId) {
                yield* call(quickAlgoLibraryResetAndReloadStateSaga);
                yield* put(stepperClearError());
            }

            const taskTests = yield* appSelect(selectTaskTests);
            const currentTestId = yield* appSelect(state => state.task.currentTestId);
            if (currentTestId > taskTests.length - 1) {
                yield* put(updateCurrentTestId({testId: taskTests.length ? 0 : null, record: false}));
            } else if (!(payload && payload.withoutTestChange)) {
                yield* put(updateCurrentTestId({testId: currentTestId, record: false, keepSubmission: payload.fromSubmission}));
            }

            if (null !== submissionId) {
                const submission = yield* appSelect(state => state.submission.taskSubmissions[submissionId]);
                if (isServerSubmission(submission) && submission.result) {
                    const submissionsPaneEnabled = yield* appSelect(selectSubmissionsPaneEnabled);
                    if (submissionsPaneEnabled) {
                        yield* put(submissionChangePaneOpen(true));
                    }
                }
            }
        });

        yield* takeEvery(submissionUpdateTaskSubmission, function* ({payload: {withoutTestChange}}) {
            if (withoutTestChange) {
                return;
            }

            // Refresh test visualization
            const currentTestId = yield* appSelect(state => state.task.currentTestId);
            yield* put(updateCurrentTestId({testId: currentTestId, record: false}));
        });

        yield* takeEvery(submissionChangeDisplayedError, function* ({payload}) {
            if (SubmissionErrorType.CompilationError === payload) {
                const error = getMessage('SUBMISSION_ERROR_COMPILATION').s;
                yield* put(stepperDisplayError(error));
            } else if (null === payload) {
                yield* put(stepperClearError());
            }
        });

        yield* takeEvery(submissionExecuteMyTests, function* () {
            const answer = yield* appSelect(selectAnswer);
            const level = yield* appSelect(state => state.task.currentLevel);

            yield* race({
                grade: call([taskSubmissionExecutor, taskSubmissionExecutor.gradeAnswerServer],{
                    level,
                    answer,
                    scope: SubmissionExecutionScope.MyTests,
                }),
                submissionChanged: take([submissionCloseCurrentSubmission]),
            });
        });

        yield* takeEvery(submissionCreateTest, function* () {
            const level = yield* appSelect(state => state.task.currentLevel);

            const allTaskTests = yield* appSelect(state => state.task.taskTests);

            let nextId = 1;
            let nextName = 1;
            for (let test of allTaskTests.filter(test => TaskTestGroupType.User === test.groupType)) {
                if (test.name) {
                    const matches = test.name.match(new RegExp(getMessage('SUBMISSION_OWN_TEST_LABEL').format({index: "(\\d+)"})));
                    if (matches) {
                        nextName = Math.max(nextName, Number(matches[1]) + 1);
                    }
                }

                const matches = test.id.match(/user-(\d+)/);
                if (matches) {
                    nextId = Math.max(nextId, Number(matches[1]) + 1);
                }
            }

            const newTestId = `user-${nextId}`;

            const context = quickAlgoLibraries.getContext(null, 'main');
            const newTestData = context ? context.getDefaultEmptyTest() : null;

            const newTest: TaskTest = {
                id: newTestId,
                name: getMessage('SUBMISSION_OWN_TEST_LABEL').format({index: String(nextName)}),
                data: newTestData,
                contextState: null,
                groupType: TaskTestGroupType.User,
                level,
            };

            yield* put(addNewTaskTest(newTest));

            const newTaskTests = yield* appSelect(selectTaskTests);
            const newTestIndex = newTaskTests.findIndex(test => newTestId === test.id);
            if (-1 !== newTestIndex) {
                yield* put(updateCurrentTestId({testId: newTestIndex}));
            }
        });

        yield* takeEvery(submissionUpdateCurrentTest, function* ({payload: {data}}) {
            const taskTests = yield* appSelect(selectTaskTests);
            const currentTestId = yield* appSelect(state => state.task.currentTestId);

            yield* call(onEditSource, 'test');

            if (null === currentTestId || !(currentTestId in taskTests)) {
                const level = yield* appSelect(state => state.task.currentLevel);

                const newTestId = getRandomId();

                // Create a new test
                const newTest: TaskTest = {
                    id: newTestId,
                    data,
                    contextState: null,
                    level,
                };

                yield* put(addNewTaskTest(newTest));
                const newTaskTests = yield* appSelect(selectTaskTests);
                const newTestIndex = newTaskTests.findIndex(test => newTestId === test.id);
                if (-1 !== newTestIndex) {
                    yield* put(updateCurrentTestId({testId: newTestIndex}));
                }
            } else {
                const newData = {
                    ...taskTests[currentTestId].data,
                    ...data,
                };
                const allTaskTests = yield* appSelect(state => state.task.taskTests);
                const updatedTestPosition = allTaskTests.indexOf(taskTests[currentTestId]);

                yield* put(updateTaskTest({testIndex: updatedTestPosition, data: newData}));
            }
        });

        yield* takeEvery(submissionRemoveTest, function* ({payload: {testIndex}}) {
            const taskTests = yield* appSelect(selectTaskTests);
            let currentTestId = yield* appSelect(state => state.task.currentTestId);
            if (currentTestId === testIndex) {
                currentTestId--;
            } else if (currentTestId > testIndex) {
                currentTestId--;
            }
            if (currentTestId < 0) {
                if (taskTests.length) {
                    currentTestId = 0;
                } else {
                    currentTestId = null;
                }
            }

            const removedTest = taskTests[testIndex];
            const allTaskTests = yield* appSelect(state => state.task.taskTests);
            const removedTestPosition = allTaskTests.indexOf(removedTest);
            yield* put(removeTaskTest({testToRemoveIndex: removedTestPosition, newTestId: currentTestId}));
            yield* put(updateCurrentTestId({testId: currentTestId}));
            yield* call(onEditSource, 'test');
        });

        yield* takeEvery(submissionCancel, function* ({payload: {submissionIndex}}) {
            yield* call([taskSubmissionExecutor, taskSubmissionExecutor.cancelSubmission], submissionIndex);

            const state = yield* appSelect();
            for (let [bufferName, buffer] of Object.entries(state.buffers.buffers)) {
                if (submissionIndex === buffer.submissionIndex) {
                    yield* put(bufferDissociateFromSubmission({buffer: bufferName}));
                }
            }

            if (submissionIndex === state.submission.currentSubmissionId) {
                yield* put(submissionCloseCurrentSubmission({}));
            }
        });
    });

    bundle.defer(function (app: App) {
        if ('main' !== app.environment) {
            return;
        }

        addAutoRecordingBehaviour(app, {
            sliceName: submissionSlice.name,
            actions: [
                submissionCreateTest,
                submissionRemoveTest,
            ],
        });
    });
}
