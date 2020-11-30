import React from 'react';
import {Button, Slider} from '@blueprintjs/core';

import {formatTime} from '../common/utils';
import {PlayerControls} from "./PlayerControls";

export default function (bundle) {
    bundle.defineSelector('PlayerControlsSelector', PlayerControlsSelector);
    bundle.defineView('PlayerControls', 'PlayerControlsSelector', PlayerControls);
};

function PlayerControlsSelector(state, props) {
    const views = state.get('views');
    const getMessage = state.get('getMessage');
    const player = state.get('scope').getPlayerState(state);
    const isReady = player.get('isReady');
    const isPlaying = player.get('isPlaying');
    const currentInstant = player.get('current');
    const isAtEnd = currentInstant && currentInstant.isEnd;
    const audioTime = player.get('audioTime');
    const duration = player.get('duration');
    const volume = player.get('volume');
    const isMuted = player.get('isMuted');

    return {views, getMessage, isReady, isPlaying, isAtEnd, audioTime, duration, volume, isMuted};
}
