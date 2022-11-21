/* "Loading subtitles" in this context means parsing a SRT resource
   (obtained in a number of ways) and making the individual subtitle
   items ({start, end, text} objects, timestamps in milliseconds) */
import {parseSync, stringifySync} from 'subtitle';
import {call, put, select, takeLatest} from 'typed-redux-saga';

import {readFileAsText} from '../common/utils';
import {filterItems, getSubtitles, updateCurrentItem} from './utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {getMessage} from "../lang";
import log from 'loglevel';

export default function(bundle: Bundle) {
    /* Clear (unload) the currently loaded subtitles, if any. */
    bundle.defineAction(ActionTypes.SubtitlesCleared);
    bundle.addReducer(ActionTypes.SubtitlesCleared, subtitlesClearedReducer);

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
    bundle.addReducer(ActionTypes.SubtitlesLoadStarted, subtitlesLoadStartedReducer);

    bundle.defineAction(ActionTypes.SubtitlesLoadSucceeded);
    bundle.addReducer(ActionTypes.SubtitlesLoadSucceeded, subtitlesLoadSucceededReducer);

    bundle.defineAction(ActionTypes.SubtitlesLoadFailed);
    bundle.addReducer(ActionTypes.SubtitlesLoadFailed, subtitlesLoadFailedReducer);

    bundle.defineAction(ActionTypes.SubtitlesLoadForTrimSucceeded);
    bundle.addReducer(ActionTypes.SubtitlesLoadForTrimSucceeded, subtitlesLoadForTrimSucceededReducer);

    bundle.defineAction(ActionTypes.SubtitlesTrimDone);
    bundle.addReducer(ActionTypes.SubtitlesTrimDone, subtitlesTrimDoneReducer);

    bundle.addSaga(subtitlesLoadSaga);
}

function subtitlesClearedReducer(state: AppStore): void {
    state.subtitles.loaded = false;
    state.subtitles.text = '';
    state.subtitles.items = [];
    state.subtitles.filteredItems = [];
    state.subtitles.currentIndex = 0;
    state.subtitles.loadedKey = 'none';
}

function subtitlesLoadStartedReducer(state: AppStore, {payload: {key}}): void {
    state.subtitles.loaded = false;
    state.subtitles.loading = key;
    state.subtitles.lastError = '';
}

function subtitlesLoadSucceededReducer(state: AppStore, {payload: {key, text, items}}): void {
    state.subtitles.loaded = true;
    state.subtitles.loading = false;
    state.subtitles.loadedKey = key;
    state.subtitles.text = text;
    state.subtitles.items = items;
    state.subtitles.filteredItems = filterItems(items, state.subtitles.filterRegexp);

    updateCurrentItem(state.subtitles);
}

function subtitlesLoadFailedReducer(state: AppStore, {payload: {error}}): void {
    let errorText = getMessage('SUBTITLES_FAILED_TO_LOAD').s;
    if (error.res) {
        errorText = `${errorText} (${error.res.statusCode})`;
    }

    state.subtitles.loaded = false;
    state.subtitles.loading = false;
    state.subtitles.lastError = errorText;
    state.subtitles.text = errorText;
    state.subtitles.loadedKey = 'none';
}

function subtitlesLoadForTrimSucceededReducer(state: AppStore, {payload: {key, items}}): void {
    const index = state.subtitles.trim.loaded.findIndex(element => element.key === key);
    log.getLogger('subtitles').debug('load succeeded', state.subtitles.trim.loaded, index);
    if (index !== -1) {
        state.subtitles.trim.loaded[index] = {key, items};
    } else {
        state.subtitles.trim.loaded.push({key, items})
    }
}

function subtitlesTrimDoneReducer(state: AppStore, {payload: {subtitles: data}}): void {
    if (data.length) {
        for (const {key, text} of data) {
            state.subtitles.availableOptions[key].text = text;
            state.subtitles.availableOptions[key].unsaved = true;
        }
    }
}

function* subtitlesLoadSaga() {
    yield* takeLatest(ActionTypes.SubtitlesLoadFromText, subtitlesLoadFromTextSaga);
    yield* takeLatest(ActionTypes.SubtitlesLoadFromUrl, subtitlesLoadFromUrlSaga);
    yield* takeLatest(ActionTypes.SubtitlesLoadFromFile, subtitlesLoadFromFileSaga);
    yield* takeLatest(ActionTypes.SubtitlesReload, subtitlesReloadSaga);
    yield* takeLatest(EditorActionTypes.EditorTrimEnter, subtitlesLoadForTrimSaga);
}

function* subtitlesLoadFromTextSaga(action) {
    yield* put({type: ActionTypes.SubtitlesLoadStarted, payload: {key: action.payload.key}});

    let items;
    try {
        items = parseSync(action.payload.text);
    } catch (ex) {
        yield* put({type: ActionTypes.SubtitlesLoadFailed, payload: {key: action.payload.key, error: ex}});

        return;
    }

    yield* put({
        type: ActionTypes.SubtitlesLoadSucceeded, payload: {
            key: action.payload.key,
            text: action.payload.text,
            items
        }
    });
}

function* subtitlesLoadFromUrlSaga(action) {
    const options = yield* select(state => state.options);
    if (options.data && options.data.subtitlesData && action.payload.key in options.data.subtitlesData) {
        yield* put({
            type: ActionTypes.SubtitlesLoadSucceeded,
            payload: {
                key: action.payload.key,
                text: action.payload.text,
                items: options.data.subtitlesData[action.payload.key],
            }
        });
        return;
    }

    yield* put({
        type: ActionTypes.SubtitlesLoadStarted,
        payload: {
            key: action.payload.key
        }
    });

    try {
        const text = yield* call(getSubtitles, action.payload.url);
        const items = parseSync(text);

        yield* put({
            type: ActionTypes.SubtitlesLoadSucceeded,
            payload: {
                key: action.payload.key,
                text: action.payload.text,
                items
            }
        });
    } catch (ex) {
        yield* put({
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
        const text = yield* call(readFileAsText, action.payload.file);
        const items = parseSync(text);
        yield* put({
            type: ActionTypes.SubtitlesLoadSucceeded,
            payload: {key: action.payload.key, text: action.payload.text, items}
        });
    } catch (ex) {
        yield* put({type: ActionTypes.SubtitlesLoadFailed, payload: {key: action.payload.key, error: ex}});
    }
}

function* subtitlesReloadSaga(_action) {
    const state: AppStore = yield* select();
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

        yield* put({type: ActionTypes.SubtitlesLoadFromText, payload: {key, text}});
    }
}

export function* subtitlesLoadForTrimSaga() {
    const state: AppStore = yield* select();
    const {availableOptions} = state.subtitles;
    const availKeys = Object.keys(availableOptions).sort();

    for (const key of availKeys) {
        const {url} = availableOptions[key];
        let text = (availableOptions[key].text || '').trim();

        try {
            log.getLogger('subtitles').debug('here text', {text});
            if (!text) {
                text = yield* call(getSubtitles, url);
                log.getLogger('subtitles').debug('get subtitles');
            }
            const items = parseSync(text);
            log.getLogger('subtitles').debug('rsult items', {items});
            yield* put({type: ActionTypes.SubtitlesLoadForTrimSucceeded, payload: {key, items}});
        } catch (ex) {
        }
    }
}
