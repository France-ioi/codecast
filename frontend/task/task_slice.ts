import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import StringRotationFixture from './fixtures/14_strings_05_rotation';
import TurtleFixture from './fixtures/turtle_05_functions_01';
import ProcessingFixture from './fixtures/test_processing';
import BarcodeFixture from './fixtures/test_barcode';
import QuickPiFixture from './fixtures/quickpi_testbed';
import QuickPiBuzzerFixture from './fixtures/quickpi_buzzer';
import QuickPiDirectionFixture from './fixtures/quickpi_direction';
import SokobanFixture from './fixtures/11_variable_08_sokoban';
import StringsLoginFixture from './fixtures/14_strings_01_login';
import DatabaseFixture from './fixtures/test_database';
import P5Fixture from './fixtures/test_p5';
import CraneFixture from './fixtures/test_crane';
import Crane2Fixture from './fixtures/test_crane2';
import MapFixture from './fixtures/test_map';
import {AppStore} from "../store";
import {TaskLevelName} from "./platform/platform_slice";
import {isLocalStorageEnabled} from "../common/utils";
import {selectTaskTests} from '../submission/submission_selectors';
import {BlocksUsage, QuickalgoLibraryInfos, QuickalgoTaskIncludeBlocks, Task, TaskState, TaskTest} from './task_types';

const availableTasks = {
    robot: SokobanFixture,
    turtle: TurtleFixture,
    quickpi: QuickPiFixture,
    buzzer: QuickPiBuzzerFixture,
    direction: QuickPiDirectionFixture,
    processing: ProcessingFixture,
    printer: StringRotationFixture,
    barcode: BarcodeFixture,
    database: DatabaseFixture,
    p5: P5Fixture,
    crane: CraneFixture,
    crane2: Crane2Fixture,
    login: StringsLoginFixture,
    map: MapFixture,
};

export enum TaskActionTypes {
    TaskLoad = 'task/load',
    TaskRunExecution = 'task/runExecution',
}

export const taskInitialState = {
    currentTask: null,
    currentLevel: null,
    taskTests: [],
    currentTestId: null,
    previousTestId: null,
    recordingEnabled: false,
    resetDone: true,
    loaded: false,
    success: false,
    successMessage: null,
    inputNeeded: false,
    inputs: [],
    contextId: 0,
    contextStrings: {},
    contextIncludeBlocks: {},
    blocksPanelCollapsed: false,
    blocksPanelWasOpen: true,
    blocksUsage: null,
    soundEnabled: !isLocalStorageEnabled() || !window.localStorage.getItem('soundDisabled'),
    menuHelpsOpen: false,
    availablePlatforms: [],
    levelGridInfos: null,
} as TaskState;

export const selectCurrentTestData = (state: AppStore) => {
    const currentTest = selectCurrentTest(state);

    return null !== currentTest ? currentTest.data : {};
}

export const selectCurrentTest = (state: AppStore): TaskTest|null => {
    const taskTests = selectTaskTests(state);

    if (null == state.task.currentTestId || !(state.task.currentTestId in taskTests)) {
        return null;
    }

    return taskTests[state.task.currentTestId];
}

export interface TaskInputEnteredPayload {
    input: string,
    clearInput?: boolean,
}

