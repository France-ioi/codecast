import {
    getCurrentImmerState,
    getDefaultSourceCode,
    getTaskPlatformMode,
    recordingProgressSteps,
    TaskPlatformMode
} from "./utils";
import {Bundle} from "../linker";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {all, call, cancel, cancelled, delay, fork, put, select, take, takeEvery, takeLatest} from "typed-redux-saga";
import {getRecorderState} from "../recorder/selectors";
import {App, Codecast} from "../index";
import {AppStore} from "../store";
import QuickalgoLibsBundle, {
    createQuickalgoLibrary,
    mainQuickAlgoLogger,
    quickAlgoLibraries,
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
    selectCurrentTestData, TaskActionTypes,
    taskAddInput,
    taskChangeSoundEnabled,
    taskCurrentLevelChange,
    taskInputEntered,
    taskInputNeeded,
    taskLoaded,
    taskRecordableActions,
    taskResetDone,
    taskSuccess,
    taskSuccessClear, TaskTest,
    taskUpdateState,
    updateCurrentTestId,
    updateTaskTests,
    updateTestContextState,
} from "./task_slice";
import {addAutoRecordingBehaviour} from "../recorder/record";
import {ReplayContext} from "../player/sagas";
import DocumentationBundle from "./documentation/doc";
import BlocksBundle from "./blocks/blocks";
import PlatformBundle, {
    getTaskAnswerAggregated,
    platformApi,
    setPlatformBundleParameters,
    taskGradeAnswerEventSaga
} from "./platform/platform";
import {ActionTypes as LayoutActionTypes} from "./layout/actionTypes";
import {LayoutMobileMode, LayoutType, ZOOM_LEVEL_HIGH} from "./layout/layout";
import {PlayerInstant} from "../player";
import {ActionTypes as StepperActionTypes, stepperClearError, stepperDisplayError} from "../stepper/actionTypes";
import {ActionTypes as BufferActionTypes} from "../buffers/actionTypes";
import {clearSourceHighlightSaga, StepperState, StepperStatus, StepperStepMode} from "../stepper";
import { makeContext, StepperContext} from "../stepper/api";
import {taskSubmissionExecutor} from "../submission/task_submission";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {platformAnswerGraded, platformAnswerLoaded, taskGradeAnswerEvent,} from "./platform/actionTypes";
import {BlockDocumentModel, DocumentModel, documentModelFromString} from "../buffers";
import {
    getDefaultTaskLevel,
    platformSaveAnswer,
    platformSetTaskLevels,
    platformTokenUpdated,
    TaskLevelName,
    taskLevelsList
} from "./platform/platform_slice";
import {getTaskTokenForLevel} from "./platform/task_token";
import {createAction} from "@reduxjs/toolkit";
import {selectAnswer} from "./selectors";
import {hasBlockPlatform, loadBlocklyHelperSaga} from "../stepper/js";
import {ObjectDocument} from "../buffers/document";
import {hintsLoaded} from "./hints/hints_slice";
import {ActionTypes as CommonActionTypes, ActionTypes} from "../common/actionTypes";
import log from 'loglevel';
import {convertServerTaskToCodecastFormat, getTaskFromId, TaskServer} from "../submission/task_platform";
import {
    submissionChangeCurrentSubmissionId,
    submissionChangeExecutionMode,
    submissionChangePlatformName,
} from "../submission/submission_slice";
import {appSelect} from '../hooks';
import {extractTestsFromTask} from '../submission/tests';
import {TaskSubmissionResultPayload} from "../submission/submission";
import {CodecastPlatform, platformsList} from '../stepper/platforms';

export const taskLoad = ({testId, level, tests, reloadContext, selectedTask}: {
    testId?: number,
    level?: TaskLevelName,
    tests?: any[],
    reloadContext?: boolean,
    selectedTask?: string,
} = {}) => ({
    type: TaskActionTypes.TaskLoad,
    payload: {
        testId,
        level,
        tests,
        reloadContext,
        selectedTask,
    },
});

export const taskUnload = () => ({
    type: TaskActionTypes.TaskUnload,
});

