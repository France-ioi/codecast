/*
 *  Subtitles Editor
 */

import {call, put, select, take, takeLatest} from 'redux-saga/effects';
import update, {Spec} from 'immutability-helper';
import {stringifySync} from 'subtitle';
import FileSaver from 'file-saver';

import {postJson} from '../common/utils';
import {getSubtitles, updateCurrentItem} from './utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import produce from "immer";
import {AppStore} from "../store";
import {initialStateSubtitles} from "./index";

export default function(bundle) {
    bundle.defineAction(ActionTypes.SubtitlesSelected);
    bundle.addReducer(ActionTypes.SubtitlesSelected, produce(subtitlesSelectedReducer));

    /* subtitlesAddOption adds a subtitles option to loaded recording. */
    bundle.defineAction(ActionTypes.SubtitlesAddOption);
    bundle.addReducer(ActionTypes.SubtitlesAddOption, produce(subtitlesAddOptionReducer));

    /* subtitlesRemoveOption removes a subtitles option from the loaded recording. */
    bundle.defineAction(ActionTypes.SubtitlesRemoveOption);
    bundle.addReducer(ActionTypes.SubtitlesRemoveOption, produce(subtitlesRemoveOptionReducer));

    /* subtitlesSaveOptions {key} opens a Save file dialog to save the current
       text for the subtitles option with the given key. */
    bundle.defineAction(ActionTypes.SubtitlesSaveOption);

    /* subtitlesTextReverted {key, url} reloads subtitles from the cloud. */
    bundle.defineAction(ActionTypes.SubtitlesTextReverted);

    /* subtitlesTextLoaded {key, file} loads subtitles from a File. */
    bundle.defineAction(ActionTypes.SubtitlesTextLoaded);

    /* subtitlesTextChanged {text, unsaved} is dispatched when the text of the
       selected subtitles is changed.  If `unsaved` is a boolean the corresponding
       flag is set accordingly. */
    bundle.defineAction(ActionTypes.SubtitlesTextChanged);
    bundle.addReducer(ActionTypes.SubtitlesTextChanged, produce(subtitlesTextChangedReducer));

    /* subtitlesEditorEnter switches to the subtitles editor view (player
       view with added controls to edit subtitle items for the selected
       language) */
    bundle.defineAction(ActionTypes.SubtitlesEditorEnter);

    /* subtitlesEditorReturn switches back to the setup screen */
    bundle.defineAction(ActionTypes.SubtitlesEditorReturn);

    bundle.defineAction(ActionTypes.SubtitlesItemChanged);
    bundle.addReducer(ActionTypes.SubtitlesItemChanged, produce(subtitlesItemChangedReducer));

    bundle.defineAction(ActionTypes.SubtitlesItemInserted);
    bundle.addReducer(ActionTypes.SubtitlesItemInserted, produce(subtitlesItemInsertedReducer));

    bundle.defineAction(ActionTypes.SubtitlesItemRemoved);
    bundle.addReducer(ActionTypes.SubtitlesItemRemoved, produce(subtitlesItemRemovedReducer));

    bundle.defineAction(ActionTypes.SubtitlesItemShifted);
    bundle.addReducer(ActionTypes.SubtitlesItemShifted, produce(subtitlesItemShiftedReducer));

    /* subtitlesEditorSave is dispatched when the user clicks the 'Save' button
       on the setup screen. */
    bundle.defineAction(ActionTypes.SubtitlesEditorSave);
    bundle.addReducer(ActionTypes.SubtitlesEditorSave, produce(subtitlesEditorSaveReducer));

    bundle.defineAction(ActionTypes.SubtitlesEditorSaveFailed);
    bundle.addReducer(ActionTypes.SubtitlesEditorSaveFailed, produce(subtitlesEditorSaveFailedReducer));

    bundle.defineAction(ActionTypes.SubtitlesEditorSaveSucceeded);
    bundle.addReducer(ActionTypes.SubtitlesEditorSaveSucceeded, produce(subtitlesEditorSaveSucceededReducer));

    /* subtitlesSave is dispatched when returning from the editor to the screen. */
    bundle.defineAction(ActionTypes.SubtitlesSave);
    bundle.addReducer(ActionTypes.SubtitlesSave, produce(subtitlesSaveReducer));

    bundle.addSaga(subtitlesEditorSaga);
}

function clearNotify(subtitles: typeof initialStateSubtitles) {
    subtitles.notify = {
        key: '',
        message: ''
    };
}

function setUnsaved(subtitles: typeof initialStateSubtitles) {
    subtitles.unsaved = true;
}

