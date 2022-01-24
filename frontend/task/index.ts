import {extractLevelSpecific, getCurrentImmerState, getDefaultSourceCode} from "./utils";
import {Bundle} from "../linker";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {call, put, select, takeEvery, all, fork, cancel, take, takeLatest} from "typed-redux-saga";
import {getRecorderState} from "../recorder/selectors";
import {App} from "../index";
import {PrinterLib} from "./libs/printer/printer_lib";
import {AppStore} from "../store";
import {quickAlgoLibraries, QuickAlgoLibrary} from "./libs/quickalgo_librairies";
import stringify from 'json-stable-stringify-without-jsonify';
import taskSlice, {
    currentTaskChange,
    currentTaskChangePredefined,
    recordingEnabledChange,
    selectCurrentTest,
    taskAddInput,
    taskClearSubmission,
    taskCurrentLevelChange,
    taskInputEntered,
    taskInputNeeded,
    taskLoaded,
    taskRecordableActions,
    taskResetDone, taskSetContextIncludeBlocks, taskSetContextStrings,
    TaskSubmissionResultPayload,
    taskSuccess,
    taskSuccessClear,
    taskUpdateState,
    updateCurrentTestId,
    updateTaskTests, updateTestContextState,
} from "./task_slice";
import {addAutoRecordingBehaviour} from "../recorder/record";
import {ReplayContext} from "../player/sagas";
import DocumentationBundle from "./doc";
import PlatformBundle, {
    getTaskAnswerAggregated,
    setPlatformBundleParameters,
    taskGradeAnswerEventSaga
} from "./platform/platform";
import {ActionTypes as LayoutActionTypes} from "./layout/actionTypes";
import {ZOOM_LEVEL_HIGH} from "./layout/layout";
import {createDraft} from "immer";
import {PlayerInstant} from "../player";
import {ActionTypes as StepperActionTypes, stepperDisplayError} from "../stepper/actionTypes";
import {ActionTypes as BufferActionTypes} from "../buffers/actionTypes";
import {StepperState, StepperStatus, StepperStepMode} from "../stepper";
import {createQuickAlgoLibraryExecutor, StepperContext} from "../stepper/api";
import {taskSubmissionExecutor} from "./task_submission";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {
    platformAnswerGraded,
    platformAnswerLoaded,
    taskGetAnswerEvent,
    taskGradeAnswerEvent
} from "./platform/actionTypes";
import {isStepperInterrupting} from "../stepper/selectors";
import {getBufferModel} from "../buffers/selectors";
import {documentModelFromString} from "../buffers";
import {
    platformSaveAnswer,
    platformSetTaskLevels, platformTokenUpdated,
    TaskLevel,
    TaskLevelName,
    taskLevelsList
} from "./platform/platform_slice";
import log from "loglevel";
import {getTaskTokenForLevel} from "./platform/task_token";
import {createAction} from "@reduxjs/toolkit";

export enum TaskActionTypes {
    TaskLoad = 'task/load',
    TaskUnload = 'task/unload',
    TaskRunExecution = 'task/runExecution',
}

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

