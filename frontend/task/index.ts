import {
    checkCompilingCode,
    getDefaultSourceCode,
    getTaskPlatformMode,
    recordingProgressSteps,
    TaskPlatformMode
} from "./utils";
import {Bundle} from "../linker";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {all, call, cancel, cancelled, fork, put, take, takeEvery, takeLatest} from "typed-redux-saga";
import {delay} from "../player/sagas";
import {getRecorderState} from "../recorder/selectors";
import {AppStore} from "../store";
import QuickalgoLibsBundle, {
    QuickAlgoLibrariesActionType,
    quickAlgoLibraryResetAndReloadStateSaga
} from "./libs/quickalgo_libraries";
import SrlBundle, {statsGetStateSaga} from './srl';
import BehaviourBundle from './behaviour';
import stringify from 'json-stable-stringify-without-jsonify';
import taskSlice, {
    currentTaskChange,
    currentTaskChangePredefined,
    recordingEnabledChange,
    selectCurrentTestData,
    TaskActionTypes,
    taskAddInput,
    taskChangeSoundEnabled,
    taskCurrentLevelChange,
    taskInputEntered,
    taskInputNeeded,
    taskLoaded,
    taskResetDone,
    taskSetBlocksPanelCollapsed,
    taskSuccess,
    taskSuccessClear,
    taskUnload,
    taskUpdateState,
    updateCurrentTestId,
    updateTaskTests,
    updateTestContextState,
} from "./task_slice";
import {addAutoRecordingBehaviour} from "../recorder/record";
import {ReplayContext} from "../player/sagas";
import DocumentationBundle, {openDocumentationIfNecessary} from "./documentation/doc";
import BlocksBundle from "./blocks/blocks";
import PlatformBundle, {
    getTaskAnswerAggregated,
    platformApi,
    setPlatformBundleParameters, subscribePlatformHelper,
    taskGradeAnswerEventSaga
} from "./platform/platform";
import {ActionTypes as LayoutActionTypes} from "./layout/actionTypes";
import {ActionTypes as LangActionTypes} from "../lang/actionTypes";
import {ZOOM_LEVEL_HIGH} from "./layout/layout";
import {PlayerInstant} from "../player";
import {
    ActionTypes as StepperActionTypes,
    stepperClearError,
    stepperDisplayError,
    stepperExecutionEnd,
    stepperExecutionEndConditionReached,
    stepperExecutionError,
    stepperExecutionSuccess
} from "../stepper/actionTypes";
import {StepperState, StepperStatus, StepperStepMode} from "../stepper";
import {makeContext, QuickalgoLibraryCall, StepperContext} from "../stepper/api";
import {taskSubmissionExecutor} from "../submission/task_submission";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {platformAnswerGraded, platformAnswerLoaded, taskGradeAnswerEvent,} from "./platform/actionTypes";
import {
    getDefaultTaskLevel, platformChangeName,
    platformSaveAnswer,
    platformSetTaskLevels, platformTaskParamsUpdated, platformTaskRandomSeedUpdated,
    platformTokenUpdated, platformUnlockLevel,
    TaskLevelName,
    taskLevelsList
} from "./platform/platform_slice";
import {selectAnswer} from "./selectors";
import {loadBlocklyHelperSaga} from "../stepper/js";
import {isEmptyDocument} from "../buffers/document";
import {hintsLoaded} from "./hints/hints_slice";
import {ActionTypes as CommonActionTypes, ActionTypes} from "../common/actionTypes";
import log from 'loglevel';
import {convertServerTaskToCodecastFormat, getTaskFromId} from "../submission/task_platform";
import {
    submissionChangePaneOpen,
    submissionCloseCurrentSubmission,
    SubmissionExecutionScope,
} from "../submission/submission_slice";
import {appSelect} from '../hooks';
import {selectTaskTests} from '../submission/submission_selectors';
import {hasBlockPlatform} from '../stepper/platforms';
import {LibraryTestResult} from './libs/library_test_result';
import {QuickAlgoLibrary} from './libs/quickalgo_library';
import {getMessage, Languages} from '../lang';
import {isServerTask, TaskServer, TaskTest} from './task_types';
import {extractTestsFromTask} from '../submission/tests';
import {taskChangeLevel, taskLoad} from './task_actions';
import {App, Codecast} from '../app_types';
import {mainQuickAlgoLogger} from './libs/quick_algo_logger';
import {quickAlgoLibraries} from './libs/quick_algo_libraries_model';
import {TaskSubmissionResultPayload} from '../submission/submission_types';
import {LayoutMobileMode, LayoutType} from './layout/layout_types';
import {createQuickalgoLibrary} from './libs/quickalgo_library_factory';
import {isServerSubmission, selectCurrentServerSubmission, selectCurrentSubmission} from '../submission/submission';
import {
    bufferDissociateFromSubmission,
    bufferEdit,
    bufferEditPlain, bufferInit,
    bufferResetDocument, buffersInitialState
} from '../buffers/buffers_slice';
import {getTaskHintsSelector} from './instructions/instructions';
import {selectActiveBufferPlatform, selectSourceBuffers} from '../buffers/buffer_selectors';
import {callPlatformLog, callPlatformValidate, submissionCancel} from '../submission/submission_actions';
import {
    createSourceBufferFromBufferParameters,
    createSourceBufferFromDocument,
    denormalizeBufferFromAnswer
} from '../buffers';
import {RECORDING_FORMAT_VERSION} from '../version';
import {Screen} from '../common/screens';
import {DeferredPromise} from '../utils/app';
import {bufferChangePlatform} from '../buffers/buffer_actions';
import jwt from 'jsonwebtoken';
import {getAudioTimeStep} from './task_selectors';

