import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {CodeHelpMode} from './hint_actions';

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
    levels?: string[],
    codeHelp?: {
        issue: string,
        main: string,
        insufficient: string,
    },
}

export interface HintsState {
    availableHints: TaskHint[],
    unlockedHintIds: string[],
    codeHelpLoading: CodeHelpMode,
    codeHelpIssue: string,
    codeHelpDetailEnabled: boolean,
}

export const hintsInitialState = {
    availableHints: [],
    unlockedHintIds: [],
    codeHelpLoading: null,
    codeHelpIssue: '',
    codeHelpDetailEnabled: false,
} as HintsState;

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
        hintObtained(state, action: PayloadAction<TaskHint>) {
            const newHint = {...action.payload};
            if (!newHint.id) {
                newHint.id = `hint:${state.availableHints.length}`;
            }

            state.availableHints.push(newHint);
            state.unlockedHintIds.push(newHint.id);
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
        changeCodeHelpLoading(state, action: PayloadAction<CodeHelpMode>) {
            state.codeHelpLoading = action.payload;
        },
        changeCodeHelpIssue(state, action: PayloadAction<string>) {
            state.codeHelpIssue = action.payload;
        },
        changeCodeHelpDetailEnabled(state, action: PayloadAction<boolean>) {
            state.codeHelpDetailEnabled = action.payload;
        },
    },
});

export const {
    hintsLoaded,
    hintObtained,
    hintUnlocked,
    changeCodeHelpLoading,
    changeCodeHelpIssue,
    changeCodeHelpDetailEnabled,
} = hintsSlice.actions;

export default hintsSlice;
