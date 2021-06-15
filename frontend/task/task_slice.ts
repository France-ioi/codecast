import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface TaskState {
    recordingEnabled: boolean,
    state?: any,
    success?: boolean,
    successMessage?: string,
    currentTest?: object,
}

export const taskSlice = createSlice({
    name: 'task',
    initialState: {
        recordingEnabled: false,
        success: false,
        successMessage: null,
        currentTest: null,
    } as TaskState,
    reducers: {
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
    },
});

export const {
    recordingEnabledChange,
    taskSuccess,
    taskSuccessClear,
    updateCurrentTest,
} = taskSlice.actions;

export const {
    taskSuccess: taskSuccessReducer,
    taskSuccessClear: taskSuccessClearReducer,
} = taskSlice.caseReducers;

export default taskSlice.reducer;
