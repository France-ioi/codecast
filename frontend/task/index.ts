import {extractLevelSpecific, getCurrentImmerState} from "./utils";
import {Bundle} from "../linker";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {call, put, select, takeEvery, all, fork, cancel} from "redux-saga/effects";
import {getRecorderState} from "../recorder/selectors";
import {App} from "../index";
import {PrinterLib} from "./libs/printer/printer_lib";
import {AppAction, AppStore} from "../store";
import {quickAlgoLibraries, QuickAlgoLibraries, QuickAlgoLibrary} from "./libs/quickalgo_librairies";
import taskSlice, {
    currentTaskChange,
    recordingEnabledChange, taskInputNeeded, taskLevels, taskLoaded, taskRecordableActions, taskResetDone,
    taskSuccess, taskSuccessClear, taskUpdateState,
    updateCurrentTest
} from "./task_slice";
import {addAutoRecordingBehaviour} from "../recorder/record";
import {ReplayContext} from "../player/sagas";
import DocumentationBundle from "./documentation";
import {createDraft} from "immer";
import {PlayerInstant} from "../player";
import {ActionTypes} from "../stepper/actionTypes";
import {ActionTypes as BufferActionTypes} from "../buffers/actionTypes";
import {stepperDisabledSaga, stepperExitReducer, StepperState, StepperStatus} from "../stepper";
import {createQuickAlgoLibraryExecutor, StepperContext} from "../stepper/api";
import {ActionTypes as AppActionTypes} from "../actionTypes";

export enum TaskActionTypes {
    TaskLoad = 'task/load',
    TaskUnload = 'task/unload',
    TaskReset = 'task/reset',
}

export const taskLoad = () => ({
    type: TaskActionTypes.TaskLoad,
});

export const taskUnload = () => ({
    type: TaskActionTypes.TaskUnload,
});

export const taskReset = () => ({
    type: TaskActionTypes.TaskReset,
});

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

function* createContext(quickAlgoLibraries: QuickAlgoLibraries, display = true) {
    let context = quickAlgoLibraries.getContext();
    console.log('Create a context', context);
    if (context) {
        context.unload();
    }

    const currentTask = yield select(state => state.task.currentTask);
    const currentLevel = yield select(state => state.task.currentLevel);
    const levelGridInfos = extractLevelSpecific(currentTask.gridInfos, taskLevels[currentLevel]);

    let contextLib;
    if (levelGridInfos.context) {
        const libraryIndex = window.quickAlgoLibrariesList.findIndex(element => levelGridInfos.context === element[0]);
        if (-1 !== libraryIndex) {
            const contextFactory = window.quickAlgoLibrariesList[libraryIndex][1];
            try {
                contextLib = contextFactory(display, levelGridInfos);
                quickAlgoLibraries.addLibrary(contextLib, levelGridInfos.context);
            } catch (e) {
                console.error("Cannot create context", e);
                contextLib = new QuickAlgoLibrary(display, levelGridInfos);
                quickAlgoLibraries.addLibrary(contextLib, 'default');
            }
        }
    }
    if (!contextLib) {
        try {
            const contextLib = new PrinterLib(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'printer');
        } catch (e) {
            console.error("Cannot create context", e);
            const contextLib = new QuickAlgoLibrary(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'default');
        }
    }

    const testData = getTaskTest(currentTask, currentLevel);
    yield put(updateCurrentTest(testData));
    const state = yield select();
    context = quickAlgoLibraries.getContext();
    context.resetAndReloadState(testData, state);
}

export function getTaskTest(currentTask: any, currentLevel: number) {
    return currentTask.data[taskLevels[currentLevel]][0];
}

export interface AutocompletionParameters {
    includeBlocks: any,
    strings: any,
    constants: any,
}

export function getAutocompletionParameters (context, currentLevel: number): AutocompletionParameters {
    if (!context.strings || 0 === Object.keys(context.strings).length) {
        return null;
    }

    const curIncludeBlocks = extractLevelSpecific(context.infos.includeBlocks, taskLevels[currentLevel]);

    return {
        includeBlocks: curIncludeBlocks,
        strings: context.strings,
        constants: context.customConstants,
    };
}

let oldSagasTasks = {
    main: null,
    replay: null,
};

function* taskLoadSaga(app: App) {
    const urlParameters = new URLSearchParams(window.location.search);
    const selectedTask = urlParameters.has('task') ? urlParameters.get('task') : null;

    if (selectedTask) {
        yield put(currentTaskChange(selectedTask));
    }

    if (oldSagasTasks[app.replay ? 'replay' : 'main']) {
        // Unload task first
        yield cancel(oldSagasTasks[app.replay ? 'replay' : 'main']);
        yield put(taskUnload());
    }

    const context = quickAlgoLibraries.getContext();
    if (!app.replay && !context) {
        yield call(createContext, quickAlgoLibraries);
    }

    yield put(taskLoaded());

    if (app.replay && context) {
        const contextState = context.getCurrentState();
        yield put(taskUpdateState(getCurrentImmerState(contextState)));
    }

    const sagas = quickAlgoLibraries.getSagas(app);
    oldSagasTasks[app.replay ? 'replay' : 'main'] = yield fork(function* () {
        yield all(sagas);
    });

    yield call(handleLibrariesEventListenerSaga, app);
}

