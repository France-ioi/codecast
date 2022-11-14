import {call, fork, put, select, take, takeEvery} from 'typed-redux-saga';
import stringify from 'json-stable-stringify-without-jsonify';
import {getHeight, windowHeightMonitorSaga} from "./window_height_monitor";
import {getTaskTokenForLevel} from "./task_token";
import jwt from "jsonwebtoken";
import {Bundle} from "../../linker";
import makeTaskChannel from './task_channel';
import makePlatformAdapter from './platform_adapter';
import {
    taskGetAnswerEvent,
    taskGetHeightEvent,
    taskGetStateEvent,
    taskGetMetadataEvent,
    taskGetViewsEvent,
    taskGradeAnswerEvent,
    taskReloadAnswerEvent,
    taskReloadStateEvent,
    taskShowViewsEvent,
    taskUpdateTokenEvent,
    taskLoadEvent,
    taskUnloadEvent,
    platformAnswerGraded,
    platformTaskRefresh,
    platformAnswerLoaded,
    taskGetResourcesPost,
    platformTaskLink,
} from './actionTypes';
import {App, Codecast} from "../../index";
import {AppStore} from "../../store";
import {Action, ActionCreator} from "redux";
import {
    platformTokenUpdated,
    platformSaveAnswer,
    platformSaveScore,
    platformTaskRandomSeedUpdated,
    TaskLevelName,
} from "./platform_slice";
import {generateTokenUrl} from "./task_token";
import {levelScoringData} from "../task_submission";
import {Effect} from "@redux-saga/types";
import log from "loglevel";
import {importPlatformModules} from '../libs/import_modules';
import {taskLoad} from '../index';
import {taskLoaded} from '../task_slice';

let getTaskAnswer: () => Generator;
let getTaskState: () => Generator;
let getTaskLevel: () => Generator<unknown, TaskLevelName>;
let taskChangeLevel: ActionCreator<Action>;
let taskGrader: TaskGrader;
let taskEventsEnvironment = 'main';

export let taskApi: any;
export let platformApi: ReturnType<typeof makePlatformAdapter>;
export let serverApi = null;
export let setTaskEventsEnvironment = (environment: string) => {
    taskEventsEnvironment = environment;
}

export function* getTaskAnswerAggregated () {
    const currentAnswer = yield getTaskAnswer();

    const levels = yield* select((state: AppStore) => state.platform.levels);
    if (levels && Object.keys(levels).length) {
        const currentLevel = yield* select((state: AppStore) => state.task.currentLevel);
        const answers = {};
        for (let {level, answer} of Object.values(levels)) {
            answers[level] = level === currentLevel ? currentAnswer : answer;
        }

        return answers;
    } else {
        return currentAnswer;
    }
}

export function getTaskMetadata() {
    const metadata = window.json ? window.json : {
        fullFeedback: true,
        minWidth: "auto",
    };
    metadata.autoHeight = true;
    metadata.disablePlatformProgress = true;

    return metadata;
}

function* linkTaskPlatformSaga() {
    const state: AppStore = yield* select();
    if ('main' !== state.environment) {
        return;
    }

    platformApi = makePlatformAdapter(window.platform);

    const taskChannel = yield* call(makeTaskChannel);
    taskApi = ((yield* take(taskChannel)) as {task: any}).task;

    yield* takeEvery(taskChannel, function* (action: Action) {
        const environment = yield* select((state: AppStore) => state.environment);
        console.log('listen to event', action, environment, taskEventsEnvironment)
        const environmentStore = Codecast.environments[taskEventsEnvironment ?? 'main'].store;
        yield* call(environmentStore.dispatch, action);
    });

    window.task = taskApi;
    window.implementGetResources(window.task);
    yield* call(platformApi.initWithTask, taskApi);

    window.taskGetResourcesPost = (res, callback) => {
        Codecast.environments['main'].store.dispatch(taskGetResourcesPost(res, callback));
    };
}

function* taskAnswerReloadedSaga () {
    const nextVersion = yield* call(taskGetNextLevelToIncreaseScore);
    log.getLogger('platform').debug('Task answer reloaded, next version = ' + nextVersion);

    if (null !== nextVersion) {
        yield* put(taskChangeLevel(nextVersion));
    }
}

