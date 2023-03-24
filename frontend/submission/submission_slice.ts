import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {TaskSubmission, TaskSubmissionResultPayload} from './submission';

export enum SubmissionExecutionMode {
    Client = 'client',
    Server = 'server',
}

export enum SubmissionExecuteOn {
    ThisTest = 'this_test',
    MyTests = 'my_tests',
    Submit = 'submit',
}

export interface SubmissionState {
    executionMode: SubmissionExecutionMode,
    executeOn: SubmissionExecuteOn,
    platformName: string,
    taskSubmissions: TaskSubmission[],
    submissionsPaneOpen: boolean,
    currentSubmissionId: number|null,
}

export const submissionInitialState = {
    executionMode: SubmissionExecutionMode.Client,
    executeOn: SubmissionExecuteOn.Submit,
    platformName: null,
    taskSubmissions: [],
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
        submissionChangeExecuteOn(state, action: PayloadAction<SubmissionExecuteOn>) {
            state.executeOn = action.payload;
        },
        submissionChangePlatformName(state, action: PayloadAction<string>) {
            state.platformName = action.payload;
        },
        submissionAddNewTaskSubmission(state, action: PayloadAction<TaskSubmission>) {
            state.taskSubmissions.push(action.payload);
        },
        submissionUpdateTaskSubmission(state, action: PayloadAction<{id: number, submission: TaskSubmission}>) {
            state.taskSubmissions[action.payload.id] = action.payload.submission;
        },
        submissionStartExecutingTest(state, action: PayloadAction<{submissionId: number, testId: number}>) {
            state.taskSubmissions[action.payload.submissionId].result.tests[action.payload.testId].executing = true;
        },
        submissionSetTestResult(state, action: PayloadAction<{submissionId: number, testId: number, result: TaskSubmissionResultPayload}>) {
            state.taskSubmissions[action.payload.submissionId].result.tests[action.payload.testId] = {
                ...state.taskSubmissions[action.payload.submissionId].result.tests[action.payload.testId],
                executing: false,
                score: action.payload.result.result ? 100 : 0,
                message: action.payload.result.message,
            };
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
    submissionChangeExecuteOn,
    submissionChangePlatformName,
    submissionAddNewTaskSubmission,
    submissionUpdateTaskSubmission,
    submissionChangePaneOpen,
    submissionChangeCurrentSubmissionId,
    submissionStartExecutingTest,
    submissionSetTestResult,
} = submissionSlice.actions;

export default submissionSlice;
