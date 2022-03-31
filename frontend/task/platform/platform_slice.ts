import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export enum TaskLevelName {
    Basic = 'basic',
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard',
}

export const taskLevelsList = [TaskLevelName.Basic, TaskLevelName.Easy, TaskLevelName.Medium, TaskLevelName.Hard];

export interface TaskLevel {
    level: TaskLevelName,
    answer: any,
    bestAnswer: any,
    score: number,
    locked?: boolean,
}

export interface PlatformState {
    taskRandomSeed: string,
    taskToken: string,
    levels: {[key: string]: TaskLevel},
}

export const platformInitialState = {
    taskRandomSeed: null,
    taskToken: null,
    levels: {},
} as PlatformState;

export const getDefaultTaskLevel = (level: TaskLevelName) => {
    return {
        level,
        answer: null,
        bestAnswer: null,
        score: 0,
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
            const taskLevel = state.levels[action.payload.level];
            const currentScore = taskLevel.score;
            let newState = state;
            if (action.payload.score > currentScore) {
                state.levels[action.payload.level].bestAnswer = action.payload.answer;
                state.levels[action.payload.level].score = action.payload.score;

                if (action.payload.score >= 1) {
                    const levelNumber = taskLevelsList.indexOf(action.payload.level)
                    if (levelNumber + 1 <= taskLevelsList.length - 1) {
                        const nextLevel = taskLevelsList[levelNumber + 1];
                        if (nextLevel in state.levels && state.levels[nextLevel].locked) {
                            state.levels[nextLevel].locked = false;
                        }
                    }
                }
            }

            return newState;
        },
        platformSaveAnswer(state: PlatformState, action: PayloadAction<{level: TaskLevelName, answer: any}>) {
            if (!(action.payload.level in state.levels)) {
                state.levels[action.payload.level] = getDefaultTaskLevel(action.payload.level);
            }
            const taskLevel = state.levels[action.payload.level];
            taskLevel.answer = action.payload.answer;
        },
    },
});

export const {
    platformTaskRandomSeedUpdated,
    platformTokenUpdated,
    platformSetTaskLevels,
    platformSaveScore,
    platformSaveAnswer,
} = platformSlice.actions;

export default platformSlice;
