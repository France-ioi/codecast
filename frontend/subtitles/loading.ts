/* "Loading subtitles" in this context means parsing a SRT resource
   (obtained in a number of ways) and making the individual subtitle
   items ({start, end, text} objects, timestamps in milliseconds) */
import {parseSync, stringifySync} from 'subtitle';
import {call, put, select, takeLatest} from 'redux-saga/effects';

import {readFileAsText} from '../common/utils';
import {filterItems, getSubtitles, updateCurrentItem} from './utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";
import produce from "immer";
import {AppStore} from "../store";

export default function(bundle) {
    /* Clear (unload) the currently loaded subtitles, if any. */
    bundle.defineAction(ActionTypes.SubtitlesCleared);
    bundle.addReducer(ActionTypes.SubtitlesCleared, produce(subtitlesClearedReducer));

    /* subtitlesLoadFromText({key, text}) loads SRT subtitles from a string. */
    bundle.defineAction(ActionTypes.SubtitlesLoadFromText);

    /* subtitlesLoadFromUrl({key, url}) loads SRT subtitles from a URL. */
    bundle.defineAction(ActionTypes.SubtitlesLoadFromUrl);

    /* subtitlesLoadFromFile({key, file}) loads SRT subtitles from a (local)
       File object. */
    bundle.defineAction(ActionTypes.SubtitlesLoadFromFile);

    /* subtitlesReload() reloads the currently selected subtitles.
       This is needed for the editor, in case the user has directly edited
       the text. */
    bundle.defineAction(ActionTypes.SubtitlesReload);

    bundle.defineAction(ActionTypes.SubtitlesLoadStarted);
    bundle.addReducer(ActionTypes.SubtitlesLoadStarted, produce(subtitlesLoadStartedReducer));

    bundle.defineAction(ActionTypes.SubtitlesLoadSucceeded);
    bundle.addReducer(ActionTypes.SubtitlesLoadSucceeded, produce(subtitlesLoadSucceededReducer));

    bundle.defineAction(ActionTypes.SubtitlesLoadFailed);
    bundle.addReducer(ActionTypes.SubtitlesLoadFailed, produce(subtitlesLoadFailedReducer));

    bundle.defineAction(ActionTypes.SubtitlesLoadForTrimSucceeded);
    bundle.addReducer(ActionTypes.SubtitlesLoadForTrimSucceeded, produce(subtitlesLoadForTrimSucceededReducer));

    bundle.defineAction(ActionTypes.SubtitlesTrimDone);
    bundle.addReducer(ActionTypes.SubtitlesTrimDone, produce(subtitlesTrimDoneReducer));

    bundle.addSaga(subtitlesLoadSaga);
}

function subtitlesClearedReducer(draft: AppStore): void {
    draft.subtitles.loaded = false;
    draft.subtitles.text = '';
    draft.subtitles.items = [];
    draft.subtitles.filteredItems = [];
    draft.subtitles.currentIndex = 0;
    draft.subtitles.loadedKey = 'none';
}

function subtitlesLoadStartedReducer(draft: AppStore, {payload: {key}}): void {
    draft.subtitles.loaded = false;
    draft.subtitles.loading = key;
    draft.subtitles.lastError = '';
}

function subtitlesLoadSucceededReducer(draft: AppStore, {payload: {key, text, items}}): void {
    draft.subtitles.loaded = true;
    draft.subtitles.loading = false;
    draft.subtitles.loadedKey = key;
    draft.subtitles.text = text;
    draft.subtitles.items = items;
    draft.subtitles.filteredItems = filterItems(items, draft.subtitles.filterRegexp);

    updateCurrentItem(draft.subtitles);
}

function subtitlesLoadFailedReducer(draft: AppStore, {payload: {error}}): void {
    let errorText = draft.getMessage('SUBTITLES_FAILED_TO_LOAD').s;
    if (error.res) {
        errorText = `${errorText} (${error.res.statusCode})`;
    }

    draft.subtitles.loaded = false;
    draft.subtitles.loading = false;
    draft.subtitles.lastError = errorText;
    draft.subtitles.text = errorText;
    draft.subtitles.loadedKey = 'none';
}

