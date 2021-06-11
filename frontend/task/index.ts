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
import {AppAction, AppStore} from "../store";
import {quickAlgoLibraries, QuickAlgoLibraries, QuickAlgoLibrary} from "./libs/quickalgo_librairies";
import taskSlice, {
    recordingEnabledChange, taskInitialState, taskRecordableActions,
    TaskState,
    taskSuccess,
    taskSuccessClear,
    updateCurrentTest
} from "./task_slice";
import {addAutoRecordingBehaviour} from "../recorder/record";
import {ReplayContext} from "../player/sagas";
import {DocumentModel, initialStateBuffers} from "../buffers";

export enum ActionTypes {
    TaskLoad = 'task/load',
    TaskReset = 'task/reset',
    TaskInputEntered = 'task/inputEntered',
}

export interface TaskResetAction extends AppAction {
    type: ActionTypes.TaskReset;
    payload: TaskState;
}

export interface TaskInputEnteredAction extends AppAction {
    type: ActionTypes.TaskInputEntered;
    payload: string;
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

export const taskInputEntered = (
    input: string
): TaskInputEnteredAction => ({
    type: ActionTypes.TaskInputEntered,
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

const subTask = StringRotation;
const curLevel = 'easy';

function* createContext (quickAlgoLibraries: QuickAlgoLibraries) {
    const levelGridInfos = extractLevelSpecific(subTask.gridInfos, curLevel);
    const display = true;

    try {
        const printerLib = new PrinterLib(display, levelGridInfos);
        quickAlgoLibraries.addLibrary(printerLib, 'printer');
    } catch (e) {
        const defaultLib = new QuickAlgoLibrary(display, levelGridInfos);
        quickAlgoLibraries.addLibrary(defaultLib, 'default');
    }

    const testData = getTaskTest();
    console.log('create context', testData);
    yield put(updateCurrentTest(testData));
    quickAlgoLibraries.reset(testData);
}

function getTaskTest() {
    return subTask.data[curLevel][0];
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
    bundle.addSaga(function* (app: App) {
        yield takeEvery(ActionTypes.TaskLoad, function* () {
            yield call(createContext, quickAlgoLibraries);
            const sagas = quickAlgoLibraries.getSagas(app);
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

    bundle.defer(function(app: App) {
        addAutoRecordingBehaviour(app, {
            sliceName: taskSlice.name,
            actionNames: taskRecordableActions,
            actions: taskSlice.actions,
            reducers: taskSlice.caseReducers,
            onResetDisabled: true,
        });

        const context = quickAlgoLibraries.getContext();

        app.replayApi.on('start', function(replayContext: ReplayContext) {
            replayContext.state.task = {
                currentTest: getTaskTest(),
                state: context && context.getCurrentState ? {...context.getCurrentState()} : {},
            };
        });
    });
}
