import {getCurrentImmerState, getDefaultSourceCode} from "./utils";
import {Bundle} from "../linker";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {all, call, cancel, cancelled, delay, fork, put, select, take, takeEvery, takeLatest} from "typed-redux-saga";
import {getRecorderState} from "../recorder/selectors";
import {App, Codecast} from "../index";
import {AppStore, CodecastPlatform} from "../store";
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
    selectCurrentTest,
    taskAddInput,
    taskChangeSoundEnabled,
    taskClearSubmission,
    taskCurrentLevelChange,
    taskInputEntered,
    taskInputNeeded,
    taskLoaded,
    taskRecordableActions,
    taskResetDone,
    TaskSubmissionResultPayload,
    taskSuccess,
    taskSuccessClear,
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
import {createQuickAlgoLibraryExecutor, StepperContext} from "../stepper/api";
import {taskSubmissionExecutor} from "./task_submission";
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
import {ActionTypes} from "../common/actionTypes";
import {getTaskFromId} from "../submission/task_platform";
import {
    submissionChangeExecutionMode,
    submissionChangePlatformName,
    SubmissionExecutionMode
} from "../submission/submission_slice";

export enum TaskActionTypes {
    TaskLoad = 'task/load',
    TaskUnload = 'task/unload',
    TaskRunExecution = 'task/runExecution',
}

export enum TaskPlatformMode {
    Source = 'source',
    RecordingProgress = 'recording_progress',
}

export const recordingProgressSteps = 10;

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

    let state: AppStore = yield* select();

    if (urlParameters.has('taskId')) {
        const task = yield* getTaskFromId(urlParameters.get('taskId'));
        const defaultTask = {
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
                        // singleBlocks: ["controls_repeat", "controls_if"]
                    }
                },
            },
        };
        const fullTask = {...defaultTask, ...task};
        yield* put(currentTaskChange(fullTask));
        yield* put(submissionChangeExecutionMode(SubmissionExecutionMode.Server));
        if (urlParameters.has('sPlatform')) {
            yield* put(submissionChangePlatformName(urlParameters.get('sPlatform')));
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
        console.log('load hints', state.options.taskHints);
        yield* put(hintsLoaded(state.options.taskHints));
    }

    const currentTask = yield* select((state: AppStore) => state.task.currentTask);
    if (currentTask) {
        let currentLevel = yield* select((state: AppStore) => state.task.currentLevel);

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
        currentLevel = yield* select((state: AppStore) => state.task.currentLevel);
        console.log('new current level', currentLevel);

        const tests = action.payload && action.payload.tests ? action.payload.tests : (currentTask.data ? currentTask.data[currentLevel] : []);
        console.log('[task.load] update task tests', tests);
        yield* put(updateTaskTests(tests));

        const testId = action.payload && action.payload.testId ? action.payload.testId : 0;
        console.log('[task.load] update current test id', testId);
        yield* put(updateCurrentTestId({testId, record: false}));

        const taskLevels = yield* select((state: AppStore) => state.platform.levels);
        if (0 === Object.keys(taskLevels).length) {
            const levels = {};
            if (currentTask.data && Object.keys(currentTask.data).length) {
                for (let level of Object.keys(currentTask.data)) {
                    if (state.options.level && state.options.level !== level) {
                        continue;
                    }

                    levels[level] = getDefaultTaskLevel(level as TaskLevelName);
                }
            // } else {
            //     levels[TaskLevelName.Medium] = getDefaultTaskLevel(TaskLevelName.Medium);
            }

            yield* put(platformSetTaskLevels(levels));
        }

        console.log({testId, tests});
    }

    if (oldSagasTasks[app.environment]) {
        // Unload task first
        yield* cancel(oldSagasTasks[app.environment]);
        yield* put(taskUnload());
    }

    console.log('create new context');

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
                console.log('finished, do cancel');
                yield* call(cancelHandleLibrariesEventListenerSaga, app);
            }
        }
    });

    state = yield* select();
    const source = selectAnswer(state);
    if ((!source || (typeof source === 'string' && !source.length)) && currentTask) {
        const defaultSourceCode = getDefaultSourceCode(state.options.platform, state.environment);
        if (null !== defaultSourceCode) {
            console.log('Load default source code', defaultSourceCode);
            const platform = yield* select((state: AppStore) => state.options.platform);
            yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: getModelFromAnswer(defaultSourceCode, platform), goToEnd: true});
        }
    }

    yield* call(taskLevelLoadedSaga);

    console.log('task loaded', app.environment);
    yield* put(taskLoaded());
}

