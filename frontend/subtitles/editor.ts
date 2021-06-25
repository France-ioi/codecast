/*
 *  Subtitles Editor
 */

import {call, put, select, take, takeLatest} from 'redux-saga/effects';
import {stringifySync} from 'subtitle';
import FileSaver from 'file-saver';
import {postJson} from '../common/utils';
import {getSubtitles, updateCurrentItem} from './utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {AppStore} from "../store";
import {initialStateSubtitles, SubtitlesOption, SubtitlesOptions} from "./index";
import {Bundle} from "../linker";
import {App} from "../index";
import {Screen} from "../common/screens";

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.SubtitlesSelected);
    bundle.addReducer(ActionTypes.SubtitlesSelected, subtitlesSelectedReducer);

    /* subtitlesAddOption adds a subtitles option to loaded recording. */
    bundle.defineAction(ActionTypes.SubtitlesOptionAdd);
    bundle.addReducer(ActionTypes.SubtitlesOptionAdd, subtitlesAddOptionReducer);

    /* subtitlesRemoveOption removes a subtitles option from the loaded recording. */
    bundle.defineAction(ActionTypes.SubtitlesOptionRemove);
    bundle.addReducer(ActionTypes.SubtitlesOptionRemove, subtitlesRemoveOptionReducer);

    /* subtitlesSaveOptions {key} opens a Save file dialog to save the current
       text for the subtitles option with the given key. */
    bundle.defineAction(ActionTypes.SubtitlesOptionSave);

    /* subtitlesTextReverted {key, url} reloads subtitles from the cloud. */
    bundle.defineAction(ActionTypes.SubtitlesTextReverted);

    /* subtitlesTextLoaded {key, file} loads subtitles from a File. */
    bundle.defineAction(ActionTypes.SubtitlesTextLoaded);

    /* subtitlesTextChanged {text, unsaved} is dispatched when the text of the
       selected subtitles is changed.  If `unsaved` is a boolean the corresponding
       flag is set accordingly. */
    bundle.defineAction(ActionTypes.SubtitlesTextChanged);
    bundle.addReducer(ActionTypes.SubtitlesTextChanged, subtitlesTextChangedReducer);

    /* subtitlesEditorEnter switches to the subtitles editor view (player
       view with added controls to edit subtitle items for the selected
       language) */
    bundle.defineAction(ActionTypes.SubtitlesEditorEnter);

    /* subtitlesEditorReturn switches back to the setup screen */
    bundle.defineAction(ActionTypes.SubtitlesEditorReturn);

    bundle.defineAction(ActionTypes.SubtitlesItemChanged);
    bundle.addReducer(ActionTypes.SubtitlesItemChanged, subtitlesItemChangedReducer);

    bundle.defineAction(ActionTypes.SubtitlesItemInserted);
    bundle.addReducer(ActionTypes.SubtitlesItemInserted, subtitlesItemInsertedReducer);

    bundle.defineAction(ActionTypes.SubtitlesItemRemoved);
    bundle.addReducer(ActionTypes.SubtitlesItemRemoved, subtitlesItemRemovedReducer);

    bundle.defineAction(ActionTypes.SubtitlesItemShifted);
    bundle.addReducer(ActionTypes.SubtitlesItemShifted, subtitlesItemShiftedReducer);

    /* subtitlesEditorSave is dispatched when the user clicks the 'Save' button
       on the setup screen. */
    bundle.defineAction(ActionTypes.SubtitlesEditorSave);
    bundle.addReducer(ActionTypes.SubtitlesEditorSave, subtitlesEditorSaveReducer);

    bundle.defineAction(ActionTypes.SubtitlesEditorSaveFailed);
    bundle.addReducer(ActionTypes.SubtitlesEditorSaveFailed, subtitlesEditorSaveFailedReducer);

    bundle.defineAction(ActionTypes.SubtitlesEditorSaveSucceeded);
    bundle.addReducer(ActionTypes.SubtitlesEditorSaveSucceeded, subtitlesEditorSaveSucceededReducer);

    /* subtitlesSave is dispatched when returning from the editor to the screen. */
    bundle.defineAction(ActionTypes.SubtitlesSave);
    bundle.addReducer(ActionTypes.SubtitlesSave, subtitlesSaveReducer);

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

function subtitlesSelectedReducer(state: AppStore, {payload: {option}}): void {
    clearNotify(state.subtitles);

    state.subtitles.selectedKey = option.key;
}

function subtitlesAddOptionReducer(state: AppStore, {payload: {key, select}}): void {
    const option = state.subtitles.availableOptions[key];
    if (!option) {
        const base = state.subtitles.langOptions.find(option => option.value === key);

        state.subtitles.availableOptions[key] = {
            key,
            text: '',
            unsaved: true,
            removed: false,
            url : '',
            ...base
        }
    } else if (option.removed) {
        state.subtitles.availableOptions[key].removed = false;
    }
    if (select && state.subtitles.availableOptions[key]) {
        state.subtitles.selectedKey = key;
    }

    setUnsaved(state.subtitles);
    clearNotify(state.subtitles);
}

function subtitlesRemoveOptionReducer(state: AppStore, {payload: {key}}): void {
    state.subtitles.availableOptions[key].removed = true;
    if (state.subtitles.selectedKey === key) {
        state.subtitles.selectedKey = null;
    }

    clearNotify(state.subtitles);
}


