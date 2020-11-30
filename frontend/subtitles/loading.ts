/* "Loading subtitles" in this context means parsing a SRT resource
   (obtained in a number of ways) and making the individual subtitle
   items ({start, end, text} objects, timestamps in milliseconds) */
import {parseSync, stringifySync} from 'subtitle';
import {call, put, select, takeLatest} from 'redux-saga/effects';
import update from 'immutability-helper';

import {readFileAsText} from '../common/utils';
import {filterItems, getSubtitles, updateCurrentItem} from './utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";

export default function (bundle) {
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

function subtitlesClearedReducer(state, _action) {
    return state.update('subtitles', subtitles => (
        {...subtitles, loaded: false, text: '', items: [], filteredItems: [], currentIndex: 0, loadedKey: 'none'}));
}

function subtitlesLoadStartedReducer(state, {payload: {key}}) {
    return state.update('subtitles', subtitles => (
        {...subtitles, loaded: false, loading: key, lastError: false}));
}

function subtitlesLoadSucceededReducer(state, {payload: {key, text, items}}) {
    return state
        .update('subtitles', subtitles => (
            updateCurrentItem({
                ...subtitles,
                loaded: true,
                loading: false,
                loadedKey: key,
                text,
                items,
                filteredItems: filterItems(items, subtitles.filterRegexp)
            })
        ));
}

function subtitlesLoadFailedReducer(state, {payload: {error}}) {
    let errorText = state.get('getMessage')('SUBTITLES_FAILED_TO_LOAD').s;
    if (error.res) {
        errorText = `${errorText} (${error.res.statusCode})`;
    }

    return state.update('subtitles', subtitles => ({
        ...subtitles,
        loaded: false,
        loading: false,
        lastError: errorText,
        text: errorText,
        loadedKey: 'none'
    }));
}

function subtitlesLoadForTrimSucceededReducer(state, {payload: {key, items}}) {
    return state.update('subtitles', subtitles =>
        update(subtitles, {
            trim: {
                loaded: {$push: [{key, items}]}
            }
        })
    );
}

function subtitlesTrimDoneReducer(state, {payload: {subtitles: data}}) {
    return state
        .update('subtitles', subtitles => {
            const updateObj = {};
            for (const {key, text} of data) {
                updateObj[key] = {text: {$set: text}, unsaved: {$set: true}}
            }

            if (data.length > 0) {
                return update(subtitles, {
                    availableOptions: updateObj
                })
            } else {
                return subtitles
            }
        });
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
    const {selectedKey: key, availableOptions} = yield select(state => state.get('subtitles'));

    if (key) {
        /* Generate an initial item covering the entire recording (needed because
           the editor works by splitting existing items at a specific position). */
        let text = (availableOptions[key].text || '').trim();
        if (!text) {
            const data = yield select(state => state.getIn(['player', 'data']));

            text = stringifySync([{
                data: {
                    start: 0,
                    end: data.events[data.events.length - 1][0],
                    text: ''
                },
                type: "cue"
            }], {
                format: "SRT"
            });
        }

        yield put({type: ActionTypes.SubtitlesLoadFromText, payload: {key, text}});
    }
}

function* subtitlesLoadForTrimSaga(_action) {
    const {availableOptions} = yield select(state => state.get('subtitles'));
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
