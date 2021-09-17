import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import StringRotationFixture from './fixtures/14_strings_05_rotation';
import LoopFixture from './fixtures/a19_boucles';
import SokobanFixture from './fixtures/11_variable_08_sokoban';

export const taskLevels = ['basic', 'easy', 'medium', 'hard'];

export interface TaskState {
    currentTask?: any,
    currentLevel?: number,
    recordingEnabled?: boolean,
    resetDone?: boolean,
    loaded?: boolean,
    state?: any,
    success?: boolean,
    successMessage?: string,
    currentTest?: object,
    inputNeeded?: boolean,
}

export const taskInitialState = {
    currentTask: StringRotationFixture,
    currentLevel: 1,
    recordingEnabled: false,
    resetDone: true,
    loaded: false,
    success: false,
    successMessage: null,
    currentTest: null,
    inputNeeded: false,
} as TaskState;

export const taskSlice = createSlice({
    name: 'task',
    initialState: taskInitialState,
    reducers: {
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
        updateCurrentTest(state: TaskState, action: PayloadAction<object>) {
            if (state.currentTest) {
                state.currentTest = {
                    ...state.currentTest,
                    ...action.payload,
                };
            } else {
                state.currentTest = action.payload;
            }
        },
        taskInputNeeded(state: TaskState, action: PayloadAction<boolean>) {
            state.inputNeeded = action.payload;
        },
        taskInputEntered(state: TaskState, action: PayloadAction<string>) {
            state.inputNeeded = false;
        },
        taskLoaded(state: TaskState) {
            state.loaded = true;
        },
        taskUpdateState(state: TaskState, action: PayloadAction<any>) {
            state.state = action.payload;
        },
    },
});

export const {
    recordingEnabledChange,
    taskSuccess,
    taskSuccessClear,
    updateCurrentTest,
    taskInputNeeded,
    taskInputEntered,
    taskResetDone,
    taskUpdateState,
    taskLoaded,
} = taskSlice.actions;

export const taskRecordableActions = [
    'taskSuccess',
    'taskSuccessClear',
    'taskInputNeeded',
];

export default taskSlice;
