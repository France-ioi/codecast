import {AppStore} from "../store";
import {RecorderState} from './store';

export function getRecorderState(state: AppStore): RecorderState {
    return state.recorder;
}
