import {AppStoreReplay} from "../store";

export function selectAnswer(state: AppStoreReplay) {
    const currentLevel = state.task.currentLevel;

    return currentLevel ? state.platform.levels[currentLevel].answer : null;
}
