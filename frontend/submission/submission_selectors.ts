import {AppStore} from '../store';
import {TaskTest, TaskTestGroupType} from '../task/task_types';
import {TaskSubmissionMode} from './submission_types';
import {memoize} from 'proxy-memoize';
import {mapServerTestToTaskTest} from './tests';

export const selectTaskTests = memoize<AppStore, TaskTest[]>((state: AppStore) => {
    const taskLevelsTests = getTaskLevelTests(state);

    if (null !== state.submission.currentSubmissionId) {
        const submission = state.submission.taskSubmissions[state.submission.currentSubmissionId];
        if (TaskSubmissionMode.UserTest === submission?.result?.mode) {
            const submissionUserTests = [];
            if (submission && submission?.result?.tests) {
                for (let test of submission.result.tests) {
                    if (test.test) {
                        submissionUserTests.push(mapServerTestToTaskTest(test.test));
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

function getTaskLevelTests(state: AppStore) {
    if (null === state.task.currentLevel) {
        return state.task.taskTests;
    }

    return state.task.taskTests.filter(test => {
        return state.task.currentLevel === test.level;
    });
}

export function selectSubmissionsPaneEnabled(state: AppStore) {
    if (!state.task.currentTask || state.task.currentTask.gridInfos.hiddenTests) {
        return false;
    }

    const taskTests = selectTaskTests(state);

    return !!(state.options.viewTestDetails || state.options.canAddUserTests || (state.task.currentTask && taskTests.length > 1))
}
