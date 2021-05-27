import {extractLevelSpecific} from "./utils";
import StringRotation from './fixtures/14_strings_05_rotation';
import {Bundle} from "../linker";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {call, put, select, takeEvery, all, fork} from "redux-saga/effects";
import {getRecorderState} from "../recorder/selectors";
import {App} from "../index";
import {PlayerInstant} from "../player";
import {PrinterLib} from "./libs/printer/printer_lib";
import {AppAction} from "../store";
import {quickAlgoLibraries, QuickAlgoLibraries, QuickAlgoLibrary} from "./libs/quickalgo_librairies";
import {
    recordingEnabledChange,
    TaskState,
    taskSuccess,
    taskSuccessClear,
    updateCurrentTest
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
    });

    bundle.defer(function({replayApi}: App) {
        replayApi.onReset(function* (instant: PlayerInstant) {
            const taskData = instant.state.task;
            if (taskData) {
                yield put(taskReset(taskData));
                yield put(updateCurrentTest(taskData.currentTest));
                if (taskData.success) {
                    yield put(taskSuccess(taskData.successMessage));
                } else {
                    yield put(taskSuccessClear());
                }
            }
        });
    });
}