// @ts-ignore
if (!String.prototype.format) {
    // @ts-ignore
    String.prototype.format = function() {
        let str = this.toString();
        if (!arguments.length) {
            return str;
        }

        let args = typeof arguments[0];
        args = (("string" == args || "number" == args) ? arguments : arguments[0]);

        for (let arg in args as any) {
            str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
        }

        return str;
    }
}

window.changeTaskLevel = (levelName: TaskLevelName) => {
    const mainStore = Codecast.environments['main'].store;
    mainStore.dispatch(taskChangeLevel(levelName));

    return false;
};

let oldSagasTasks = {};

function* taskLoadSaga(app: App, action) {
    const urlParameters = new URLSearchParams(window.location.search);
    const selectedTask = urlParameters.has('task') ? urlParameters.get('task') : null;

    let state = yield* appSelect();

    let extractTests = 0 === state.task.taskTests.length;
    if (!state.task.currentTask) {
        extractTests = true;
        if (urlParameters.has('taskId')) {
            let task: TaskServer | null = null;
            const taskId = urlParameters.get('taskId');
            try {
                task = yield* getTaskFromId(taskId);
            } catch (e) {
                console.error(e);
                yield* put({
                    type: ActionTypes.Error,
                    payload: {source: 'task-loader', error: `Impossible to fetch task id ${taskId}`}
                });
                return;
            }

            const convertedTask = convertServerTaskToCodecastFormat(task);
            yield* put(currentTaskChange(convertedTask));
            if (urlParameters.has('sPlatform')) {
                yield* put(platformChangeName(urlParameters.get('sPlatform')));
            }
            if (urlParameters.has('sToken')) {
                yield* put(platformTokenUpdated(urlParameters.get('sToken')));
            }
            if (convertedTask?.gridInfos?.hints?.length) {
                yield* put(hintsLoaded(convertedTask.gridInfos.hints));
            }
        } else if (state.options.task) {
            yield* put(currentTaskChange(state.options.task));
        } else if (selectedTask) {
            yield* put(currentTaskChangePredefined(selectedTask));
        }
    }

    const taskParams = yield* call(platformApi.getTaskParams, null, null);
    yield* put(platformTaskParamsUpdated(taskParams));

    if (taskParams.options.log) {
        yield* put({type: ActionTypes.LogAttemptsChanged, payload: {logAttempts: true}});
    }

    // yield* put(hintsLoaded([
    //     {content: 'aazazaz', minScore: 0},
    //     {content: 'aazazazazazazz', minScore: 0},
    // ]));

    // yield* put(hintsLoaded([
    //     {
    //         id: '1.a',
    //         content: 'As-tu réussi à placer la première bouée ?',
    //         question: true,
    //         yesHintId: '2.a',
    //         noHintId: '1.a.no',
    //     },
    //     {
    //         id: '1.a.no',
    //         content: 'Indice vidéo',
    //         nextHintId: '1.b',
    //     },
    //     {
    //         id: '1.b',
    //         content: 'Cette animation a-t-elle permis de te débloquer ?',
    //         question: true,
    //         immediate: true,
    //         yesHintId: '1.b.yes',
    //         noHintId: '1.b.no',
    //     },
    //     {
    //         id: '1.b.yes',
    //         content: 'Message de félicitations incitant à essayer de continuer.',
    //         disablePrevious: true,
    //         nextHintId: '2.a',
    //     },
    //     {
    //         id: '1.b.no',
    //         content: 'Message invitant à aller réviser sur la saison 1.',
    //         disableNext: true,
    //     },
    //     {
    //         id: '2.a',
    //         content: 'As-tu bien fait revenir le grappin ?',
    //         question: true,
    //         yesHintId: '5.a',
    //         noHintId: '2.a.no',
    //         previousHintId: '1.a',
    //     },
    //     {
    //         id: '2.a.no',
    //         content: 'Indice vidéo',
    //         nextHintId: '2.b',
    //     },
    //     {
    //         id: '2.b',
    //         content: 'Est-ce que ça t\'a débloqué ?',
    //         question: true,
    //         immediate: true,
    //         yesHintId: '2.b.yes',
    //         noHintId: '2.b.no',
    //     },
    //     {
    //         id: '2.b.yes',
    //         content: 'Message de félicitations incitant à essayer de continuer.',
    //         nextHintId: '5.a',
    //         disablePrevious: true,
    //     },
    //     {
    //         id: '2.b.no',
    //         content: 'Message invitant à aller réviser sur la saison 1.',
    //         disableNext: true,
    //     },
    //     {
    //         id: '5.a',
    //         content: 'Félicitations !',
    //         immediate: true,
    //         disableNext: true,
    //         previousHintId: '2.a',
    //     },
    // ]));

    const currentTask = yield* appSelect(state => state.task.currentTask);
    if (!isServerTask(currentTask) && 'main' === app.environment) {
        yield* fork(subscribePlatformHelper);
    }

    if (currentTask) {
        const language = yield* appSelect(state => state.options.language.split('-')[0]);
        if (
            currentTask?.strings?.length
            && -1 === currentTask.strings.map(string => string.language).indexOf(language)
            && Object.keys(Languages).find(lang => -1 !== currentTask.strings.map(string => string.language).indexOf(lang.split('-')[0]))
        ) {
            const newLanguage = Object.keys(Languages).find(lang => -1 !== currentTask.strings.map(string => string.language).indexOf(lang.split('-')[0]));
            yield* put({type: LangActionTypes.LanguageSet, payload: {language: newLanguage, withoutTaskReload: true}});
        }

        let currentLevel = yield* appSelect(state => state.task.currentLevel);

        const levels = {};
        if (currentTask.data && Object.keys(currentTask.data).length) {
            for (let [index, level] of Object.keys(currentTask.data).entries()) {
                if (state.options.levels?.length && -1 === state.options.levels.indexOf(level as TaskLevelName)) {
                    continue;
                }

                levels[level] = getDefaultTaskLevel(level as TaskLevelName);
                if (currentTask.gridInfos && currentTask.gridInfos.unlockedLevels && index >= currentTask.gridInfos.unlockedLevels) {
                    levels[level].locked = true;
                }
            }
        }

        yield* put(platformSetTaskLevels(levels));

        if (action.payload.level && action.payload.level in levels) {
            yield* put(taskCurrentLevelChange({level: action.payload.level, record: false}));
        } else if (Object.keys(levels).length && (null === currentLevel || !(currentLevel in levels))) {
            // Select default level
            let defaultLevel = null;
            if (state.options.defaultLevel && state.options.defaultLevel in levels) {
                defaultLevel = state.options.defaultLevel;
            } else if (currentTask.gridInfos?.defaultLevel && currentTask.gridInfos?.defaultLevel in levels) {
                defaultLevel = currentTask.gridInfos.defaultLevel;
            } else if ('easy' in levels) {
                defaultLevel = 'easy';
            } else {
                for (let level of taskLevelsList) {
                    if (level in levels) {
                        defaultLevel = level;
                        break;
                    }
                }
            }

            yield* put(taskCurrentLevelChange({level: defaultLevel, record: false}));
        }
    }

    const taskHints = yield* appSelect(getTaskHintsSelector);
    if (null !== taskHints) {
        log.getLogger('task').debug('load hints from HTML', taskHints);
        yield* put(hintsLoaded(taskHints));
    } else if (state.options.taskHints) {
        log.getLogger('task').debug('load hints from task options', state.options.taskHints);
        yield* put(hintsLoaded(state.options.taskHints));
    }

    const currentLevel = yield* appSelect(state => state.task.currentLevel);
    log.getLogger('task').debug('new current level', {currentLevel, currentTask});

    let tests: TaskTest[] = [];
    if (action.payload && action.payload.tests) {
        tests = action.payload.tests;
    } else if (currentTask) {
        if (extractTests) {
            const taskVariant = state.options.taskVariant;
            tests = extractTestsFromTask(currentTask, taskVariant);
        } else {
            tests = state.task.taskTests;
        }
    }
    log.getLogger('task').debug('[task.load] update task tests', {tests, extractTests});
    yield* put(updateTaskTests(tests));

    const testId = action.payload && action.payload.testId ? action.payload.testId : (tests.length ? 0 : null);
    log.getLogger('task').debug('[task.load] update current test id', testId, tests);
    yield* put(updateCurrentTestId({testId, record: false}));

    if (oldSagasTasks[app.environment]) {
        // Unload task first
        yield* cancel(oldSagasTasks[app.environment]);
        yield* put(taskUnload());
    }

    log.getLogger('task').debug('create new context');

    let context = quickAlgoLibraries.getContext(null, state.environment);
    if (!context || (action.payload && action.payload.reloadContext)) {
        const result = yield* call(createQuickalgoLibrary);
        if (false === result) {
            return;
        }
    }

    context = quickAlgoLibraries.getContext(null, state.environment);
    const tabsEnabled = context?.infos?.tabsEnabled;
    yield* put({type: ActionTypes.TabsEnabledChanged, payload: {tabsEnabled}});

    yield* call(openDocumentationIfNecessary);

    oldSagasTasks[app.environment] = yield* fork(function* () {
        try {
            const sagas = quickAlgoLibraries.getSagas(app, app.environment);
            sagas.push(handleLibrariesEventListenerSaga(app));
            yield* all(sagas);
        } finally {
            if (yield* cancelled()) {
                log.getLogger('task').debug('finished, do cancel');
                yield* call(cancelHandleLibrariesEventListenerSaga, app);
            }
        }
    });

    state = yield* appSelect();
    const sourceBuffers = selectSourceBuffers(state);
    if (0 === Object.keys(sourceBuffers).length || isEmptyDocument(selectAnswer(state)?.document)) {
        let newDocument = getDefaultSourceCode(state.options.platform, state.environment, state.task.currentTask);
        yield* call(createSourceBufferFromDocument, newDocument, state.options.platform);
    }

    yield* call(taskLevelLoadedSaga);

    yield* delay(0);
    log.getLogger('task').debug('task loaded', app.environment);
    yield* put(taskLoaded());
    if (action.payload.callback) {
        action.payload.callback();
    }
}

