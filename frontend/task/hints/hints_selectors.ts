import {AppStore} from '../../store';
import {TaskHint} from './hints_slice';
import {memoize} from 'proxy-memoize';

export const selectAvailableHints = memoize((state: AppStore): TaskHint[] => {
    const levels = state.platform.levels;
    const currentLevel = state.task.currentLevel;
    const currentLevelScore = currentLevel && currentLevel in levels ? levels[currentLevel].score : 0;

    return state.hints.availableHints.filter(hint => {
        return ((undefined === hint.minScore || currentLevelScore >= hint.minScore)
            && (!hint.levels || hint.levels.includes(currentLevel)));
    });
});

export const selectUnlockedHintIds = memoize((state: AppStore): string[] => {
    const allUnlockedHintIds = state.hints.unlockedHintIds;
    const availableHints = selectAvailableHints(state);

    return allUnlockedHintIds.filter(hintId => availableHints.find(hint => hintId === hint.id));
});
