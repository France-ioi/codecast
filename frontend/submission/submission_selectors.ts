import {AppStore} from '../store';
import {isServerTask, TaskTest, TaskTestGroupType} from '../task/task_types';
import {
    TaskSubmission,
    TaskSubmissionEvaluateOn,
    TaskSubmissionMode, TaskSubmissionServer, TaskSubmissionServerExecutionMetadata, TaskSubmissionServerTestResult
} from './submission_types';
import {createSelector} from '@reduxjs/toolkit';
import {mapServerTestToTaskTest} from './tests';
import {TaskLevelName} from '../task/platform/platform_slice';
import {hasBlockPlatform} from '../stepper/platforms';
import {doesPlatformHaveClientRunner} from '../stepper';
import {remoteDebugSupportedPlatforms} from '../stepper/remote/remote_debug_executer';
import {selectTaskTokenPayload} from '../task/platform/platform';
import {SubmissionExecutionScope} from './submission_slice';
import {Range} from '../buffers/buffer_types';
import {selectCurrentTest} from '../task/task_selectors';

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

export const selectTaskTests = createSelector(
    [(state: AppStore) => state.task.taskTests, (state: AppStore) => state.task.currentLevel, (state: AppStore) => state.submission],
    (taskTests, currentLevel, submission): TaskTest[] => {
        const taskLevelsTests = null === currentLevel
            ? taskTests
            : taskTests.filter(test => currentLevel === test.level || !test.level);

        if (null !== submission.currentSubmissionId) {
            const currentSubmission = submission.taskSubmissions[submission.currentSubmissionId];
            if (TaskSubmissionMode.UserTest === currentSubmission?.result?.mode) {
                const userTests = [...currentSubmission.userTests];

                if (currentSubmission?.result?.tests) {
                    for (let testResult of currentSubmission.result.tests) {
                        if (testResult.test) {
                            const test = testResult.test;
                            let hasUserTest = false;
                            if (test.clientId) {
                                const userTest = userTests.find(otherTest => otherTest.id === test.clientId);
                                if (userTest) {
                                    hasUserTest = true;
                                }
                            }

                            if (!hasUserTest) {
                                userTests.push(mapServerTestToTaskTest(test));
                            }
                        }
                    }
                }

                return [
                    ...taskLevelsTests.filter(test => TaskTestGroupType.User !== test.groupType),
                    ...userTests,
                ];
            }
        }

        return taskLevelsTests;
    },
);

export function getTaskLevelTests(state: AppStore, level?: TaskLevelName) {
    const selectedLevel = level ?? state.task.currentLevel;
    if (null === selectedLevel) {
        return state.task.taskTests;
    }

    return state.task.taskTests.filter(test => {
        return selectedLevel === test.level || !test.level;
    });
}

export function selectSubmissionsPaneEnabled(state: AppStore) {
    if (!state.task.currentTask || state.task.levelGridInfos?.hiddenTests) {
        return false;
    }

    const taskTests = selectTaskTests(state);

    return !!(state.options.viewTestDetails || state.options.canAddUserTests || state.task.currentTask.userTests || (state.task.currentTask && taskTests.length > 3))
}

export function selectTaskSelectorEnabled(state: AppStore) {
    if (!state.task.currentTask || state.task.levelGridInfos?.hiddenTests) {
        return false;
    }

    const taskTests = selectTaskTests(state);

    return !!(state.options.viewTestDetails || state.options.canAddUserTests || state.task.currentTask.userTests || (state.task.currentTask && taskTests.length > 1))
}

export const selectAvailableExecutionModes = createSelector(
    [
        (state: AppStore) => state.options.platform,
        (state: AppStore) => state.task.currentTask,
        selectTaskTokenPayload,
    ],
    (platform, currentTask, tokenPayload): TaskSubmissionEvaluateOn[] => {
        const platformHasClientRunner = doesPlatformHaveClientRunner(platform);
        const serverTask = null !== currentTask && isServerTask(currentTask);

        const allowClientExecution = currentTask?.gridInfos?.allowClientExecution;

        const availableExecutionModes = [];
        if (platformHasClientRunner && (!serverTask || allowClientExecution)) {
            availableExecutionModes.push(TaskSubmissionEvaluateOn.Client);
        }
        if (serverTask && false !== tokenPayload?.bSubmissionPossible) {
            availableExecutionModes.push(TaskSubmissionEvaluateOn.Server);
        }
        if (!hasBlockPlatform(platform) && (!currentTask || currentTask.gridInfos.remoteDebugEnabled) && -1 !== remoteDebugSupportedPlatforms.indexOf(platform)) {
            availableExecutionModes.push(TaskSubmissionEvaluateOn.RemoteDebugServer);
        }

        return availableExecutionModes;
    },
);