let replayContextSave;

function* handleLibrariesEventListenerSaga(app: App) {
    const stepperContext: StepperContext = makeContext(null, {
        interactAfter: (arg) => {
            return new Promise((resolve, reject) => {
                app.dispatch({
                    type: StepperActionTypes.StepperInteract,
                    payload: {stepperContext, arg},
                    meta: {resolve, reject}
                });
            });
        },
        environment: app.environment,
        dispatch: app.dispatch,
        quickAlgoContext: quickAlgoLibraries.getContext(null, app.environment),
    });

    const listeners = quickAlgoLibraries.getEventListeners();
    log.getLogger('task').debug('create task listeners on ', app.environment, listeners);
    for (let [eventName, {module, method}] of Object.entries(listeners)) {
        if ('main' === app.environment) {
            app.recordApi.on(eventName, function* (addEvent, {payload}) {
                yield* call(addEvent, eventName, payload);
            });
            app.replayApi.on(eventName, function* (replayContext: ReplayContext, event) {
                const payload = event[2];
                log.getLogger('task').debug('trigger method ', method, 'for event name ', eventName);
                replayContextSave = replayContext;
                yield* put({type: eventName, payload});
            });
        }

        // @ts-ignore
        yield* takeEvery(eventName, function* ({payload, onlyLog}) {
            log.getLogger('task').debug('Receive custom event', payload);
            const state = yield* appSelect();

            if (!onlyLog) {
                const args = payload ? payload : [];
                if (replayContextSave) {
                    stepperContext.quickAlgoCallsLogger = (call: QuickalgoLibraryCall, result) => {
                        replayContextSave.addQuickAlgoLibraryCall(call, result);
                    };
                }

                yield stepperContext.quickAlgoCallsExecutor(module, method, args, () => {
                    log.getLogger('task').debug('exec done, update task state');
                    const contextState = quickAlgoLibraries.getLibrariesInnerState(state.environment);
                    log.getLogger('task').debug('get new state', contextState);
                    app.dispatch(taskUpdateState(contextState));
                });
            }

            const context = quickAlgoLibraries.getContext(null, state.environment);
            yield* call([context, context.checkEventListeners]);
        });
    }
}

