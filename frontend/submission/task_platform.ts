import {call, put} from "typed-redux-saga";
import {asyncGetJson, asyncRequestJson} from "../utils/api";
import {Task} from '../task/task_slice';
import {appSelect} from '../hooks';
import {TaskSubmissionServer, TaskSubmissionServerResult} from './submission';
import {submissionUpdateTaskSubmission} from './submission_slice';
import {TaskHint} from '../task/hints/hints_slice';

export interface TaskNormalized {
    id: string,
    textId: string,
    supportedLanguages: string[],
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

export enum TaskTestGroupType {
    Example = 'Example',
    User = 'User',
    Evaluation = 'Evaluation',
    Submission = 'Submission',
}

export interface TaskTestServer {
    id: string,
    taskId: string,
    subtaskId: string|null,
    submissionId: string|null,
    groupType: TaskTestGroupType,
    userId: string|null,
    platformId: string|null,
    rank: number,
    active: boolean,
    name: string,
    input: string,
    output: string,
}

export interface TaskServer extends TaskNormalized {
    limits: TaskLimitNormalized[],
    strings: TaskStringNormalized[],
    subTasks: TaskSubtaskNormalized[],
    tests: TaskTestServer[],
    hints?: TaskHint[],
}


export interface SubmissionNormalized {
    id: string,
    success: boolean,
    totalTestsCount: number,
    passedTestsCount: number,
    score: number, // Initially from 0 to 100 in the server return, but converted from 0 to 1 to be consistent with other submission types
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
    output: string|null,
    expectedOutput: string|null,
    errorMessage: string|null,
    log: string|null,
    noFeedback: boolean,
    files: string[]|null,
    submissionSubtaskId: string|null,
}

export function* getTaskFromId(taskId: string): Generator<any, TaskServer|null> {
    const state = yield* appSelect();
    const {taskPlatformUrl} = state.options;

    return (yield* call(asyncGetJson, taskPlatformUrl + '/tasks/' + taskId, false)) as TaskServer|null;
}

export function convertServerTaskToCodecastFormat(task: TaskServer): Task {
    // Use this for now to check if it's a Smart Contract task. Change this in the future
    if (-1 !== task.supportedLanguages.indexOf('michelson')) {
        return {
            ...task,
            gridInfos: {
                context: 'smart_contract',
                importModules: [],
                showLabels: true,
                conceptViewer: true,
                includeBlocks: {
                    groupByCategory: true,
                    standardBlocks: {
                        wholeCategories: ['smart_contract_main_blocks', 'smart_contract_types'],
                    },
                },
            },
            hints: [
                {content: 'Indice 1'},
                {content: 'Indice 2'},
            ],
        };
    } else {
        return {
            ...task,
            gridInfos: {
                context: 'printer',
                importModules: [],
                showLabels: true,
                conceptViewer: true,
                // maxInstructions: {
                //     easy: 20,
                //     medium: 30,
                //     hard: 40
                // },
                // nbPlatforms: 100,
                includeBlocks: {
                    groupByCategory: true,
                    standardBlocks: {
                        includeAll: true,
                        singleBlocks: ["controls_repeat", "controls_if"]
                    },
                    generatedBlocks: {
                        printer: ["print", "read"]
                    },
                    variables: [],
                    pythonAdditionalFunctions: ["len"]
                },
                checkEndEveryTurn: false,
                checkEndCondition: function (context, lastTurn) {
                    if (!lastTurn) return;
                    context.checkOutputHelper();
                    context.success = true;
                    throw(window.languageStrings.messages.outputCorrect);
                },
            },
        }
    }
}

export function* longPollServerSubmissionResults(submissionId: string, submissionIndex: number, serverSubmission: TaskSubmissionServer, callback: (TaskSubmissionServerResult) => void) {
    const state = yield* appSelect();
    const {taskPlatformUrl} = state.options;

    while (true) {
        const result = (yield* call(asyncGetJson, taskPlatformUrl + '/submissions/' + submissionId + '?longPolling', false)) as TaskSubmissionServerResult|null;
        if (result.evaluated) {
            for (let test of result.tests) {
                test.score = test.score / 100;
            }

            yield* put(submissionUpdateTaskSubmission({id: submissionIndex, submission: {...serverSubmission, evaluated: true, result}}));
            callback(result);

            return;
        }
    }
}

export function* makeServerSubmission(answer: string, taskToken: string, answerToken: string, platform: string) {
    const state = yield* appSelect();
    const {taskPlatformUrl} = state.options;
    const answerDecoded = JSON.parse(answer);

    const body = {
        token: taskToken,
        answerToken: answerToken,
        answer: {
            language: platform,
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

    return (yield* call(asyncRequestJson, taskPlatformUrl + '/submissions', body, false)) as {success: boolean, submissionId?: string};
}
