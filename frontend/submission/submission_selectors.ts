import {AppStore} from '../store';
import {TaskTest, TaskTestGroupType} from '../task/task_types';
import {TaskSubmissionMode} from './submission_types';
import {memoize} from 'proxy-memoize';
import {mapServerTestToTaskTest} from './tests';
import {TaskLevelName} from '../task/platform/platform_slice';

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
    if (!state.task.currentTask || state.task.currentTask.gridInfos.hiddenTests) {
        return false;
    }

    const taskTests = selectTaskTests(state);

    return !!(state.options.viewTestDetails || state.options.canAddUserTests || (state.task.currentTask && taskTests.length > 1))
}
