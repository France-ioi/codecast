import {call, put} from "typed-redux-saga";
import {asyncGetJson, asyncRequestJson} from "../utils/api";
import {Task, TaskAnswer, TaskServer, TaskTest} from '../task/task_types';
import {appSelect} from '../hooks';
import {TaskSubmissionServer, TaskSubmissionServerResult} from './submission_types';
import {submissionUpdateTaskSubmission} from './submission_slice';
import {smartContractPlatforms} from '../task/libs/smart_contract/smart_contract_blocks';
import {getAvailablePlatformsFromSupportedLanguages} from '../stepper/platforms';
import {documentToString} from '../buffers/document';
import stringify from 'json-stable-stringify-without-jsonify';
import {TaskLevelName} from '../task/platform/platform_slice';
import {CodecastPlatform} from '../stepper/codecast_platform';

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
    }

    // Use this for now to check if it's a Smart Contract task. Change this in the future
    if (smartContractPlatforms.find(platform => -1 !== getAvailablePlatformsFromSupportedLanguages(task.supportedLanguages).indexOf(platform))) {
        return {
            ...task,
            gridInfos: {
                context: 'smart_contract',
                importModules: ['smart_contract_config'],
                showLabels: true,
                conceptViewer: true,
                tabsEnabled: true,
                includeBlocks: {
                    groupByCategory: true,
                    standardBlocks: {
                        wholeCategories: ['smart_contract_main_blocks', 'smart_contract_types'],
                    },
                },
                ...(window.taskData?.gridInfos ? window.taskData.gridInfos : {}),
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
                tabsEnabled: true,
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
                ...(window.taskData?.gridInfos ? window.taskData.gridInfos : {}),
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

                // If the test has a clientId, change the id of the test to use the client id
                if (test?.test?.clientId) {
                    const userTest = state.task.taskTests.find(otherTest => otherTest.id === test.test.clientId);
                    if (userTest) {
                        test.test.id = userTest.id;
                        test.testId = userTest.id;
                    }
                }
            }

            yield* put(submissionUpdateTaskSubmission({id: submissionIndex, submission: {...serverSubmission, evaluated: true, result}}));
            callback(result);

            return;
        }
    }
}

export function* makeServerSubmission(answer: TaskAnswer, answerToken: string, platform: CodecastPlatform, userTests: TaskTest[]) {
    const state = yield* appSelect();
    const taskPlatformUrl = state.options.taskPlatformUrl;
    const taskToken = state.platform.taskToken;
    const answerContent = documentToString(answer.document);

    const body = {
        token: taskToken,
        answerToken: answerToken,
        answer: {
            language: platform,
            fileName: answer.fileName,
            sourceCode: answerContent,
        },
        userTests: userTests.map(test => ({
            name: test.name,
            input: test.data?.input ? test.data?.input : '',
            output: test.data?.output ? test.data?.output : '',
            clientId: test.id,
        })),
        sLocale: state.options.language.split('-')[0],
        platform: state.platform.platformName,
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
