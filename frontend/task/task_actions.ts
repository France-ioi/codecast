import {TaskLevelName} from './platform/platform_slice';
import {TaskActionTypes} from './task_slice';
import {createAction} from '@reduxjs/toolkit';

export const taskLoad = ({testId, level, tests, reloadContext, selectedTask, callback}: {
    testId?: number,
    level?: TaskLevelName,
    tests?: any[],
    reloadContext?: boolean,
    selectedTask?: string,
    callback?: () => void,
} = {}) => ({
    type: TaskActionTypes.TaskLoad,
    payload: {
        testId,
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