export const taskSlice = createSlice({
    name: 'task',
    initialState: taskInitialState,
    reducers: {
        currentTaskChangePredefined(state, action: PayloadAction<string>) {
            if (action.payload in availableTasks) {
                state.currentTask = availableTasks[action.payload];
            } else {
                state.currentTask = availableTasks.robot;
            }
            state.previousTestId = null;
        },
        currentTaskChange(state, action: PayloadAction<Task|null>) {
            state.currentTask = action.payload;
            state.previousTestId = null;
            state.currentTestId = null;
        },
        taskCurrentLevelChange(state, action: PayloadAction<{level: TaskLevelName, record?: boolean}>) {
            state.currentLevel = action.payload.level;
            state.previousTestId = null;
            state.currentTestId = null;
        },
        recordingEnabledChange(state, action: PayloadAction<boolean>) {
            state.recordingEnabled = action.payload;
        },
        taskSuccess(state: TaskState, action: PayloadAction<string>) {
            state.success = true;
            state.successMessage = action.payload;
        },
        taskSuccessClear(state: TaskState, action?: PayloadAction<{record?: boolean}>) {
            state.success = false;
            state.successMessage = null;
        },
        taskResetDone(state: TaskState, action: PayloadAction<boolean>) {
            state.resetDone = action.payload;
        },
        updateTaskTests(state: TaskState, action: PayloadAction<TaskTest[]>) {
            state.taskTests = action.payload;
            state.previousTestId = null;
            state.currentTestId = null;
        },
        addNewTaskTest(state: TaskState, action: PayloadAction<TaskTest>) {
            state.taskTests.push(action.payload);
        },
        removeTaskTest(state: TaskState, action: PayloadAction<{testToRemoveIndex: number, newTestId: number}>) {
            state.taskTests.splice(action.payload.testToRemoveIndex, 1);
            state.previousTestId = state.currentTestId;
            state.currentTestId = action.payload.newTestId;
        },
        updateCurrentTestId(state: TaskState, action: PayloadAction<{testId: number, record?: boolean, recreateContext?: boolean, withoutContextState?: boolean, keepSubmission?: boolean}>) {
            state.previousTestId = state.currentTestId;
            state.currentTestId = action.payload.testId;
        },
        updateTaskTest(state: TaskState, action: PayloadAction<{testIndex: number, data: object}>) {
            let currentTest = state.taskTests[action.payload.testIndex].data;

            state.taskTests[action.payload.testIndex].data = {
                ...currentTest,
                ...action.payload.data,
            };
        },
        updateTestContextState(state: TaskState, action: PayloadAction<{testId: number, contextState: any, contextStateResetDone: boolean}>) {
            state.taskTests[action.payload.testId].contextState = action.payload.contextState;
            state.taskTests[action.payload.testId].contextStateResetDone = action.payload.contextStateResetDone;
        },
        taskInputNeeded(state: TaskState, action: PayloadAction<boolean>) {
            state.inputNeeded = action.payload;
        },
        // We don't store the input into the store but it's useful in the action for its listeners
        taskInputEntered(state: TaskState, action: PayloadAction<TaskInputEnteredPayload>) {
            state.inputNeeded = false;
            if (action.payload.clearInput) {
                state.inputs.shift();
            }
        },
        taskUnload(state: TaskState) {
            state.loaded = false;
        },
        taskLoaded(state: TaskState) {
            state.loaded = true;
        },
        taskUpdateState(state: TaskState, action: PayloadAction<any>) {
            state.state = action.payload;
        },
        taskClearInputs(state: TaskState) {
            state.inputs = [];
        },
        taskAddInput(state: TaskState, action: PayloadAction<any>) {
            state.inputs.push(action.payload);
        },
        taskIncreaseContextId(state: TaskState) {
            state.contextId++;
        },
        taskSetContextStrings(state: TaskState, action: PayloadAction<any>) {
            // Make a copy to put in the store so that the original "strings" object do not end frozen and thus immutable by Immer
            state.contextStrings = action.payload ? JSON.parse(JSON.stringify(action.payload)) : {};
        },
        taskSetContextIncludeBlocks(state: TaskState, action: PayloadAction<QuickalgoTaskIncludeBlocks>) {
            state.contextIncludeBlocks = action.payload;
        },
        taskSetBlocksPanelCollapsed(state: TaskState, action: PayloadAction<{collapsed: boolean, manual?: boolean}>) {
            state.blocksPanelCollapsed = action.payload.collapsed;
            if (action.payload.manual) {
                state.blocksPanelWasOpen = !state.blocksPanelCollapsed;
            }
        },
        taskSetBlocksUsage(state: TaskState, action: PayloadAction<BlocksUsage>) {
            state.blocksUsage = action.payload;
        },
        taskChangeSoundEnabled(state: TaskState, action: PayloadAction<boolean>) {
            state.soundEnabled = action.payload
            if (isLocalStorageEnabled()) {
                if (state.soundEnabled) {
                    window.localStorage.removeItem('soundDisabled');
                } else {
                    window.localStorage.setItem('soundDisabled', 'yes');
                }
            }
        },
        taskSetMenuHelpsOpen(state: TaskState, action: PayloadAction<boolean>) {
            state.menuHelpsOpen = action.payload;
        },
        taskSetAvailablePlatforms(state: TaskState, action: PayloadAction<string[]>) {
            state.availablePlatforms = action.payload;
        },
        taskSetLevelGridInfos(state: TaskState, action: PayloadAction<QuickalgoLibraryInfos>) {
            state.levelGridInfos = action.payload;
        },
    },
});

export const {
    recordingEnabledChange,
    taskSuccess,
    taskSuccessClear,
    updateTaskTest,
    updateTaskTests,
    updateCurrentTestId,
    taskInputNeeded,
    taskInputEntered,
    taskResetDone,
    taskLoaded,
    taskUpdateState,
    currentTaskChangePredefined,
    currentTaskChange,
    taskAddInput,
    updateTestContextState,
    taskCurrentLevelChange,
    taskIncreaseContextId,
    taskSetContextStrings,
    taskSetContextIncludeBlocks,
    taskSetBlocksPanelCollapsed,
    taskSetBlocksUsage,
    taskChangeSoundEnabled,
    taskSetMenuHelpsOpen,
    taskSetAvailablePlatforms,
    taskUnload,
    addNewTaskTest,
    removeTaskTest,
    taskSetLevelGridInfos,
} = taskSlice.actions;

export default taskSlice;