function* cancelHandleLibrariesEventListenerSaga(app: App) {
    log.getLogger('task').debug('cancel saga on ', app.environment);
    const listeners = quickAlgoLibraries.getEventListeners();
    for (let eventName of Object.keys(listeners)) {
        if ('main' === app.environment) {
            log.getLogger('task').debug('remove event', eventName);
            app.recordApi.off(eventName);
            app.replayApi.off(eventName);
        }
    }
}

function* taskRunExecution({type, payload}) {
    log.getLogger('task').debug('START RUN EXECUTION', type, payload);
    const {level, testId, tests, options, answer, resolve} = payload;

    log.getLogger('task').debug('Unload any previous context');
    quickAlgoLibraries.unloadContext('background');

    yield* put({type: AppActionTypes.AppInit, payload: {options: {...options}, environment: 'background'}});
    yield* put(platformAnswerLoaded(answer));
    yield* put(taskLoad({testId, level, tests, reloadContext: true}));
    yield* take(taskLoaded.type);

    taskSubmissionExecutor.setAfterExecutionCallback((result: TaskSubmissionResultPayload) => {
        log.getLogger('task').debug('END RUN EXECUTION', result);
        resolve(result);
    });

    yield* put({type: StepperActionTypes.StepperCompileAndStep, payload: {mode: StepperStepMode.Run}});
}

function* taskChangeLevelSaga({payload}: ReturnType<typeof taskChangeLevel>) {
    const state = yield* appSelect();
    const currentLevel = state.task.currentLevel;
    const newLevel = payload.level;
    log.getLogger('task').debug('level change', currentLevel, newLevel);

    yield* put({type: StepperActionTypes.StepperExit});

    const currentSubmissionId = yield* appSelect(state => state.submission.currentSubmissionId);
    if (null !== currentSubmissionId) {
        yield* put(submissionCloseCurrentSubmission({}));
    }
    yield* put(taskSuccessClear({record: false}));

    // Save old answer
    const oldAnswer = selectAnswer(state);
    yield* put(platformSaveAnswer({level: currentLevel, answer: oldAnswer}));

    // Grade old answer with updateScore = true and showResult = false
    const answer = stringify(yield* getTaskAnswerAggregated());
    yield* call(taskGradeAnswerEventSaga, taskGradeAnswerEvent(answer, null, () => {}, () => {}, true, false));
    log.getLogger('task').debug('grading finished');

    // Change level
    if (state.platform.levels[newLevel].locked) {
        yield* put(platformUnlockLevel(newLevel));
    }
    yield* put(taskCurrentLevelChange({level: newLevel}));

    yield* put({type: LayoutActionTypes.LayoutInstructionsIndexChanged, payload: {tabIndex: 0, pageIndex: 0}});

    const deferredPromise = new DeferredPromise();
    yield* put(updateCurrentTestId({testId: 0, record: false, recreateContext: true, callback: deferredPromise.resolve}));

    // Wait the creation of the new context before setting answer because getDefaultSourceCode depends on the context
    yield deferredPromise.promise;

    const currentTask = state.task.currentTask;
    // Reload answer
    let newLevelAnswer = yield* appSelect(state => state.platform.levels[newLevel].answer);
    log.getLogger('task').debug('new level answer', newLevelAnswer);
    if (!newLevelAnswer || isEmptyDocument(newLevelAnswer.document)) {
        newLevelAnswer = {
            version: RECORDING_FORMAT_VERSION,
            document: getDefaultSourceCode(state.options.platform, state.environment, currentTask),
            platform: state.options.platform,
        }
    }
    yield* put(platformAnswerLoaded(newLevelAnswer));

    yield* call(openDocumentationIfNecessary);

    yield* call(taskLevelLoadedSaga);
}