function subtitlesSelectedReducer(draft: AppStore, {payload: {option}}): void {
    clearNotify(draft.subtitles);
    draft.subtitles.selectedKey = option.key;
}

function subtitlesAddOptionReducer(draft: AppStore, {payload: {key, select}}): void {
    const option = draft.subtitles.availableOptions[key];
    if (!option) {
        const base = draft.subtitles.langOptions.find(option => option.value === key);

        draft.subtitles.availableOptions[key] = {
            key,
            text: '',
            unsaved: true,
            ...base
        }
    } else if (option.removed) {
        draft.subtitles.availableOptions[key].removed = false;
    }
    if (select && draft.subtitles.availableOptions[key]) {
        draft.subtitles.selectedKey = key;
    }

    setUnsaved(draft.subtitles);
    clearNotify(draft.subtitles);
}

function subtitlesRemoveOptionReducer(draft: AppStore, {payload: {key}}): void {
    draft.subtitles.availableOptions[key].removed = true;
    if (draft.subtitles.selectedKey === key) {
        draft.subtitles.selectedKey = null;
    }

    clearNotify(draft.subtitles);
}


function subtitlesTextChangedReducer(draft: AppStore, {payload: {text, unsaved}}): void {
    const {selectedKey: key} = draft.subtitles;

    draft.subtitles.availableOptions[key].text = text;
    if (typeof unsaved === 'boolean') {
        draft.subtitles.availableOptions[key].unsaved = unsaved;
    }

    setUnsaved(draft.subtitles);
    clearNotify(draft.subtitles);
}

function subtitlesItemChangedReducer(draft: AppStore, {payload: {index, text}}): void {
    draft.subtitles.items[index].data.text = text;
}

function subtitlesItemInsertedReducer(draft: AppStore, {payload: {index, offset, where}}): void {
    const {data: {start, end, text}} = draft.subtitles.items[index];
    const split = start + offset;
    if (start > split && split > end) {
        return;
    }

    let jumpTo = start;
    if (where === 'below') {
        draft.subtitles.items = draft.subtitles.items.splice(index, 1, {
            data: {
                start,
                end: split - 1,
                text
            },
            type: 'cue'
        }, {
            data: {
                start: split,
                end,
                text: ''
            },
            type: 'cue'
        });

        jumpTo = split;
    }
    if (where === 'above') {
        draft.subtitles.items = draft.subtitles.items.splice(index, 1, {
            data: {
                start,
                end: split - 1,
                text: ''
            },
            type: 'cue'
        }, {
            data: {
                start: split,
                end,
                text
            },
            type: 'cue'
        });

        jumpTo = start;
    }

    return updateCurrentItem(draft.subtitles, jumpTo);
}

function subtitlesItemRemovedReducer(draft: AppStore, {payload: {index, merge}}): void {
    if (index === 0 && merge === 'up') {
        return;
    }
    if (index === draft.subtitles.items.length - 1 && merge === 'down') {
        return;
    }

    const otherIndex = merge === 'up' ? index - 1 : index + 1;
    const firstIndex = Math.min(index, otherIndex);
    const {start} = draft.subtitles.items[firstIndex].data;
    const {end} = draft.subtitles.items[firstIndex + 1].data;
    const {text} = draft.subtitles.items[otherIndex].data;

    draft.subtitles.items.splice(firstIndex, 2, {
        data: {
            start,
            end,
            text
        },
        type: 'cue'
    });

    const audioTime = draft.player.audioTime;

    updateCurrentItem(draft.subtitles, audioTime);
}

function subtitlesItemShiftedReducer(draft: AppStore, {payload: {index, amount}}): void {
    if (index === 0) {
        return;
    }

    function shift(ms: number): number {
        return ms + amount;
    }

    /* The current item is not updated, otherwise its start could move
       backwards past audioTime, causing the item not to remain current,
       and disturbing further user action on the same item. */
    draft.subtitles.items[index - 1].data.end = shift(draft.subtitles.items[index - 1].data.end);
    draft.subtitles.items[index].data.start = shift(draft.subtitles.items[index].data.start);
}

function subtitlesSaveReducer(draft: AppStore): void {
    const {selectedKey: key, items} = draft.subtitles;
    const text = stringifySync(items, {
        format: 'SRT'
    });

    clearNotify(draft.subtitles);

    draft.subtitles.availableOptions[key].text = text;
}

function subtitlesEditorSaveReducer(draft: AppStore): void {
    draft.subtitles.notify.key = 'pending';
}

function subtitlesEditorSaveFailedReducer(draft: AppStore, {payload: {error}}): void {
    draft.subtitles.notify.key = 'failure';
    draft.subtitles.notify.message = error.toString();
}

