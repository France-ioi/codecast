import {Map} from 'immutable';

import {findInstant} from './utils';
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes} from "./actionTypes";

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, initReducer);

    bundle.defineAction(ActionTypes.PlayerClear);
    bundle.addReducer(ActionTypes.PlayerClear, playerClearReducer);

    bundle.defineAction(ActionTypes.PlayerPreparing);
    bundle.addReducer(ActionTypes.PlayerPreparing, playerPreparingReducer);

    bundle.defineAction(ActionTypes.PlayerPrepareProgress);
    bundle.addReducer(ActionTypes.PlayerPrepareProgress, playerPrepareProgressReducer);

    bundle.defineAction(ActionTypes.PlayerPrepareFailure);
    bundle.addReducer(ActionTypes.PlayerPrepareFailure, playerPrepareFailureReducer);

    bundle.defineAction(ActionTypes.PlayerReady);
    bundle.addReducer(ActionTypes.PlayerReady, playerReadyReducer);

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

function initReducer(state, _action) {
    return playerClearReducer(state);
}

function playerClearReducer(state) {
    const audio = document.createElement('video');
    const volume = audio.volume; /* XXX: load from localStorage? */
    const isMuted = audio.muted; /* XXX: load from localStorage? */
    const progress = 0;

    return state.set('player', Map({audio, volume, isMuted, progress}));
}

function playerPreparingReducer(state, _action) {
    return state.setIn(['player', 'isReady'], false);
}

function playerPrepareProgressReducer(state, {payload: {progress}}) {
    return state.setIn(['player', 'progress'], progress);
}

function playerPrepareFailureReducer(state, {payload: {message}}) {
    return state.setIn(['player', 'error'], {source: 'prepare', message});
}

function playerReadyReducer(state, {payload: {duration, data, instants}}) {
    return state.update('player', player => updateStatus(player
        .set('audioTime', 0)
        .set('duration', duration)
        .set('data', data)
        .set('instants', instants)
        .set('current', instants[0])));
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
