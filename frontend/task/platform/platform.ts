import {call, fork, put, select, take, takeEvery} from 'typed-redux-saga';
import stringify from 'json-stable-stringify-without-jsonify';
import {getHeight, windowHeightMonitorSaga} from "./window_height_monitor";
import {generateTokenUrl, getTaskTokenForLevel} from "./task_token";
import jwt from "jsonwebtoken";
import {Bundle} from "../../linker";
import makeTaskChannel from './task_channel';
import makePlatformAdapter from './platform_adapter';
import {
    platformAnswerGraded,
    platformAnswerLoaded,
    platformTaskLink,
    platformTaskRefresh,
    taskGetAnswerEvent,
    taskGetHeightEvent,
    taskGetMetadataEvent,
    taskGetResourcesPost,
    taskGetStateEvent,
    taskGetViewsEvent,
    taskGradeAnswerEvent,
    taskLoadEvent,
    taskReloadAnswerEvent,
    taskReloadStateEvent,
    taskShowViewsEvent,
    taskUnloadEvent,
    taskUpdateTokenEvent,
} from './actionTypes';
import {Action, ActionCreator} from "redux";
import {
    platformSaveAnswer,
    platformSaveScore,
    platformTaskRandomSeedUpdated,
    platformTokenUpdated, TaskLevel,
    TaskLevelName, taskLevelsList,
} from "./platform_slice";
import {Effect} from "@redux-saga/types";
import log from "loglevel";
import {importPlatformModules} from '../libs/import_modules';
import {taskLoaded} from '../task_slice';
import {appSelect} from '../../hooks';
import {ActionTypes as LayoutActionTypes} from '../layout/actionTypes';
import {SubmissionExecutionScope} from '../../submission/submission_slice';
import {getMessage} from '../../lang';
import {LayoutView} from '../layout/layout_types';
import {taskLoad} from '../task_actions';
import {levelScoringData} from '../../submission/scoring';
import {Codecast} from '../../app_types';
import {Document} from '../../buffers/buffer_types';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {ActionTypes} from '../../common/actionTypes';
import {TaskAnswer} from '../task_types';
import {RECORDING_FORMAT_VERSION} from '../../version';
import {BlockBufferHandler, uncompressIntoDocument} from '../../buffers/document';

let getTaskAnswer: () => Generator<unknown, TaskAnswer>;
let getTaskState: () => Generator;
let getTaskLevel: () => Generator<unknown, TaskLevelName>;
let taskChangeLevel: ActionCreator<Action>;
let taskGrader: TaskGrader;
let taskEventsEnvironment = 'main';

export let taskApi: any;
export let platformApi: ReturnType<typeof makePlatformAdapter> = null;
export let serverApi = null;
export let setTaskEventsEnvironment = (environment: string) => {
    taskEventsEnvironment = environment;
}