function* handleLibrariesEventListenerSaga(app: App) {
    const stepperContext: StepperContext = {
        interactAfter: (arg) => {
            return new Promise((resolve, reject) => {
                app.dispatch({
                    type: StepperActionTypes.StepperInteract,
                    payload: {stepperContext, arg},
                    meta: {resolve, reject}
                });
            });
        },
        dispatch: app.dispatch,
        quickAlgoContext: quickAlgoLibraries.getContext(null, app.environment),
    };

    stepperContext.quickAlgoCallsExecutor = createQuickAlgoLibraryExecutor(stepperContext);

    const listeners = quickAlgoLibraries.getEventListeners();
    console.log('create task listeners on ', app.environment, listeners);
    for (let [eventName, {module, method}] of Object.entries(listeners)) {
        if ('main' === app.environment) {
            app.recordApi.on(eventName, function* (addEvent, {payload}) {
                yield* call(addEvent, eventName, payload);
            });

            app.replayApi.on(eventName, function* (replayContext: ReplayContext, event) {
                const payload = event[2];
                console.log('trigger method ', method, 'for event name ', eventName);
                yield* put({type: eventName, payload});
            });
        }

        // @ts-ignore
        yield* takeEvery(eventName, function* ({payload}) {
            console.log('make payload', payload);
            const args = payload ? payload : [];
            const state = yield* select();
            yield stepperContext.quickAlgoCallsExecutor(module, method, args, () => {
                console.log('exec done, update task state');
                const context = quickAlgoLibraries.getContext(null, state.environment);
                if (context) {
                    const contextState = getCurrentImmerState(context.getInnerState());
                    console.log('get new state', contextState);
                    app.dispatch(taskUpdateState(contextState));
                }
            });
        });
    }
}

function* cancelHandleLibrariesEventListenerSaga(app: App) {
    console.log('cancel saga on ', app.environment);
    const listeners = quickAlgoLibraries.getEventListeners();
    for (let eventName of Object.keys(listeners)) {
        if ('main' === app.environment) {
            console.log('remove event', eventName);
            app.recordApi.off(eventName);
            app.replayApi.off(eventName);
        }
    }
}

function* taskRunExecution(app: App, {type, payload}) {
    console.log('START RUN EXECUTION', type, payload);
    const {level, testId, tests, options, answer, resolve} = payload;

    yield* put({type: AppActionTypes.AppInit, payload: {options: {...options}, environment: 'background'}});
    yield* put(platformAnswerLoaded(answer));
    yield* put(taskLoad({testId, level, tests, reloadContext: true}));
    yield* take(taskLoaded.type);

    taskSubmissionExecutor.setAfterExecutionCallback((result: TaskSubmissionResultPayload) => {
        console.log('END RUN EXECUTION', result);
        resolve(result);
    });

    yield* put({type: StepperActionTypes.StepperCompileAndStep, payload: {mode: StepperStepMode.Run}});
}

function* taskChangeLevelSaga({payload}: ReturnType<typeof taskChangeLevel>) {
    const state: AppStore = yield* select();
    const currentLevel = state.task.currentLevel;
    const newLevel = payload.level;
    console.log('level change', currentLevel, newLevel);

    yield* put({type: StepperActionTypes.StepperExit});

    const currentSubmission = yield* select((state: AppStore) => state.task.currentSubmission);
    if (null !== currentSubmission) {
        yield* put(taskClearSubmission());
    }
    yield* put(taskSuccessClear({record: false}));

    // Save old answer
    const oldAnswer = selectAnswer(state);
    yield* put(platformSaveAnswer({level: currentLevel, answer: oldAnswer}));

    // Grade old answer
    const answer = stringify(yield* getTaskAnswerAggregated());
    yield* call(taskGradeAnswerEventSaga, taskGradeAnswerEvent(answer, null, () => {}, () => {}, true));
    console.log('grading finished');

    // Change level
    yield* put(taskCurrentLevelChange({level: newLevel}));

    const randomSeed = yield* select((state: AppStore) => state.platform.taskRandomSeed);
    const taskToken = getTaskTokenForLevel(newLevel, randomSeed);
    yield* put(platformTokenUpdated(taskToken));

    // Reload answer
    let newLevelAnswer = yield* select((state: AppStore) => state.platform.levels[newLevel].answer);
    console.log('new level answer', newLevelAnswer);
    if (!newLevelAnswer || (typeof newLevelAnswer === 'string' && !newLevelAnswer.length)) {
        newLevelAnswer = getDefaultSourceCode(state.options.platform, state.environment);
    }
    yield* put(platformAnswerLoaded(newLevelAnswer));

    const currentTask = state.task.currentTask;
    const tests = currentTask.data ? currentTask.data[newLevel] : [];
    console.log('[task.currentLevelChange] update task tests', tests);
    yield* put(updateTaskTests(tests));

    yield* put(updateCurrentTestId({testId: 0, record: false, recreateContext: true}));

    yield* call(taskLevelLoadedSaga);
}

