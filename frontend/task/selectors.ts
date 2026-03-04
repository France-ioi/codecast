import {AppStoreReplay} from "../store";
import {TaskAnswer} from './task_types';
import {normalizeBufferToTaskAnswer} from '../buffers';
import {createSelector} from '@reduxjs/toolkit';

export const selectAnswer = createSelector(
    (state: AppStoreReplay) => state.buffers.activeBufferName,
    (state: AppStoreReplay) => state.buffers.buffers,
    (activeBufferName, buffers): TaskAnswer|null => {
        const sourceBuffer = buffers[activeBufferName];
        return sourceBuffer ? normalizeBufferToTaskAnswer(sourceBuffer) : null;
    }
);
