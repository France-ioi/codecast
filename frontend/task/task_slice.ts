import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import StringRotationFixture from './fixtures/14_strings_05_rotation';
import TurtleFixture from './fixtures/turtle_05_functions_01';
import ProcessingFixture from './fixtures/test_processing';
import BarcodeFixture from './fixtures/test_barcode';
import QuickPiFixture from './fixtures/quickpi_testbed';
import SokobanFixture from './fixtures/11_variable_08_sokoban';
import StringsLoginFixture from './fixtures/14_strings_01_login';
import DatabaseFixture from './fixtures/test_database';
import P5Fixture from './fixtures/test_p5';
import CraneFixture from './fixtures/test_crane';
import {AppStore} from "../store";
import {TaskLevelName} from "./platform/platform_slice";
import {isLocalStorageEnabled} from "../common/utils";
import {TaskServer, TaskTestGroupType} from '../submission/task_platform';
import {QuickAlgoLibrary} from './libs/quickalgo_library';

const availableTasks = {
    robot: SokobanFixture,
    turtle: TurtleFixture,
    quickpi: QuickPiFixture,
    processing: ProcessingFixture,
    printer: StringRotationFixture,
    barcode: BarcodeFixture,
    database: DatabaseFixture,
    p5: P5Fixture,
    crane: CraneFixture,
    login: StringsLoginFixture,
};

export enum TaskActionTypes {
    TaskLoad = 'task/load',
    TaskUnload = 'task/unload',
    TaskRunExecution = 'task/runExecution',
}

export interface BlocksUsage {
    error?: string,
    blocksLimit?: number,
    blocksCurrent?: number,
    limitations?: {name: string, current: number, limit: number}[],
}

export interface TaskState {
    currentTask?: Task|null,
    currentLevel?: TaskLevelName,
    recordingEnabled?: boolean,
    resetDone?: boolean,
    loaded?: boolean,
    state?: any,
    success?: boolean,
    successMessage?: string,
    taskTests: TaskTest[],
    currentTestId?: number,
    previousTestId?: number,
    inputNeeded?: boolean,
    inputs?: any[],
    contextId: number,
    contextStrings: any,
    contextIncludeBlocks: any,
    blocksPanelCollapsed?: boolean,
    blocksUsage?: BlocksUsage,
    soundEnabled?: boolean,
    menuHelpsOpen?: boolean,
}

export interface TaskInputEnteredPayload {
    input: string,
    clearInput?: boolean,
}

export interface TaskTest {
    id?: string,
    subtaskId?: string|null,
    groupType?: TaskTestGroupType,
    active?: boolean,
    name?: string,
    data: any,
    contextState: any,
}

export type NotionCategory = string;
export type Notion = string;

export interface QuickalgoTaskIncludeBlocks {
    groupByCategory?: boolean,
    originalGroupByCategory?: boolean,
    generatedBlocks?: {[context: string]: string[]},
    standardBlocks?: {
        includeAll?: boolean,
        wholeCategories?: NotionCategory[],
        singleBlocks?: Notion[],
    },
    variables?: string[],
}

// We can customize the option for each level in the task definition
export interface QuickalgoTaskIncludeBlocksAllLevels {
    groupByCategory?: boolean|{[level: string]: boolean},
    generatedBlocks?: {[context: string]: string[]}|{[context: string]: {[level: string]: string[]}},
    standardBlocks?: {
        includeAll?: boolean,
        wholeCategories?: NotionCategory[]|{[level: string]: NotionCategory[]},
        singleBlocks?: Notion[]|{[level: string]: Notion[]},
    },
    variables?: string[]|{[level: string]: string[]},
}

export interface QuickalgoTaskGridInfosNotLevelDependent {
    context: string,
    contextType?: string,
    images?: {id?: string, path: {default: string}}[],
    importModules?: string[],
    conceptViewer?: boolean|string[],
    backgroundColor?: string,
    backgroundSrc?: string,
    borderColor?: string,
    showLabels?: boolean,
    logOption?: boolean,
    unlockedLevels?: number,
    blocklyColourTheme?: string,
    zoom?: {wheel?: boolean, controls?: boolean, scale?: number},
    scrollbars?: boolean,
    intro?: any,
    hideSaveOrLoad?: boolean,
    actionDelay?: number,
    panelCollapsed?: boolean,
    checkEndCondition?: (context: QuickAlgoLibrary, lastTurn: any) => void,
    checkEndEveryTurn?: boolean,
    hiddenTests?: boolean,
    maxListSize?: number,
    placeholderBlocks?: any,
    usedSkills?: string[],
    targetNbInstructions?: number,
}