function* logLoadLevel() {
    yield* delay(1000);

    const logAttempts = yield* appSelect(state => state.options.logAttempts);
    const currentLevel = yield* appSelect(state => state.task.currentLevel);
    if (logAttempts) {
        const details = 'loadLevel;' + currentLevel;

        yield* put(callPlatformLog(['activity', details]));
    }
}

let currentLevelLoadLogTask = null;

function* taskLevelLoadedSaga() {
    const state = yield* appSelect();
    const levelGridInfos = state.task.levelGridInfos;
    const currentLevel = state.task.currentLevel;

    if (levelGridInfos?.logOption && 'main' === state.environment && window.SrlLogger) {
        window.SrlLogger.load();
        window.SrlLogger.levelLoaded(currentLevel);
    }

    if ('main' === state.environment && state.options.logAttempts) {
        if (currentLevelLoadLogTask) {
            yield* cancel(currentLevelLoadLogTask)
        }
        currentLevelLoadLogTask = yield* fork(logLoadLevel);
    }
}

function* taskUpdateCurrentTestIdSaga({payload}) {
    const state = yield* appSelect();
    const context = quickAlgoLibraries.getContext(null, state.environment);
    log.getLogger('task').debug('update current test', context);

    const taskTests = yield* appSelect(selectTaskTests);

    // Save context state for the test we have just left
    if (context && !payload.recreateContext && null !== state.task.previousTestId && state.task.currentTestId !== state.task.previousTestId) {
        const currentState = quickAlgoLibraries.getLibrariesInnerState(state.environment);
        const taskResetDone = state.task.resetDone;
        const allTaskTests = state.task.taskTests;
        const realTestIndex = allTaskTests.findIndex(test => taskTests[state.task.previousTestId].id === test.id);
        log.getLogger('tests').debug('update current test context state', {allTaskTests, previous: state.task.previousTestId, current: state.task.currentTestId, taskTests, previousTest: taskTests[state.task.previousTestId], realTestIndex});
        if (-1 !== realTestIndex) {
            yield* put(updateTestContextState({testIndex: realTestIndex, contextState: currentState, contextStateResetDone: taskResetDone}));
        }
    }

    // Stop current execution if there is one
    if (!payload.keepSubmission && ((state.stepper && state.stepper.status !== StepperStatus.Clear) || !state.task.resetDone)) {
        yield* put({type: StepperActionTypes.StepperExit, payload: {record: false}});
    }

    if (null === state.task.currentTestId) {
        return;
    }

    // Reload context state for the new test
    if (payload.recreateContext) {
        yield* call(createQuickalgoLibrary);
    } else if (context) {
        log.getLogger('task').debug('task update test', taskTests, state.task.currentTestId);
        if (!(state.task.currentTestId in taskTests)) {
            console.error("Test " + state.task.currentTestId + " does not exist on task ", state.task);
            throw "Couldn't update test during replay, check if the replay is using the appropriate task";
        }
        context.iTestCase = state.task.currentTestId;

        let newTaskResetDone = true;
        if (!payload.withoutContextState) {
            const {contextState, contextStateResetDone} = yield* call(getTestContextState);
            if (false === contextStateResetDone) {
                newTaskResetDone = false;
            }
            yield* call(quickAlgoLibraryResetAndReloadStateSaga, contextState);
            log.getLogger('task').debug('[taskUpdateCurrentTestIdSaga] reload current test', contextState);
            yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
        }

        if (newTaskResetDone !== state.task.resetDone) {
            yield* put(taskResetDone(newTaskResetDone));
        }
    }

    if (payload.callback) {
        yield* call(payload.callback);
    }
}

function* getTestContextState() {
    const state = yield* appSelect();
    const taskTests = selectTaskTests(state);
    const newTest = taskTests[state.task.currentTestId];
    let resetDone = newTest.contextStateResetDone;

    const submission = selectCurrentServerSubmission(state);
    if (null !== submission && isServerSubmission(submission) && submission.evaluated) {
        const testResult = submission.result.tests.find(test => test.testId === newTest.id);
        const context = quickAlgoLibraries.getContext(null, state.environment);
        if (undefined !== testResult && context.getContextStateFromTestResult) {
            const contextState = context.getContextStateFromTestResult(testResult, newTest);
            if (contextState) {
                return {contextState: {[quickAlgoLibraries.getMainContextName(state.environment)]: contextState}};
            }
        }
    }

    return {
        contextState: newTest.contextState,
        contextStateResetDone: resetDone,
    };
}

function* getTaskAnswer() {
    const state = yield* appSelect();

    return selectAnswer(state) ?? '';
}


function* getTaskState () {
    const statsState = yield* call(statsGetStateSaga);

    return {
        stats: statsState,
    };
}

function* getTaskLevel () {
    return yield* appSelect(state => state.task.currentLevel);
}

