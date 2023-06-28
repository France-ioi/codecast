import {AppStoreReplay} from "../store";


import {BufferContentModel} from './document';

export function getBufferModel(state: AppStoreReplay, buffer: string): BufferContentModel {
    return state.buffers[buffer] ? state.buffers[buffer].model : null;
}
