import React from 'react';
import {call, put, select, take, takeEvery} from 'redux-saga/effects';
import {getAudio} from '../common/utils';
import {extractWaveform} from './waveform/tools';
import OverviewBundle from './overview';
import TrimBundle, {initialStateTrimSaving} from './trim';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from '../common/actionTypes';
import {ActionTypes as PlayerActionTypes} from '../player/actionTypes';
import produce from "immer";
import {AppStore} from "../store";

export type EditorControl = 'none' | 'trim' | 'subtitles';

export enum EditorSaveState {
    Idle = 'idle',
    Pending = 'pending',
    Success = 'success',
    Failure = 'failure'
}

export const initialStateEditor = {
    save: {
        state: EditorSaveState.Idle,
        error: ''
    },
    unsaved: false,
    controls: 'none' as EditorControl,
    audioLoadProgress: 0,
    setupTabId: 'setup-tab-infos',
    base: '',
    dataUrl: '',
    playerUrl: '',
    canSave: false,
    audioLoaded: false,
    duration: 0,
    audioBlob: null as any, // TODO: type
    audioBuffer: null as any,// TODO: type
    waveform: new Float32Array(),
    playerReady: false,
    data: null as any, // TODO: type
    trim: initialStateTrimSaving
};

export default function(bundle) {
    bundle.defineAction(ActionTypes.EditorPrepare);
    bundle.addReducer(ActionTypes.EditorPrepare, produce((draft: AppStore, {payload: {baseDataUrl}}) => {
        const {baseUrl} = draft.options;

        draft.editor = initialStateEditor;
        draft.editor.base = baseDataUrl;
        draft.editor.dataUrl = baseDataUrl;
        draft.editor.playerUrl = `${baseUrl}/player?base=${encodeURIComponent(baseDataUrl)}`;
        draft.editor.canSave = userHasGrant(draft.user, baseDataUrl);
    }));

    bundle.addReducer(CommonActionTypes.LoginFeedback, produce(loginFeedbackReducer));

    bundle.defineAction(ActionTypes.EditorControlsChanged);
    bundle.addReducer(ActionTypes.EditorControlsChanged, produce((draft: AppStore, {payload: {controls}}) => {
        draft.editor.controls = controls;
    }));

    bundle.defineAction(ActionTypes.EditorAudioLoadProgress);
    bundle.addReducer(ActionTypes.EditorAudioLoadProgress, produce(editorAudioLoadProgressReducer));

    bundle.defineAction(ActionTypes.EditorAudioLoaded);
    bundle.addReducer(ActionTypes.EditorAudioLoaded, produce((draft: AppStore, {payload: {duration, audioBlob, audioBuffer, waveform}}) => {
        draft.editor.audioLoaded = true;
        draft.editor.duration = duration;
        draft.editor.audioBlob = audioBlob;
        draft.editor.audioBuffer = audioBuffer;
        draft.editor.waveform = waveform;
    }));

    bundle.defineAction(ActionTypes.EditorPlayerReady);
    bundle.addReducer(ActionTypes.EditorPlayerReady, produce((draft: AppStore, {payload: {data}}) => {
        draft.editor.playerReady = true;
        draft.editor.data = data;
    }));

    bundle.defineAction(ActionTypes.SetupScreenTabChanged);
    bundle.addReducer(ActionTypes.SetupScreenTabChanged, produce(setupScreenTabChangedReducer));

    bundle.addSaga(function* editorSaga(app) {
        yield takeEvery(ActionTypes.EditorPrepare, editorPrepareSaga, app);

    });

    bundle.include(OverviewBundle);
    bundle.include(TrimBundle);
};

function loginFeedbackReducer(draft: AppStore): void {
    if (draft.editor) {
        draft.editor.canSave = userHasGrant(draft.user,draft.editor.dataUrl);
    }
}

function userHasGrant(user, dataUrl): boolean {
    if (user && user.grants && dataUrl) {
        for (let grant of user.grants) {
            if (dataUrl.startsWith(grant.url)) {
                return true;
            }
        }
    }

    return false;
}

function editorAudioLoadProgressReducer(draft: AppStore, {payload: {value}}): void {
    draft.editor.audioLoadProgress = value;
}

function* editorPrepareSaga(app, action) {
    /* Require the user to be logged in. */
    while (!(yield select((state: AppStore) => state.user))) {
        yield take(CommonActionTypes.LoginFeedback);
    }

    yield put({type: CommonActionTypes.SystemSwitchToScreen, payload: {screen: 'setup'}});

    const audioUrl = `${action.payload.baseDataUrl}.mp3`;
    const eventsUrl = `${action.payload.baseDataUrl}.json`;

    /* Load the audio stream. */
    const {blob: audioBlob, audioBuffer} = yield call(getAudioSaga, audioUrl);
    const inMemoryAudioUrl = URL.createObjectURL(audioBlob);
    const duration = audioBuffer.duration * 1000;

    // TODO: send progress events during extractWaveform?
    const waveform = extractWaveform(audioBuffer, Math.floor(duration * 60 / 1000));
    yield put({type: ActionTypes.EditorAudioLoaded, payload: {duration, audioBlob, audioBuffer, waveform}});

    /* Prepare the player and wait until ready.
       This order (load audio, prepare player) is faster, the reverse
       (as of Chrome 64) leads to redundant concurrent fetches of the audio. */
    yield put({
        type: PlayerActionTypes.PlayerPrepare,
        payload: {
            baseDataUrl: action.payload.baseDataUrl,
            audioUrl: inMemoryAudioUrl, eventsUrl
        }
    });

    const {payload: {data}} = yield take(PlayerActionTypes.PlayerReady);

    yield put({type: ActionTypes.EditorPlayerReady, payload: {data}});
}

function* getAudioSaga(audioUrl) {
    const chan = yield call(getAudio, audioUrl);
    while (true) {
        let event = yield take(chan);
        switch (event.type) {
            case 'done':
                return event;
            case 'error':
                throw event.error;
            case 'progress':
                yield put({type: ActionTypes.EditorAudioLoadProgress, payload: {value: event.value}});
                break;
        }
    }
}

function setupScreenTabChangedReducer(draft: AppStore, {payload: {tabId}}): void {
    draft.editor.setupTabId = tabId;
}
