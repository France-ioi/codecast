import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {SubmissionOutput} from './task_platform';

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
    platformName: string,
    serverSubmissionsResults: SubmissionOutput[],
    submissionsPaneOpen: boolean,
}

export const submissionInitialState = {
    executionMode: SubmissionExecutionMode.Client,
    serverExecuteOn: SubmissionServerExecuteOn.ThisTest,
    platformName: null,
    serverSubmissionsResults: [],
    submissionsPaneOpen: false,
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
        submissionChangePlatformName(state, action: PayloadAction<string>) {
            state.platformName = action.payload;
        },
        submissionAddNewSubmissionResult(state, action: PayloadAction<SubmissionOutput>) {
            state.serverSubmissionsResults.push(action.payload);
        },
        submissionChangePaneOpen(state, action: PayloadAction<boolean>) {
            state.submissionsPaneOpen = action.payload;
        },
    },
});

export const {
    submissionChangeExecutionMode,
    submissionChangeServerExecuteOn,
    submissionChangePlatformName,
    submissionAddNewSubmissionResult,
    submissionChangePaneOpen,
} = submissionSlice.actions;

export default submissionSlice;