export function* taskGetNextLevelToIncreaseScore(currentLevelMaxScore: TaskLevelName = null): Generator<any, TaskLevelName, any> {
    const taskLevels = yield* select((state: AppStore) => state.platform.levels);
    let nextVersion: TaskLevelName = null;

    const {maxScore} = yield* call(platformApi.getTaskParams, null, null);

    let currentReconciledScore = 0;
    for (let {level, score} of Object.values(taskLevels)) {
        const {scoreCoefficient} = levelScoringData[level];
        const versionScore = (currentLevelMaxScore === level ? maxScore : score) * scoreCoefficient;
        log.getLogger('platform').debug({level, score, scoreCoefficient, versionScore});
        currentReconciledScore = Math.max(currentReconciledScore, versionScore);
    }

    for (let {level} of Object.values(taskLevels)) {
        const levelMaxScore = maxScore * levelScoringData[level].scoreCoefficient;
        if (levelMaxScore > currentReconciledScore) {
            nextVersion = level;
            break;
        }
    }

    return nextVersion;
}


function* taskShowViewsEventSaga ({payload: {success}}: ReturnType<typeof taskShowViewsEvent>) {
    /* The reducer has stored the views to show, just call success. */
    yield* call(success);
}

function* taskGetViewsEventSaga ({payload: {success}}: ReturnType<typeof taskGetViewsEvent>) {
    /* XXX only the 'task' view is declared */
    yield* call(success, {'task': {}});
}

function* taskUpdateTokenEventSaga ({payload: {success}}: ReturnType<typeof taskUpdateTokenEvent>) {
    //TODO: Do something specific? We haven't implemented it into react-task-lib yet it works
    yield* call(success);
}

function* taskGetHeightEventSaga ({payload: {success}}: ReturnType<typeof taskGetHeightEvent>) {
    yield* call(success, getHeight());
}

function* taskUnloadEventSaga ({payload: {success}}: ReturnType<typeof taskUnloadEvent>) {
    /* XXX No action needed? */
    yield* call(success);
}

function* taskGetMetaDataEventSaga ({payload: {success, error: _error}}: ReturnType<typeof taskGetMetadataEvent>) {
    const metadata = getTaskMetadata();

    yield* call(success, metadata);
}

function* taskGetAnswerEventSaga (action: ReturnType<typeof taskGetAnswerEvent>) {
    const answer = yield getTaskAnswerAggregated();
    yield* call(action.payload.success, stringify(answer));
}

function* taskReloadAnswerEventSaga ({payload: {answer, success, error}}: ReturnType<typeof taskReloadAnswerEvent>) {
    try {
        const taskLevels = yield* select((state: AppStore) => state.platform.levels);
        if (taskLevels && answer) {
            const currentLevel = yield getTaskLevel();
            const answerObject = JSON.parse(answer);
            for (let {level} of Object.values(taskLevels)) {
                yield* put(platformSaveAnswer({level, answer: answerObject[level]}));
                if (level === currentLevel) {
                    yield* put(platformAnswerLoaded(answerObject[level]));
                    yield* put(platformTaskRefresh());
                }
            }
            yield* call(taskGradeAnswerEventSaga, taskGradeAnswerEvent(answer, null, success, error, true));
            yield* call(taskAnswerReloadedSaga);
        } else if (answer) {
            yield* put(platformAnswerLoaded(JSON.parse(answer)));
            yield* put(platformTaskRefresh());
            yield* call(success);
        } else {
            yield* call(success);
        }
    } catch (ex: any) {
        yield* call(error, `bad answer: ${ex.message}`);
    }
}

function* taskGetStateEventSaga ({payload: {success}}: ReturnType<typeof taskGetStateEvent>) {
    const currentState = yield getTaskState();
    const strDump = stringify(currentState);
    yield* call(success, strDump);
}

