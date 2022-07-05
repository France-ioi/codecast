import {AppStoreReplay} from "../store";
import {BufferContentModel} from "./index";

export function getBufferModel(state: AppStoreReplay, buffer: string): BufferContentModel {
    return state.buffers[buffer] ? state.buffers[buffer].model : null;
}