function* createContext() {
    let state: AppStore = yield* select();
    let context = quickAlgoLibraries.getContext(null, state.environment);
    console.log('Create a context', context, state.environment);
    if (context) {
        console.log('Unload initial context first');
        context.unload();
    }

    const display = 'main' === state.environment;

    const currentTask = yield* select(state => state.task.currentTask);
    const currentLevel = yield* select(state => state.task.currentLevel);

    let contextLib;
    let levelGridInfos = currentTask ? extractLevelSpecific(currentTask.gridInfos, currentLevel) : {
        includeBlocks: {
            generatedBlocks: {
                printer: ["print", "read", "manipulate"]
            },
            standardBlocks: {
                includeAll: true,
            },
        },
    };
    if (levelGridInfos.context) {
        if (!window.quickAlgoLibrariesList) {
            window.quickAlgoLibrariesList = [];
        }
        const libraryIndex = window.quickAlgoLibrariesList.findIndex(element => levelGridInfos.context === element[0]);
        if (-1 !== libraryIndex) {
            const contextFactory = window.quickAlgoLibrariesList[libraryIndex][1];
            try {
                contextLib = contextFactory(display, levelGridInfos);
                quickAlgoLibraries.addLibrary(contextLib, levelGridInfos.context, state.environment);
            } catch (e) {
                console.error("Cannot create context", e);
                contextLib = new QuickAlgoLibrary(display, levelGridInfos);
                quickAlgoLibraries.addLibrary(contextLib, 'default', state.environment);
            }
        }
    }
    if (!contextLib) {
        try {
            const contextLib = new PrinterLib(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'printer', state.environment);
        } catch (e) {
            console.error("Cannot create context", e);
            const contextLib = new QuickAlgoLibrary(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'default', state.environment);
        }
    }

    const testData = selectCurrentTest(state);
    console.log('Create context with', {currentTask, currentLevel, testData});
    context = quickAlgoLibraries.getContext(null, state.environment);
    console.log('Created context', context);
    yield* put(taskSetContextStrings(context.strings));
    if (context.infos && context.infos.includeBlocks) {
        yield* put(taskSetContextIncludeBlocks(context.infos.includeBlocks));
    }
    context.resetAndReloadState(testData, state);
}

let oldSagasTasks = {};

function* taskLoadSaga(app: App, action) {
    const urlParameters = new URLSearchParams(window.location.search);
    const selectedTask = urlParameters.has('task') ? urlParameters.get('task') : null;

    let state: AppStore = yield* select();

    if (state.options.task) {
        yield* put(currentTaskChange(state.options.task));
    } else if (selectedTask) {
        yield* put(currentTaskChangePredefined(selectedTask));
    } else if (action.payload.selectedTask) {
        yield* put(currentTaskChangePredefined(action.payload.selectedTask));
    }

    const currentTask = yield* select((state: AppStore) => state.task.currentTask);
    if (currentTask) {
        let currentLevel = yield* select((state: AppStore) => state.task.currentLevel);

        if (action.payload.level && action.payload.level in currentTask.data) {
            yield* put(taskCurrentLevelChange({level: action.payload.level, record: false}));
        } else if (null === currentLevel || !(currentLevel in currentTask.data)) {
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

        const tests = action.payload && action.payload.tests ? action.payload.tests : currentTask.data[currentLevel];
        console.log('[task.load] update task tests', tests);
        yield* put(updateTaskTests(tests));

        const testId = action.payload && action.payload.testId ? action.payload.testId : 0;
        console.log('[task.load] update current test id', testId);
        yield* put(updateCurrentTestId({testId, record: false}));

        const taskLevels = yield* select((state: AppStore) => state.platform.levels);
        if (0 === Object.keys(taskLevels).length) {
            const levels = {};
            for (let level of Object.keys(currentTask.data)) {
                if (state.options.level && state.options.level !== level) {
                    continue;
                }

                levels[level] = {
                    level,
                    answer: null,
                    bestAnswer: null,
                    score: 0,
                } as TaskLevel;
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

    let context = quickAlgoLibraries.getContext(null, state.environment);
    if (!context || (action.payload && action.payload.reloadContext)) {
        yield* call(createContext);
    }

    const sagas = quickAlgoLibraries.getSagas(app);
    oldSagasTasks[app.environment] = yield* fork(function* () {
        sagas.push(handleLibrariesEventListenerSaga(app));
        yield* all(sagas);
    });

    state = yield* select();
    const sourceModel = getBufferModel(state, 'source');
    const source = sourceModel ? sourceModel.document.toString() : null;
    if ((!source || !source.length) && currentTask) {
        const defaultSourceCode = getDefaultSourceCode(state.options.platform, state.environment);
        console.log('Load default source code', defaultSourceCode);
        yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: documentModelFromString(defaultSourceCode), goToEnd: true});
    }

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
    console.log('task listeners', listeners);
    for (let [eventName, {module, method}] of Object.entries(listeners)) {
        console.log({eventName, method});

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
                const contextState = getCurrentImmerState(context.getInnerState());
                console.log('get new state', contextState);
                app.dispatch(taskUpdateState(contextState));
            });
        });
    }
}

