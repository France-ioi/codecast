import {call, select} from "typed-redux-saga";
import {asyncGetJson, asyncRequestJson} from "../utils/api";
import {AppStore} from "../store";

export function* getTaskFromId (taskId: string): Generator<any, object> {
    const state: AppStore = yield* select();
    const {taskPlatformUrl} = state.options;

    return (yield* call(asyncGetJson, taskPlatformUrl + '/tasks/' + taskId, false)) as object;
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

    return (yield* call(asyncRequestJson, taskPlatformUrl + '/submissions?XDEBUG_SESSION_START=PHPSTORM', body, false)) as object;
}
