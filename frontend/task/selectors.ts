import {AppStoreReplay} from "../store";
import log from 'loglevel';
import {TaskAnswer} from './task_types';
import {normalizeBufferToTaskAnswer} from '../buffers';

export function selectAnswer(state: AppStoreReplay): TaskAnswer|null {
    const activeBufferName = state.buffers.activeBufferName;
    const sourceBuffer = state.buffers.buffers[activeBufferName];
    // log.getLogger('editor').debug('select current answer', sourceBuffer);

    return sourceBuffer ? normalizeBufferToTaskAnswer(sourceBuffer) : null;
}
