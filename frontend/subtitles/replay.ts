import {updateCurrentItem} from './utils';
import {getPersistentOptions} from './options';
import {put, select, takeLatest} from 'redux-saga/effects';
import {ActionTypes as PlayerActionTypes} from '../player/actionTypes';
import {ActionTypes} from "./actionTypes";
import produce from "immer";
import {AppStore} from "../store";

export default function(bundle) {
    /* Initialize the available options from the recording's data when the
       player is ready. */
    bundle.addReducer(PlayerActionTypes.PlayerReady, produce(playerReadyReducer));

    /* Update the index of the current item when the player's position
       has changed due to user interaction. */
    bundle.addReducer(PlayerActionTypes.PlayerSeeked, produce(playerSeekedReducer));

    /* Update the index of the current item when the player's position
       has changed due to time advancing. */
    bundle.addReducer(PlayerActionTypes.PlayerTick, produce(playerTickReducer));

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

function playerReadyReducer(draft: AppStore, {payload: {baseDataUrl, data}}): void {
    const availableOptions = [];
    const {langOptions} = draft.subtitles;

    (data.subtitles || []).forEach(function(key) {
        const url = `${baseDataUrl}_${key}.srt`;
        const option = langOptions.find(option => option.value === key);

        availableOptions[key] = {key, url, ...option};
    });

    draft.subtitles.availableOptions = availableOptions;
    draft.subtitles.items = [];
    draft.subtitles.filteredItems = [];
    draft.subtitles.currentIndex = 0;
    draft.subtitles.loadedKey = 'none';
}

function playerSeekedReducer(draft: AppStore, action): void {
    const {seekTo} = action;

    updateCurrentItem(draft.subtitles, seekTo);
}

function playerTickReducer(draft: AppStore, {payload: {audioTime}}): void {
    return updateCurrentItem(draft.subtitles, audioTime);
}