function* taskLevelLoadedSaga() {
    const state: AppStore = yield* select();
    const currentTask = state.task.currentTask;
    const currentLevel = state.task.currentLevel;

    if (currentTask && currentTask.gridInfos.logOption && 'main' === state.environment && window.SrlLogger) {
        window.SrlLogger.load();
        window.SrlLogger.levelLoaded(currentLevel);
    }
}

function* taskUpdateCurrentTestIdSaga(app: App, {payload}) {
    const state: AppStore = yield* select();
    const context = quickAlgoLibraries.getContext(null, state.environment);
    console.log('update current test', context);

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
        console.log('task update test', state.task.taskTests, state.task.currentTestId);
        if (!(state.task.currentTestId in state.task.taskTests)) {
            console.error("Test " + state.task.currentTestId + " does not exist on task ", state.task);
            throw "Couldn't update test during replay, check if the replay is using the appropriate task";
        }
        context.iTestCase = state.task.currentTestId;
        const contextState = state.task.taskTests[state.task.currentTestId].contextState;
        if (null !== contextState) {
            const currentTest = selectCurrentTest(state);
            console.log('[taskUpdateCurrentTestIdSaga] reload current test', currentTest, contextState);
            context.resetAndReloadState(currentTest, state, contextState);
            yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
        } else {
            const currentTest = selectCurrentTest(state);
            console.log('[taskUpdateCurrentTestIdSaga] reload current test without state', currentTest);
            context.resetAndReloadState(currentTest, state);
        }
    }
}

function* getTaskAnswer () {
    const state: AppStore = yield* select();
    const taskPlatformMode = getTaskPlatformMode(state);

    if (TaskPlatformMode.RecordingProgress === taskPlatformMode) {
        return getAudioTimeStep(state);
    }

    if (TaskPlatformMode.Source === taskPlatformMode) {
        return selectAnswer(state) ?? '';
    }

    return null;
}

export function getTaskPlatformMode(state: AppStore): TaskPlatformMode {
    return !state.task.currentTask && state.player.instants ? TaskPlatformMode.RecordingProgress : TaskPlatformMode.Source;
}

function* getTaskState () {
    const statsState = yield* call(statsGetStateSaga);

    return {
        stats: statsState,
    };
}

function* getTaskLevel () {
    return yield* select((state: AppStore) => state.task.currentLevel);
}

function getAudioTimeStep(state: AppStore) {
    if (state.player && state.player.duration) {
        return Math.ceil(recordingProgressSteps * state.player.audioTime / state.player.duration);
    }

    return null;
}

function* watchRecordingProgressSaga(app: App) {
    const state = yield* select();
    if ('main' !== app.environment || TaskPlatformMode.RecordingProgress !== getTaskPlatformMode(state)) {
        return;
    }

    console.log('[recording.progress] watching');
    while (true) {
        const previousStep = yield* select((state: AppStore) => getAudioTimeStep(state));
        yield* take(PlayerActionTypes.PlayerTick);
        const nextStep = yield* select((state: AppStore) => getAudioTimeStep(state));
        const shouldUpdate = previousStep !== nextStep;
        if (shouldUpdate) {
            console.log('[recording.progress] update', previousStep, nextStep);
            yield* call([platformApi, platformApi.validate], 'done');
        }
    }
}

