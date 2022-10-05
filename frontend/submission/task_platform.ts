import {call, delay, race, select} from "typed-redux-saga";
import {asyncGetJson, asyncRequestJson} from "../utils/api";
import {AppStore} from "../store";

export interface TaskNormalized {
    id: string,
    textId: string,
    supportedLanguages: string,
    author: string,
    showLimits: boolean,
    userTests: boolean,
    isEvaluable: boolean,
    scriptAnimation: string,
    hasSubtasks: boolean,
}

export interface TaskLimitNormalized {
    id: string,
    taskId: string,
    language: string,
    maxTime: number,
    maxMemory: number,
}

export interface TaskStringNormalized {
    id: string,
    taskId: string,
    language: string,
    title: string,
    statement: string,
    solution: string|null,
}

export interface TaskSubtaskNormalized {
    id: string,
    taskId: string,
    rank: number,
    name: string,
    comments: string|null,
    pointsMax: number,
    active: boolean,
}

export interface TaskTestNormalized {
    id: string,
    taskId: string,
    subtaskId: string|null,
    submissionId: string|null,
    groupType: string,
    userId: string|null,
    platformId: string|null,
    rank: number,
    active: boolean,
    name: string,
    input: string,
    output: string,
}

export interface TaskOutput extends TaskNormalized {
    limits: TaskLimitNormalized[],
    strings: TaskStringNormalized[],
    subTasks: TaskSubtaskNormalized[],
    tests: TaskTestNormalized[],
}


export interface SubmissionNormalized {
    id: string,
    success: boolean,
    totalTestsCount: number,
    passedTestsCount: number,
    score: number,
    compilationError: boolean,
    compilationMessage: string|null,
    errorMessage: string|null,
    firstUserOutput: string|null,
    firstExpectedOutput: string|null,
    evaluated: boolean,
    confirmed: boolean,
    manualCorrection: boolean,
    manualScoreDiffComment: string|null,
    mode: string,
}

export interface SubmissionSubtaskNormalized {
    id: string,
    success: boolean,
    score: number,
    subtaskId: string,
}

export interface SubmissionTestNormalized {
    id: string,
    testId: string,
    score: number,
    timeMs: number,
    memoryKb: number,
    errorCode: number,
    output: string|null,
    expectedOutput: string|null,
    errorMessage: string|null,
    log: string|null,
    noFeedback: boolean,
    files: string[]|null,
    submissionSubtaskId: string|null,
}

export interface SubmissionOutput extends SubmissionNormalized {
    subTasks?: SubmissionSubtaskNormalized[],
    tests?: SubmissionTestNormalized[],
}

export function* getTaskFromId(taskId: string): Generator<any, TaskOutput|null> {
    const state: AppStore = yield* select();
    const {taskPlatformUrl} = state.options;

    return (yield* call(asyncGetJson, taskPlatformUrl + '/tasks/' + taskId, false)) as TaskOutput|null;
}

export function* getServerSubmissionResults(submissionId: string): Generator<any, SubmissionOutput|null> {
    const outcome = yield* race({
        results: call(longPollServerSubmissionResults, submissionId),
        timeout: delay(60*1000)
    });


    if (outcome.timeout) {
        throw new Error("Submission results have timeout");
    }

    return outcome.results;
}

export function* longPollServerSubmissionResults(submissionId: string) {
    const state: AppStore = yield* select();
    const {taskPlatformUrl} = state.options;

    while (true) {
        const result = (yield* call(asyncGetJson, taskPlatformUrl + '/submissions/' + submissionId + '?longPolling', false)) as SubmissionOutput|null;
        if (result.evaluated) {
            return result;
        }
    }
}


export function* makeServerSubmission(answer: string, taskToken: string, answerToken: string) {
    const state: AppStore = yield* select();
    const {taskPlatformUrl} = state.options;
    const answerDecoded = JSON.parse(answer);

    const body = {
        token: taskToken,
        answerToken: answerToken,
        answer: {
            language: state.options.platform,
            sourceCode: answerDecoded,
        },
        userTests: [],
        sLocale: state.options.language.split('-')[0],
        platform: state.submission.platformName,
        taskId: String(state.task.currentTask.id),
        taskParams: {
            minScore: 0,
            maxScore: 100,
            noScore: 0,
            readOnly: false,
            randomSeed: '',
            returnUrl: '',
        }
    };

    return (yield* call(asyncRequestJson, taskPlatformUrl + '/submissions?XDEBUG_SESSION_START=PHPSTORM', body, false)) as {success: boolean, submissionId?: string};
}
