import {Map} from "immutable";
import {AppStore} from "../store";

export function getRecorderState(state: AppStore) {
    return state.get('recorder', Map());
}