function* watchRecordingProgressSaga(app: App) {
    const state = yield* appSelect();
    if ('main' !== app.environment || TaskPlatformMode.RecordingProgress !== getTaskPlatformMode(state)) {
        return;
    }

    log.getLogger('task').debug('[recording.progress] watching');
    while (true) {
        const previousStep = yield* appSelect(state => getAudioTimeStep(state));
        yield* take(PlayerActionTypes.PlayerTick);
        const nextStep = yield* appSelect(state => getAudioTimeStep(state));
        const shouldUpdate = previousStep !== nextStep;
        if (shouldUpdate) {
            log.getLogger('task').debug('[recording.progress] update', previousStep, nextStep);
            yield* put(callPlatformValidate('done'));
        }
    }
}

export function* onEditSource(origin?: string) {
    const state = yield* appSelect();

    const needsReset = StepperStatus.Clear !== state.stepper.status || !state.task.resetDone || state.stepper.runningBackground;
    log.getLogger('task').debug('needs reset', needsReset);
    if (needsReset) {
        log.getLogger('task').debug('HANDLE RESET');
        yield* put({type: StepperActionTypes.StepperExit});
    }

    // Cancel server submission that are not Submit
    for (let [submissionIndex, submission] of state.submission.taskSubmissions.entries()) {
        if (isServerSubmission(submission) && !submission.result && !submission.crashed && SubmissionExecutionScope.Submit !== submission.scope) {
            yield* put(submissionCancel(submissionIndex));
        }
    }

    const currentError = state.stepper.error;
    if (null !== currentError) {
        yield* put(stepperClearError());
    }

    const activeBufferName = state.buffers.activeBufferName;
    if (null !== activeBufferName) {
        const activeBuffer = state.buffers.buffers[activeBufferName];
        if (null !== activeBuffer.submissionIndex) {
            yield* put(bufferDissociateFromSubmission({buffer: activeBufferName}));
            if (activeBuffer.submissionIndex === state.submission.currentSubmissionId) {
                yield* put(submissionCloseCurrentSubmission({}));
            }
        }
    }

    if ('test' !== origin) {
        const blocksPanelWasOpen = state.task.blocksPanelWasOpen;
        if (state.task.blocksPanelCollapsed === blocksPanelWasOpen) {
            yield* put(taskSetBlocksPanelCollapsed({collapsed: !blocksPanelWasOpen}));
        }
        if (false !== state.submission.submissionsPaneOpen) {
            yield* put(submissionChangePaneOpen(false));
        }
    }
}