function getModelFromAnswer(answer: any, platform: CodecastPlatform) {
    if (null === answer) {
        return hasBlockPlatform(platform) ? new BlockDocumentModel() : new DocumentModel();
    }

    console.log('get model from answer', answer);
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
        console.log('INIT TASK SAGAS');

        yield* takeEvery(TaskActionTypes.TaskLoad, taskLoadSaga, app);

        // @ts-ignore
        yield* takeEvery(recordingEnabledChange.type, function* ({payload}) {
            yield* put({type: LayoutActionTypes.LayoutZoomLevelChanged, payload: {zoomLevel: payload ? ZOOM_LEVEL_HIGH : 1}});

            if (!payload) {
                return;
            }

            const state = yield* select();
            const recorderState = getRecorderState(state);
            if (!recorderState.status) {
                yield* put({type: RecorderActionTypes.RecorderPrepare});
            }
        });

        yield* takeEvery([BufferActionTypes.BufferEdit, BufferActionTypes.BufferEditPlain], function* (action) {
            // @ts-ignore
            const {buffer} = action;
            if (buffer === 'source') {
                const needsReset = yield* select(state => StepperStatus.Clear !== state.stepper.status || !state.task.resetDone || state.stepper.runningBackground);
                console.log('needs reset', needsReset);
                if (needsReset) {
                    console.log('HANDLE RESET');
                    yield* put({type: StepperActionTypes.StepperExit});
                }

                const currentSubmission = yield* select((state: AppStore) => state.task.currentSubmission);
                if (null !== currentSubmission) {
                    yield* put(taskClearSubmission());
                }

                const currentError = yield* select((state: AppStore) => state.stepper.error);
                if (null !== currentError) {
                    yield* put(stepperClearError());
                }
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.StepperExecutionSuccess, function* ({payload}) {
            const currentTestId = yield* select(state => state.task.currentTestId);
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: true,
                steps: Codecast.runner._steps,
                message: payload.message,
            });
        });

        // @ts-ignore
        yield* takeEvery([StepperActionTypes.StepperExecutionError, StepperActionTypes.CompileFailed], function* ({payload}) {
            const currentTestId = yield* select(state => state.task.currentTestId);
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: false,
                steps: Codecast.runner._steps,
                message: payload.error,
            });
        });

        yield* takeEvery(StepperActionTypes.StepperExit, function* () {
            const state = yield* select();
            if ('main' === state.environment) {
                mainQuickAlgoLogger.clearQuickAlgoLibraryCalls();
            }
            if (Codecast.runner) {
                Codecast.runner.stop();
            }
            yield* call(clearSourceHighlightSaga);
            yield* call(quickAlgoLibraryResetAndReloadStateSaga, app);
            console.log('put task reset done to true');
            yield* put(taskResetDone(true));
        });

        // Store inputs to be replayed in the next method
        // @ts-ignore
        yield* takeEvery(taskInputEntered.type, function* ({payload}) {
            console.log('add new input into store', payload);
            const state = yield* select();
            if (!state.stepper.synchronizingAnalysis) {
                yield* put(taskAddInput(payload.input));
            }
        });

        // Replay inputs when needed from stepperRunFromBeginningIfNecessary
        // @ts-ignore
        yield* takeEvery(taskInputNeeded.type, function* ({payload}) {
            console.log('task input needed', payload);
            if (payload) {
                const state = yield* select();
                console.log('sync', state.stepper.synchronizingAnalysis, 'inputs', state.task.inputs);
                if (state.stepper.synchronizingAnalysis && state.task.inputs.length) {
                    const nextInput = state.task.inputs[0];
                    console.log('next input', nextInput);
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
            console.log('stepper restart, create new submission');
            if (!payload.keepSubmission) {
                yield* put(taskClearSubmission());
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
            console.log('Platform answer loaded', answer);
            const platform = yield* select((state: AppStore) => state.options.platform);
            yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: getModelFromAnswer(answer, platform), goToEnd: true});
        });

        yield* takeEvery(taskChangeSoundEnabled.type, function* () {
            const context = quickAlgoLibraries.getContext(null, 'main');
            const state: AppStore = yield* select();
            if (context && context.changeSoundEnabled) {
                context.changeSoundEnabled(state.task.soundEnabled);
            }
        });

        yield* takeEvery(ActionTypes.WindowResized, function* () {
            const context = quickAlgoLibraries.getContext(null, 'main');
            const state: AppStore = yield* select();
            if (hasBlockPlatform(state.options.platform) && state.task.currentTask) {
                yield* call(loadBlocklyHelperSaga, context, state.task.currentLevel);
            }
        });

        yield* takeEvery([ActionTypes.WindowResized, LayoutActionTypes.LayoutMobileModeChanged], function* () {
            const state: AppStore = yield* select();
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
            const state: AppStore = yield* select();
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
                const currentLevel = yield* select((state: AppStore) => state.task.currentLevel);
                const currentTestId = yield* select((state: AppStore) => state.task.currentTestId);
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
                            currentSubmission: taskData.currentSubmission,
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

            console.log('TASK REPLAY API RESET', instant.event, taskData);

            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context && (!quick || -1 !== ['compile.success'].indexOf(instant.event[1]) || hasChangedLevel || hasChangedTest)) {
                yield* call(quickAlgoLibraryResetAndReloadStateSaga, app, taskData && taskData.state ? taskData.state : null, instant);
                console.log('DO RESET DISPLAY');
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
            const currentTest = selectCurrentTest(state);

            console.log('stepper init, current test', currentTest, state.environment);

            const context = quickAlgoLibraries.getContext(null, state.environment);
            context.resetAndReloadState(currentTest, state);
            yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});

            stepperState.contextState = getCurrentImmerState(context.getInnerState());
        });
    });
}
