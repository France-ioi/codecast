import {extractLevelSpecific} from "./utils";
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
    TaskState, taskSuccess, taskSuccessClear,
    updateCurrentTest
} from "./task_slice";
import {addAutoRecordingBehaviour} from "../recorder/record";
import {ReplayContext} from "../player/sagas";
import DocumentationBundle from "./documentation";
import {original} from "immer";
import {PlayerInstant} from "../player";
import {ActionTypes} from "../stepper/actionTypes";
import {ActionTypes as BufferActionTypes} from "../buffers/actionTypes";
import {StepperState, StepperStatus} from "../stepper";

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

function* createContext (quickAlgoLibraries: QuickAlgoLibraries) {
    const context = quickAlgoLibraries.getContext();
    if (context) {
        context.unload();
    }

    const currentTask = yield select(state => state.task.currentTask);
    const currentLevel = yield select(state => state.task.currentLevel);
    const levelGridInfos = extractLevelSpecific(currentTask.gridInfos, taskLevels[currentLevel]);
    const display = true;

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
}

function getTaskTest(currentTask: any, currentLevel: number) {
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

export default function (bundle: Bundle) {
    bundle.include(DocumentationBundle);

    bundle.addSaga(function* (app: App) {
        let oldSagasTask;

        yield takeEvery(TaskActionTypes.TaskLoad, function* () {
            if (oldSagasTask) {
                // Unload task first
                yield cancel(oldSagasTask);
                yield put(taskUnload());
            }

            yield call(createContext, quickAlgoLibraries);
            yield put(taskLoaded());
            const sagas = quickAlgoLibraries.getSagas(app);
            oldSagasTask = yield fork(function* () {
                yield all(sagas);
            });
        });

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

        app.replayApi.onReset(function* (instant: PlayerInstant) {
            const taskData = instant.state.task;

            const context = quickAlgoLibraries.getContext();
            const stepperState = instant.state.stepper;
            console.log('RELOAD STATE', stepperState);
            if (stepperState && stepperState.currentStepperState && stepperState.currentStepperState.contextState && context) {
                context.reloadState(stepperState.currentStepperState.contextState);
                context.resetDisplay();
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

        // @ts-ignore
        yield takeEvery(ActionTypes.StepperExit, function* ({payload}) {
            if (!(payload && false === payload.reset)) {
                console.log('make reset');
                const context = quickAlgoLibraries.getContext();
                if (context) {
                    const state = yield select();
                    const context = quickAlgoLibraries.getContext();
                    context.reset(state.task.currentTest, state);
                    yield put(taskResetDone(true));
                }
            } else {
                yield put(taskResetDone(false));
            }
        });
    });

    bundle.defer(function(app: App) {
        addAutoRecordingBehaviour(app, {
            sliceName: taskSlice.name,
            actionNames: taskRecordableActions,
            actions: taskSlice.actions,
            reducers: taskSlice.caseReducers,
            onResetDisabled: true,
        });

        // const context = quickAlgoLibraries.getContext();

        app.replayApi.on('start', function(replayContext: ReplayContext) {
            const currentState = original(replayContext.state.task);

            replayContext.state.task = {
                ...currentState,
                currentTest: getTaskTest(currentState.currentTask, currentState.currentLevel),
                // state: context && context.getCurrentState ? {...context.getCurrentState()} : {},
            };
        });

        app.stepperApi.onInit(function(stepperState: StepperState, state: AppStore) {
            const currentTest = state.task.currentTest;

            const context = quickAlgoLibraries.getContext();
            context.reset(currentTest, state);

            stepperState.contextState = context.getCurrentState();
        });
    });
}
