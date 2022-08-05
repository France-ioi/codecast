import {call, select} from "typed-redux-saga";
import {asyncGetJson} from "../utils/api";
import {AppStore} from "../store";

export function* getTaskFromId (taskId: string): Generator<any, object> {
    const state: AppStore = yield* select();
    const {taskPlatformUrl} = state.options;

    return (yield* call(asyncGetJson, taskPlatformUrl + '/tasks/' + taskId, false)) as object;
}
