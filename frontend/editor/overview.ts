import {call, put, select, takeLatest} from 'redux-saga/effects';
import FileSaver from 'file-saver';
import {postJson} from '../common/utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from '../editor/actionTypes';
import {ActionTypes as AppActionTypes} from '../actionTypes';
import produce from "immer";
import {AppStore} from "../store";
import {EditorSaveState, initialStateEditor} from "./index";

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
        draft.editor = initialStateEditor;
    }));

    bundle.addReducer(EditorActionTypes.EditorPrepare, produce((draft: AppStore) => {
        draft.editor = initialStateEditor;
    }));

    bundle.defineAction(ActionTypes.EditorPropertyChanged);
    bundle.addReducer(ActionTypes.EditorPropertyChanged, produce(editorPropertyChangedReducer));

    bundle.defineAction(ActionTypes.EditorSaveAudio);

    bundle.defineAction(ActionTypes.EditorSave);
    bundle.addReducer(ActionTypes.EditorSave, produce(editorSaveReducer));

    bundle.defineAction(ActionTypes.EditorSaveFailed);
    bundle.addReducer(ActionTypes.EditorSaveFailed, produce(editorSaveFailedReducer));

    bundle.defineAction(ActionTypes.EditorSaveSucceeded);
    bundle.addReducer(ActionTypes.EditorSaveSucceeded, produce(editorSaveSucceededReducer));

    bundle.addSaga(function* editorOverviewSaga() {
        yield takeLatest(ActionTypes.EditorSaveAudio, editorSaveAudioSaga);
        yield takeLatest(ActionTypes.EditorSave, editorSaveSaga);
    });
}

function editorPropertyChangedReducer(draft: AppStore, {payload: {key, value}}): void {
    if (draft.editor.save.state != EditorSaveState.Pending) {
        draft.editor.data[key] = value;
        draft.editor.save.state = EditorSaveState.Idle;
        draft.editor.unsaved = true;
    }
}

function editorSaveReducer(draft: AppStore): void {
    draft.editor.save.state = EditorSaveState.Pending;
}

function editorSaveFailedReducer(draft: AppStore, {payload: {error}}) {
    draft.editor.save.state = EditorSaveState.Failure;
    draft.editor.save.error = error;
}

function editorSaveSucceededReducer(draft: AppStore): void {
    draft.editor.save.state = EditorSaveState.Success;
    draft.editor.unsaved = false;
}

function* editorSaveAudioSaga() {
    const {id, name} = yield select((state: AppStore) => {
        const editor = state.editor;
        const id = editor.base.replace(/^.*\//, '');
        const name = (editor.data.name || '').trim();

        return {id, name};
    });

    const saveAsName = `${name || id}.mp3`;
    const blob = yield select((state: AppStore) => state.editor.audioBlob);

    yield call(FileSaver.saveAs, blob, saveAsName);
}

function* editorSaveSaga() {
    const {baseUrl, base, name} = yield select((state: AppStore) => {
        const {baseUrl} = state.options;
        const editor = state.editor;
        const base = editor.base;
        const {name} = editor.data;

        return {baseUrl, base, name};
    });

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
