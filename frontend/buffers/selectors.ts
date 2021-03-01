import {AppStore} from "../store";
import {DocumentModel} from "./index";

export function getBufferModel(state: AppStore, buffer: string): DocumentModel {
    return state.buffers[buffer].model;
}
