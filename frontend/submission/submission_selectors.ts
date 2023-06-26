import {AppStore} from '../store';
import {TaskState} from '../task/task_types';

export function selectTaskTests(state: AppStore) {
    return selectTaskTestsInTaskStore(state.task);
}

export function selectTaskTestsInTaskStore(state: TaskState) {
    if (null === state.currentLevel) {
        return state.taskTests;
    }

    return state.taskTests.filter(test => {
        return state.currentLevel === test.level;
    });
}
