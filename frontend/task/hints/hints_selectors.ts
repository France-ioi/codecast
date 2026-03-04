import {AppStore} from '../../store';
import {TaskHint} from './hints_slice';
import {createSelector} from '@reduxjs/toolkit';

export const selectAvailableHints = createSelector(
    (state: AppStore) => state.platform.levels,
    (state: AppStore) => state.task.currentLevel,
    (state: AppStore) => state.hints.availableHints,
    (levels, currentLevel, availableHints): TaskHint[] => {
        const currentLevelScore = currentLevel && currentLevel in levels ? levels[currentLevel].score : 0;

        return availableHints.filter(hint => {
            return ((undefined === hint.minScore || currentLevelScore >= hint.minScore)
                && (!hint.levels || hint.levels.includes(currentLevel)));
        });
    }
);

export const selectUnlockedHintIds = createSelector(
    (state: AppStore) => state.hints.unlockedHintIds,
    selectAvailableHints,
    (allUnlockedHintIds, availableHints): string[] => {
        return allUnlockedHintIds.filter(hintId => availableHints.find(hint => hintId === hint.id));
    }
);