function subtitlesEditorSaveSucceededReducer(draft: AppStore): void {
    draft.subtitles.unsaved = false;
    draft.subtitles.notify.key = 'success';

    clearAllUnsaved(draft.subtitles.availableOptions);
}

function clearAllUnsaved(options: typeof initialStateSubtitles.availableOptions) {
    for (let key of Object.keys(options)) {
        options[key].unsaved = false;
    }
}

function* subtitlesEditorSaga(state) {
    yield takeLatest(ActionTypes.SubtitlesSelected, subtitlesSelectedSaga, state);
    yield takeLatest(ActionTypes.SubtitlesEditorEnter, subtitlesEditorEnterSaga, state);
    yield takeLatest(ActionTypes.SubtitlesEditorSave, subtitlesEditorSaveSaga, state);
    yield takeLatest(ActionTypes.SubtitlesEditorReturn, subtitlesEditorReturnSaga, state);
    yield takeLatest(ActionTypes.SubtitlesTextReverted, subtitlesTextRevertedSaga, state);
    yield takeLatest(ActionTypes.SubtitlesTextLoaded, subtitlesTextLoadedSaga, state);
    yield takeLatest(ActionTypes.SubtitlesSaveOption, subtitlesSaveOptionSaga, state);
}

function* subtitlesSelectedSaga(state, action) {
    /* Trigger loading of subtitles when first selected. */
    const {key, url, text} = action.payload.option;
    if (url && !text) {
        yield put({type: ActionTypes.SubtitlesTextReverted, payload: {key, url}});
    }
}

function* subtitlesEditorEnterSaga(state, _action) {
    yield put({type: ActionTypes.SubtitlesEditingChanged, payload: {editing: true}});
    yield put({
        type: EditorActionTypes.EditorControlsChanged,
        payload: {
            controls: 'subtitles'
        }
    });
    yield put({type: ActionTypes.SubtitlesReload});
    yield put({type: CommonActionTypes.SystemSwitchToScreen, payload: {screen: 'edit'}});
}

function* subtitlesEditorReturnSaga(state, _action) {
    yield put({type: ActionTypes.SubtitlesSave});
    yield put({type: ActionTypes.SubtitlesEditingChanged, payload: {editing: false}});
    yield put({type: EditorActionTypes.EditorControlsChanged, payload: {controls: 'none'}});
    yield put({type: CommonActionTypes.SystemSwitchToScreen, payload: {screen: 'setup'}});
}

function* subtitlesEditorSaveSaga(state, _action) {
    const {baseUrl, base, subtitles} = yield select(function(state) {
        const {baseUrl} = state.get('options');
        const editor = state.get('editor');
        const base = editor.get('base');
        const subtitles = Object.values(state.get('subtitles').availableOptions);

        return {baseUrl, base, subtitles};
    });

    const changes = {subtitles};

    let result;
    try {
        // TODO: also pass new base when copying
        result = yield call(postJson, `${baseUrl}/save`, {base, changes});
    } catch (ex) {
        result = {error: ex.toString()};
    }

    if (result.error) {
        yield put({type: ActionTypes.SubtitlesEditorSaveFailed, payload: {error: result.error}});
        return;
    }

    const timestamp = new Date();

    yield put({type: ActionTypes.SubtitlesEditorSaveSucceeded, payload: {timestamp}});
}

function* subtitlesTextRevertedSaga(state, action) {
    const text = yield call(getSubtitles, action.payload.url);

    /* Text is loaded from server, so clear the unsaved flag. */
    yield put({type: ActionTypes.SubtitlesTextChanged, payload: {text, unsaved: false}});
}

function* subtitlesTextLoadedSaga(state, action) {
    yield put({type: ActionTypes.SubtitlesLoadFromFile, payload: {
        key: action.payload.key,
        file: action.payload.file
    }});

    while (true) {
        const loadAction = yield take([ActionTypes.SubtitlesLoadSucceeded, ActionTypes.SubtitlesLoadFailed]);
        if (loadAction.payload.key !== action.payload.key) {
            continue;
        }
        if (loadAction.type === ActionTypes.SubtitlesLoadSucceeded) {
            const {text} = loadAction.payload;

            yield put({type: ActionTypes.SubtitlesTextChanged, payload: {text, unsaved: true}});
        }

        break;
    }
}

function* subtitlesSaveOptionSaga(_app, action) {
    const state: AppStore = yield select();
    const {text} = state.subtitles.availableOptions[action.payload.key];
    const blob = new Blob([text], {type: "text/plain;charset=utf-8"});

    yield call(FileSaver.saveAs, blob, `${action.payload.key}.srt`);
}
