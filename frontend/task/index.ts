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
    recordingEnabledChange, taskInputNeeded, taskLevels, taskRecordableActions, taskResetDone,
    taskSuccess, taskSuccessClear, taskUpdateState,
    updateCurrentTest
} from "./task_slice";
import {addAutoRecordingBehaviour} from "../recorder/record";
import {ReplayContext} from "../player/sagas";
import DocumentationBundle from "./documentation";
import {createDraft, current, isDraft, original} from "immer";
import {PlayerInstant} from "../player";
import {ActionTypes} from "../stepper/actionTypes";
import {ActionTypes as BufferActionTypes} from "../buffers/actionTypes";
import {stepperDisabledSaga, StepperState, StepperStatus} from "../stepper";
import {createQuickAlgoLibraryExecutor, makeContext} from "../stepper/api";

export enum TaskActionTypes {
    TaskLoad = 'task/load',
    TaskLoaded = 'task/loaded',
    TaskUnload = 'task/unload',
    TaskInputEntered = 'task/inputEntered',
}

export interface TaskInputEnteredAction extends AppAction {
    type: TaskActionTypes.TaskInputEntered;
    payload: string;
}

export const taskLoad = () => ({
    type: TaskActionTypes.TaskLoad,
});

export const taskLoaded = () => ({
    type: TaskActionTypes.TaskLoaded,
});

export const taskUnload = () => ({
    type: TaskActionTypes.TaskUnload,
});

export const taskInputEntered = (
    input: string
): TaskInputEnteredAction => ({
    type: TaskActionTypes.TaskInputEntered,
    payload: input,
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
    quickAlgoLibraries.reset(testData, state);
    context = quickAlgoLibraries.getContext();
    context.reloadState(createDraft(context.getCurrentState()));
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

let oldSagasTask;

function* taskLoadSaga (app: App) {
    console.log('TASK LOAD', oldSagasTask);
    if (oldSagasTask) {
        // Unload task first
        yield cancel(oldSagasTask);
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
    oldSagasTask = yield fork(function* () {
        yield all(sagas);
    });

    const stepperContext = {
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

    const executor = createQuickAlgoLibraryExecutor(stepperContext, false);

    const listeners = quickAlgoLibraries.getEventListeners();
    console.log('task listeners', listeners);
    for (let [eventName, {module, method}] of Object.entries(listeners)) {
        console.log({eventName, method})
        app.replayApi.on(eventName, function* (replayContext: ReplayContext, event) {
            const payload = event[2];
            console.log('trigger method ', method, 'for event name ', eventName);
            yield put({type: eventName, payload});
        });

        // @ts-ignore
        yield takeEvery(eventName, function* ({payload}) {
            console.log('make payload', payload);
            const args = payload ? payload : [];
            yield executor(module, method, args, () => {
                console.log('exec done');
            });

            const context = quickAlgoLibraries.getContext();
            const contextState = context.getCurrentState();
            console.log('get new state', contextState);
            yield put(taskUpdateState(getCurrentImmerState(contextState)));
        });
    }
}

export default function (bundle: Bundle) {
    bundle.include(DocumentationBundle);

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
            if (!(payload && false === payload.reset)) {
                console.log('make reset');
                const context = quickAlgoLibraries.getContext();
                if (context) {
                    const state = yield select();
                    const context = quickAlgoLibraries.getContext();
                    context.reset(state.task.currentTest, state);
                    context.reloadState(createDraft(context.getCurrentState()));
                    yield put(taskResetDone(true));
                }
            } else {
                yield put(taskResetDone(false));
            }
        });
    });

    bundle.defer(function (app: App) {
        // Quick mode means continuous play. In this case we can just call every library method
        // without reloading state or display in between
        app.replayApi.onReset(function* (instant: PlayerInstant, quick) {
            const taskData = instant.state.task;

            const context = quickAlgoLibraries.getContext();
            const stepperState = instant.state.stepper;
            console.log('RELOAD STATE', stepperState);

            if (!quick) {
                if (taskData && taskData.state) {
                    console.log('do reload state', taskData.state);
                    const draft = createDraft(taskData.state);
                    context.reloadState(draft);
                }
                console.log('DO RESET DISPLAY');
                context.resetDisplay(); // TODO: remove this?
            }

            if (stepperState && stepperState.currentStepperState && stepperState.currentStepperState.quickalgoLibraryCalls && quick && context) {
                const stepperContext = makeContext(stepperState, () => {
                    return Promise.resolve(true);
                }, (arg) => {
                    return new Promise((resolve, reject) => {
                        app.dispatch({
                            type: ActionTypes.StepperInteract,
                            payload: {stepperContext, arg},
                            meta: {resolve, reject}
                        });
                    });
                }, null, app.dispatch);

                console.log('stepper context', {stepperContext})

                const executor = createQuickAlgoLibraryExecutor(stepperContext, false);
                for (let quickalgoCall of stepperState.currentStepperState.quickalgoLibraryCalls) {
                    const {module, action, args} = quickalgoCall;
                    console.log('start call execution', quickalgoCall, !quick);

                    yield call(executor, module, action, args, () => {
                        console.log('execution over');
                    });
                }
            }

            if (taskData) {
                yield put(updateCurrentTest(taskData.currentTest));
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

            const context = quickAlgoLibraries.getContext();
            context.reset(currentTest, state);

            stepperState.contextState = context.getCurrentState();
            context.reloadState(createDraft(stepperState.contextState));
        });
    });
}
