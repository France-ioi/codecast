import {AppStore} from '../../store';
import {TaskHint} from './hints_slice';

export function selectAvailableHints(state: AppStore): TaskHint[] {
    const levels = state.platform.levels;
    const currentLevel = state.task.currentLevel;
    const currentLevelScore = currentLevel && currentLevel in levels ? levels[currentLevel].score : 0;

    return state.hints.availableHints.filter(hint => {
        return undefined === hint.minScore || currentLevelScore >= hint.minScore;
    });
}
