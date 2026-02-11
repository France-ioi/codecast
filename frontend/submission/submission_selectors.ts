import {AppStore} from '../store';
import {isServerTask, TaskTest, TaskTestGroupType} from '../task/task_types';
import {TaskSubmissionEvaluateOn, TaskSubmissionMode} from './submission_types';
import {createSelector} from '@reduxjs/toolkit';
import {mapServerTestToTaskTest} from './tests';
import {TaskLevelName} from '../task/platform/platform_slice';
import {hasBlockPlatform} from '../stepper/platforms';
import {doesPlatformHaveClientRunner} from '../stepper';
import {remoteDebugSupportedPlatforms} from '../stepper/remote/remote_debug_executer';

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
    [(state: AppStore) => state.options.platform, (state: AppStore) => state.task.currentTask],
    (platform, currentTask): TaskSubmissionEvaluateOn[] => {
        const platformHasClientRunner = doesPlatformHaveClientRunner(platform);
        const serverTask = null !== currentTask && isServerTask(currentTask);

        const allowClientExecution = currentTask?.gridInfos?.allowClientExecution;

        const availableExecutionModes = [];
        if (platformHasClientRunner && (!serverTask || allowClientExecution)) {
            availableExecutionModes.push(TaskSubmissionEvaluateOn.Client);
        }
        if (serverTask) {
            availableExecutionModes.push(TaskSubmissionEvaluateOn.Server);
        }
        if (!hasBlockPlatform(platform) && (!currentTask || currentTask.gridInfos.remoteDebugEnabled) && -1 !== remoteDebugSupportedPlatforms.indexOf(platform)) {
            availableExecutionModes.push(TaskSubmissionEvaluateOn.RemoteDebugServer);
        }

        return availableExecutionModes;
    },
);