function* taskGetResourcesPostSaga ({payload: {resources, callback}}: ReturnType<typeof taskGetResourcesPost>) {
    const options = yield* select((state: AppStore) => state.options);
    const optionsToPreload = {
        platform: options.platform,
        language: options.language,
    };

    // Import necessary platform modules without waiting for them to be imported, the declaration is enough
    const platform = yield* select((state: AppStore) => state.options.platform);
    yield* call(importPlatformModules, platform, window.modulesPath);

    window.jQuery('script.module').each(function() {
        const scriptSrc = window.jQuery(this).attr('src');
        if (scriptSrc && !resources.task_modules.find(resource => scriptSrc === resource.url)) {
            resources.task_modules.push({type: 'javascript', url: scriptSrc, id: window.jQuery(this).attr('id')});
        }
    });

    // For Castor platform, we need to add custom scripts that will be added to the assets during the generation of the task
    const castorScriptInject = `window.codecastPreload = JSON.parse('${JSON.stringify(optionsToPreload)}');
document.body.setAttribute('id', 'app');
var reactContainerDiv = document.createElement('div');
reactContainerDiv.setAttribute('id', 'react-container');
document.body.appendChild(reactContainerDiv);
try {
    $('#question-iframe', window.parent.document).css('width', '100%');
} catch(e) {
}`;

    resources.task.unshift({type: 'javascript', content: castorScriptInject, id: 'codecast-preload'});
    callback(resources);
}

/**
 * Add a listener on this event in your code to execute actions
 */
function* taskReloadStateEventSaga ({payload: {success, error}}: ReturnType<typeof taskReloadStateEvent>) {
    try {
        yield* call(success);
    } catch (ex: any) {
        yield* call(error, `bad state: ${ex.message}`);
    }
}

function* taskLoadEventSaga ({payload: {views: _views, success, error}}: ReturnType<typeof taskLoadEvent>) {
    let {randomSeed, options} = yield* call(platformApi.getTaskParams);
    // Fix issue with too large randomSeed that overflow int capacity
    randomSeed = String(randomSeed);
    if ('0' === randomSeed) {
        randomSeed = String(Math.floor(Math.random() * 10));
        if (window.task_token) {
            const token = window.task_token.get();
            if (token) {
                const payload = jwt.decode(token);
                if (null !== payload.randomSeed && undefined !== payload.randomSeed) {
                    randomSeed = String(payload.randomSeed);
                }
            }
        }
    }
    yield* put(platformTaskRandomSeedUpdated(randomSeed));

    let level = yield* select((state: AppStore) => state.task.currentLevel);
    console.log('task load event', level);
    if (!level) {
        const urlParameters = new URLSearchParams(window.location.search);
        const query = Object.fromEntries(urlParameters);

        if (options && options.version) {
            level = options.version;
        } else {
            if (!query['version'] && window.options) {
                query['taskID'] = window.options.defaults.taskID;
                query['version'] = window.options.defaults.version;
                window.location.href = generateTokenUrl(query);
                return;
            } else {
                level = query['version'] as TaskLevelName;
            }
        }
    }

    const taskToken = getTaskTokenForLevel(level, randomSeed);
    yield* put(platformTokenUpdated(taskToken));

    try {
        const taskLoadParameters: {level?: TaskLevelName} = {};
        if (options.level) {
            taskLoadParameters.level = options.level;
        }
        yield* put(taskLoad(taskLoadParameters));
        yield* take(taskLoaded.type);

        // if (serverApi) {
        //     const taskData = yield* call(serverApi, 'tasks', 'taskData', {task: taskToken});
        //     //yield* put({type: taskInit, payload: {taskData}});
        // }

        yield* call(success);
        yield* fork(windowHeightMonitorSaga, platformApi);
    } catch (ex) {
        yield* call(error, ex.toString());
    }
}

