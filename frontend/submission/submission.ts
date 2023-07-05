import {Bundle} from "../linker";
import {call, put, takeEvery} from "typed-redux-saga";
import {AppStore} from "../store";
import {platformApi} from "../task/platform/platform";
import {appSelect} from '../hooks';
import {addNewTaskTest, removeTaskTest, updateCurrentTestId, updateTaskTest} from '../task/task_slice';
import {stepperClearError, stepperDisplayError} from '../stepper/actionTypes';
import {quickAlgoLibraryResetAndReloadStateSaga} from '../task/libs/quickalgo_libraries';
import {
    submissionChangeCurrentSubmissionId,
    submissionChangeDisplayedError,
    SubmissionErrorType,
    SubmissionExecutionScope,
    submissionSlice
} from './submission_slice';
import {getMessage} from '../lang';
import {addAutoRecordingBehaviour} from '../recorder/record';
import {selectTaskTests} from './submission_selectors';
import {taskSubmissionExecutor} from './task_submission';
import {selectAnswer} from '../task/selectors';
import stringify from 'json-stable-stringify-without-jsonify';
import {TaskTest, TaskTestGroupType} from '../task/task_types';
import {getRandomId} from '../utils/app';
import {TaskSubmission, TaskSubmissionEvaluateOn, TaskSubmissionServer} from './submission_types';
import {
    callPlatformValidate,
    submissionCreateTest,
    submissionExecuteMyTests,
    submissionRemoveTest,
    submissionUpdateCurrentTest
} from './submission_actions';
import {App} from '../app_types';
import {quickAlgoLibraries} from '../task/libs/quick_algo_libraries_model';
import {askConfirmation} from '../alert';

export function isServerSubmission(object: TaskSubmission): object is TaskSubmissionServer {
    return TaskSubmissionEvaluateOn.Server === object.type;
}

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

        yield* takeEvery(submissionExecuteMyTests, function* () {
            const answer = yield* appSelect(selectAnswer);
            const level = yield* appSelect(state => state.task.currentLevel);

            yield* call([taskSubmissionExecutor, taskSubmissionExecutor.gradeAnswerServer],{
                level,
                answer: stringify(answer),
                scope: SubmissionExecutionScope.MyTests,
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

            const newTest: TaskTest = {
                id: newTestId,
                name: getMessage('SUBMISSION_OWN_TEST_LABEL').format({index: String(nextName)}),
                data: null,
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
                yield* put(updateTaskTest({testIndex: currentTestId, data: newData}));
            }
        });

        yield* takeEvery(submissionRemoveTest, function* ({payload: {testIndex}}) {
            let currentTestId = yield* appSelect(state => state.task.currentTestId);
            if (currentTestId === testIndex) {
                currentTestId = null;
            } else if (currentTestId > testIndex) {
                currentTestId--;
            }

            yield* put(updateCurrentTestId({testId: currentTestId}));

            const taskTests = yield* appSelect(selectTaskTests);
            const removedTest = taskTests[testIndex];

            const allTaskTests = yield* appSelect(state => state.task.taskTests);
            const removedTestPosition = allTaskTests.indexOf(removedTest);
            yield* put(removeTaskTest(removedTestPosition));
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
