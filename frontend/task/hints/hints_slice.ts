import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface TaskHint {
    content: string,
}

export interface HintsState {
    availableHints: TaskHint[],
    unlockedHintIds: number[],
}

export const hintsInitialState = {
    availableHints: [],
    unlockedHintIds: [],
} as HintsState;

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
