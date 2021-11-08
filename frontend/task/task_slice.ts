import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import StringRotationFixture from './fixtures/14_strings_05_rotation/index';
import SokobanFixture from './fixtures/11_variable_08_sokoban/index';

const availableTasks = {
    robot: SokobanFixture,
    printer: StringRotationFixture,
};

export enum TaskLevelName {
    Basic = 'basic',
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard',
}

export const taskLevelsList = [TaskLevelName.Basic, TaskLevelName.Easy, TaskLevelName.Medium, TaskLevelName.Hard];

export interface TaskSubmission {
    executing: boolean,
    results: TaskSubmissionResult[], // One per test
}

export interface TaskSubmissionResult {
    executing: boolean,
    result?: boolean,
    message?: string,
}

export interface TaskLevel {
    level: TaskLevelName,
    answer: any,
    bestAnswer: any,
    score: number,
}

export interface TaskState {
    currentTask?: any,
    currentLevel?: TaskLevelName,
    levels: {[key: string]: TaskLevel},
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
    levels: {},
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
} as TaskState;

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
        taskSuccessClear(state: TaskState) {
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
            if (state.currentTestId in state.taskTests) {
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
        taskSetLevels(state: TaskState, action: PayloadAction<{[key: string]: TaskLevel}>) {
            console.log('task set levels', action.payload);
            state.levels = action.payload;
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
    currentTaskChangePredefined,
    currentTaskChange,
    taskAddInput,
    taskCreateSubmission,
    taskClearSubmission,
    taskSubmissionStartTest,
    taskSubmissionSetTestResult,
    updateTestContextState,
    taskSetLevels,
    taskCurrentLevelChange,
} = taskSlice.actions;

export const taskRecordableActions = [
    'taskSuccess',
    'taskSuccessClear',
    'taskInputNeeded',
    'updateCurrentTestId',
    'taskCurrentLevelChange',
];

export default taskSlice;
