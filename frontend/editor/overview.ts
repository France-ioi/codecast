import {call, put, select, takeLatest} from 'redux-saga/effects';
import FileSaver from 'file-saver';
import {postJson} from '../common/utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from '../editor/actionTypes';
import {ActionTypes as AppActionTypes} from '../actionTypes';
import produce from "immer";
import {AppStore} from "../store";
import {initialStateEditor} from "./index";

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
        draft.editor = initialStateEditor;
    }));

    bundle.addReducer(EditorActionTypes.EditorPrepare, produce((draft: AppStore) => {
        draft.editor = initialStateEditor;
    }));

    bundle.defineAction(ActionTypes.EditorPropertyChanged);
    bundle.addReducer(ActionTypes.EditorPropertyChanged, editorPropertyChangedReducer);

    bundle.defineAction(ActionTypes.EditorSaveAudio);

    bundle.defineAction(ActionTypes.EditorSave);
    bundle.addReducer(ActionTypes.EditorSave, editorSaveReducer);

    bundle.defineAction(ActionTypes.EditorSaveFailed);
    bundle.addReducer(ActionTypes.EditorSaveFailed, editorSaveFailedReducer);

    bundle.defineAction(ActionTypes.EditorSaveSucceeded);
    bundle.addReducer(ActionTypes.EditorSaveSucceeded, editorSaveSucceededReducer);

    bundle.addSaga(function* editorOverviewSaga(app) {
        yield takeLatest(ActionTypes.EditorSaveAudio, editorSaveAudioSaga, app);
        yield takeLatest(ActionTypes.EditorSave, editorSaveSaga, app);
    });
}

function editorPropertyChangedReducer(state, {payload: {key, value}}) {
    return state.update('editor', editor =>
        editor.get('save').state === 'pending'
            ? editor
            : editor
                .update('data', data => ({...data, [key]: value}))
                .set('save', {state: 'idle'})
                .set('unsaved', true));
}

function editorSaveReducer(state, action) {
    return state.setIn(['editor', 'save'], {state: 'pending'});
}

function editorSaveFailedReducer(state, {payload: {error}}) {
    return state.setIn(['editor', 'save'], {state: 'failure', error});
}

function editorSaveSucceededReducer(state, action) {
    return state.update('editor', editor => editor
        .set('save', {state: 'success'})
        .set('unsaved', false)
    );
}

function* editorSaveAudioSaga(_app, _action) {
    const {id, name} = yield select(function(state) {
        const editor = state.get('editor');
        const id = editor.get('base').replace(/^.*\//, '');
        const name = (editor.get('data').name || '').trim();
        return {id, name};
    });

    const saveAsName = `${name || id}.mp3`;
    const blob = yield select(state => state.getIn(['editor', 'audioBlob']));

    yield call(FileSaver.saveAs, blob, saveAsName);
}

function* editorSaveSaga(app, _action) {
    const {baseUrl, base, name} = yield select(function(state) {
        const {baseUrl} = state.get('options');
        const editor = state.get('editor');
        const base = editor.get('base');
        const {name} = editor.get('data');

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