function subtitlesLoadForTrimSucceededReducer(draft: AppStore, {payload: {key, items}}): void {
    draft.subtitles.trim.loaded.push({key, items})
}

function subtitlesTrimDoneReducer(draft: AppStore, {payload: {subtitles: data}}): void {
    if (data.length) {
        for (const {key, text} of data) {
            draft.subtitles.availableOptions[key].text = text;
            draft.subtitles.availableOptions[key].unsaved = true;
        }
    }
}

function* subtitlesLoadSaga() {
    yield takeLatest(ActionTypes.SubtitlesLoadFromText, subtitlesLoadFromTextSaga);
    yield takeLatest(ActionTypes.SubtitlesLoadFromUrl, subtitlesLoadFromUrlSaga);
    yield takeLatest(ActionTypes.SubtitlesLoadFromFile, subtitlesLoadFromFileSaga);
    yield takeLatest(ActionTypes.SubtitlesReload, subtitlesReloadSaga);
    yield takeLatest(EditorActionTypes.EditorTrimEnter, subtitlesLoadForTrimSaga);
}

function* subtitlesLoadFromTextSaga(action) {
    yield put({type: ActionTypes.SubtitlesLoadStarted, payload: {key: action.payload.key}});

    let items;
    try {
        items = parseSync(action.payload.text);
    } catch (ex) {
        yield put({type: ActionTypes.SubtitlesLoadFailed, payload: {key: action.payload.key, error: ex}});

        return;
    }

    yield put({
        type: ActionTypes.SubtitlesLoadSucceeded, payload: {
            key: action.payload.key,
            text: action.payload.text,
            items
        }
    });
}

function* subtitlesLoadFromUrlSaga(action) {
    yield put({
        type: ActionTypes.SubtitlesLoadStarted,
        payload: {
            key: action.payload.key
        }
    });

    try {
        const text = yield call(getSubtitles, action.payload.url);
        const items = parseSync(text);

        yield put({
            type: ActionTypes.SubtitlesLoadSucceeded,
            payload: {
                key: action.payload.key,
                text: action.payload.text,
                items
            }
        });
    } catch (ex) {
        yield put({
            type: ActionTypes.SubtitlesLoadFailed,
            payload: {
                key: action.payload.key,
                error: ex
            }
        });
    }
}

function* subtitlesLoadFromFileSaga(action) {
    try {
        const text = yield call(readFileAsText, action.payload.file);
        const items = parseSync(text);
        yield put({
            type: ActionTypes.SubtitlesLoadSucceeded,
            payload: {key: action.payload.key, text: action.payload.text, items}
        });
    } catch (ex) {
        yield put({type: ActionTypes.SubtitlesLoadFailed, payload: {key: action.payload.key, error: ex}});
    }
}

function* subtitlesReloadSaga(_action) {
    const state: AppStore = yield select();
    const {selectedKey: key, availableOptions} = state.subtitles;

    if (key) {
        /* Generate an initial item covering the entire recording (needed because
           the editor works by splitting existing items at a specific position). */
        let text = (availableOptions[key].text || '').trim();
        if (!text) {
            const data = state.player.data;

            text = stringifySync([{
                data: {
                    start: 0,
                    end: data.events[data.events.length - 1][0],
                    text: ''
                },
                type: 'cue'
            }], {
                format: 'SRT'
            });
        }

        yield put({type: ActionTypes.SubtitlesLoadFromText, payload: {key, text}});
    }
}

function* subtitlesLoadForTrimSaga(_action) {
    const state: AppStore = yield select();
    const {availableOptions} = state.subtitles;
    const availKeys = Object.keys(availableOptions).sort();

    for (const key of availKeys) {
        const {url} = availableOptions[key];
        let text = (availableOptions[key].text || '').trim();

        try {
            if (!text) {
                text = yield call(getSubtitles, url);
            }
            const items = parseSync(text);
            yield put({type: ActionTypes.SubtitlesLoadForTrimSucceeded, payload: {key, items}});
        } catch (ex) {
        }
    }
}
