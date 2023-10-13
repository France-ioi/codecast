import {AppStore} from '../store';
import {BufferState} from './buffer_types';

export function selectSourceBuffers(state: AppStore): {[bufferName: string]: BufferState} {
    const sourceBuffers = {};
    for (let [bufferName, buffer] of Object.entries(state.buffers.buffers)) {
        if (buffer.source) {
            sourceBuffers[bufferName] = buffer;
        }
    }

    return sourceBuffers;
}
