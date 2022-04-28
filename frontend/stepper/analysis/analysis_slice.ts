import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface AnalysisState {
    openedPaths: {stackFrameId: string[]}
}

export interface AnalysisPath {
    stackFrameId: number,
    path: string,
}

export const analysisInitialState = {
    openedPaths: {},
} as AnalysisState;

export const analysisSlice = createSlice({
    name: 'analysis',
    initialState: analysisInitialState,
    reducers: {
        analysisTogglePath(state, action: PayloadAction<AnalysisPath>) {
            if (!(action.payload.stackFrameId in state.openedPaths)) {
                state.openedPaths[action.payload.stackFrameId] = [];
            }
            let position = state.openedPaths[action.payload.stackFrameId].indexOf(action.payload.path);
            if (-1 !== position) {
                state.openedPaths[action.payload.stackFrameId].splice(position, 1);
            } else {
                state.openedPaths[action.payload.stackFrameId].push(action.payload.path);
            }
        },
    },
});

export const {
    analysisTogglePath,
} = analysisSlice.actions;

export const analysisRecordableActions = [
    'analysisTogglePath',
];

export default analysisSlice;
