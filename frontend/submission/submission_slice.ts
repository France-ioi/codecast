import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
    SubmissionTestErrorCode,
    TaskSubmission,
    TaskSubmissionEvaluateOn,
    TaskSubmissionResultPayload
} from './submission_types';

export enum SubmissionExecutionScope {
    ThisTest = 'this_test',
    MyTests = 'my_tests',
    Submit = 'submit',
}

export enum SubmissionErrorType {
    CompilationError = 'compilation_error',
    CompilationWarning = 'compilation_warning',
    ExecutionError = 'execution_error',
}

export interface SubmissionState {
    executionMode: TaskSubmissionEvaluateOn,
    executionScope: SubmissionExecutionScope,
    taskSubmissions: TaskSubmission[],
    submissionsPaneOpen: boolean,
    currentSubmissionId: number|null,
    submissionDisplayedError: SubmissionErrorType|null,
}

export const submissionInitialState = {
    executionMode: TaskSubmissionEvaluateOn.Client,
    executionScope: SubmissionExecutionScope.Submit,
    taskSubmissions: [],
    submissionsPaneOpen: false,
    currentSubmissionId: null,
    submissionDisplayedError: null,
} as SubmissionState;

export const submissionSlice = createSlice({
    name: 'submission',
    initialState: submissionInitialState,
    reducers: {
        submissionChangeExecutionMode(state, action: PayloadAction<TaskSubmissionEvaluateOn>) {
            state.executionMode = action.payload;
        },
        submissionChangeExecutionScope(state, action: PayloadAction<SubmissionExecutionScope>) {
            state.executionScope = action.payload;
        },

        submissionAddNewTaskSubmission(state, action: PayloadAction<TaskSubmission>) {
            state.taskSubmissions.push(action.payload);
        },
        submissionUpdateTaskSubmission(state, action: PayloadAction<{id: number, submission: TaskSubmission, withoutTestChange?: boolean}>) {
            state.taskSubmissions[action.payload.id] = action.payload.submission;
        },
        submissionStartExecutingTest(state, action: PayloadAction<{submissionId: number, testId: number}>) {
            state.taskSubmissions[action.payload.submissionId].result.tests[action.payload.testId].executing = true;
        },
        submissionSetTestResult(state, action: PayloadAction<{submissionId: number, testId: number, result: TaskSubmissionResultPayload}>) {
            state.taskSubmissions[action.payload.submissionId].result.tests[action.payload.testId] = {
                ...state.taskSubmissions[action.payload.submissionId].result.tests[action.payload.testId],
                executing: false,
                errorCode: action.payload.result.result ? SubmissionTestErrorCode.NoError : SubmissionTestErrorCode.WrongAnswer,
                score: action.payload.result.successRate,
                message: action.payload.result.message,
            };
        },
        submissionChangePaneOpen(state, action: PayloadAction<boolean>) {
            state.submissionsPaneOpen = action.payload;
        },
        submissionChangeCurrentSubmissionId(state, action: PayloadAction<{submissionId: number, withoutTestChange?: boolean}>) {
            state.currentSubmissionId = action.payload.submissionId;
        },
        submissionCloseCurrentSubmission(state, action: PayloadAction<{fromSubmission?: boolean}>) {
            state.currentSubmissionId = null;
        },
        submissionChangeDisplayedError(state, action: PayloadAction<SubmissionErrorType>) {
            state.submissionDisplayedError = action.payload;
        },
    },
});

export const {
    submissionChangeExecutionMode,
    submissionAddNewTaskSubmission,
    submissionUpdateTaskSubmission,
    submissionChangePaneOpen,
    submissionChangeCurrentSubmissionId,
    submissionStartExecutingTest,
    submissionSetTestResult,
    submissionChangeDisplayedError,
    submissionCloseCurrentSubmission,
} = submissionSlice.actions;

export default submissionSlice;
