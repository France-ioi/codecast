import {call, put, select, takeLatest} from 'redux-saga/effects';
import FileSaver from 'file-saver';
import {postJson} from '../common/utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from '../editor/actionTypes';
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {AppStore} from "../store";
import {EditorSaveState, initialStateEditor} from "./index";
import {Bundle} from "../linker";

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.editor = initialStateEditor;
    });

    bundle.addReducer(EditorActionTypes.EditorPrepare, (state: AppStore) => {
        state.editor.save.state = EditorSaveState.Idle;
        state.editor.unsaved = false;
    });

    bundle.defineAction(ActionTypes.EditorPropertyChanged);
    bundle.addReducer(ActionTypes.EditorPropertyChanged, editorPropertyChangedReducer);

    bundle.defineAction(ActionTypes.EditorSaveAudio);

    bundle.defineAction(ActionTypes.EditorSave);
    bundle.addReducer(ActionTypes.EditorSave, editorSaveReducer);

    bundle.defineAction(ActionTypes.EditorSaveFailed);
    bundle.addReducer(ActionTypes.EditorSaveFailed, editorSaveFailedReducer);

    bundle.defineAction(ActionTypes.EditorSaveSucceeded);
    bundle.addReducer(ActionTypes.EditorSaveSucceeded, editorSaveSucceededReducer);

    bundle.addSaga(function* editorOverviewSaga() {
        yield takeLatest(ActionTypes.EditorSaveAudio, editorSaveAudioSaga);
        yield takeLatest(ActionTypes.EditorSave, editorSaveSaga);
    });
}

function editorPropertyChangedReducer(state: AppStore, {payload: {key, value}}): void {
    if (state.editor.save.state != EditorSaveState.Pending) {
        state.editor.data[key] = value;
        state.editor.save.state = EditorSaveState.Idle;
        state.editor.unsaved = true;
    }
}

function editorSaveReducer(state: AppStore): void {
    state.editor.save.state = EditorSaveState.Pending;
}

function editorSaveFailedReducer(state: AppStore, {payload: {error}}) {
    state.editor.save.state = EditorSaveState.Failure;
    state.editor.save.error = error;
}

function editorSaveSucceededReducer(state: AppStore): void {
    state.editor.save.state = EditorSaveState.Success;
    state.editor.unsaved = false;
}

function* editorSaveAudioSaga() {
    const state: AppStore = yield select();

    const editor = state.editor;
    const id = editor.base.replace(/^.*\//, '');
    const name = (editor.data.name || '').trim();

    const saveAsName = `${name || id}.mp3`;
    const blob = state.editor.audioBlob;

    yield call(FileSaver.saveAs, blob, saveAsName);
}

function* editorSaveSaga() {
    const state: AppStore = yield select();

    const {baseUrl} = state.options;
    const editor = state.editor;
    const base = editor.base;
    const {name} = editor.data;

    const changes = {name};
    let result;
    try {
        result = yield call(postJson, `${baseUrl}/save`, {base, changes});
    } catch (ex) {
        result = {error: ex.toString()};
    }

    if (result.error) {
        yield put({type: ActionTypes.EditorSaveFailed, payload: {error: result.error}});

        return;
    }

    yield put({type: ActionTypes.EditorSaveSucceeded});
}
