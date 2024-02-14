import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {TaskAnswer} from '../task_types';

export enum TaskLevelName {
    Basic = 'basic',
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard',
}

export const taskLevelsList = [TaskLevelName.Basic, TaskLevelName.Easy, TaskLevelName.Medium, TaskLevelName.Hard];

export interface TaskLevel {
    level: TaskLevelName,
    answer: TaskAnswer|null,
    bestAnswer: TaskAnswer|null,
    score: number,
    locked?: boolean,
}

export interface PlatformState {
    taskRandomSeed: string,
    taskToken: string,
    levels: {[key: string]: TaskLevel},
    taskParams: PlatformTaskParams,
}

export interface PlatformTaskParams {
    randomSeed: string,
    options: any,
    minScore: number,
    maxScore: number,
    noScore: number,
    supportsTabs?: boolean,
    fullFeedback?: boolean,
}

export const platformInitialState = {
    taskRandomSeed: null,
    taskToken: null,
    levels: {},
    taskParams: {},
} as PlatformState;

export const getDefaultTaskLevel = (level: TaskLevelName) => {
    return {
        level,
        answer: null,
        bestAnswer: null,
        score: 0,
        locked: false,
    } as TaskLevel;
};

export const platformSlice = createSlice({
    name: 'platform',
    initialState: platformInitialState,
    reducers: {
        platformTaskRandomSeedUpdated(state: PlatformState, action: PayloadAction<string>) {
            state.taskRandomSeed = action.payload;
        },
        platformTokenUpdated(state: PlatformState, action: PayloadAction<string>) {
            if (action.payload) {
                state.taskToken = action.payload;
            }
        },
        platformSetTaskLevels(state: PlatformState, action: PayloadAction<{[key: string]: TaskLevel}>) {
            state.levels = action.payload;
        },
        platformSaveScore(state: PlatformState, action: PayloadAction<{level: TaskLevelName, answer: any, score: number}>) {
            // Score is between 0 and 1 here
            const taskLevel = state.levels[action.payload.level];
            const currentScore = taskLevel.score;
            let newState = state;
            if (action.payload.score > currentScore) {
                state.levels[action.payload.level].bestAnswer = action.payload.answer;
                state.levels[action.payload.level].score = action.payload.score;

                if (action.payload.score >= 1) {
                    const levelNumber = taskLevelsList.indexOf(action.payload.level);
                    for (let level = levelNumber + 1; level < taskLevelsList.length; level++) {
                        if (taskLevelsList[level] in state.levels) {
                            if (state.levels[taskLevelsList[level]].locked) {
                                state.levels[taskLevelsList[level]].locked = false;
                            }
                            break;
                        }
                    }
                }
            }

            return newState;
        },
        platformUnlockLevel(state: PlatformState, action: PayloadAction<TaskLevelName>) {
            if (!(action.payload in state.levels)) {
                return;
            }
            state.levels[action.payload].locked = false;
        },
        platformSaveAnswer(state: PlatformState, action: PayloadAction<{level: TaskLevelName, answer: any}>) {
            if (!(action.payload.level in state.levels)) {
                state.levels[action.payload.level] = getDefaultTaskLevel(action.payload.level);
            }
            const taskLevel = state.levels[action.payload.level];
            taskLevel.answer = action.payload.answer;
        },
        platformTaskParamsUpdated(state: PlatformState, action: PayloadAction<PlatformTaskParams>) {
            state.taskParams = action.payload;
        },
    },
});

export const {
    platformTaskRandomSeedUpdated,
    platformTaskParamsUpdated,
    platformTokenUpdated,
    platformSetTaskLevels,
    platformSaveScore,
    platformSaveAnswer,
    platformUnlockLevel,
} = platformSlice.actions;

export default platformSlice;