function* handleLibrariesEventListenerSaga(app: App) {
    const stepperContext: StepperContext = {
        interactAfter: (arg) => {
            return new Promise((resolve, reject) => {
                app.dispatch({
                    type: ActionTypes.StepperInteract,
                    payload: {stepperContext, arg},
                    meta: {resolve, reject}
                });
            });
        },
        dispatch: app.dispatch,
    };

    stepperContext.quickAlgoCallsExecutor = createQuickAlgoLibraryExecutor(stepperContext);

    const listeners = quickAlgoLibraries.getEventListeners();
    console.log('task listeners', listeners);
    for (let [eventName, {module, method}] of Object.entries(listeners)) {
        console.log({eventName, method});

        if (!app.replay) {
            app.recordApi.on(eventName, function* (addEvent, {payload}) {
                yield call(addEvent, eventName, payload);
            });

            app.replayApi.on(eventName, function* (replayContext: ReplayContext, event) {
                const payload = event[2];
                console.log('trigger method ', method, 'for event name ', eventName);
                yield put({type: eventName, payload});
            });
        }

        // @ts-ignore
        yield takeEvery(eventName, function* ({payload}) {
            console.log('make payload', payload);
            const args = payload ? payload : [];
            yield stepperContext.quickAlgoCallsExecutor(module, method, args, () => {
                console.log('exec done');
            });

            console.log('continue');

            const context = quickAlgoLibraries.getContext();
            const contextState = context.getCurrentState();
            console.log('get new state', contextState);
            yield put(taskUpdateState(getCurrentImmerState(contextState)));
        });
    }
}

export default function (bundle: Bundle) {
    bundle.include(DocumentationBundle);

    bundle.defineAction(taskSuccess.type);
    bundle.addReducer(taskSuccess.type, stepperExitReducer);

    bundle.addSaga(function* (app: App) {
        console.log('INIT TASK SAGAS');

        yield takeEvery(TaskActionTypes.TaskLoad, taskLoadSaga, app);

        yield takeEvery(recordingEnabledChange.type, function* (payload) {
            if (!payload) {
                return;
            }

            const state = yield select();
            const recorderState = getRecorderState(state);
            if (!recorderState.status) {
                yield put({type: RecorderActionTypes.RecorderPrepare});
            }
        });

        yield takeEvery(BufferActionTypes.BufferEdit, function* (action) {
            // @ts-ignore
            const {buffer} = action;
            if (buffer === 'source') {
                const needsReset = yield select(state => StepperStatus.Clear !== state.stepper.status || !state.task.resetDone);
                console.log('needs reset', needsReset);
                if (needsReset) {
                    console.log('HANDLE RESET');
                    yield put({type: ActionTypes.StepperExit});
                }
            }
        });

        yield takeEvery(taskSuccess.type, function* () {
            console.log('listen task success');
            // let state: AppStore = yield select();
            // if (state.stepper && state.stepper.status === StepperStatus.Running && !isStepperInterrupting(state)) {
            //     yield put({type: ActionTypes.StepperInterrupt, payload: {}});
            // }
            yield call(stepperDisabledSaga);
        });

        // @ts-ignore
        yield takeEvery(ActionTypes.StepperExit, function* ({payload}) {
            // if (!(payload && false === payload.reset)) {
                console.log('make reset');
                const context = quickAlgoLibraries.getContext();
                if (context) {
                    const state = yield select();
                    const context = quickAlgoLibraries.getContext();
                    context.resetAndReloadState(state.task.currentTest, state);
                    console.log('put task reset done to true');
                    yield put(taskResetDone(true));
                }
            // } else {
            //     yield put(taskResetDone(false));
            // }

            // yield put(taskResetDone(false));
        });

        yield takeEvery(TaskActionTypes.TaskReset, function* () {
            const isResetDone = yield select(state => state.task.resetDone);
            if (!isResetDone) {
                console.log('make reset');
                const context = quickAlgoLibraries.getContext();
                if (context) {
                    const state = yield select();
                    const context = quickAlgoLibraries.getContext();
                    context.resetAndReloadState(state.task.currentTest, state);
                    yield put(taskResetDone(true));
                }
            }
        });
    });

    bundle.defer(function (app: App) {
        // Quick mode means continuous play. In this case we can just call every library method
        // without reloading state or display in between
        app.replayApi.onReset(function* (instant: PlayerInstant, quick) {
            const taskData = instant.state.task;

            const context = quickAlgoLibraries.getContext();

            console.log('TASK REPLAY API RESET', instant.event);
            if (instant.event[1] === 'compile.success') {
                // When the stepper is initialized, we have to set the current test value into the context
                // just like in the stepperApi.onInit listener
                const currentTest = taskData.currentTest;
                console.log('stepper init, current test', currentTest);

                const context = quickAlgoLibraries.getContext();
                context.resetAndReloadState(currentTest, instant.state);
            }

            if (!quick) {
                if (taskData && taskData.state) {
                    console.log('do reload state', taskData.state);
                    const draft = createDraft(taskData.state);
                    context.reloadState(draft);
                }
                console.log('DO RESET DISPLAY');
                context.resetDisplay();
            }

            if (taskData) {
                yield put(updateCurrentTest(taskData.currentTest));
                yield put(taskUpdateState(taskData.state));
                yield put(taskResetDone(taskData.resetDone));
                if (taskData.success) {
                    yield put(taskSuccess(taskData.successMessage));
                } else {
                    yield put(taskSuccessClear());
                }
                yield put(taskInputNeeded(taskData.inputNeeded));
            }
        });

        addAutoRecordingBehaviour(app, {
            sliceName: taskSlice.name,
            actionNames: taskRecordableActions,
            actions: taskSlice.actions,
            reducers: taskSlice.caseReducers,
            onResetDisabled: true,
        });

        app.stepperApi.onInit(function(stepperState: StepperState, state: AppStore) {
            const currentTest = state.task.currentTest;

            console.log('stepper init, current test', currentTest);

            const context = quickAlgoLibraries.getContext();
            context.resetAndReloadState(currentTest, state);
            stepperState.contextState = getCurrentImmerState(context.getCurrentState());
        });
    });
}
