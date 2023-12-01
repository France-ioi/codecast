import {AppStoreReplay} from "../store";
import {TaskAnswer} from './task_types';
import {normalizeBufferToTaskAnswer} from '../buffers';
import {memoize} from 'proxy-memoize';

export const selectAnswer = memoize((state: AppStoreReplay): TaskAnswer|null => {
    const activeBufferName = state.buffers.activeBufferName;
    const sourceBuffer = state.buffers.buffers[activeBufferName];

    return sourceBuffer ? normalizeBufferToTaskAnswer(sourceBuffer) : null;
});
