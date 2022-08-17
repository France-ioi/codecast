import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export enum SubmissionExecutionMode {
    Client = 'client',
    Server = 'server',
}

export enum SubmissionServerExecuteOn {
    ThisTest = 'this_test',
    MyTests = 'my_tests',
    Submit = 'submit',
}

export interface SubmissionState {
    executionMode: SubmissionExecutionMode,
    serverExecuteOn: SubmissionServerExecuteOn,
}

export const submissionInitialState = {
    executionMode: SubmissionExecutionMode.Client,
    serverExecuteOn: SubmissionServerExecuteOn.ThisTest,
} as SubmissionState;

export const submissionSlice = createSlice({
    name: 'submission',
    initialState: submissionInitialState,
    reducers: {
        submissionChangeExecutionMode(state, action: PayloadAction<SubmissionExecutionMode>) {
            state.executionMode = action.payload;
        },
        submissionChangeServerExecuteOn(state, action: PayloadAction<SubmissionServerExecuteOn>) {
            state.serverExecuteOn = action.payload;
        },
    },
});

export const {
    submissionChangeExecutionMode,
    submissionChangeServerExecuteOn,
} = submissionSlice.actions;

export default submissionSlice;
