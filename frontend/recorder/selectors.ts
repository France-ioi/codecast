import {AppStore} from "../store";
import {initialStateRecorder} from "./store";

export function getRecorderState(state: AppStore): typeof initialStateRecorder {
    return state.recorder;
}
