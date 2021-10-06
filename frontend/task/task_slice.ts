import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import StringRotationFixture from './fixtures/14_strings_05_rotation';
import SokobanFixture from './fixtures/11_variable_08_sokoban';

const availableTasks = {
    robot: SokobanFixture,
    printer: StringRotationFixture,
};

export const taskLevels = ['basic', 'easy', 'medium', 'hard'];

export interface TaskSubmission {
    executing: boolean,
    results: TaskSubmissionResult[], // One per test
}

export interface TaskSubmissionResult {
    executing: boolean,
    result?: boolean,
    message?: string,
}

export interface TaskState {
    currentTask?: any,
    currentLevel?: number,
    recordingEnabled?: boolean,
    resetDone?: boolean,
    loaded?: boolean,
    state?: any,
    success?: boolean,
    successMessage?: string,
    taskTests: any[],
    currentTestId?: number,
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

export const taskInitialState = {
    currentTask: null,
    currentLevel: 1,
    taskTests: [],
    currentTestId: null,
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
        currentLevelChange(state, action: PayloadAction<number>) {
            state.currentLevel = action.payload;
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
            state.taskTests = action.payload;
        },
        updateCurrentTestId(state: TaskState, action: PayloadAction<number>) {
            state.currentTestId = action.payload;
        },
        updateCurrentTest(state: TaskState, action: PayloadAction<object>) {
            if (state.currentTestId in state.taskTests) {
                let currentTest = state.taskTests[state.currentTestId];

                state.taskTests[state.currentTestId] = {
                    ...currentTest,
                    ...action.payload,
                };
            } else {
                state.taskTests[state.currentTestId] = action.payload;
            }
        },
        taskInputNeeded(state: TaskState, action: PayloadAction<boolean>) {
            state.inputNeeded = action.payload;
        },
        // We don't store the input into the store but it's useful in the action for its listeners
        taskInputEntered(state: TaskState, action: PayloadAction<TaskInputEnteredPayload>) {
            state.inputNeeded = false;
            if (action.payload.clearInput) {
                console.log('pop input', state.inputs.join(','));
                state.inputs.shift();
                console.log('pop input2', state.inputs.join(','));
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
        taskSetInputs(state: TaskState, action: PayloadAction<any[]>) {
            state.inputs = action.payload;
        },
        taskCreateSubmission(state: TaskState) {
            state.currentSubmission = {
                executing: true,
                results: state.taskTests.map(() => ({executing: false})),
            };
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
    taskUpdateState,
    taskLoaded,
    currentTaskChangePredefined,
    currentTaskChange,
    taskAddInput,
    taskSetInputs,
    taskCreateSubmission,
    taskSubmissionStartTest,
    taskSubmissionSetTestResult,
} = taskSlice.actions;

export const taskRecordableActions = [
    'taskSuccess',
    'taskSuccessClear',
    'taskInputNeeded',
    'updateCurrentTestId',
];

export default taskSlice;
