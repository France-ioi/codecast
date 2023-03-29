import {Bundle} from "../linker";
import {call, takeEvery} from "typed-redux-saga";
import {AppAction} from "../store";
import {getTaskAnswerAggregated, platformApi, PlatformTaskGradingParameters} from "../task/platform/platform";
import {
    SubmissionNormalized,
    SubmissionSubtaskNormalized,
    SubmissionTestErrorCode,
    SubmissionTestNormalized
} from './task_platform';
import {taskSubmissionExecutor} from './task_submission';
import {appSelect} from '../hooks';
import {selectAnswer} from '../task/selectors';
import stringify from 'json-stable-stringify-without-jsonify';

export interface TaskSubmissionTestResult {
    executing?: boolean,
    testId: string,
    message?: string,
    score: number,
    errorCode: SubmissionTestErrorCode,
}

export enum TaskSubmissionEvaluateOn {
    Client = 'client',
    Server = 'server',
}

export interface TaskSubmission {
    type: TaskSubmissionEvaluateOn,
    date: string, // ISO format
    evaluated: boolean,
    crashed?: boolean,
    result?: TaskSubmissionResult,
}

export function isServerSubmission(object: TaskSubmission): object is TaskSubmissionServer {
    return TaskSubmissionEvaluateOn.Server === object.type;
}

export interface TaskSubmissionResult {
    tests: TaskSubmissionTestResult[],
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

}

export interface TaskSubmissionResultPayload {
    testId: number,
    result: boolean,
    message?: string,
    steps?: number,
}


export enum SubmissionActionTypes {
    SubmissionTriggerPlatformValidate = 'submission/triggerPlatformValidate',
    SubmissionGradeAnswerServer = 'submission/gradeAnswerServer',
}

export interface SubmissionTriggerPlatformValidateAction extends AppAction {
    type: SubmissionActionTypes.SubmissionTriggerPlatformValidate,
}

export interface SubmissionGradeAnswerServerAction extends AppAction {
    type: SubmissionActionTypes.SubmissionGradeAnswerServer,
}

export const submissionTriggerPlatformValidate = (): SubmissionTriggerPlatformValidateAction => ({
    type: SubmissionActionTypes.SubmissionTriggerPlatformValidate,
});

export const submissionGradeAnswerServer = (): SubmissionGradeAnswerServerAction => ({
    type: SubmissionActionTypes.SubmissionGradeAnswerServer,
});

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield* takeEvery(SubmissionActionTypes.SubmissionTriggerPlatformValidate, function* (action: SubmissionTriggerPlatformValidateAction) {
            yield* call([platformApi, platformApi.validate], 'done');
            if (window.SrlLogger) {
                window.SrlLogger.validation(100, 'none', 0);
            }
        });

        yield* takeEvery(SubmissionActionTypes.SubmissionGradeAnswerServer, function* (action: SubmissionTriggerPlatformValidateAction) {
            const answer = yield getTaskAnswerAggregated();
            const submissionParameters: PlatformTaskGradingParameters = {
                answer: stringify(answer),
                minScore: 0,
                maxScore: 100,
                noScore: 0,
            };

            yield* call([taskSubmissionExecutor, taskSubmissionExecutor.gradeAnswerServer], submissionParameters);
        });
    });
}
