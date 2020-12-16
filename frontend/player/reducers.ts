import {findInstant} from './utils';
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes} from "./actionTypes";
import produce from "immer";
import {AppStore} from "../store";

export const initialStatePlayer = {
    audio: null as HTMLVideoElement,
    volume: 100,
    isMuted: false,
    progress: 0,
    audioTime: 0,
    duration: 0,
    data: null as any, // TODO: type
    instants: null as any[], // TODO: type
    current: null as any, // TODO: type
    isReady: false,
    error: null as {
        message: '',
        source: 'prepare'
    }
}

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
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
    bundle.addReducer(ActionTypes.PlayerPrepareProgress, playerPrepareProgressReducer);

    bundle.defineAction(ActionTypes.PlayerPrepareFailure);
    bundle.addReducer(ActionTypes.PlayerPrepareFailure, produce((draft, {payload: {message}}) => {
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
    bundle.addReducer(ActionTypes.PlayerStarted, playerStartedReducer);

    bundle.defineAction(ActionTypes.PlayerPaused);
    bundle.addReducer(ActionTypes.PlayerPaused, playerPausedReducer);

    bundle.defineAction(ActionTypes.PlayerTick);
    bundle.addReducer(ActionTypes.PlayerTick, playerTickReducer);

    bundle.defineAction(ActionTypes.PlayerVolumeChanged);
    bundle.addReducer(ActionTypes.PlayerVolumeChanged, playerVolumeChangedReducer);

    bundle.defineAction(ActionTypes.PlayerMutedChanged);
    bundle.addReducer(ActionTypes.PlayerMutedChanged, playerMutedChangedReducer);

    bundle.defineAction(ActionTypes.PlayerSeek);
    bundle.defineAction(ActionTypes.PlayerSeeked);
}

function playerClear(draft: AppStore) {
    const audio = document.createElement('video');

    draft.player.audio = audio;
    draft.player.volume = audio.volume; /* TODO: load from localStorage? */
    draft.player.isMuted = audio.muted; /* TODO: load from localStorage? */
    draft.player.progress = 0;
}

function playerPrepareProgressReducer(state, {payload: {progress}}) {
    return state.setIn(['player', 'progress'], progress);
}

function updateStatus(player) {
    if (player.get('data') && player.get('duration')) {
        player = player.set('isReady', true);
    }
    return player;
}

function playerStartedReducer(state, _action) {
    return state.setIn(['player', 'isPlaying'], true);
}

function playerPausedReducer(state, _action) {
    return state.setIn(['player', 'isPlaying'], false);
}

function playerTickReducer(state, {payload: {audioTime}}) {
    const instants = state.getIn(['player', 'instants'])
    const instant = findInstant(instants, audioTime);

    return state.update('player', player => player
        .set('current', instant) /* current instant */
        .set('audioTime', audioTime));
}

function playerVolumeChangedReducer(state, {payload: {volume}}) {
    return state.update('player', function(player) {
        const audio = player.get('audio');
        audio.volume = volume;

        return player.set('volume', audio.volume);
    });
}

function playerMutedChangedReducer(state, {payload: {isMuted}}) {
    return state.update('player', function(player) {
        const audio = player.get('audio');
        audio.muted = isMuted;

        return player.set('isMuted', audio.muted);
    });
}
