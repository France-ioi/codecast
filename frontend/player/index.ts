import playerSagas from './sagas';
import {findInstant} from './utils';
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes} from "./actionTypes";
import {AppStore, AppStoreReplay} from "../store";
import {Bundle} from "../linker";
import {CodecastRecord} from "../recorder/save_screen";

export default function(bundle: Bundle) {
    bundle.include(playerSagas);

    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.player = initialStatePlayer;

        playerClear(state);
    });

    bundle.defineAction(ActionTypes.PlayerClear);
    bundle.addReducer(ActionTypes.PlayerClear, (state: AppStore) => {
        playerClear(state);
    });

    bundle.defineAction(ActionTypes.PlayerPreparing);
    bundle.addReducer(ActionTypes.PlayerPreparing, (state: AppStore) => {
        state.player.isReady = false;
    });

    bundle.defineAction(ActionTypes.PlayerPrepareProgress);
    bundle.addReducer(ActionTypes.PlayerPrepareProgress, (state: AppStore, {payload: {progress}}) => {
        state.player.progress = progress;
    });

    bundle.defineAction(ActionTypes.PlayerPrepareFailure);
    bundle.addReducer(ActionTypes.PlayerPrepareFailure, (state: AppStore, {payload: {message}}) => {
        state.player.error = {
            source: 'prepare',
            message,
            details: ''
        };
    });

    bundle.defineAction(ActionTypes.PlayerReady);
    bundle.addReducer(ActionTypes.PlayerReady, (state: AppStore, {payload: {duration, data, instants}}) => {
        state.player.audioTime = 0;
        state.player.duration = duration;
        state.player.data = data;
        state.player.instants = instants;
        state.player.current = instants.length ? instants[0] : null;

        if (state.player.data && state.player.duration) {
            state.player.isReady = true;
        }
    });

    bundle.defineAction(ActionTypes.PlayerStarted);
    bundle.addReducer(ActionTypes.PlayerStarted, (state: AppStore) => {
        state.player.isPlaying = true;
    });

    bundle.defineAction(ActionTypes.PlayerPaused);
    bundle.addReducer(ActionTypes.PlayerPaused, (state: AppStore) => {
        state.player.isPlaying = false;
    });

    bundle.defineAction(ActionTypes.PlayerTick);
    bundle.addReducer(ActionTypes.PlayerTick, (state: AppStore, {payload: {audioTime}}) => {
        const instants = state.player.instants;

        state.player.current = findInstant(instants, audioTime);
        state.player.audioTime = audioTime;
    });

    bundle.defineAction(ActionTypes.PlayerVolumeChanged);
    bundle.addReducer(ActionTypes.PlayerVolumeChanged, (state: AppStore, {payload: {volume}}) => {
        const audio = state.player.audio;
        audio.volume = volume;

        state.player.volume = audio.volume;
    });

    bundle.defineAction(ActionTypes.PlayerMutedChanged);
    bundle.addReducer(ActionTypes.PlayerMutedChanged, (state: AppStore, {payload: {isMuted}}) => {
        const audio = state.player.audio;
        audio.muted = isMuted;

        state.player.isMuted = audio.muted;
    });

    bundle.defineAction(ActionTypes.PlayerSeek);
    bundle.defineAction(ActionTypes.PlayerSeeked);
};

export interface PlayerInstant {
    isEnd?: boolean,
    t: number, // time
    pos: number, // index
    event: any[], // [t, eventName, args...]
    range?: any, // TODO: What is this ?
    state: AppStoreReplay,
    sagas: any[],
    jump?: boolean,
    mute?: boolean
}

export type PlayerError = {
    message: string,
    source: string,
    details: string
}

export const initialStatePlayer = {
    audio: null as HTMLVideoElement,
    volume: 100,
    isMuted: false,
    progress: 0,
    audioTime: 0,
    duration: 0,
    data: null as CodecastRecord,
    instants: null as PlayerInstant[],
    current: null as PlayerInstant,
    isReady: false,
    isPlaying: false,
    error: null as PlayerError
}

function playerClear(state: AppStore): void {
    const audio = document.createElement('video');

    state.player.audio = audio;
    state.player.audioTime = 0;
    state.player.volume = audio.volume; /* TODO: load from localStorage? */
    state.player.isMuted = audio.muted; /* TODO: load from localStorage? */
    state.player.progress = 0;
}
