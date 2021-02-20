import {updateCurrentItem} from './utils';
import {getPersistentOptions} from './options';
import {put, select, takeLatest} from 'redux-saga/effects';
import {ActionTypes as PlayerActionTypes} from '../player/actionTypes';
import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";

export default function(bundle: Bundle) {
    /* Initialize the available options from the recording's data when the
       player is ready. */
    bundle.addReducer(PlayerActionTypes.PlayerReady, playerReadyReducer);

    /* Update the index of the current item when the player's position
       has changed due to user interaction. */
    bundle.addReducer(PlayerActionTypes.PlayerSeeked, playerSeekedReducer);

    /* Update the index of the current item when the player's position
       has changed due to time advancing. */
    bundle.addReducer(PlayerActionTypes.PlayerTick, playerTickReducer);

    bundle.addSaga(function* () {
        /* When the player is ready, automatically reload the last selected
           subtitles language, if available. */
        yield takeLatest(PlayerActionTypes.PlayerReady, function* () {
            const {language} = getPersistentOptions();
            const state: AppStore = yield select();
            const {availableOptions} = state.subtitles;
            if (language && language !== "none" && language in availableOptions) {
                const option = availableOptions[language];

                yield put({type: ActionTypes.SubtitlesLoadFromUrl, payload: option});
            }
        });
    });
}

function playerReadyReducer(state: AppStore, {payload: {baseDataUrl, data}}): void {
    const availableOptions = [];
    const {langOptions} = state.subtitles;

    (data.subtitles || []).forEach(function(key) {
        const url = `${baseDataUrl}_${key}.srt`;
        const option = langOptions.find(option => option.value === key);

        availableOptions[key] = {key, url, ...option};
    });

    state.subtitles.availableOptions = availableOptions;
    state.subtitles.items = [];
    state.subtitles.filteredItems = [];
    state.subtitles.currentIndex = 0;
    state.subtitles.loadedKey = 'none';
}

function playerSeekedReducer(state: AppStore, action): void {
    const {seekTo} = action;

    updateCurrentItem(state.subtitles, seekTo);
}

function playerTickReducer(state: AppStore, {payload: {audioTime}}): void {
    return updateCurrentItem(state.subtitles, audioTime);
}
