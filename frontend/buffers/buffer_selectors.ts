import {AppStore} from '../store';
import {BufferState} from './buffer_types';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {BuffersState} from './buffers_slice';

export function selectSourceBuffers(state: AppStore): {[bufferName: string]: BufferState} {
    return selectSourceBuffersFromBufferState(state.buffers);
}

export function selectSourceBuffersFromBufferState(buffers: BuffersState): {[bufferName: string]: BufferState} {
    const sourceBuffers = {};
    for (let [bufferName, buffer] of Object.entries(buffers.buffers)) {
        if (buffer.source) {
            sourceBuffers[bufferName] = buffer;
        }
    }

    return sourceBuffers;
}

export function selectActiveBufferPlatform(state: AppStore): CodecastPlatform {
    if (null === state.buffers.activeBufferName) {
        return state.options.platform;
    }


    return state.buffers.buffers[state.buffers.activeBufferName].platform;
}
