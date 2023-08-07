import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppStore} from '../../store';
import {useAppSelector} from '../../hooks';
import {useDispatch} from 'react-redux';
import {taskLevelsList} from '../platform/platform_slice';

export interface TaskHint {
    content?: string,
    minScore?: number, // Between 0 and 1
    id?: string,
    previousHintId?: string,
    nextHintId?: string,
    question?: boolean,
    yesHintId?: string,
    noHintId?: string,
    disableNext?: boolean,
    disablePrevious?: boolean,
    immediate?: boolean,
}

export interface HintsState {
    availableHints: TaskHint[],
    unlockedHintIds: string[],
}

export const hintsInitialState = {
    availableHints: [],
    unlockedHintIds: [],
} as HintsState;

export function selectAvailableHints(state: AppStore): TaskHint[] {
    const levels = state.platform.levels;
    const currentLevel = state.task.currentLevel;
    const currentLevelScore = currentLevel && currentLevel in levels ? levels[currentLevel].score : 0;

    return state.hints.availableHints.filter(hint => {
        return undefined === hint.minScore || currentLevelScore >= hint.minScore;
    });
}

export const hintsSlice = createSlice({
    name: 'hints',
    initialState: hintsInitialState,
    reducers: {
        hintsLoaded(state, action: PayloadAction<TaskHint[]>) {
            // Add id to hints
            let currentId = 0;
            const hintsById: {[hintId: string]: TaskHint} = {};
            const newAvailableHints = [];
            for (let hint of action.payload) {
                const newHint = {...hint};
                if (!newHint.id) {
                    newHint.id = `hint:${currentId++}`;
                }
                newAvailableHints.push(newHint);
                hintsById[newHint.id] = newHint;
            }

            // Add previous links to hints
            for (let [hintId, hint] of Object.entries(hintsById)) {
                if (hint.yesHintId) {
                    if (!hintsById[hint.yesHintId]) {
                        throw "This hint id does not exist: " + hint.yesHintId;
                    }
                    if (!hintsById[hint.yesHintId].previousHintId) {
                        hintsById[hint.yesHintId].previousHintId = hintId;
                    }
                }
                if (hint.noHintId) {
                    if (!hintsById[hint.noHintId]) {
                        throw "This hint id does not exist: " + hint.noHintId;
                    }
                    if (!hintsById[hint.noHintId].previousHintId) {
                        hintsById[hint.noHintId].previousHintId = hintId;
                    }
                }
                if (hint.nextHintId) {
                    if (!hintsById[hint.nextHintId]) {
                        throw "This hint id does not exist: " + hint.nextHintId;
                    }
                    if (!hintsById[hint.nextHintId].previousHintId) {
                        hintsById[hint.nextHintId].previousHintId = hintId;
                    }
                }
            }

            state.availableHints = newAvailableHints;
        },
        hintUnlocked(state, action: PayloadAction<string>) {
            if (-1 === state.unlockedHintIds.indexOf(action.payload)) {
                const newUnlockedHintIds = [...state.unlockedHintIds, action.payload];
                // Re-order unlocked hint ids
                state.unlockedHintIds = [];
                for (let hint of state.availableHints) {
                    if (-1 !== newUnlockedHintIds.indexOf(hint.id)) {
                        state.unlockedHintIds.push(hint.id);
                    }
                }
            }
        },
    },
});

export const {
    hintsLoaded,
    hintUnlocked,
} = hintsSlice.actions;

export default hintsSlice;
