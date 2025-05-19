import {TaskLevelName} from './platform/platform_slice';
import {TaskActionTypes} from './task_slice';
import {createAction} from '@reduxjs/toolkit';
import {Task} from './task_types';

export const taskLoad = ({testId, task, level, tests, reloadContext, selectedTask, callback}: {
    testId?: number,
    task?: Task,
    level?: TaskLevelName,
    tests?: any[],
    reloadContext?: boolean,
    selectedTask?: string,
    callback?: () => void,
} = {}) => ({
    type: TaskActionTypes.TaskLoad,
    payload: {
        testId,
        task,
        level,
        tests,
        reloadContext,
        selectedTask,
        callback,
    },
});
export const taskChangeLevel = createAction('task/changeLevel', (level: TaskLevelName) => ({
    payload: {
        level,
    },
}));