function* taskRunExecution(app: App, {type, payload}) {
    console.log('START RUN EXECUTION', type, payload);
    const {level, testId, tests, options, source, resolve} = payload;

    yield* put({type: AppActionTypes.AppInit, payload: {options: {...options}, environment: 'background'}});
    yield* put({type: BufferActionTypes.BufferLoad, buffer: 'source', text: source});
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

    const currentSubmission = yield* select((state: AppStore) => state.task.currentSubmission);
    if (null !== currentSubmission) {
        yield* put(taskClearSubmission());
    }
    yield* put(taskSuccessClear({record: false}));

    // Save old answer
    const source = getBufferModel(state, 'source').document.toString();
    yield* put(platformSaveAnswer({level: currentLevel, answer: source}));

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
    if (!newLevelAnswer || !newLevelAnswer.length) {
        newLevelAnswer = getDefaultSourceCode(state.options.platform, state.environment);
    }
    yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: documentModelFromString(newLevelAnswer), goToEnd: true});

    const currentTask = state.task.currentTask;
    const tests = currentTask.data[newLevel];
    console.log('[task.currentLevelChange] update task tests', tests);
    yield* put(updateTaskTests(tests));

    yield* put(updateCurrentTestId({testId: 0, record: false, recreateContext: true}));
}

function* taskUpdateCurrentTestIdSaga({payload}) {
    const state: AppStore = yield* select();
    const context = quickAlgoLibraries.getContext(null, state.environment);
    console.log('update current test', context);

    // Save context state for the test we have just left
    if (context && !payload.recreateContext && null !== state.task.previousTestId) {
        const currentState = getCurrentImmerState(context.getInnerState());
        yield* put(updateTestContextState({testId: state.task.previousTestId, contextState: currentState}));
    }

    // Stop current execution if there is one
    if (state.stepper && state.stepper.status === StepperStatus.Running && !isStepperInterrupting(state)) {
        yield* put({type: StepperActionTypes.StepperInterrupt, payload: {record: false}});
    }
    if (state.stepper && state.stepper.status !== StepperStatus.Clear) {
        yield* put({type: StepperActionTypes.StepperExit, payload: {record: false}});
    }

    // Reload context state for the new test
    if (payload.recreateContext) {
        yield* call(createContext);
    } else if (context) {
        console.log('task update test', state.task.taskTests, state.task.currentTestId);
        if (!(state.task.currentTestId in state.task.taskTests)) {
            console.error("Test " + state.task.currentTestId + " does not exist on task ", state.task);
            throw "Couldn't update test during replay, check if the replay is using the appropriate task";
        }
        const contextState = state.task.taskTests[state.task.currentTestId].contextState;
        if (null !== contextState) {
            console.log('reload context state', contextState);
            context.reloadInnerState(createDraft(contextState));
            context.redrawDisplay();
        } else {
            const currentTest = selectCurrentTest(state);
            console.log('reload current test', currentTest);
            context.resetAndReloadState(currentTest, state);
        }
    }
}

function* contextResetAndReloadStateSaga() {
    const state: AppStore = yield* select();
    const currentTest = selectCurrentTest(state);

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context) {
        context.resetAndReloadState(currentTest, state);
        const contextState = getCurrentImmerState(context.getInnerState());
        console.log('get new state', contextState);
        yield* put(taskUpdateState(contextState));
    }
}

function* getTaskAnswer () {
    const state: AppStore = yield* select();

    return getBufferModel(state, 'source').document.toString();
}

function* getTaskState () {
    return {};
}

function* getTaskLevel () {
    return yield* select((state: AppStore) => state.task.currentLevel);
}