function subtitlesTextChangedReducer(state: AppStore, {payload: {text, unsaved}}): void {
    const {selectedKey: key} = state.subtitles;

    state.subtitles.availableOptions[key].text = text;
    if (typeof unsaved === 'boolean') {
        state.subtitles.availableOptions[key].unsaved = unsaved;
    }

    setUnsaved(state.subtitles);
    clearNotify(state.subtitles);
}

function subtitlesItemChangedReducer(state: AppStore, {payload: {index, text}}): void {
    state.subtitles.items[index].data.text = text;
}

function subtitlesItemInsertedReducer(state: AppStore, {payload: {index, offset, where}}): void {
    const {data: {start, end, text}} = state.subtitles.items[index];
    const split = start + offset;
    if (start > split && split > end) {
        return;
    }

    let jumpTo = start;
    if (where === 'below') {
        state.subtitles.items.splice(index, 1, {
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
        state.subtitles.items.splice(index, 1, {
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

    return updateCurrentItem(state.subtitles, jumpTo);
}

function subtitlesItemRemovedReducer(state: AppStore, {payload: {index, merge}}): void {
    if (index === 0 && merge === 'up') {
        return;
    }
    if (index === state.subtitles.items.length - 1 && merge === 'down') {
        return;
    }

    const otherIndex = merge === 'up' ? index - 1 : index + 1;
    const firstIndex = Math.min(index, otherIndex);
    const {start} = state.subtitles.items[firstIndex].data;
    const {end} = state.subtitles.items[firstIndex + 1].data;
    const {text} = state.subtitles.items[otherIndex].data;

    state.subtitles.items.splice(firstIndex, 2, {
        data: {
            start,
            end,
            text
        },
        type: 'cue'
    });

    const audioTime = state.player.audioTime;

    updateCurrentItem(state.subtitles, audioTime);
}

function subtitlesItemShiftedReducer(state: AppStore, {payload: {index, amount}}): void {
    if (index === 0) {
        return;
    }

    function shift(ms: number): number {
        return ms + amount;
    }

    /* The current item is not updated, otherwise its start could move
       backwards past audioTime, causing the item not to remain current,
       and disturbing further user action on the same item. */
    state.subtitles.items[index - 1].data.end = shift(state.subtitles.items[index - 1].data.end);
    state.subtitles.items[index].data.start = shift(state.subtitles.items[index].data.start);
}

function subtitlesSaveReducer(state: AppStore): void {
    const {selectedKey: key, items} = state.subtitles;
    const text = stringifySync(items, {
        format: 'SRT'
    });

    clearNotify(state.subtitles);

    state.subtitles.availableOptions[key].text = text;
}

function subtitlesEditorSaveReducer(state: AppStore): void {
    state.subtitles.notify.key = 'pending';
}

function subtitlesEditorSaveFailedReducer(state: AppStore, {payload: {error}}): void {
    state.subtitles.notify.key = 'failure';
    state.subtitles.notify.message = error.toString();
}

function subtitlesEditorSaveSucceededReducer(state: AppStore): void {
    state.subtitles.unsaved = false;
    state.subtitles.notify.key = 'success';

    clearAllUnsaved(state.subtitles.availableOptions);
}

function clearAllUnsaved(options: SubtitlesOptions) {
    for (let key of Object.keys(options)) {
        options[key].unsaved = false;
    }
}

function* subtitlesEditorSaga(state) {
    yield takeLatest(ActionTypes.SubtitlesSelected, subtitlesSelectedSaga, state);
    yield takeLatest(ActionTypes.SubtitlesEditorEnter, subtitlesEditorEnterSaga, state);
    yield takeLatest(ActionTypes.SubtitlesEditorSave, subtitlesEditorSaveSaga);
    yield takeLatest(ActionTypes.SubtitlesEditorReturn, subtitlesEditorReturnSaga, state);
    yield takeLatest(ActionTypes.SubtitlesTextReverted, subtitlesTextRevertedSaga, state);
    yield takeLatest(ActionTypes.SubtitlesTextLoaded, subtitlesTextLoadedSaga, state);
    yield takeLatest(ActionTypes.SubtitlesOptionSave, subtitlesSaveOptionSaga, state);
    yield takeLatest(ActionTypes.SubtitlesOptionAdd, function*() {
        yield put({type: ActionTypes.SubtitlesReload});
    });
    yield takeLatest(ActionTypes.SubtitlesOptionRemove, function*() {
        yield put({type: ActionTypes.SubtitlesReload});
    });
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
    yield put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Edit}});
}

function* subtitlesEditorReturnSaga(state, _action) {
    yield put({type: ActionTypes.SubtitlesSave});
    yield put({type: ActionTypes.SubtitlesEditingChanged, payload: {editing: false}});
    yield put({type: EditorActionTypes.EditorControlsChanged, payload: {controls: 'none'}});
    yield put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Setup}});
}

function* subtitlesEditorSaveSaga() {
    const state: AppStore = yield select();

    const {baseUrl} = state.options;
    const editor = state.editor;
    const base = editor.base;
    const subtitles = Object.values(state.subtitles.availableOptions).filter((subtitlesOption: SubtitlesOption) => {
        return !subtitlesOption.removed;
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

function* subtitlesSaveOptionSaga(app: App, action) {
    const state: AppStore = yield select();
    const {text} = state.subtitles.availableOptions[action.payload.key];
    const blob = new Blob([text], {type: "text/plain;charset=utf-8"});

    yield call(FileSaver.saveAs, blob, `${action.payload.key}.srt`);
}