export function* getTaskAnswerAggregated() {
    const currentAnswer: TaskAnswer = yield getTaskAnswer();

    const levels = yield* appSelect(state => state.platform.levels);
    if (levels && Object.keys(levels).length) {
        const currentLevel = yield* appSelect(state => state.task.currentLevel);
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
    const metadata = window.json ?? window.PEMTaskMetaData ?? {
        fullFeedback: true,
        minWidth: "auto",
    };
    metadata.autoHeight = true;
    metadata.disablePlatformProgress = true;

    return metadata;
}

function sendErrorLog() {
    // Send errors to the platform
    let args = Array.prototype.slice.call(arguments);
    try {
        window.platform.log(["error", args]);
    } catch(e) {}
}

function* linkTaskPlatformSaga() {
    const state = yield* appSelect();
    if ('main' !== state.environment) {
        return;
    }

    platformApi = makePlatformAdapter(window.platform);

    window.onerror = sendErrorLog;

    const taskChannel = yield* call(makeTaskChannel);
    taskApi = ((yield* take(taskChannel)) as {task: any}).task;

    yield* takeEvery(taskChannel, function* (action: Action) {
        const environmentStore = Codecast.environments[taskEventsEnvironment ?? 'main'].store;
        yield* call(environmentStore.dispatch, action);
    });

    window.task = taskApi;
    if (window.implementGetResources) {
        window.implementGetResources(window.task);
    }
    yield* call(platformApi.initWithTask, taskApi);

    window.taskGetResourcesPost = (res, callback) => {
        Codecast.environments['main'].store.dispatch(taskGetResourcesPost(res, callback));
    };
}

export function isTaskPlatformLinked(): boolean {
    return null !== platformApi;
}

function* taskAnswerReloadedSaga () {
    const nextLevel = yield* call(taskGetNextLevelToIncreaseScore);
    const taskLevel = yield* appSelect(state => state.task.currentLevel);
    log.getLogger('platform').debug('Task answer reloaded, next version = ' + nextLevel);

    if (null !== nextLevel && nextLevel !== taskLevel) {
        yield* put(taskChangeLevel(nextLevel));
    }
}

export function* taskGetNextLevelToIncreaseScore(currentLevelMaxScore: TaskLevelName = null): Generator<any, TaskLevelName, any> {
    const taskLevels = yield* appSelect(state => state.platform.levels);
    let nextLevel: TaskLevelName = null;

    const levelScores = Object.values(taskLevels).map(element => ({
        level: element.level,
        score: currentLevelMaxScore === element.level ? 1 : element.score,
    }));
    const reconciledScore = computeReconciledScore(levelScores);

    const topLevel = getTopLevel(levelScores.map(elm => elm.level));
    for (let {level} of Object.values(taskLevels)) {
        let {scoreCoefficient} = levelScoringData[level];
        if (level === topLevel) {
            scoreCoefficient = 1;
        }
        const levelMaxScore = scoreCoefficient;
        if (levelMaxScore > reconciledScore) {
            nextLevel = level;
            break;
        }
    }

    return nextLevel;
}

function* showDifferentViews() {
    const levelGridInfos = yield* appSelect(state => state.task.levelGridInfos);
    const {supportsTabs} = yield* call(platformApi.getTaskParams);
    if (!supportsTabs || !levelGridInfos) {
        return false;
    }

    const context = quickAlgoLibraries.getContext(null, 'main');
    if (levelGridInfos && 'showViews' in levelGridInfos) {
        return levelGridInfos.showViews;
    }
    if (context?.showViews) {
        return context.showViews();
    }

    return false;
}

function* taskGetViewsEventSaga ({payload: {success}}: ReturnType<typeof taskGetViewsEvent>) {
    const views = yield* call(getSupportedViews);
    const showViews = yield* call(showDifferentViews);

    yield* call(success, views, showViews);
}

function* getSupportedViews() {
    const showViews = yield* call(showDifferentViews);

    if (showViews) {
        return {
            [LayoutView.Task]: {},
            [LayoutView.Editor]: {},
        }
    } else {
        return {
            [LayoutView.Task]: {},
        };
    }
}

function* taskShowViewsEventSaga ({payload: {views, success}}: ReturnType<typeof taskShowViewsEvent>) {
    const supportedViews = yield* call(getSupportedViews);
    // Use views system only if we support at least 2 views, otherwise we display everything
    let selectedViews = Object.keys(supportedViews).length >= 2 ? views : {};
    yield* put({type: LayoutActionTypes.LayoutViewsChanged, payload: {views: selectedViews}});
    yield* call(success);
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

function* backwardCompatibilityConvert(answer) {
    if (!answer) {
        return null;
    }

    if ('object' === typeof answer && answer.version) {
        return answer;
    }

    const platform = yield* appSelect(state => state.options.platform);

    let document: Document;
    if (answer.blockly) {
        document = BlockBufferHandler.documentFromObject(answer);
    } else {
        document = uncompressIntoDocument(answer);
    }

    return {
        version: RECORDING_FORMAT_VERSION,
        document,
        platform,
    }
}

function* taskReloadAnswerEventSaga ({payload: {answer, success, error}}: ReturnType<typeof taskReloadAnswerEvent>) {
    try {
        const taskLevels = yield* appSelect(state => state.platform.levels);
        if (taskLevels && Object.keys(taskLevels).length && answer) {
            const currentLevel = yield getTaskLevel();
            const answerObject = JSON.parse(answer);
            if ('object' !== typeof answerObject) {
                throw new Error("Answer is not an object: " + answer);
            }
            const convertedAnswer = {};
            for (let {level} of Object.values(taskLevels)) {
                convertedAnswer[level] = yield* call(backwardCompatibilityConvert, answerObject[level]);
                yield* put(platformSaveAnswer({level, answer: convertedAnswer[level]}));
                if (level === currentLevel) {
                    yield* put(platformAnswerLoaded(convertedAnswer[level]));
                    yield* put(platformTaskRefresh());
                }
            }
            yield* call(taskGradeAnswerEventSaga, taskGradeAnswerEvent(JSON.stringify(convertedAnswer), null, success, error, true));
            yield* call(taskAnswerReloadedSaga);
        } else if (answer) {
            const answerObject = yield* call(backwardCompatibilityConvert, JSON.parse(answer));
            yield* put(platformAnswerLoaded(answerObject));
            yield* put(platformTaskRefresh());
            yield* call(success);
        } else {
            yield* call(success);
        }
    } catch (ex: any) {
        console.error(ex);
        yield* call(error, `bad answer: ${ex.message}`);
    }
}

function* taskGetStateEventSaga ({payload: {success}}: ReturnType<typeof taskGetStateEvent>) {
    const currentState = yield getTaskState();
    const strDump = stringify(currentState);
    yield* call(success, strDump);
}

function* taskGetResourcesPostSaga ({payload: {resources, callback}}: ReturnType<typeof taskGetResourcesPost>) {
    const options = yield* appSelect(state => state.options);
    const optionsToPreload = {
        platform: options.platform,
        language: options.language,
    };

    // Import necessary platform modules without waiting for them to be imported, the declaration is enough
    const platform = yield* appSelect(state => state.options.platform);
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

    const taskVariant = yield* appSelect(state => state.options.taskVariant);
    const randomTaskVariants = yield* appSelect(state => state.options.randomTaskVariants);
    if (undefined === taskVariant && undefined !== randomTaskVariants) {
        const newTaskVariant = parseInt(randomSeed) % randomTaskVariants + 1;
        yield* put({
            type: ActionTypes.TaskVariantChanged,
            payload: { variant: newTaskVariant }
        });
    };

    let level = yield* appSelect(state => state.task.currentLevel);
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
        yield* take(taskLoaded);

        // if (serverApi) {
        //     const taskData = yield* call(serverApi, 'tasks', 'taskData', {task: taskToken});
        //     //yield* put({type: taskInit, payload: {taskData}});
        // }

        yield* call(success);
        yield* fork(windowHeightMonitorSaga, platformApi);
    } catch (ex) {
        console.error(ex);
        yield* call(error, ex.toString());
    }
}

export function* taskGradeAnswerEventSaga ({payload: {answer, success, error, silent}}: ReturnType<typeof taskGradeAnswerEvent>) {
    try {
        const taskLevels = yield* appSelect(state => state.platform.levels);
        log.getLogger('tests').debug('task levels', taskLevels);
        const {minScore, maxScore} = yield* call(platformApi.getTaskParams, null, null);
        if (taskLevels && Object.keys(taskLevels).length) {
            const versionsScore = {};
            const currentLevel = yield getTaskLevel();
            let currentScore = null;
            let currentMessage = null;
            let currentScoreToken = null;
            const answerObject = JSON.parse(answer);
            log.getLogger('tests').debug('answer data', answer);
            for (let {level} of Object.values(taskLevels)) {
                log.getLogger('tests').debug('level', level, answerObject[level]);
                if (!answerObject[level]) {
                    versionsScore[level] = 0;
                    continue;
                }

                log.getLogger('tests').debug('info answer', level);

                // Score is between 0 and 1
                const {score, message, scoreToken} = yield* call([taskGrader, taskGrader.gradeAnswer],{level, answer: answerObject[level]});

                versionsScore[level] = score;
                if (level === currentLevel) {
                    currentScore = score;
                    currentMessage = message;
                    currentScoreToken = scoreToken;
                }

                yield* put(platformSaveScore({level, score, answer: answerObject[level]}));
            }

            const levelScores = Object.values(taskLevels).map(element => ({
                level: element.level,
                score: versionsScore[element.level],
            }));
            const reconciledScore = computeReconciledScore(levelScores);
            const scoreWithPlatformParameters = minScore + (maxScore - minScore) * reconciledScore;

            if (!silent) {
                yield* put(platformAnswerGraded({score: currentScore, message: currentMessage}));
            }

            log.getLogger('tests').debug('[Tests] Evaluation result', {scoreWithPlatformParameters, currentMessage});
            yield* call(success, scoreWithPlatformParameters, currentMessage, currentScoreToken);
        } else {
            // if (!answerToken) {
            //     const answer = yield getTaskAnswer();
            //     answerToken = window.task_token.getAnswerToken(stringify(answer));
            // }

            const answerObject = JSON.parse(answer);

            // Score is between 0 and 1
            const {score, message, scoreToken} = yield* call([taskGrader, taskGrader.gradeAnswer], {answer: answerObject});
            const scoreWithPlatformParameters = minScore + (maxScore - minScore) * score;

            yield* put(platformAnswerGraded({score, message}));
            log.getLogger('tests').debug('[Tests] Evaluation result', {scoreWithPlatformParameters, message});
            yield* call(success, scoreWithPlatformParameters, message, scoreToken);
        }
    } catch (ex: any) {
        const message = ex.message === 'Network request failed' ? getMessage('SUBMISSION_RESULTS_CRASHED_NETWORK')
            : (ex.message ? ex.message : ex.toString());
        yield* put(platformAnswerGraded({error: message}));
        console.error(ex);
        if (error) {
            yield* call(error, message);
        }
    }
}

function computeReconciledScore(levelScores: {level: TaskLevelName, score: number}[]) {
    let reconciledScore = 0;
    const topLevel = getTopLevel(levelScores.map(elm => elm.level));
    for (let {level, score} of levelScores) {
        let {scoreCoefficient} = levelScoringData[level];
        if (level === topLevel) {
            scoreCoefficient = 1;
        }
        let versionScore = score * scoreCoefficient;
        reconciledScore = Math.max(reconciledScore, versionScore);
    }

    return reconciledScore;
}

function getTopLevel(levels: TaskLevelName[]) {
    const sortedLevels = levels.sort((a, b) => {
        return levelScoringData[a].stars - levelScoringData[b].stars;
    });

    return sortedLevels[sortedLevels.length - 1];
}

export function getNextLevelIndex(levels: {[key: string]: TaskLevel}, currentLevel: TaskLevelName): number|null {
    const currentLevelIndex = taskLevelsList.indexOf(currentLevel);
    for (let level = currentLevelIndex + 1; level < taskLevelsList.length; level++) {
        if (taskLevelsList[level] in levels) {
            return level;
        }
    }

    return null;
}

export interface PlatformTaskGradingParameters {
    level?: TaskLevelName,
    answer?: TaskAnswer,
    scope?: SubmissionExecutionScope,
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
        yield* takeEvery(taskLoadEvent, taskLoadEventSaga);
        yield* takeEvery(taskGetMetadataEvent, taskGetMetaDataEventSaga);
        yield* takeEvery(taskUnloadEvent, taskUnloadEventSaga);
        yield* takeEvery(taskShowViewsEvent, taskShowViewsEventSaga);
        yield* takeEvery(taskGetViewsEvent, taskGetViewsEventSaga);
        yield* takeEvery(taskUpdateTokenEvent, taskUpdateTokenEventSaga);
        yield* takeEvery(taskGetHeightEvent, taskGetHeightEventSaga);
        yield* takeEvery(taskGetStateEvent, taskGetStateEventSaga);
        yield* takeEvery(taskReloadStateEvent, taskReloadStateEventSaga);
        yield* takeEvery(taskGetAnswerEvent, taskGetAnswerEventSaga);
        yield* takeEvery(taskGradeAnswerEvent, taskGradeAnswerEventSaga);
        yield* takeEvery(taskReloadAnswerEvent, taskReloadAnswerEventSaga);
        yield* takeEvery(taskGetResourcesPost, taskGetResourcesPostSaga);
        yield* takeEvery(platformTaskLink, linkTaskPlatformSaga);
    });
}
