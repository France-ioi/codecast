import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppStore} from '../../store';
import {useAppSelector} from '../../hooks';
import {useDispatch} from 'react-redux';
import {taskLevelsList} from '../platform/platform_slice';

export interface TaskHint {
    content: string,
    minScore?: number, // Between 0 and 1
}

export interface HintsState {
    availableHints: TaskHint[],
    unlockedHintIds: number[],
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
            state.availableHints = action.payload;
        },
        hintUnlocked(state, action: PayloadAction<number>) {
            if (-1 === state.unlockedHintIds.indexOf(action.payload)) {
                state.unlockedHintIds.push(action.payload);
            }
        },
    },
});

export const {
    hintsLoaded,
    hintUnlocked,
} = hintsSlice.actions;

export default hintsSlice;
