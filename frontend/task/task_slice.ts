import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import StringRotationFixture from './fixtures/14_strings_05_rotation';
import TurtleFixture from './fixtures/turtle_05_functions_01';
import SokobanFixture from './fixtures/11_variable_08_sokoban';
import {AppStore} from "../store";
import {TaskLevelName} from "./platform/platform_slice";

const availableTasks = {
    robot: SokobanFixture,
    turtle: TurtleFixture,
    printer: StringRotationFixture,
};

export interface TaskSubmission {
    executing: boolean,
    results: TaskSubmissionResult[], // One per test
}

export interface TaskSubmissionResult {
    executing: boolean,
    result?: boolean,
    message?: string,
}

export interface BlocksUsage {
    error?: string,
    blocksLimit?: number,
    blocksCurrent?: number,
    limitations?: {name: string, current: number, limit: number}[],
}

export interface TaskState {
    currentTask?: any,
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
    currentSubmission?: TaskSubmission,
    inputNeeded?: boolean,
    inputs?: any[],
    contextId: number,
    contextStrings: any,
    contextIncludeBlocks: any,
    blocksPanelCollapsed?: boolean,
    blocksUsage?: BlocksUsage,
}

export interface TaskInputEnteredPayload {
    input: string,
    clearInput?: boolean,
}

export interface TaskSubmissionResultPayload {
    testId: number,
    result: boolean,
    message?: string,
}

export interface UpdateTestContextStatePayload {
    testId: number,
    contextState: any,
}

export interface TaskTest {
    data: any,
    contextState: any,
}

export const taskInitialState = {
    currentTask: null,
    currentLevel: null,
    taskTests: [],
    currentTestId: null,
    previousTestId: null,
    currentSubmission: null,
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
} as TaskState;

export const selectCurrentTest = (state: AppStore) => {
    if (null == state.task.currentTestId || !(state.task.currentTestId in state.task.taskTests)) {
        return {};
    }

    return state.task.taskTests[state.task.currentTestId].data;
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
        },
        currentTaskChange(state, action: PayloadAction<any>) {
            state.currentTask = action.payload;
        },
        taskCurrentLevelChange(state, action: PayloadAction<{level: TaskLevelName, record?: boolean}>) {
            state.currentLevel = action.payload.level;
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
        updateTaskTests(state: TaskState, action: PayloadAction<any[]>) {
            state.taskTests = action.payload.map(testData => ({
                data: testData,
                contextState: null,
            } as TaskTest));
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
        updateTestContextState(state: TaskState, action: PayloadAction<UpdateTestContextStatePayload>) {
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
        taskCreateSubmission(state: TaskState) {
            state.currentSubmission = {
                executing: true,
                results: state.taskTests.map(() => ({executing: false})),
            };
        },
        taskClearSubmission(state: TaskState) {
            state.currentSubmission = null;
        },
        taskSubmissionStartTest(state: TaskState, action: PayloadAction<number>) {
            state.currentSubmission.results[action.payload].executing = true;
        },
        taskSubmissionSetTestResult(state: TaskState, action: PayloadAction<TaskSubmissionResultPayload>) {
            state.currentSubmission.results[action.payload.testId] = {
                executing: false,
                result: action.payload.result,
                message: action.payload.message,
            };
        },
        taskIncreaseContextId(state: TaskState) {
            state.contextId++;
        },
        taskSetContextStrings(state: TaskState, action: PayloadAction<any>) {
            state.contextStrings = action.payload;
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
    taskCreateSubmission,
    taskClearSubmission,
    taskSubmissionStartTest,
    taskSubmissionSetTestResult,
    updateTestContextState,
    taskCurrentLevelChange,
    taskIncreaseContextId,
    taskSetContextStrings,
    taskSetContextIncludeBlocks,
    taskSetBlocksPanelCollapsed,
    taskSetBlocksUsage,
} = taskSlice.actions;

export const taskRecordableActions = [
    'taskSuccess',
    'taskSuccessClear',
    'taskInputNeeded',
    'updateCurrentTestId',
    'taskSetBlocksPanelCollapsed',
];

export default taskSlice;
