import playerSagas from './sagas';
import {findInstant} from './utils';
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes} from "./actionTypes";
import produce from "immer";
import {AppStore, CodecastOptions} from "../store";
import {StepperState} from "../stepper";
import {initialStateArduino} from "../stepper/arduino";
import {initialStateBuffers} from "../buffers";
import {initialStateCompile} from "../stepper/compile";
import {initialStateIoPane} from "../stepper/io";

export default function(bundle) {
    bundle.include(playerSagas);

    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
        draft.player = initialStatePlayer;

        playerClear(draft);
    }));

    bundle.defineAction(ActionTypes.PlayerClear);
    bundle.addReducer(ActionTypes.PlayerClear, produce((draft: AppStore) => {
        playerClear(draft);
    }));

    bundle.defineAction(ActionTypes.PlayerPreparing);
    bundle.addReducer(ActionTypes.PlayerPreparing, produce((draft: AppStore) => {
        draft.player.isReady = false;
    }));

    bundle.defineAction(ActionTypes.PlayerPrepareProgress);
    bundle.addReducer(ActionTypes.PlayerPrepareProgress, produce((draft: AppStore, {payload: {progress}}) => {
        draft.player.progress = progress;
    }));

    bundle.defineAction(ActionTypes.PlayerPrepareFailure);
    bundle.addReducer(ActionTypes.PlayerPrepareFailure, produce((draft: AppStore, {payload: {message}}) => {
        draft.player.error = {
            source: 'prepare',
            message
        };
    }));

    bundle.defineAction(ActionTypes.PlayerReady);
    bundle.addReducer(ActionTypes.PlayerReady, produce((draft: AppStore, {payload: {duration, data, instants}}) => {
        draft.player.audioTime = 0;
        draft.player.duration = duration;
        draft.player.data = data;
        draft.player.instants = instants;
        draft.player.current = instants[0];
    }));

    bundle.defineAction(ActionTypes.PlayerStarted);
    bundle.addReducer(ActionTypes.PlayerStarted, produce((draft: AppStore) => {
        draft.player.isPlaying = true;
    }));

    bundle.defineAction(ActionTypes.PlayerPaused);
    bundle.addReducer(ActionTypes.PlayerPaused, produce((draft: AppStore) => {
        draft.player.isPlaying = false;
    }));

    bundle.defineAction(ActionTypes.PlayerTick);
    bundle.addReducer(ActionTypes.PlayerTick, produce((draft: AppStore, {payload: {audioTime}}) => {
        const instants = draft.player.instants;

        draft.player.current = findInstant(instants, audioTime);
        draft.player.audioTime = audioTime;
    }));

    bundle.defineAction(ActionTypes.PlayerVolumeChanged);
    bundle.addReducer(ActionTypes.PlayerVolumeChanged, produce((draft: AppStore, {payload: {volume}}) => {
        const audio = draft.player.audio;
        audio.volume = volume;

        draft.player.volume = audio.volume;
    }));

    bundle.defineAction(ActionTypes.PlayerMutedChanged);
    bundle.addReducer(ActionTypes.PlayerMutedChanged, produce((draft: AppStore, {payload: {isMuted}}) => {
        const audio = draft.player.audio;
        audio.muted = isMuted;

        draft.player.isMuted = audio.muted;
    }));

    bundle.defineAction(ActionTypes.PlayerSeek);
    bundle.defineAction(ActionTypes.PlayerSeeked);
};

export interface PlayerInstant {
    isEnd?: boolean,
    t: number, // time
    pos: number, // index
    event: any[], // [t, eventName, args...]
    range?: any, // TODO: What is this ?
    state: {
        arduino: typeof initialStateArduino,
        buffers: typeof initialStateBuffers,
        compile: typeof initialStateCompile,
        ioPane: typeof initialStateIoPane,
        options: CodecastOptions,
        stepper: StepperState
    },
    sagas: Function[]
}

export const initialStatePlayer = {
    audio: null as HTMLVideoElement,
    volume: 100,
    isMuted: false,
    progress: 0,
    audioTime: 0,
    duration: 0,
    data: null as any, // TODO: type
    instants: null as PlayerInstant[],
    current: null as PlayerInstant,
    isReady: false,
    isPlaying: false,
    error: null as {
        message: '',
        source: 'prepare'
    }
}

function playerClear(draft: AppStore): void {
    const audio = document.createElement('video');

    draft.player.audio = audio;
    draft.player.volume = audio.volume; /* TODO: load from localStorage? */
    draft.player.isMuted = audio.muted; /* TODO: load from localStorage? */
    draft.player.progress = 0;
}
