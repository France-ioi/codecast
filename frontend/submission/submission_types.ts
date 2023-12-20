import {TaskTestServer} from '../task/task_types';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {SubmissionExecutionScope} from './submission_slice';

export interface SubmissionNormalized {
    id: string,
    success: boolean,
    totalTestsCount: number,
    passedTestsCount: number,
    score: number, // Initially from 0 to 100 in the server return, but converted from 0 to 1 to be consistent with other submission types
    compilationError: boolean,
    compilationMessage: string | null,
    errorMessage: string | null,
    metadata: TaskSubmissionServerExecutionMetadata|null,
    firstUserOutput: string | null,
    firstExpectedOutput: string | null,
    evaluated: boolean,
    confirmed: boolean,
    manualCorrection: boolean,
    manualScoreDiffComment: string | null,
    mode: TaskSubmissionMode,
}

export interface SubmissionSubtaskNormalized {
    id: string,
    success: boolean,
    score: number,
    subtaskId: string,
}

export enum SubmissionTestErrorCode {
    OtherError = -1,
    NoError = 0,
    WrongAnswer = 1,
    AbortError = 6,
    BusError = 7,
    FloatingPointException = 8,
    SegFault = 11,
    TimeLimitExceeded = 137,
}

export interface SubmissionTestNormalized {
    id: string,
    testId: string,
    score: number,
    timeMs: number,
    memoryKb: number,
    errorCode: SubmissionTestErrorCode,
    output: string | null,
    expectedOutput: string | null,
    errorMessage: string | null,
    log: string | null,
    noFeedback: boolean,
    files: string[] | null,
    submissionSubtaskId: string | null,
}

export interface TaskSubmissionTestResult {
    executing?: boolean,
    testId: string,
    test?: TaskTestServer, // For user tests
    message?: string,
    score: number,
    errorCode: SubmissionTestErrorCode,
}

export enum TaskSubmissionEvaluateOn {
    Client = 'client',
    Server = 'server',
    RemoteDebugServer = 'remote_debug_server',
}

export interface TaskSubmission {
    type: TaskSubmissionEvaluateOn,
    date: string, // ISO format
    evaluated: boolean,
    crashed?: boolean,
    cancelled?: boolean,
    platform: CodecastPlatform,
    result?: TaskSubmissionResult,
    scope?: SubmissionExecutionScope,
}

export enum TaskSubmissionMode {
    Submitted = 'Submitted',
    LimitedTime = 'LimitedTime',
    Contest = 'Contest',
    UserTest = 'UserTest',
}

export interface TaskSubmissionResult {
    tests: TaskSubmissionTestResult[],
    compilationError?: boolean,
    compilationMessage?: string | null,
    errorMessage?: string | null,
    mode?: TaskSubmissionMode,
    sourceCode?: {
        params: {
            sLangProg: string,
        },
        name: string,
        source: string,
    },
}

export interface TaskSubmissionClient extends TaskSubmission {
    type: TaskSubmissionEvaluateOn.Client,
}

export interface TaskSubmissionServer extends TaskSubmission {
    result?: TaskSubmissionServerResult,
    type: TaskSubmissionEvaluateOn.Server,
}

export interface TaskSubmissionServerResult extends SubmissionNormalized {
    subTasks?: SubmissionSubtaskNormalized[],
    tests: TaskSubmissionServerTestResult[],
}

export interface TaskSubmissionServerTestResult extends TaskSubmissionTestResult, SubmissionTestNormalized {
    metadata?: TaskSubmissionServerExecutionMetadata|null,
}

export interface TaskSubmissionServerExecutionMetadata {
    errorfile?: string,
    errorline?: number,
}

export interface TaskSubmissionResultPayload {
    testId: number,
    result: boolean,
    successRate?: number, // Between 0 and 1
    message?: string,
    steps?: number,
    testResult?: LibraryTestResult,
    noGrading?: boolean,
}
