import React from 'react';
import {Map} from 'immutable';
import {call, put, select, take, takeEvery} from 'redux-saga/effects';

import {getAudio} from '../common/utils';
import {extractWaveform} from './waveform/tools';
import OverviewBundle from './overview';
import TrimBundle from './trim';
import {ActionTypes} from "./actionTypes";
import {EditorApp} from "./EditorApp";
import {SetupScreen} from "./SetupScreen";
import {EditScreen} from "./EditScreen";

export default function (bundle, deps) {

    bundle.addReducer('init', state =>
        state.set('editor', Map()));

    bundle.defineAction(ActionTypes.EditorPrepare);
    bundle.addReducer(ActionTypes.EditorPrepare, editorPrepareReducer);
    bundle.addReducer('loginFeedback', loginFeedbackReducer);

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

    bundle.defineView('EditorApp', EditorAppSelector, EditorApp);

    bundle.defineView('SetupScreen', SetupScreenSelector, SetupScreen);
    bundle.defineView('EditScreen', EditScreenSelector, EditScreen);

    bundle.addSaga(function* editorSaga(app) {
        yield takeEvery(app.actionTypes.editorPrepare, editorPrepareSaga, app);

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
        state = state.update('editor', editor =>
            editor.set('canSave', userHasGrant(user, editor.get('dataUrl'))));
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
    return state.updateIn(['editor', 'controls'], oldControls =>
        ({...oldControls, ...controls}));
}

function editorAudioLoadProgressReducer(state, {payload: {value}}) {
    return state.setIn(['editor', 'audioLoadProgress'], value);
}

function* editorPrepareSaga({actionTypes}, {payload: {baseDataUrl}}) {
    /* Require the user to be logged in. */
    while (!(yield select(state => state.get('user')))) {
        yield take(actionTypes.loginFeedback);
    }
    yield put({type: actionTypes.switchToScreen, payload: {screen: 'setup'}});
    const audioUrl = `${baseDataUrl}.mp3`;
    const eventsUrl = `${baseDataUrl}.json`;
    /* Load the audio stream. */
    const {blob: audioBlob, audioBuffer} = yield call(getAudioSaga, actionTypes, audioUrl);
    const inMemoryAudioUrl = URL.createObjectURL(audioBlob);
    const duration = audioBuffer.duration * 1000;
    // TODO: send progress events during extractWaveform?
    const waveform = extractWaveform(audioBuffer, Math.floor(duration * 60 / 1000));
    yield put({type: actionTypes.editorAudioLoaded, payload: {duration, audioBlob, audioBuffer, waveform}});
    /* Prepare the player and wait until ready.
       This order (load audio, prepare player) is faster, the reverse
       (as of Chrome 64) leads to redundant concurrent fetches of the audio. */
    yield put({type: actionTypes.playerPrepare, payload: {baseDataUrl, audioUrl: inMemoryAudioUrl, eventsUrl}});
    const {payload: {data}} = yield take(actionTypes.playerReady);
    yield put({type: actionTypes.editorPlayerReady, payload: {data}});
}

function* getAudioSaga(actionTypes, audioUrl) {
    const chan = yield call(getAudio, audioUrl);
    while (true) {
        let event = yield take(chan);
        switch (event.type) {
            case 'done':
                return event;
            case 'error':
                throw event.error;
            case 'progress':
                yield put({type: actionTypes.editorAudioLoadProgress, payload: {value: event.value}});
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

function EditorAppSelector(state, props) {
    const scope = state.get('scope');
    const user = state.get('user');
    const screen = state.get('screen');
    const {LogoutButton} = scope;
    const floatingControls = state.getIn(['editor', 'controls']).floating;
    let activity, screenProp, Screen;
    if (!user) {
        activity = 'login';
        screenProp = 'LoginScreen';
    } else if (screen === 'setup') {
        activity = 'setup';
        screenProp = 'SetupScreen';
    } else if (screen === 'edit') {
        activity = 'edit';
        screenProp = 'EditScreen';
    } else {
        Screen = () => <p>{'undefined state'}</p>;
    }
    if (!Screen && screenProp) {
        Screen = scope[screenProp];
    }
    return {Screen, activity, floatingControls, LogoutButton};
}

function SetupScreenSelector(state, props) {
    const editor = state.get('editor');
    const audioLoaded = editor.get('audioLoaded');
    if (!audioLoaded) {
        const progress = editor.get('audioLoadProgress');
        return {step: 'loading', progress};
    }
    const playerReady = editor.get('playerReady');
    if (!playerReady) {
        const progress = state.getIn(['player', 'progress']);
        return {step: 'preparing', progress};
    }
    const views = state.get('views');
    const actionTypes = state.get('actionTypes');
    const duration = editor.get('duration');
    const tabId = editor.get('setupTabId');
    const {version, title, events} = editor.get('data');
    const waveform = editor.get('waveform');
    return {
        views, actionTypes, tabId, version, title, events, duration, waveform
    };
}

function EditScreenSelector(state, props) {
    const {StepperView, SubtitlesBand} = state.get('scope');
    const viewportTooSmall = state.get('viewportTooSmall');
    const containerWidth = state.get('containerWidth');
    const topControls = state.getIn(['editor', 'controls']).top;
    return {
        viewportTooSmall, containerWidth, topControls,
        StepperView, SubtitlesBand
    };
}

