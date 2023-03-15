import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ServerSubmission} from './task_platform';

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
    serverSubmissions: ServerSubmission[],
    submissionsPaneOpen: boolean,
    currentSubmissionId: number|null,
}

export const submissionInitialState = {
    executionMode: SubmissionExecutionMode.Client,
    serverExecuteOn: SubmissionServerExecuteOn.Submit,
    platformName: null,
    serverSubmissions: [],
    submissionsPaneOpen: false,
    currentSubmissionId: null,
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
        submissionAddNewServerSubmission(state, action: PayloadAction<ServerSubmission>) {
            state.serverSubmissions.push(action.payload);
        },
        submissionUpdateServerSubmission(state, action: PayloadAction<{id: number, submission: ServerSubmission}>) {
            state.serverSubmissions[action.payload.id] = action.payload.submission;
        },
        submissionChangePaneOpen(state, action: PayloadAction<boolean>) {
            state.submissionsPaneOpen = action.payload;
        },
        submissionChangeCurrentSubmissionId(state, action: PayloadAction<number>) {
            state.currentSubmissionId = action.payload;
        },
    },
});

export const {
    submissionChangeExecutionMode,
    submissionChangeServerExecuteOn,
    submissionChangePlatformName,
    submissionAddNewServerSubmission,
    submissionUpdateServerSubmission,
    submissionChangePaneOpen,
    submissionChangeCurrentSubmissionId,
} = submissionSlice.actions;

export default submissionSlice;
