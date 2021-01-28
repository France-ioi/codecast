import {AppStore} from "../store";

export function getPlayerState(state: AppStore) {
    return state.player;
}
