import {call, put, select, takeLatest} from 'typed-redux-saga';
import FileSaver from 'file-saver';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as EditorActionTypes} from '../editor/actionTypes';
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {AppStore} from "../store";
import {EditorSaveState, getInitialStateEditor} from "./index";
import {Bundle} from "../linker";
import {SubtitlesOption} from "../subtitles";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ensureLoggedSaga} from "../recorder/save_screen";
import {Screen} from "../common/screens";
import {clearAllUnsaved} from "../subtitles/editor";
import {asyncRequestJson} from "../utils/api";

export default function (bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.editor = {...getInitialStateEditor()};
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

    bundle.defineAction(ActionTypes.EditorSaveClear);
    bundle.addReducer(ActionTypes.EditorSaveClear, editorSaveClearReducer);

    bundle.defineAction(ActionTypes.EditorSaveFailed);
    bundle.addReducer(ActionTypes.EditorSaveFailed, editorSaveFailedReducer);

    bundle.defineAction(ActionTypes.EditorSaveSucceeded);
    bundle.addReducer(ActionTypes.EditorSaveSucceeded, editorSaveSucceededReducer);

    bundle.addSaga(function* editorOverviewSaga() {
        yield* takeLatest(ActionTypes.EditorSaveAudio, editorSaveAudioSaga);
        yield* takeLatest(ActionTypes.EditorSave, editorSaveSaga);
        // @ts-ignore
        yield* takeLatest(CommonActionTypes.AppSwitchToScreen, function* ({payload: {screen}}) {
            if (Screen.EditorSave === screen) {
                yield* call(ensureLoggedSaga);
            }
        });
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

function editorSaveClearReducer(state: AppStore): void {
    state.editor.save.state = EditorSaveState.Idle;
    state.editor.save.step = null;
    state.editor.save.error = null;
    state.editor.save.progress = null;
}

function editorSaveFailedReducer(state: AppStore, {payload: {error}}) {
    state.editor.save.state = EditorSaveState.Failure;
    state.editor.save.error = error;
    state.editor.save.step = null;
}

function editorSaveSucceededReducer(state: AppStore, {payload: {playerUrl, editorUrl}}): void {
    state.editor.save.state = EditorSaveState.Success;
    state.editor.save.step = null;
    if (playerUrl) {
        state.editor.playerUrl = playerUrl;
    }
    if (editorUrl) {
        state.editor.editorUrl = editorUrl;
    }
    state.editor.unsaved = false;
    state.editor.trim.unsaved = false;
    state.subtitles.unsaved = false;
    clearAllUnsaved(state.subtitles.availableOptions);
}

function* editorSaveAudioSaga() {
    const state: AppStore = yield* select();

    const editor = state.editor;
    const id = editor.base.replace(/^.*\//, '');
    const name = (editor.data.name || '').trim();

    const saveAsName = `${name || id}.mp3`;
    const blob = state.editor.audioBlob;

    yield* call(FileSaver.saveAs, blob, saveAsName);
}

function* editorSaveSaga() {
    const state: AppStore = yield* select();

    const {baseUrl} = state.options;
    const editor = state.editor;
    const base = editor.base;
    const {name} = editor.data;

    const changes = {name};
    if (state.subtitles.unsaved) {
        changes['subtitles'] = Object.values(state.subtitles.availableOptions).filter((subtitlesOption: SubtitlesOption) => {
            return !subtitlesOption.removed;
        });
    }

    let result;
    try {
        result = yield* call(asyncRequestJson, `${baseUrl}/save`, {base, changes});
    } catch (ex) {
        result = {error: ex.toString()};
    }

    if (result.error) {
        yield* put({type: ActionTypes.EditorSaveFailed, payload: {error: result.error}});

        return;
    }

    const timestamp = new Date();

    yield* put({type: ActionTypes.EditorSaveSucceeded, payload: {timestamp}});
}
