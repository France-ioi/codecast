import {AppStore} from "../store";

export function getBufferModel(state: AppStore, buffer: string) {
    return state.buffers[buffer].model;
}
