import {AppStore} from '../store';
import {recordingProgressSteps} from './utils';

export function getAudioTimeStep(state: AppStore) {
    if (state.player && state.player.duration) {
        return Math.ceil(recordingProgressSteps * state.player.audioTime / state.player.duration);
    }

    return null;
}
