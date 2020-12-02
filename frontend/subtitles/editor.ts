/*
 *  Subtitles Editor
 */

import {call, put, select, take, takeLatest} from 'redux-saga/effects';
import update, {Spec} from 'immutability-helper';
import {stringifySync} from 'subtitle';
import FileSaver from 'file-saver';

import {postJson} from '../common/utils';
import {getSubtitles, updateCurrentItem} from './utils';
import {SubtitlesEditorPane} from "./views/SubtitlesEditorPane";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {PlayerControls} from "../player/PlayerControls";
import {SubtitlesEditor} from "./SubtitlesEditor";
import {SubtitlesEditorReturn} from "./SubtitlesEditorReturn";

export default function (bundle) {
    bundle.defineAction(ActionTypes.SubtitlesSelected);
    bundle.addReducer(ActionTypes.SubtitlesSelected, subtitlesSelectedReducer);

    /* subtitlesAddOption adds a subtitles option to loaded recording. */
    bundle.defineAction(ActionTypes.SubtitlesAddOption);
    bundle.addReducer(ActionTypes.SubtitlesAddOption, subtitlesAddOptionReducer);

    /* subtitlesRemoveOption removes a subtitles option from the loaded recording. */
    bundle.defineAction(ActionTypes.SubtitlesRemoveOption);
    bundle.addReducer(ActionTypes.SubtitlesRemoveOption, subtitlesRemoveOptionReducer);

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

function clearNotify(subtitles) {
    return {...subtitles, notify: {}};
}

function setUnsaved(subtitles) {
    return {...subtitles, unsaved: true};
}

function subtitlesSelectedReducer(state, {payload: {option}}) {
    return state.update('subtitles', subtitles => clearNotify({...subtitles, selectedKey: option.key}));
}

function subtitlesAddOptionReducer(state, {payload: {key, select}}) {
    return state.update('subtitles', function (subtitles) {
        const option = subtitles.availableOptions[key];
        if (!option) {
            const base = subtitles.langOptions.find(option => option.value === key);
            subtitles = update(subtitles, {availableOptions: {[key]: {$set: {key, text: '', unsaved: true, ...base}}}});
        } else if (option.removed) {
            subtitles = update(subtitles, {availableOptions: {[key]: {removed: {$set: false}}}});
        }
        if (select && subtitles.availableOptions[key]) {
            subtitles = update(subtitles, {selectedKey: {$set: key}});
        }

        return setUnsaved(clearNotify(subtitles));
    });
}

function subtitlesRemoveOptionReducer(state, {payload: {key}}) {
    return state.update('subtitles', function (subtitles) {
        const changes: Spec<any> = {availableOptions: {[key]: {removed: {$set: true}}}};
        if (subtitles.selectedKey === key) {
            changes.selectedKey = {$set: null};
        }

        return setUnsaved(clearNotify(update(subtitles, changes)));
    });
}


function subtitlesTextChangedReducer(state, {payload: {text, unsaved}}) {
    const changes: Spec<any> = {text: {$set: text}};
    if (typeof unsaved === 'boolean') {
        changes.unsaved = {$set: unsaved}
    }

    return state.update('subtitles', function (subtitles) {
        const {selectedKey: key} = subtitles;

        return setUnsaved(clearNotify(update(subtitles, {availableOptions: {[key]: changes}})));
    });
}

function subtitlesItemChangedReducer(state, {payload: {index, text}}) {
    return state.update('subtitles', function (subtitles) {
        return update(subtitles, {items: {[index]: {data: {text: {$set: text}}}}});
    });
}

function subtitlesItemInsertedReducer(state, {payload: {index, offset, where}}) {
    return state.update('subtitles', function (subtitles) {
        const {data: {start, end, text}} = subtitles.items[index];
        const split = start + offset;
        if (start > split && split > end) {
            return subtitles;
        }

        let jumpTo = start;
        if (where === 'below') {
            subtitles = update(subtitles, {
                items: {
                    $splice: [
                        [
                            index,
                            1,
                            {
                                data: {
                                    start,
                                    end: split - 1,
                                    text
                                },
                                type: "cue"
                            }, {
                            data: {
                                start: split,
                                end,
                                text: ''
                            },
                            type: "cue"
                        }
                        ]
                    ]
                }
            });

            jumpTo = split;
        }
        if (where === 'above') {
            subtitles = update(subtitles, {
                items: {
                    $splice: [
                        [
                            index,
                            1,
                            {
                                data: {
                                    start,
                                    end: split - 1,
                                    text: ''
                                },
                                type: "cue"
                            }, {
                            data: {
                                start: split,
                                end,
                                text
                            },
                            type: "cue"
                        }
                        ]
                    ]
                }
            });

            jumpTo = start;
        }

        return updateCurrentItem(subtitles, jumpTo);
    });
}

function subtitlesItemRemovedReducer(state, {payload: {index, merge}}) {
    return state.update('subtitles', function (subtitles) {
        if (index === 0 && merge === 'up') {
            return subtitles;
        }
        if (index === subtitles.items.length - 1 && merge === 'down') {
            return subtitles;
        }

        const otherIndex = merge === 'up' ? index - 1 : index + 1;
        const firstIndex = Math.min(index, otherIndex);
        const {start} = subtitles.items[firstIndex].data;
        const {end} = subtitles.items[firstIndex + 1].data;
        const {text} = subtitles.items[otherIndex].data;

        subtitles = update(subtitles, {
            items: {
                $splice: [
                    [
                        firstIndex,
                        2,
                        {
                            data: {
                                start,
                                end,
                                text
                            },
                            type: "cue"
                        }
                    ]
                ]
            }
        });

        const audioTime = state.getIn(['player', 'audioTime']);

        return updateCurrentItem(subtitles, audioTime);
    });
}

function subtitlesItemShiftedReducer(state, {payload: {index, amount}}) {
    return state.update('subtitles', function (subtitles) {
        if (index === 0) {
            return subtitles;
        }

        function shift(ms) {
            return ms + amount;
        }

        /* The current item is not updated, otherwise its start could move
           backwards past audioTime, causing the item not to remain current,
           and disturbing further user action on the same item. */
        return update(subtitles, {
            items: {
                [index - 1]: {
                    data: {
                        end: {$apply: shift}
                    }
                },
                [index]: {
                    data: {
                        start: {$apply: shift}
                    }
                }
            }
        });
    });
}

function subtitlesSaveReducer(state, action) {
    return state.update('subtitles', function (subtitles) {
        const {selectedKey: key, items} = subtitles;
        const text = stringifySync(items, {
            format: 'SRT'
        });

        return clearNotify(update(subtitles, {availableOptions: {[key]: {text: {$set: text}}}}));
    });
}

function subtitlesEditorSaveReducer(state, action) {
    return state.update('subtitles', subtitles => ({...subtitles, notify: {key: 'pending'}}));
}

function subtitlesEditorSaveFailedReducer(state, {payload: {error}}) {
    return state.update('subtitles', subtitles => ({
        ...subtitles,
        notify: {key: 'failure', message: error.toString()}
    }));
}

function subtitlesEditorSaveSucceededReducer(state, action) {
    return state.update('subtitles', subtitles =>
        update(subtitles, {
            unsaved: {$set: false},
            notify: {$set: {key: 'success'}},
            availableOptions: {$apply: clearAllUnsaved}
        }));
}

function clearAllUnsaved(options) {
    const changes = {};
    for (let key of Object.keys(options)) {
        changes[key] = {unsaved: {$set: false}};
    }

    return update(options, changes);
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
        payload: {controls: {top: [PlayerControls], floating: [SubtitlesEditorReturn]}}
    });
    yield put({type: ActionTypes.SubtitlesReload});
    yield put({type: CommonActionTypes.SystemSwitchToScreen, payload: {screen: 'edit'}});
}

function* subtitlesEditorReturnSaga(state, _action) {
    yield put({type: ActionTypes.SubtitlesSave});
    yield put({type: ActionTypes.SubtitlesEditingChanged, payload: {editing: false}});
    yield put({type: EditorActionTypes.EditorControlsChanged, payload: {controls: {floating: []}}});
    yield put({type: CommonActionTypes.SystemSwitchToScreen, payload: {screen: 'setup'}});
}

function* subtitlesEditorSaveSaga(state, _action) {
    const {baseUrl, base, subtitles} = yield select(function (state) {
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
    const {text} = yield select(state => state.get('subtitles').availableOptions[action.payload.key]);
    const blob = new Blob([text], {type: "text/plain;charset=utf-8"});

    yield call(FileSaver.saveAs, blob, `${action.payload.key}.srt`);
}