export interface QuickalgoTaskGridInfos extends QuickalgoTaskGridInfosNotLevelDependent {
    maxInstructions?: number|{[level: string]: number},
    startingExample?: any,
    limitedUses?: {[level: string]: {blocks: string[], nbUses: number}[]},
    includeBlocks?: QuickalgoTaskIncludeBlocksAllLevels,
}

export interface QuickalgoLibraryInfos extends QuickalgoTaskGridInfosNotLevelDependent {
    maxInstructions?: number,
    startingExample: any,
    limitedUses?: {blocks: string[], nbUses: number}[],
    includeBlocks?: QuickalgoTaskIncludeBlocks,
}

export interface QuickalgoTask {
    gridInfos: QuickalgoTaskGridInfos,
    data?: any,
}

export type Task = QuickalgoTask & Partial<TaskServer>;

export function isServerTask(object: Task): boolean {
    return null !== object.id && undefined !== object.id;
}

export function isServerTest(object: TaskTest): boolean {
    return null !== object.id && undefined !== object.id;
}

// TODO: update this function when we will have a "public" field in tm_task_tests
export function isTestPublic(task: Task, test: TaskTest|null): boolean {
    if (null === test || !isServerTest(test)) {
        return true;
    }

    if (task && task.gridInfos && 'printer' === task.gridInfos.context) {
        return !(test && test.data && !test.data.input);
    }

    return true;
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
    blocksUsage: null,
    soundEnabled: !isLocalStorageEnabled() || !window.localStorage.getItem('soundDisabled'),
    menuHelpsOpen: false,
} as TaskState;

export const selectCurrentTestData = (state: AppStore) => {
    const currentTest = selectCurrentTest(state);

    return null !== currentTest ? currentTest.data : {};
}

export const selectCurrentTest = (state: AppStore): TaskTest|null => {
    if (null == state.task.currentTestId || !(state.task.currentTestId in state.task.taskTests)) {
        return null;
    }

    return state.task.taskTests[state.task.currentTestId];
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
        updateCurrentTestId(state: TaskState, action: PayloadAction<{testId: number, record?: boolean, recreateContext?: boolean}>) {
            state.previousTestId = state.currentTestId;
            state.currentTestId = action.payload.testId;
        },
        updateCurrentTest(state: TaskState, action: PayloadAction<object>) {
            if (null === state.currentTestId) {
                // Create a new test
                state.taskTests.push({
                    data: action.payload,
                    contextState: null,
                } as TaskTest);
                state.currentTestId = state.taskTests.length - 1;
            } else if (state.currentTestId in state.taskTests) {
                let currentTest = state.taskTests[state.currentTestId].data;

                state.taskTests[state.currentTestId].data = {
                    ...currentTest,
                    ...action.payload,
                };
            } else {
                state.taskTests[state.currentTestId].data = action.payload;
            }
        },
        updateTestContextState(state: TaskState, action: PayloadAction<{testId: number, contextState: any}>) {
            state.taskTests[action.payload.testId].contextState = action.payload.contextState;
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
        taskSetContextIncludeBlocks(state: TaskState, action: PayloadAction<any>) {
            state.contextIncludeBlocks = action.payload;
        },
        taskSetBlocksPanelCollapsed(state: TaskState, action: PayloadAction<boolean>) {
            state.blocksPanelCollapsed = action.payload;
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
    },
});

export const {
    recordingEnabledChange,
    taskSuccess,
    taskSuccessClear,
    updateCurrentTest,
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
} = taskSlice.actions;

export const taskRecordableActions = [
    'taskSuccess',
    'taskSuccessClear',
    'taskInputNeeded',
    'updateCurrentTestId',
    'taskSetBlocksPanelCollapsed',
    'taskChangeSoundEnabled',
];

export default taskSlice;
