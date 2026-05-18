import {AppStore} from '../store';
import {recordingProgressSteps} from './utils';
import {TaskTest} from './task_types';
import {selectTaskTests} from '../submission/submission_selectors';

export function getAudioTimeStep(state: AppStore) {
    if (state.player && state.player.duration) {
        return Math.ceil(recordingProgressSteps * state.player.audioTime / state.player.duration);
    }

    return null;
}

export const selectCurrentTestData = (state: AppStore) => {
    const currentTest = selectCurrentTest(state);

    return null !== currentTest ? currentTest.data : {};
}

export const selectCurrentTest = (state: AppStore): TaskTest | null => {
    const taskTests = selectTaskTests(state);

    if (null == state.task.currentTestId || !(state.task.currentTestId in taskTests)) {
        return null;
    }

    return taskTests[state.task.currentTestId];
}