export default function (bundle: Bundle) {
    bundle.include(DocumentationBundle);
    bundle.include(PlatformBundle);

    setPlatformBundleParameters({
        getTaskAnswer,
        getTaskState,
        getTaskLevel,
        taskChangeLevel,
        taskGrader: taskSubmissionExecutor,
    })

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

        yield* takeEvery(BufferActionTypes.BufferEdit, function* (action) {
            // @ts-ignore
            const {buffer} = action;
            if (buffer === 'source') {
                const needsReset = yield* select(state => StepperStatus.Clear !== state.stepper.status || !state.task.resetDone);
                console.log('needs reset', needsReset);
                if (needsReset) {
                    console.log('HANDLE RESET');
                    yield* put({type: StepperActionTypes.StepperExit});
                }

                const currentSubmission = yield* select((state: AppStore) => state.task.currentSubmission);
                if (null !== currentSubmission) {
                    yield* put(taskClearSubmission());
                }
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.StepperExecutionSuccess, function* ({payload}) {
            const currentTestId = yield* select(state => state.task.currentTestId);
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: true,
                message: payload.message,
            });
        });

        // @ts-ignore
        yield* takeEvery([StepperActionTypes.StepperExecutionError, StepperActionTypes.CompileFailed], function* ({payload}) {
            const currentTestId = yield* select(state => state.task.currentTestId);
            yield taskSubmissionExecutor.afterExecution({
                testId: currentTestId,
                result: false,
                message: payload.error,
            });
        });

        yield* takeEvery(StepperActionTypes.StepperExit, function* () {
            yield* call(contextResetAndReloadStateSaga);
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

        // Replay inputs when needed from stepperPythonRunFromBeginningIfNecessary
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
        yield* takeEvery(updateCurrentTestId.type, taskUpdateCurrentTestIdSaga);

        yield* takeLatest(TaskActionTypes.TaskRunExecution, taskRunExecution, app);

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.Compile, function*({payload}) {
            console.log('stepper restart, create new submission');
            if (!payload.keepSubmission) {
                yield* put(taskClearSubmission());
            }
        });

        yield* takeEvery(platformAnswerGraded.type, function*({payload: {score, message, error}}: ReturnType<typeof platformAnswerGraded>) {
            log.getLogger('tests').debug('Submission execution over');
            if (score >= 1) {
                yield* put(taskSuccess(message));
            } else if (error) {
                yield* put(stepperDisplayError(error));
            }
        });

        yield* takeEvery(platformAnswerLoaded.type, function*({payload: {answer}}: ReturnType<typeof platformAnswerLoaded>) {
            console.log('Platform answer loaded', answer);
            yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: documentModelFromString(answer), goToEnd: true});
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
            if (taskData) {
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

                if (taskData.success) {
                    yield* put(taskSuccess(taskData.successMessage));
                } else {
                    yield* put(taskSuccessClear({}));
                }
            }

            console.log('TASK REPLAY API RESET', instant.event, taskData);
            if (!quick || -1 !== ['compile.success', 'task/changeLevel'].indexOf(instant.event[1])) {
                yield* call(contextResetAndReloadStateSaga);
            }

            const context = quickAlgoLibraries.getContext(null, 'main');
            if (!quick || -1 !== ['task/updateCurrentTestId', 'task/changeLevel'].indexOf(instant.event[1])) {
                if (taskData && taskData.state) {
                    console.log('do reload state', taskData.state);
                    const draft = createDraft(taskData.state);
                    context.reloadInnerState(draft);
                }
                console.log('DO RESET DISPLAY');
                context.redrawDisplay();
            }
        });

        addAutoRecordingBehaviour(app, {
            sliceName: taskSlice.name,
            actionNames: taskRecordableActions,
            actions: taskSlice.actions,
            reducers: taskSlice.caseReducers,
            onResetDisabled: true,
        });

        app.recordApi.on(taskChangeLevel.type, function* (addEvent, {payload}) {
            yield* call(addEvent, taskChangeLevel.type, payload.level);
        });
        app.replayApi.on(taskChangeLevel.type, function* (replayContext: ReplayContext, event) {
            yield* put(taskChangeLevel(event[2]));
            replayContext.addSaga(function* (instant: PlayerInstant) {
                const sourceModel = getBufferModel(instant.state, 'source');
                const source = sourceModel ? sourceModel.document.toString() : '';
                yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: documentModelFromString(source), goToEnd: true});
            })
        });

        app.stepperApi.onInit(function(stepperState: StepperState, state: AppStore) {
            const currentTest = selectCurrentTest(state);

            console.log('stepper init, current test', currentTest);

            const context = quickAlgoLibraries.getContext(null, state.environment);
            context.resetAndReloadState(currentTest, state);
            stepperState.contextState = getCurrentImmerState(context.getInnerState());
        });
    });
}