export default function (bundle: Bundle) {
    bundle.include(DocumentationBundle);
    bundle.include(PlatformBundle);
    bundle.include(BlocksBundle);
    bundle.include(QuickalgoLibsBundle);
    bundle.include(SrlBundle);
    bundle.include(BehaviourBundle);

    setPlatformBundleParameters({
        getTaskAnswer,
        getTaskState,
        getTaskLevel,
        taskChangeLevel,
        taskGrader: taskSubmissionExecutor,
    });

    bundle.addSaga(watchRecordingProgressSaga);

    bundle.defineAction(TaskActionTypes.TaskRunExecution);
    bundle.addReducer(TaskActionTypes.TaskRunExecution, (state: AppStore) => {
        state.buffers = buffersInitialState;
    });

    bundle.addSaga(function* (app: App) {
        log.getLogger('task').debug('INIT TASK SAGAS');

        yield* takeEvery(TaskActionTypes.TaskLoad, taskLoadSaga, app);

        yield* takeEvery(recordingEnabledChange, function* ({payload}) {
            yield* put({type: LayoutActionTypes.LayoutZoomLevelChanged, payload: {zoomLevel: payload ? ZOOM_LEVEL_HIGH : 1}});

            if (!payload) {
                return;
            }

            const state = yield* appSelect();
            const recorderState = getRecorderState(state);
            if (!recorderState.status) {
                yield* put({type: RecorderActionTypes.RecorderPrepare});
            }
        });

        yield* takeEvery([bufferEdit, bufferEditPlain], function* ({payload}) {
            const {buffer} = payload;
            const bufferState = yield* appSelect(state => state.buffers.buffers[buffer]);
            if (bufferState.source) {
                yield* call(onEditSource);
            }
        });

        yield* takeEvery(taskSetBlocksPanelCollapsed, function* (action) {
            if (!action.payload.collapsed && action.payload.manual) {
                yield* call(onEditSource);
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.StepperExecutionSuccess, function* ({payload}) {
            const currentTestId = yield* appSelect(state => state.task.currentTestId);
            const testResult: LibraryTestResult = payload.testResult;
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: true,
                successRate: testResult.successRate,
                steps: Codecast.runner._steps,
                message: testResult.message,
            });
        });

        yield* takeEvery(StepperActionTypes.StepperExecutionEnd, function* () {
            const currentTestId = yield* appSelect(state => state.task.currentTestId);
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: true,
                successRate: 1,
                noGrading: true,
            });
        });

        // @ts-ignore
        yield* takeEvery([StepperActionTypes.StepperExecutionError, StepperActionTypes.CompileFailed], function* ({payload}) {
            const currentTestId = yield* appSelect(state => state.task.currentTestId);
            const testResult: LibraryTestResult = payload.testResult;
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: false,
                successRate: testResult.successRate,
                steps: Codecast.runner?._steps,
                message: testResult.message,
                testResult,
            });
        });

        yield* takeEvery(stepperExecutionEndConditionReached, function* ({payload: {executionResult}}) {
            const context = quickAlgoLibraries.getContext(null, app.environment);
            // checkEndCondition can throw the message or an object with more details
            const message: string = executionResult instanceof LibraryTestResult ? executionResult.getMessage() : String(executionResult);

            const computeGrade = context.infos.computeGrade ? context.infos.computeGrade : (context: QuickAlgoLibrary, message: string) => {
                let rate = 0;
                if (context.success) {
                    rate = 1;
                }

                return {
                    successRate: rate,
                    message: message
                };
            };

            const gradeResult: {successRate: number, message: string} = computeGrade(context, message);
            const aggregatedLibraryTestResult = executionResult instanceof LibraryTestResult
                ? executionResult : LibraryTestResult.fromString(message);
            aggregatedLibraryTestResult.successRate = gradeResult.successRate;
            aggregatedLibraryTestResult.message = gradeResult.message;

            if (context.doNotStartGrade) {
                yield* put(stepperExecutionEnd());
            } else {
                // Do a post-compilation if is has not been done entirely before starting the execution
                const state = yield* appSelect();

                if (context.success) {
                    if (state.options.allowExecutionOverBlocksLimit) {
                        const answer = selectAnswer(state);
                        try {
                            checkCompilingCode(answer, state);
                        } catch (e) {
                            log.getLogger('task').debug('Post compilation error', e);
                            aggregatedLibraryTestResult.message = `${aggregatedLibraryTestResult.message} ${getMessage('TASK_POST_COMPILATION_ERROR').s} ${e.toString()}`;
                            yield* put(stepperExecutionError(aggregatedLibraryTestResult));
                            return;
                        }
                    }

                    yield* put(stepperExecutionSuccess(aggregatedLibraryTestResult));
                } else {
                    yield* put(stepperExecutionError(aggregatedLibraryTestResult));
                }
            }
        });

        yield* takeEvery(StepperActionTypes.StepperExit, function* () {
            const state = yield* appSelect();
            if ('main' === state.environment) {
                mainQuickAlgoLogger.clearQuickAlgoLibraryCalls();
            }
            if (Codecast.runner) {
                Codecast.runner.stop();
            }
            window.Blockly?.DropDownDiv?.hideWithoutAnimation();
            yield* call(quickAlgoLibraryResetAndReloadStateSaga);
            log.getLogger('task').debug('put task reset done to true');
            yield* put(taskResetDone(true));
        });

        // Store inputs to be replayed in the next method
        yield* takeEvery(taskInputEntered, function* ({payload}) {
            log.getLogger('task').debug('add new input into store', payload);
            const state = yield* appSelect();
            if (!state.stepper.synchronizingAnalysis) {
                yield* put(taskAddInput(payload.input));
            }
        });

        // Replay inputs when needed from stepperRunFromBeginningIfNecessary
        yield* takeEvery(taskInputNeeded, function* ({payload}) {
            log.getLogger('task').debug('task input needed', payload);
            if (payload) {
                const state = yield* appSelect();
                log.getLogger('task').debug('sync', state.stepper.synchronizingAnalysis, 'inputs', state.task.inputs);
                if (state.stepper.synchronizingAnalysis && state.task.inputs.length) {
                    const nextInput = state.task.inputs[0];
                    log.getLogger('task').debug('next input', nextInput);
                    yield* put(taskInputEntered({input: nextInput, clearInput: true}));
                }
            }
        });

        yield* takeEvery(taskChangeLevel, taskChangeLevelSaga);

        // @ts-ignore
        yield* takeEvery(updateCurrentTestId, taskUpdateCurrentTestIdSaga);

        yield* takeLatest(TaskActionTypes.TaskRunExecution, taskRunExecution);

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.CompileWait, function*({payload}) {
            log.getLogger('task').debug('stepper restart, create new submission');
            if (!payload.keepSubmission) {
                yield* put(submissionCloseCurrentSubmission({fromSubmission: true}));
            }
        });

        yield* takeEvery(platformAnswerGraded, function*({payload: {score, message, error}}) {
            if (score >= 1) {
                yield* put(taskSuccess(message));
            } else if (error) {
                yield* put(stepperDisplayError(error));
            } else if (score > 0) {
                yield* put(stepperDisplayError(`${message} (${Math.round(score * 100)}%)`));
            } else if (message) {
                yield* put(stepperDisplayError(message));
            }
        });

        yield* takeEvery(platformAnswerLoaded, function*({payload: {answer}}) {
            log.getLogger('task').debug('Platform answer loaded', answer);
            const state = yield* appSelect();
            const currentBuffer = state.buffers.activeBufferName;
            const bufferParameters = yield* call(denormalizeBufferFromAnswer, answer);
            if (state.options.tabsEnabled || !state.buffers.activeBufferName) {
                yield* call(createSourceBufferFromBufferParameters, bufferParameters);
            } else if (null !== currentBuffer) {
                if (state.buffers.buffers[currentBuffer].platform !== answer.platform) {
                    yield* put(bufferChangePlatform(currentBuffer, answer.platform, answer.document));
                } else {
                    yield* put(bufferInit({buffer: currentBuffer, ...bufferParameters}));
                    yield* put(bufferResetDocument({buffer: currentBuffer, document: answer.document, goToEnd: true}));
                }
            }
        });

        yield* takeEvery(platformTokenUpdated, function*() {
            const newToken = yield* appSelect(state => state.platform.taskToken);
            if (newToken) {
                const payload = jwt.decode(newToken);
                if (payload && null !== payload.randomSeed && undefined !== payload.randomSeed) {
                    const randomSeed = String(payload.randomSeed);
                    yield* put(platformTaskRandomSeedUpdated(randomSeed));
                }
            }
        });

        yield* takeEvery(taskChangeSoundEnabled, function* () {
            const context = quickAlgoLibraries.getContext(null, 'main');
            const state = yield* appSelect();
            if (context && context.changeSoundEnabled) {
                context.changeSoundEnabled(state.task.soundEnabled);
            }
        });

        yield* takeEvery(ActionTypes.WindowResized, function* () {
            const context = quickAlgoLibraries.getContext(null, 'main');
            const state = yield* appSelect();
            if (hasBlockPlatform(selectActiveBufferPlatform(state)) && state.task.currentTask) {
                yield* call(loadBlocklyHelperSaga, context);
            }
        });

        yield* takeEvery([ActionTypes.WindowResized, LayoutActionTypes.LayoutMobileModeChanged], function* () {
            const state = yield* appSelect();
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (!context) {
                return;
            }

            if (LayoutType.MobileHorizontal === state.layout.type || LayoutType.MobileVertical === state.layout.type) {
                if (LayoutMobileMode.Editor === state.layout.mobileMode) {
                    // Use context.display = false when ContextVisualization is not displayed to avoid errors when
                    // using context.reset or context.updateScale
                    context.display = false;
                    yield* put({type: StepperActionTypes.StepperExit});
                } else {
                    context.display = true;
                }
            } else {
                context.display = true;
            }
        });
    });

    bundle.defer(function (app: App) {
        app.recordApi.onStart(function* (init) {
            const state = yield* appSelect();
            init.testId = state.task.currentTestId;
            init.contextState = quickAlgoLibraries.getLibrariesInnerState(state.environment);
        });

        app.replayApi.on('start', function*(replayContext: ReplayContext, event) {
            const {testId, contextState} = event[2];
            if (null !== testId && undefined !== testId) {
                yield* put(updateCurrentTestId({testId, withoutContextState: !!contextState}));
            }
            if (contextState) {
                yield* call(quickAlgoLibraryResetAndReloadStateSaga, contextState);
            }
        });

        // Quick mode means continuous play. In this case we can just call every library method
        // without reloading state or display in between
        app.replayApi.onReset(function* (instant: PlayerInstant, quick) {
            if (instant.state.platform) {
                yield* put({
                    type: PlayerActionTypes.PlayerReset,
                    payload: {
                        sliceName: 'platform',
                        partial: true,
                        state: {
                            levels: instant.state.platform.levels,
                        },
                    },
                });
            }

            const taskData = instant.state.task;
            let hasChangedLevel = false;
            let hasChangedTest = false;
            if (taskData) {
                const currentLevel = yield* appSelect(state => state.task.currentLevel);
                const currentTestId = yield* appSelect(state => state.task.currentTestId);
                hasChangedLevel = taskData.currentLevel !== currentLevel;
                hasChangedTest = taskData.currentTestId !== currentTestId;

                yield* put({
                    type: PlayerActionTypes.PlayerReset,
                    payload: {
                        sliceName: 'task',
                        partial: true,
                        state: {
                            currentLevel: taskData.currentLevel,
                            currentTestId: taskData.currentTestId,
                            taskTests: taskData.taskTests,
                            state: taskData.state,
                            resetDone: taskData.resetDone,
                            inputs: taskData.inputs,
                            inputNeeded: taskData.inputNeeded,
                        },
                    },
                });

                if (hasChangedLevel) {
                    yield* call(createQuickalgoLibrary);
                }

                if (taskData.success) {
                    yield* put(taskSuccess(taskData.successMessage));
                } else {
                    yield* put(taskSuccessClear({}));
                }
            }

            log.getLogger('replay').debug('TASK REPLAY API RESET', instant.event, taskData);

            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context && (!quick || (instant.event && -1 !== ['compile.success'].indexOf(instant.event[1])) || hasChangedLevel || hasChangedTest)) {
                yield* call(quickAlgoLibraryResetAndReloadStateSaga, taskData && taskData.state ? taskData.state : null);
                log.getLogger('replay').debug('DO RESET DISPLAY');
                yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
            }
        });

        if ('main' === app.environment) {
            addAutoRecordingBehaviour(app, {
                sliceName: taskSlice.name,
                actions: [
                    taskSuccess,
                    taskSuccessClear,
                    taskInputNeeded,
                    updateCurrentTestId,
                    taskSetBlocksPanelCollapsed,
                    taskChangeSoundEnabled,
                ],
                onResetDisabled: true,
            });
        }

        app.recordApi.on(taskChangeLevel.type, function* (addEvent, {payload}) {
            yield* call(addEvent, taskChangeLevel.type, payload.level);
        });
        app.replayApi.on(taskChangeLevel.type, function* (replayContext: ReplayContext, event) {
            yield* put(taskChangeLevel(event[2]));
        });

        app.stepperApi.onInit(function* () {
            log.getLogger('task').debug('stepper init');
            const environment = yield* appSelect(state => state.environment);
            for (let library of Object.values(quickAlgoLibraries.getAllLibrariesByName(environment))) {
                library.onStepperInit();
            }
            yield* call(quickAlgoLibraryResetAndReloadStateSaga);
            yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
        });
    });
}
