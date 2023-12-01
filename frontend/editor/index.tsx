import React from 'react';
import {call, put, select, take, takeEvery} from 'typed-redux-saga';
import {getAudio} from '../common/utils';
import {extractWaveform} from './waveform/tools';
import OverviewBundle from './overview';
import TrimBundle, {initialStateTrimSaving} from './trim';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from '../common/actionTypes';
import {ActionTypes as PlayerActionTypes} from '../player/actionTypes';
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {Screen} from "../common/screens";
import intervalTree from "./interval_tree";
import {SaveStep} from "../recorder/save_screen";
import {appSelect} from '../hooks';
import {App} from '../app_types';

export type EditorControl = 'none' | 'trim' | 'subtitles';

export enum EditorSaveState {
    Idle = 'idle',
    Pending = 'pending',
    Success = 'success',
    Failure = 'failure'
}

export enum EditorSavingStep {
    PrepareUpload = 'prepare_upload',
    UploadEvents = 'upload_events',
    AssembleAudio = 'assemble_audio',
    EncodeAudio = 'encode_audio',
    UploadAudio = 'upload_audio',
    UpdateSubtitles = 'update_subtitles',
    UploadSubtitles = 'upload_subtitles',
}

export interface EditorState {
    save: {
        state: EditorSaveState,
        error: string,
        step: SaveStep,
        progress: number,
    },
    unsaved: boolean,
    controls: EditorControl,
    audioLoadProgress: number,
    setupTabId: string,
    base: string,
    dataUrl: string,
    playerUrl: string,
    editorUrl: string,
    canSave: boolean,
    audioLoaded: boolean,
    duration: number,
    audioBlob: any,
    audioBuffer: any,
    waveform: Float32Array,
    playerReady: boolean,
    data: any,
    trim: typeof initialStateTrimSaving,
    isMuted: boolean,
}

export function getInitialStateEditor() {
    return {
        save: {
            state: EditorSaveState.Idle,
            error: '',
            step: null,
            progress: null,
        },
        unsaved: false,
        controls: 'none' as EditorControl,
        audioLoadProgress: 0,
        setupTabId: 'setup-tab-infos',
        base: '',
        dataUrl: '',
        playerUrl: '',
        editorUrl: '',
        canSave: false,
        audioLoaded: false,
        duration: 0,
        audioBlob: null as any,
        audioBuffer: null as any,
        waveform: new Float32Array(),
        playerReady: false,
        data: null as any,
        trim: {...initialStateTrimSaving},
        isMuted: false,
    };
}

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.EditorPrepare);
    bundle.addReducer(ActionTypes.EditorPrepare, (state: AppStore, {payload: {baseDataUrl}}) => {
        const {baseUrl} = state.options;
        const intervals = intervalTree({skip: false, mute: false});

        state.editor = {
            ...getInitialStateEditor(),
            trim: {
                ...state.editor.trim,
                intervals,
            }
        };
        state.editor.base = baseDataUrl;
        state.editor.dataUrl = baseDataUrl;
        state.editor.playerUrl = `${baseUrl}/task?recording=${encodeURIComponent(baseDataUrl)}`;
        state.editor.editorUrl = `${baseUrl}/task?recording=${encodeURIComponent(baseDataUrl)}&mode=edit`;
        state.editor.canSave = true;
    });

    bundle.addReducer(CommonActionTypes.LoginFeedback, loginFeedbackReducer);

    bundle.defineAction(ActionTypes.EditorControlsChanged);
    bundle.addReducer(ActionTypes.EditorControlsChanged, (state: AppStore, {payload: {controls}}) => {
        state.editor.controls = controls;
    });

    bundle.defineAction(ActionTypes.EditorAudioLoadProgress);
    bundle.addReducer(ActionTypes.EditorAudioLoadProgress, editorAudioLoadProgressReducer);

    bundle.defineAction(ActionTypes.EditorAudioLoaded);
    bundle.addReducer(ActionTypes.EditorAudioLoaded, (state: AppStore, {payload: {duration, audioBlob, audioBuffer, waveform}}) => {
        state.editor.audioLoaded = true;
        state.editor.duration = duration;
        state.editor.audioBlob = audioBlob;
        state.editor.audioBuffer = audioBuffer;
        state.editor.waveform = waveform;
    });

    bundle.defineAction(ActionTypes.EditorPlayerReady);
    bundle.addReducer(ActionTypes.EditorPlayerReady, (state: AppStore, {payload: {data}}) => {
        state.editor.playerReady = true;
        state.editor.data = data;
    });

    bundle.defineAction(ActionTypes.SetupScreenTabChanged);
    bundle.addReducer(ActionTypes.SetupScreenTabChanged, setupScreenTabChangedReducer);

    bundle.addSaga(function* editorSaga(app: App) {
        yield* takeEvery(ActionTypes.EditorPrepare, editorPrepareSaga, app);

    });

    bundle.include(OverviewBundle);
    bundle.include(TrimBundle);
};

function loginFeedbackReducer(state: AppStore): void {
    if (state.editor) {
        state.editor.canSave = true;
    }
}

function userHasGrant(user, dataUrl: string): boolean {
    if (user && user.grants && dataUrl) {
        for (let grant of user.grants) {
            if (dataUrl.startsWith(grant.url)) {
                return true;
            }
        }
    }

    return false;
}

function editorAudioLoadProgressReducer(state: AppStore, {payload: {value}}): void {
    state.editor.audioLoadProgress = value;
}

function* editorPrepareSaga(app: App, action) {
    /* Require the user to be logged in. */
    while (!(yield* appSelect(state => state.user))) {
        yield* take(CommonActionTypes.LoginFeedback);
    }

    yield* put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Setup}});

    const audioUrl = `${action.payload.baseDataUrl}.mp3`;
    const eventsUrl = `${action.payload.baseDataUrl}.json`;

    /* Load the audio stream. */
    const {blob: audioBlob, audioBuffer} = yield* call(getAudioSaga, audioUrl);
    const inMemoryAudioUrl = URL.createObjectURL(audioBlob);
    const duration = audioBuffer.duration * 1000;

    // TODO: send progress events during extractWaveform?
    const waveform = extractWaveform(audioBuffer, Math.floor(duration * 60 / 1000));
    yield* put({type: ActionTypes.EditorAudioLoaded, payload: {duration, audioBlob, audioBuffer, waveform}});

    /* Prepare the player and wait until ready.
       This order (load audio, prepare player) is faster, the reverse
       (as of Chrome 64) leads to redundant concurrent fetches of the audio. */
    yield* put({
        type: PlayerActionTypes.PlayerPrepare,
        payload: {
            baseDataUrl: action.payload.baseDataUrl,
            audioUrl: inMemoryAudioUrl, eventsUrl
        }
    });

    const {payload: {data}}: any = yield* take(PlayerActionTypes.PlayerReady);

    yield* put({type: ActionTypes.EditorPlayerReady, payload: {data}});
}

function* getAudioSaga(audioUrl: string) {
    const chan = yield* call(getAudio, audioUrl);
    while (true) {
        let event = yield* take(chan);
        switch (event.type) {
            case 'done':
                return event;
            case 'error':
                throw event.error;
            case 'progress':
                yield* put({type: ActionTypes.EditorAudioLoadProgress, payload: {value: event.value}});
                break;
        }
    }
}

function setupScreenTabChangedReducer(state: AppStore, {payload: {tabId}}): void {
    state.editor.setupTabId = tabId;
}