export function* taskGradeAnswerEventSaga ({payload: {answer, success, error, silent}}: ReturnType<typeof taskGradeAnswerEvent>) {
    try {
        const taskLevels = yield* select((state: AppStore) => state.platform.levels);
        console.log('task levels', taskLevels);
        const {minScore, maxScore, noScore} = yield* call(platformApi.getTaskParams, null, null);
        if (taskLevels && Object.keys(taskLevels).length) {
            const versionsScore = {};
            const currentLevel = yield getTaskLevel();
            let currentScore = null;
            let currentMessage = null;
            let currentScoreToken = null;
            const answerObject = JSON.parse(answer);
            console.log('answer data', answer);
            for (let {level} of Object.values(taskLevels)) {
                console.log('level', level, answerObject[level]);
                if (!answerObject[level]) {
                    versionsScore[level] = 0;
                    continue;
                }

                console.log('info answer', level);

                const {score, message, scoreToken} = yield* call([taskGrader, taskGrader.gradeAnswer],{level, answer: answerObject[level], minScore, maxScore, noScore});

                versionsScore[level] = score;
                if (level === currentLevel) {
                    currentScore = score;
                    currentMessage = message;
                    currentScoreToken = scoreToken;
                }

                yield* put(platformSaveScore({level, score, answer: answerObject[level]}));
            }

            let reconciledScore = 0;
            for (let {level} of Object.values(taskLevels)) {
                let {scoreCoefficient} = levelScoringData[level];
                let versionScore = versionsScore[level] * scoreCoefficient;
                reconciledScore = Math.max(reconciledScore, versionScore);
            }

            if (!silent) {
                yield* put(platformAnswerGraded({score: currentScore, message: currentMessage, maxScore}));
            }
            yield* call(success, reconciledScore, currentMessage, currentScoreToken);
        } else {
            const {score, message, scoreToken} = yield* call([taskGrader, taskGrader.gradeAnswer], {answer, minScore, maxScore, noScore});

            yield* put(platformAnswerGraded({score, message, maxScore}));
            yield* call(success, score, message, scoreToken);
        }
    } catch (ex: any) {
        const message = ex.message === 'Network request failed' ? "Vous n'êtes actuellement pas connecté à Internet."
            : (ex.message ? ex.message : ex.toString());
        yield* put(platformAnswerGraded({error: message}));
        console.error(ex);
        if (error) {
            yield* call(error, message);
        }
    }
}

export interface PlatformTaskGradingParameters {
    level?: TaskLevelName,
    answer?: any,
    minScore: number,
    maxScore: number,
    noScore: number,
}

export interface PlatformTaskGradingResult {
    score?: number,
    message?: string,
    error?: string,
    scoreToken?: string,
}

export interface TaskGrader {
    gradeAnswer: (parameters: PlatformTaskGradingParameters) => Generator<Effect, PlatformTaskGradingResult, any>;
}

export interface PlatformBundleParameters {
    getTaskAnswer: () => Generator,
    getTaskLevel: () => Generator<unknown, TaskLevelName>,
    getTaskState: () => Generator,
    taskChangeLevel: ActionCreator<Action>,
    taskGrader: TaskGrader,
}

export function setPlatformBundleParameters(parameters: PlatformBundleParameters) {
    getTaskAnswer = parameters.getTaskAnswer;
    getTaskState = parameters.getTaskState;
    getTaskLevel = parameters.getTaskLevel;
    taskChangeLevel = parameters.taskChangeLevel;
    taskGrader = parameters.taskGrader;
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield* takeEvery(taskLoadEvent.type, taskLoadEventSaga);
        yield* takeEvery(taskGetMetadataEvent.type, taskGetMetaDataEventSaga);
        yield* takeEvery(taskUnloadEvent.type, taskUnloadEventSaga);
        yield* takeEvery(taskShowViewsEvent.type, taskShowViewsEventSaga);
        yield* takeEvery(taskGetViewsEvent.type, taskGetViewsEventSaga);
        yield* takeEvery(taskUpdateTokenEvent.type, taskUpdateTokenEventSaga);
        yield* takeEvery(taskGetHeightEvent.type, taskGetHeightEventSaga);
        yield* takeEvery(taskGetStateEvent.type, taskGetStateEventSaga);
        yield* takeEvery(taskReloadStateEvent.type, taskReloadStateEventSaga);
        yield* takeEvery(taskGetAnswerEvent.type, taskGetAnswerEventSaga);
        yield* takeEvery(taskGradeAnswerEvent.type, taskGradeAnswerEventSaga);
        yield* takeEvery(taskReloadAnswerEvent.type, taskReloadAnswerEventSaga);
        yield* takeEvery(taskGetResourcesPost.type, taskGetResourcesPostSaga);
        yield* takeEvery(platformTaskLink.type, linkTaskPlatformSaga);
    });
}