export const taskChangeLevel = createAction('task/changeLevel', (level: TaskLevelName) => ({
    payload: {
        level,
    },
}));

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

    if (urlParameters.has('taskId')) {
        let task: TaskServer|null = null;
        const taskId = urlParameters.get('taskId');
        try {
            task = yield* getTaskFromId(taskId);
        } catch (e) {
            console.error(e);
            yield* put({type: ActionTypes.Error, payload: {source: 'task-loader', error: `Impossible to fetch task id ${taskId}`}});
        }

        const convertedTask = convertServerTaskToCodecastFormat(task);
        yield* put(currentTaskChange(convertedTask));
        if (urlParameters.has('sPlatform')) {
            yield* put(submissionChangePlatformName(urlParameters.get('sPlatform')));
        }
        if (convertedTask.hints && convertedTask.hints.length) {
            yield* put(hintsLoaded(convertedTask.hints));
        }
    } else if (state.options.task) {
        yield* put(currentTaskChange(state.options.task));
    } else if (selectedTask) {
        yield* put(currentTaskChangePredefined(selectedTask));
    }

    // yield* put(hintsLoaded([
    //     {content: 'aazazaz'},
    //     {content: 'aazazazazazazz'},
    // ]));

    if (state.options.taskHints) {
        log.getLogger('task').debug('load hints', state.options.taskHints);
        yield* put(hintsLoaded(state.options.taskHints));
    }

    const currentTask = yield* appSelect(state => state.task.currentTask);
    const platform = yield* appSelect(state => state.options.platform);
    if (currentTask) {
        if (currentTask.supportedLanguages && currentTask.supportedLanguages.length && -1 === currentTask.supportedLanguages.indexOf(platform)) {
            const availablePlatforms = Object.keys(platformsList).filter(platform => -1 !== currentTask.supportedLanguages.indexOf(platform));
            if (availablePlatforms.length) {
                yield* put({type: CommonActionTypes.PlatformChanged, payload: {platform: availablePlatforms[0], reloadTask: false}});
            }
        }

        let currentLevel = yield* appSelect(state => state.task.currentLevel);

        if (action.payload.level && action.payload.level in currentTask.data) {
            yield* put(taskCurrentLevelChange({level: action.payload.level, record: false}));
        } else if (currentTask.data && (null === currentLevel || !(currentLevel in currentTask.data))) {
            // Select default level
            for (let level of taskLevelsList) {
                if (level in currentTask.data) {
                    yield* put(taskCurrentLevelChange({level, record: false}));
                    break;
                }
            }
        }
        currentLevel = yield* appSelect(state => state.task.currentLevel);
        log.getLogger('task').debug('new current level', currentLevel);

        let tests: TaskTest[];
        if (action.payload && action.payload.tests) {
            tests = action.payload.tests;
        } else {
            tests = extractTestsFromTask(currentTask, currentLevel);
        }
        log.getLogger('task').debug('[task.load] update task tests', tests);
        yield* put(updateTaskTests(tests));

        const testId = action.payload && action.payload.testId ? action.payload.testId : (tests.length ? 0 : null);
        log.getLogger('task').debug('[task.load] update current test id', testId);
        yield* put(updateCurrentTestId({testId, record: false}));

        const taskLevels = yield* appSelect(state => state.platform.levels);
        if (0 === Object.keys(taskLevels).length) {
            const levels = {};
            if (currentTask.data && Object.keys(currentTask.data).length) {
                for (let [index, level] of Object.keys(currentTask.data).entries()) {
                    if (state.options.level && state.options.level !== level) {
                        continue;
                    }

                    levels[level] = getDefaultTaskLevel(level as TaskLevelName);
                    if (currentTask.gridInfos && currentTask.gridInfos.unlockedLevels && index >= currentTask.gridInfos.unlockedLevels) {
                        levels[level].locked = true;
                    }
                }
            }

            yield* put(platformSetTaskLevels(levels));
        }

        log.getLogger('task').debug({testId, tests});
    }

    if (oldSagasTasks[app.environment]) {
        // Unload task first
        yield* cancel(oldSagasTasks[app.environment]);
        yield* put(taskUnload());
    }

    log.getLogger('task').debug('create new context');

    let context = quickAlgoLibraries.getContext(null, state.environment);
    if (!context || (action.payload && action.payload.reloadContext)) {
        yield* call(createQuickalgoLibrary);
    }

    oldSagasTasks[app.environment] = yield* fork(function* () {
        try {
            const sagas = quickAlgoLibraries.getSagas(app);
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
    const source = selectAnswer(state);
    if ((!source || (typeof source === 'string' && !source.length)) && currentTask) {
        const defaultSourceCode = getDefaultSourceCode(state.options.platform, state.environment, currentTask);
        if (null !== defaultSourceCode) {
            log.getLogger('task').debug('Load default source code', defaultSourceCode);
            const platform = yield* appSelect(state => state.options.platform);
            yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: getModelFromAnswer(defaultSourceCode, platform), goToEnd: true});
        }
    }

    yield* call(taskLevelLoadedSaga);

    log.getLogger('task').debug('task loaded', app.environment);
    yield* put(taskLoaded());
}

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
                yield* put({type: eventName, payload});
            });
        }

        // @ts-ignore
        yield* takeEvery(eventName, function* ({payload}) {
            log.getLogger('task').debug('make payload', payload);
            const args = payload ? payload : [];
            const state = yield* appSelect();
            yield stepperContext.quickAlgoCallsExecutor(module, method, args, () => {
                log.getLogger('task').debug('exec done, update task state');
                const context = quickAlgoLibraries.getContext(null, state.environment);
                if (context) {
                    const contextState = getCurrentImmerState(context.getInnerState());
                    log.getLogger('task').debug('get new state', contextState);
                    app.dispatch(taskUpdateState(contextState));
                }
            });
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

function* taskRunExecution(app: App, {type, payload}) {
    log.getLogger('task').debug('START RUN EXECUTION', type, payload);
    const {level, testId, tests, options, answer, resolve} = payload;

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
        yield* put(submissionChangeCurrentSubmissionId(null));
    }
    yield* put(taskSuccessClear({record: false}));

    // Save old answer
    const oldAnswer = selectAnswer(state);
    yield* put(platformSaveAnswer({level: currentLevel, answer: oldAnswer}));

    // Grade old answer
    const answer = stringify(yield* getTaskAnswerAggregated());
    yield* call(taskGradeAnswerEventSaga, taskGradeAnswerEvent(answer, null, () => {}, () => {}, true));
    log.getLogger('task').debug('grading finished');

    // Change level
    yield* put(taskCurrentLevelChange({level: newLevel}));

    const randomSeed = yield* appSelect(state => state.platform.taskRandomSeed);
    const taskToken = getTaskTokenForLevel(newLevel, randomSeed);
    yield* put(platformTokenUpdated(taskToken));

    const currentTask = state.task.currentTask;
    // Reload answer
    let newLevelAnswer = yield* appSelect(state => state.platform.levels[newLevel].answer);
    log.getLogger('task').debug('new level answer', newLevelAnswer);
    if (!newLevelAnswer || (typeof newLevelAnswer === 'string' && !newLevelAnswer.length)) {
        newLevelAnswer = getDefaultSourceCode(state.options.platform, state.environment, currentTask);
    }
    yield* put(platformAnswerLoaded(newLevelAnswer));

    const tests = extractTestsFromTask(currentTask, newLevel);
    log.getLogger('task').debug('[task.currentLevelChange] update task tests', tests);
    yield* put(updateTaskTests(tests));

    yield* put(updateCurrentTestId({testId: 0, record: false, recreateContext: true}));

    yield* call(taskLevelLoadedSaga);
}

function* taskLevelLoadedSaga() {
    const state = yield* appSelect();
    const currentTask = state.task.currentTask;
    const currentLevel = state.task.currentLevel;

    if (currentTask && currentTask.gridInfos.logOption && 'main' === state.environment && window.SrlLogger) {
        window.SrlLogger.load();
        window.SrlLogger.levelLoaded(currentLevel);
    }
}

function* taskUpdateCurrentTestIdSaga(app: App, {payload}) {
    const state = yield* appSelect();
    const context = quickAlgoLibraries.getContext(null, state.environment);
    log.getLogger('task').debug('update current test', context);

    // Save context state for the test we have just left
    if (context && !payload.recreateContext && null !== state.task.previousTestId) {
        const currentState = getCurrentImmerState(context.getInnerState());
        yield* put(updateTestContextState({testId: state.task.previousTestId, contextState: currentState}));
    }

    // Stop current execution if there is one
    if (state.stepper && state.stepper.status !== StepperStatus.Clear) {
        yield* put({type: StepperActionTypes.StepperExit, payload: {record: false}});
    }

    // Reload context state for the new test
    if (payload.recreateContext) {
        yield* call(createQuickalgoLibrary);
    } else if (context) {
        log.getLogger('task').debug('task update test', state.task.taskTests, state.task.currentTestId);
        if (!(state.task.currentTestId in state.task.taskTests)) {
            console.error("Test " + state.task.currentTestId + " does not exist on task ", state.task);
            throw "Couldn't update test during replay, check if the replay is using the appropriate task";
        }
        context.iTestCase = state.task.currentTestId;
        const contextState = state.task.taskTests[state.task.currentTestId].contextState;
        if (null !== contextState) {
            const currentTest = selectCurrentTestData(state);
            log.getLogger('task').debug('[taskUpdateCurrentTestIdSaga] reload current test', currentTest, contextState);
            context.resetAndReloadState(currentTest, state, contextState);
        } else {
            const currentTest = selectCurrentTestData(state);
            log.getLogger('task').debug('[taskUpdateCurrentTestIdSaga] reload current test without state', currentTest);
            context.resetAndReloadState(currentTest, state);
        }

        yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
    }
}

function* getTaskAnswer () {
    const state = yield* appSelect();
    const taskPlatformMode = getTaskPlatformMode(state);

    if (TaskPlatformMode.RecordingProgress === taskPlatformMode) {
        return getAudioTimeStep(state);
    }

    if (TaskPlatformMode.Source === taskPlatformMode) {
        return selectAnswer(state) ?? '';
    }

    return null;
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

function getAudioTimeStep(state: AppStore) {
    if (state.player && state.player.duration) {
        return Math.ceil(recordingProgressSteps * state.player.audioTime / state.player.duration);
    }

    return null;
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
            yield* call([platformApi, platformApi.validate], 'done');
        }
    }
}

