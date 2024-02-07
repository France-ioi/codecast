import {AppStore} from '../store';
import {isServerTask, TaskTest, TaskTestGroupType} from '../task/task_types';
import {TaskSubmissionEvaluateOn, TaskSubmissionMode} from './submission_types';
import {memoize} from 'proxy-memoize';
import {mapServerTestToTaskTest} from './tests';
import {TaskLevelName} from '../task/platform/platform_slice';
import {hasBlockPlatform} from '../stepper/platforms';
import {doesPlatformHaveClientRunner} from '../stepper';
import {remoteDebugSupportedPlatforms} from '../stepper/remote/remote_debug_executer';

export const selectTaskTests = memoize<AppStore, TaskTest[]>((state: AppStore) => {
    const taskLevelsTests = getTaskLevelTests(state);

    if (null !== state.submission.currentSubmissionId) {
        const submission = state.submission.taskSubmissions[state.submission.currentSubmissionId];
        if (TaskSubmissionMode.UserTest === submission?.result?.mode) {
            const submissionUserTests = [];
            if (submission && submission?.result?.tests) {
                for (let testResult of submission.result.tests) {
                    if (testResult.test) {
                        const test = testResult.test;
                        let hasUserTest = false;
                        if (test.clientId) {
                            const userTest = taskLevelsTests.find(otherTest => otherTest.id === test.clientId);
                            if (userTest) {
                                hasUserTest = true;
                                submissionUserTests.push(userTest);
                            }
                        }

                        if (!hasUserTest) {
                            submissionUserTests.push(mapServerTestToTaskTest(test));
                        }
                    }
                }
            }

            return [
                ...taskLevelsTests.filter(test => TaskTestGroupType.User !== test.groupType),
                ...submissionUserTests,
            ];
        }
    }

    return taskLevelsTests;
});

export function getTaskLevelTests(state: AppStore, level?: TaskLevelName) {
    const selectedLevel = level ?? state.task.currentLevel;
    if (null === selectedLevel) {
        return state.task.taskTests;
    }

    return state.task.taskTests.filter(test => {
        return selectedLevel === test.level;
    });
}

export function selectSubmissionsPaneEnabled(state: AppStore) {
    if (!state.task.currentTask || state.task.levelGridInfos?.hiddenTests) {
        return false;
    }

    const taskTests = selectTaskTests(state);

    return !!(state.options.viewTestDetails || state.options.canAddUserTests || (state.task.currentTask && taskTests.length > 1))
}

export function selectAvailableExecutionModes(state: AppStore): TaskSubmissionEvaluateOn[] {
    const platform = state.options.platform;
    const platformHasClientRunner = doesPlatformHaveClientRunner(platform);
    const currentTask = state.task.currentTask;
    const serverTask = null !== currentTask && isServerTask(currentTask);

    const availableExecutionModes = [];
    if (platformHasClientRunner) {
        availableExecutionModes.push(TaskSubmissionEvaluateOn.Client);
    }
    if (serverTask) {
        availableExecutionModes.push(TaskSubmissionEvaluateOn.Server);
    }
    if (!hasBlockPlatform(platform) && (!currentTask || currentTask.gridInfos.remoteDebugEnabled) && -1 !== remoteDebugSupportedPlatforms.indexOf(platform)) {
        availableExecutionModes.push(TaskSubmissionEvaluateOn.RemoteDebugServer);
    }

    return availableExecutionModes;
}
