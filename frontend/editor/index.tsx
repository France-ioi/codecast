import React from 'react';
import {Map} from 'immutable';
import {call, put, select, take, takeEvery} from 'redux-saga/effects';

import {getAudio} from '../common/utils';
import {extractWaveform} from './waveform/tools';
import OverviewBundle from './overview';
import TrimBundle from './trim';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from '../common/actionTypes';
import {ActionTypes as PlayerActionTypes} from '../player/actionTypes';
import {ActionTypes as AppActionTypes} from '../actionTypes';

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, state =>
        state.set('editor', Map()));

    bundle.defineAction(ActionTypes.EditorPrepare);
    bundle.addReducer(ActionTypes.EditorPrepare, editorPrepareReducer);

    bundle.addReducer(CommonActionTypes.LoginFeedback, loginFeedbackReducer);

    bundle.defineAction(ActionTypes.EditorControlsChanged);
    bundle.addReducer(ActionTypes.EditorControlsChanged, editorControlsChangedReducer);

    bundle.defineAction(ActionTypes.EditorAudioLoadProgress);
    bundle.addReducer(ActionTypes.EditorAudioLoadProgress, editorAudioLoadProgressReducer);

    bundle.defineAction(ActionTypes.EditorAudioLoaded);
    bundle.addReducer(ActionTypes.EditorAudioLoaded, editorAudioLoadedReducer);

    bundle.defineAction(ActionTypes.EditorPlayerReady);
    bundle.addReducer(ActionTypes.EditorPlayerReady, editorPlayerReadyReducer);

    bundle.defineAction(ActionTypes.SetupScreenTabChanged);
    bundle.addReducer(ActionTypes.SetupScreenTabChanged, setupScreenTabChangedReducer);

    bundle.addSaga(function* editorSaga(app) {
        yield takeEvery(ActionTypes.EditorPrepare, editorPrepareSaga, app);

    });

    bundle.include(OverviewBundle);
    bundle.include(TrimBundle);
};

function editorPrepareReducer(state, {payload: {baseDataUrl}}) {
    const {baseUrl} = state.get('options');

    return state.set('editor', Map({
        base: baseDataUrl,
        dataUrl: baseDataUrl,
        playerUrl: `${baseUrl}/player?base=${encodeURIComponent(baseDataUrl)}`,
        setupTabId: 'setup-tab-infos',
        audioLoadProgress: 0,
        controls: {floating: [], top: []},
        canSave: userHasGrant(state.get('user'), baseDataUrl)
    }));
}

function loginFeedbackReducer(state, _action) {
    const editor = state.get('editor');
    if (editor) {
        const user = state.get('user');
        state = state.update('editor', editor => editor.set('canSave', userHasGrant(user, editor.get('dataUrl'))));
    }
    return state;
}

function userHasGrant(user, dataUrl) {
    if (user && user.grants && dataUrl) {
        for (let grant of user.grants) {
            if (dataUrl.startsWith(grant.url)) {
                return true;
            }
        }
    }

    return false;
}

function editorControlsChangedReducer(state, {payload: {controls}}) {
    return state.updateIn(['editor', 'controls'], oldControls => ({...oldControls, ...controls}));
}

function editorAudioLoadProgressReducer(state, {payload: {value}}) {
    return state.setIn(['editor', 'audioLoadProgress'], value);
}

function* editorPrepareSaga(app, action) {
    /* Require the user to be logged in. */
    while (!(yield select(state => state.get('user')))) {
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

function editorAudioLoadedReducer(state, {payload: {duration, audioBlob, audioBuffer, waveform}}) {
    return state.update('editor', editor => editor
        .set('audioLoaded', true)
        .set('duration', duration)
        .set('audioBlob', audioBlob)
        .set('audioBuffer', audioBuffer)
        .set('waveform', waveform));
}

function editorPlayerReadyReducer(state, {payload: {data}}) {
    return state.update('editor', editor => editor
        .set('playerReady', true)
        .set('data', data));
}

function setupScreenTabChangedReducer(state, {payload: {tabId}}) {
    return state.setIn(['editor', 'setupTabId'], tabId);
}