function getModelFromAnswer(answer: any, platform: CodecastPlatform) {
    if (null === answer) {
        return hasBlockPlatform(platform) ? new BlockDocumentModel() : new DocumentModel();
    }

    log.getLogger('task').debug('get model from answer', answer);
    if (typeof answer === 'object' && answer.blockly) {
        return new BlockDocumentModel(new ObjectDocument(answer));
    }

    return documentModelFromString(answer);
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

    bundle.addSaga(function* (app: App) {
        log.getLogger('task').debug('INIT TASK SAGAS');

        yield* takeEvery(TaskActionTypes.TaskLoad, taskLoadSaga, app);

        // @ts-ignore
        yield* takeEvery(recordingEnabledChange.type, function* ({payload}) {
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

        yield* takeEvery([BufferActionTypes.BufferEdit, BufferActionTypes.BufferEditPlain], function* (action) {
            // @ts-ignore
            const {buffer} = action;
            if (buffer === 'source') {
                const needsReset = yield* appSelect(state => StepperStatus.Clear !== state.stepper.status || !state.task.resetDone || state.stepper.runningBackground);
                log.getLogger('task').debug('needs reset', needsReset);
                if (needsReset) {
                    log.getLogger('task').debug('HANDLE RESET');
                    yield* put({type: StepperActionTypes.StepperExit});
                }

                const currentSubmissionId = yield* appSelect(state => state.submission.currentSubmissionId);
                if (null !== currentSubmissionId) {
                    yield* put(submissionChangeCurrentSubmissionId(null));
                }

                const currentError = yield* appSelect(state => state.stepper.error);
                if (null !== currentError) {
                    yield* put(stepperClearError());
                }
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.StepperExecutionSuccess, function* ({payload}) {
            const currentTestId = yield* appSelect(state => state.task.currentTestId);
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: true,
                steps: Codecast.runner._steps,
                message: payload.message,
            });
        });

        // @ts-ignore
        yield* takeEvery([StepperActionTypes.StepperExecutionError, StepperActionTypes.CompileFailed], function* ({payload}) {
            const currentTestId = yield* appSelect(state => state.task.currentTestId);
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: false,
                steps: Codecast.runner._steps,
                message: payload.error,
            });
        });

        yield* takeEvery(StepperActionTypes.StepperExit, function* () {
            const state = yield* appSelect();
            if ('main' === state.environment) {
                mainQuickAlgoLogger.clearQuickAlgoLibraryCalls();
            }
            if (Codecast.runner) {
                Codecast.runner.stop();
            }
            yield* call(clearSourceHighlightSaga);
            yield* call(quickAlgoLibraryResetAndReloadStateSaga, app);
            log.getLogger('task').debug('put task reset done to true');
            yield* put(taskResetDone(true));
        });

        // Store inputs to be replayed in the next method
        // @ts-ignore
        yield* takeEvery(taskInputEntered.type, function* ({payload}) {
            log.getLogger('task').debug('add new input into store', payload);
            const state = yield* appSelect();
            if (!state.stepper.synchronizingAnalysis) {
                yield* put(taskAddInput(payload.input));
            }
        });

        // Replay inputs when needed from stepperRunFromBeginningIfNecessary
        // @ts-ignore
        yield* takeEvery(taskInputNeeded.type, function* ({payload}) {
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

        yield* takeEvery(taskChangeLevel.type, taskChangeLevelSaga);

        // @ts-ignore
        yield* takeEvery(updateCurrentTestId.type, taskUpdateCurrentTestIdSaga, app);

        yield* takeLatest(TaskActionTypes.TaskRunExecution, taskRunExecution, app);

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.Compile, function*({payload}) {
            log.getLogger('task').debug('stepper restart, create new submission');
            if (!payload.keepSubmission) {
                yield* put(submissionChangeCurrentSubmissionId(null));
            }
        });

        yield* takeEvery(platformAnswerGraded.type, function*({payload: {score, message, error, maxScore}}: ReturnType<typeof platformAnswerGraded>) {
            if (score >= maxScore) {
                yield* put(taskSuccess(message));
            } else if (error) {
                yield* put(stepperDisplayError(error));
            }
        });

        yield* takeEvery(platformAnswerLoaded.type, function*({payload: {answer}}: ReturnType<typeof platformAnswerLoaded>) {
            log.getLogger('task').debug('Platform answer loaded', answer);
            const platform = yield* appSelect(state => state.options.platform);
            yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: getModelFromAnswer(answer, platform), goToEnd: true});
        });

        yield* takeEvery(taskChangeSoundEnabled.type, function* () {
            const context = quickAlgoLibraries.getContext(null, 'main');
            const state = yield* appSelect();
            if (context && context.changeSoundEnabled) {
                context.changeSoundEnabled(state.task.soundEnabled);
            }
        });

        yield* takeEvery(ActionTypes.WindowResized, function* () {
            const context = quickAlgoLibraries.getContext(null, 'main');
            const state = yield* appSelect();
            if (hasBlockPlatform(state.options.platform) && state.task.currentTask) {
                yield* call(loadBlocklyHelperSaga, context, state.task.currentLevel);
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
        });

        app.replayApi.on('start', function*(replayContext: ReplayContext, event) {
            const {testId} = event[2];
            if (null !== testId && undefined !== testId) {
                yield* put(updateCurrentTestId({testId}));
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
                yield* call(quickAlgoLibraryResetAndReloadStateSaga, app, taskData && taskData.state ? taskData.state : null);
                log.getLogger('replay').debug('DO RESET DISPLAY');
                yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
            }
        });

        addAutoRecordingBehaviour(app, {
            sliceName: taskSlice.name,
            actionNames: taskRecordableActions,
            actions: taskSlice.actions,
            onResetDisabled: true,
        });

        app.recordApi.on(taskChangeLevel.type, function* (addEvent, {payload}) {
            yield* call(addEvent, taskChangeLevel.type, payload.level);
        });
        app.replayApi.on(taskChangeLevel.type, function* (replayContext: ReplayContext, event) {
            yield* put(taskChangeLevel(event[2]));
            replayContext.addSaga(function* (instant: PlayerInstant) {
                const answer = selectAnswer(instant.state);
                const platform = instant.state.options.platform;
                yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: getModelFromAnswer(answer, platform), goToEnd: true});
            })
        });

        app.stepperApi.onInit(function* (stepperState: StepperState, state: AppStore) {
            const currentTest = selectCurrentTestData(state);

            log.getLogger('task').debug('stepper init, current test', currentTest, state.environment);

            const context = quickAlgoLibraries.getContext(null, state.environment);
            context.resetAndReloadState(currentTest, state);
            yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});

            stepperState.contextState = getCurrentImmerState(context.getInnerState());
        });
    });
}

