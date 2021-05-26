import {extractLevelSpecific} from "./utils";
import StringRotation from './fixtures/14_strings_05_rotation';
import {Bundle} from "../linker";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {call, put, select, takeEvery, all, fork} from "redux-saga/effects";
import {getRecorderState} from "../recorder/selectors";
import {App} from "../index";
import {PlayerInstant} from "../player";
import {ReplayContext} from "../player/sagas";
import {PrinterLib} from "./libs/printer/printer_lib";
import {AppAction} from "../store";
import {quickAlgoLibraries, QuickAlgoLibraries, QuickAlgoLibrary} from "./libs/quickalgo_librairies";
import {
    recordingEnabledChange, TaskState,
    taskSuccess,
    taskSuccessClear,
    taskSuccessClearReducer,
    taskSuccessReducer, updateCurrentTest
} from "./task_slice";

export enum ActionTypes {
    TaskLoad = 'task/load',
    TaskReset = 'task/reset',
}

export interface TaskResetAction extends AppAction {
    type: ActionTypes.TaskReset;
    payload: TaskState;
}

export const taskLoad = () => ({
    type: ActionTypes.TaskLoad,
});

export const taskReset = (
    taskData: TaskState,
): TaskResetAction => ({
    type: ActionTypes.TaskReset,
    payload: taskData,
});

export interface QuickAlgoContext {
    display: boolean,
    infos: any,
    nbCodes: number,
    nbNodes: number,
    setLocalLanguageStrings?: Function,
    strings?: any,
    importLanguageStrings?: Function,
    getConceptList?: Function,
    changeDelay?: Function,
    waitDelay?: Function,
    callCallback?: Function,
    setCurNode?: Function,
    debug_alert?: Function,
    reset?: Function,
    resetDisplay?: Function,
    updateScale?: Function,
    unload?: Function,
    provideBlocklyColours?: Function,
    localLanguageStrings?: any,
    customBlocks?: any,
    customConstants?: any,
    conceptList?: any,
    curNode?: any,
    stringsLanguage?: any,
    runner?: any,
    propagate?: Function,
    onSuccess?: Function,
    onError?: Function,
    onInput?: Function,
    getCurrentState?: () => any,
    reloadState?: (state: any) => void,
}

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
    const curLevel = 'easy';
    const subTask = StringRotation;
    const levelGridInfos = extractLevelSpecific(subTask.gridInfos, curLevel);
    const display = true;

    try {
        const printerLib = new PrinterLib(display, levelGridInfos);
        quickAlgoLibraries.addLibrary(printerLib);
    } catch (e) {
        const defaultLib = new QuickAlgoLibrary(display, levelGridInfos);
        quickAlgoLibraries.addLibrary(defaultLib);
    }

    const testData = subTask.data[curLevel][0];
    yield put(updateCurrentTest(testData));
    console.log('ici reset', testData);
    quickAlgoLibraries.reset(testData);
}

export function getAutocompletionParameters (context) {
    const curLevel = 'easy';
    const curIncludeBlocks = extractLevelSpecific(context.infos.includeBlocks, curLevel);

    return {
        includeBlocks: curIncludeBlocks,
        strings: context.strings,
        constants: context.customConstants,
    };
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.TaskLoad, function* () {
            yield call(createContext, quickAlgoLibraries);
            const sagas = quickAlgoLibraries.getSagas();
            yield fork(function* () {
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

        yield takeEvery(taskSuccess.type, function* () {
            yield put({type: StepperActionTypes.StepperExit});
        });

        yield takeEvery(ActionTypes.TaskReset, function* (action: TaskResetAction) {
            const taskData = action.payload;
            if (taskData.success) {
                yield put(taskSuccess(taskData.successMessage));
            } else {
                yield put(taskSuccessClear());
            }
        });
    });

    bundle.defer(function({replayApi, recordApi}: App) {
        replayApi.onReset(function* (instant: PlayerInstant) {
            const taskData = instant.state.task;
            if (taskData) {
                console.log('ici, repare this', taskData);
                yield put(taskReset(taskData));
            }
        });

        recordApi.on(taskSuccess.type, function* (addEvent, action) {
            const {payload} = action;

            yield call(addEvent, 'task.success', payload);
        });
        replayApi.on('task.success', function (replayContext: ReplayContext, event) {
            const message = event[2];

            taskSuccessReducer(replayContext.state.task, taskSuccess(message));
        });

        recordApi.on(taskSuccessClear.type, function* (addEvent) {
            yield call(addEvent, 'task.success.clear');
        });
        replayApi.on('task.success.clear', function (replayContext: ReplayContext) {
            taskSuccessClearReducer(replayContext.state.task);
        });
    });
}
