import {extractLevelSpecific} from "./utils";
import StringRotation from './fixtures/14_strings_05_rotation';
import {ActionTypes} from "./actionTypes";
import {Bundle} from "../linker";
import {AppStore, AppStoreReplay} from "../store";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {call, put, select, takeEvery, getContext} from "redux-saga/effects";
import {getRecorderState} from "../recorder/selectors";
import {App} from "../index";
import {PlayerInstant} from "../player";
import {clearStepper} from "../stepper";
import {ReplayContext} from "../player/sagas";
import {PrinterLib} from "./libs/printer/printer_lib";
import {quickAlgoLibraries, QuickAlgoLibraries, QuickAlgoLibrary} from "./libs/quickalgo_librairies";

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

export interface TaskState {
    recordingEnabled: boolean,
    context?: QuickAlgoLibrary,
    state?: any,
    success?: boolean,
    successMessage?: string,
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

function taskSuccessReducer(state: AppStoreReplay, {payload: {message}}): void {
    state.task.success = true;
    state.task.successMessage = message;
    clearStepper(state.stepper);
}

function taskSuccessClearReducer(state: AppStoreReplay): void {
    state.task.success = false;
    state.task.successMessage = null;
}

export function createContext (quickAlgoLibraries: QuickAlgoLibraries) {
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

    quickAlgoLibraries.reset(subTask.data[curLevel][0]);
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
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.task = {
            recordingEnabled: false,
        };
    });

    bundle.defineAction(ActionTypes.TaskLoad);

    bundle.defineAction(ActionTypes.TaskRecordingEnabledChange);
    bundle.addReducer(ActionTypes.TaskRecordingEnabledChange, (state: AppStore, {payload: {enabled}}) => {
        state.task.recordingEnabled = enabled;
    });

    bundle.defineAction(ActionTypes.TaskSuccess);
    bundle.addReducer(ActionTypes.TaskSuccess, taskSuccessReducer);

    bundle.defineAction(ActionTypes.TaskSuccessClear);
    bundle.addReducer(ActionTypes.TaskSuccessClear, taskSuccessClearReducer);

    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.TaskLoad, function* () {
            const quickAlgoLibraries = yield getContext('quickAlgoLibraries');
            createContext(quickAlgoLibraries);
        });

        yield takeEvery(ActionTypes.TaskRecordingEnabledChange, function* () {
            const state = yield select();
            const recorderState = getRecorderState(state);
            if (!recorderState.status) {
                yield put({type: RecorderActionTypes.RecorderPrepare});
            }
        });

        // @ts-ignore
        yield takeEvery(ActionTypes.TaskReset, function* ({payload: {state: taskData}}) {
            const state = yield select();
            state.task.success = taskData.success;
            state.task.successMessage = taskData.successMessage;
            if (taskData.state) {
                quickAlgoLibraries.getContext().reloadState(taskData.state);
            }
        });
    });

    bundle.defer(function({replayApi, recordApi}: App) {
        replayApi.onReset(function* (instant: PlayerInstant) {
            const taskData = instant.state.task;
            if (taskData) {
                yield put({type: ActionTypes.TaskReset, payload: {state: taskData}});
            }
        });

        recordApi.on(ActionTypes.TaskSuccess, function* (addEvent, action) {
            const {payload: {message}} = action;

            yield call(addEvent, 'task.success', message);
        });
        replayApi.on('task.success', function (replayContext: ReplayContext, event) {
            const message = event[2];

            taskSuccessReducer(replayContext.state, {payload: {message}});
        });

        recordApi.on(ActionTypes.TaskSuccessClear, function* (addEvent) {
            yield call(addEvent, 'task.success.clear');
        });
        replayApi.on('task.success.clear', function (replayContext: ReplayContext) {
            taskSuccessClearReducer(replayContext.state);
        });
    });
}
