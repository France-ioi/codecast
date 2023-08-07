import {call, put} from "typed-redux-saga";
import {asyncGetJson, asyncRequestJson} from "../utils/api";
import {Task, TaskServer, TaskTest} from '../task/task_types';
import {appSelect} from '../hooks';
import {submissionUpdateTaskSubmission} from './submission_slice';
import {smartContractPlatforms} from '../task/libs/smart_contract/smart_contract_blocks';
import {TaskSubmissionServer, TaskSubmissionServerResult} from './submission_types';

export function* getTaskFromId(taskId: string): Generator<any, TaskServer|null> {
    const state = yield* appSelect();
    const {taskPlatformUrl} = state.options;

    return (yield* call(asyncGetJson, taskPlatformUrl + '/tasks/' + taskId, false)) as TaskServer|null;
}

export function convertServerTaskToCodecastFormat(task: TaskServer): Task {
    // task.scriptAnimation = "\n       window.taskData = subTask = {};\n       subTask.gridInfos = {\n         context: 'smart_contract',\n         importModules: ['smart_contract_config'],\n         showLabels: true,\n         conceptViewer: true,\n         includeBlocks: {\n           groupByCategory: true,\n           standardBlocks: {\n             wholeCategories: ['smart_contract_main_blocks', 'smart_contract_types'],\n           },\n         },\n         expectedStorage: \"(string %names)\",\n         taskStrings: {\n           \"storageDescription\": {\n             \"names\": \"it should contain its initial value then the list of names of the callers, all separated with commas\",\n           },\n         },\n         // expectedStorage: \"(Pair (string %names) (nat %nb_calls))\",\n       };\n     ";
    if (task.scriptAnimation) {
        try {
            eval(task.scriptAnimation);
        } catch (ex) {
            console.error("Couldn't execute script animation", ex);
        }

        if (window.taskData?.gridInfos) {
            return {
                ...task,
                gridInfos: window.taskData.gridInfos,
            };
        }
    }

    // Use this for now to check if it's a Smart Contract task. Change this in the future
    if (smartContractPlatforms.find(platform => -1 !== task.supportedLanguages.indexOf(platform))) {
        return {
            ...task,
            gridInfos: {
                context: 'smart_contract',
                importModules: ['smart_contract_config'],
                showLabels: true,
                conceptViewer: true,
                includeBlocks: {
                    groupByCategory: true,
                    standardBlocks: {
                        wholeCategories: ['smart_contract_main_blocks', 'smart_contract_types'],
                    },
                },
                // expectedStorage: "(string %names)",
                // expectedStorage: "(Pair (string %names) (nat %nb_calls))",
                // hints: [
                //     {content: 'Indice 1'},
                //     {content: 'Indice 2'},
                // ],
            },
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

export function* makeServerSubmission(answer: string, taskToken: string, answerToken: string, platform: string, userTests: TaskTest[]) {
    const state = yield* appSelect();
    const {taskPlatformUrl} = state.options;

    const body = {
        token: taskToken,
        answerToken: answerToken,
        answer: {
            language: platform,
            sourceCode: answer,
        },
        userTests: userTests.map(test => ({
            name: test.name,
            input: test.data?.input ? test.data?.input : '',
            output: test.data?.output ? test.data?.output : '',
        })),
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
