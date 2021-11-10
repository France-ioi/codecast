import {AppStoreReplay} from "../store";
import {DocumentModel} from "./index";

export function getBufferModel(state: AppStoreReplay, buffer: string): DocumentModel {
    return state.buffers[buffer] ? state.buffers[buffer].model : null;
}
