import React from "react";
import {Button, ButtonGroup, Icon, Slider} from "@blueprintjs/core";
import {formatTime} from "../common/utils";
import {ActionTypes} from "../player/actionTypes";
import {connect} from "react-redux";
import {StepperControls} from "../stepper/views/StepperControls";
import {Menu} from "../common/Menu";
import {AppStore} from "../store";

interface PlayerControlsTaskStateToProps {
    isReady: boolean,
    isPlaying: boolean,
    isAtEnd: boolean,
    audioTime: number,
    duration: number,
    volume: any,
    isMuted: boolean,
    getMessage: Function
}

function mapStateToProps(state: AppStore): PlayerControlsTaskStateToProps {
    const getMessage = state.getMessage;
    const player = state.player;
    const isReady = player.isReady;
    const isPlaying = player.isPlaying;
    const currentInstant = player.current;
    const isAtEnd = currentInstant && currentInstant.isEnd;
    const audioTime = player.audioTime;
    const duration = player.duration;
    const volume = player.volume;
    const isMuted = player.audio.muted;

    return {getMessage, isReady, isPlaying, isAtEnd, audioTime, duration, volume, isMuted};
}

interface PlayerControlsTaskDispatchToProps {
    dispatch: Function
}

interface PlayerControlsTaskProps extends PlayerControlsTaskStateToProps, PlayerControlsTaskDispatchToProps {

}

class _PlayerControlsTask extends React.PureComponent<PlayerControlsTaskProps> {
    render() {
        const {isReady, isPlaying, isAtEnd, audioTime, duration, volume, isMuted, getMessage} = this.props;
        const showStartPlayback = !isPlaying;
        const canStartPlayback = isReady && !isPlaying;
        const showPausePlayback = isPlaying;
        const canPausePlayback = isPlaying;

        return (
            <div className="task-recorder-controls">
                <div className="controls-recorder">
                    <ButtonGroup>
                        {showStartPlayback &&
                            <Button
                              onClick={this.onStartPlayback}
                              disabled={!canStartPlayback}
                              title={getMessage('START_PLAYBACK')}
                              icon={isAtEnd ? 'repeat' : 'play'}
                            />
                        }
                        {showPausePlayback &&
                            <Button
                              onClick={this.onPausePlayback}
                              disabled={!canPausePlayback}
                              title={getMessage('PAUSE_PLAYBACK')}
                              icon='pause'
                            />
                        }
                    </ButtonGroup>
                </div>
                <div className="controls-recorder controls-mute">
                    <div className="player-controls-mute">
                        {isMuted ?
                            <Button
                                title={getMessage('SOUND_OFF')}
                                onClick={(isReady) ? this.handleMuteChange.bind(this, false) : undefined}
                                icon='volume-off'
                                disabled={!isReady}
                            />
                            :
                            <Button
                                title={getMessage('SOUND_ON')}
                                onClick={(isReady) ? this.handleMuteChange.bind(this, true) : undefined}
                                icon='volume-up'
                                disabled={!isReady}
                            />
                        }
                    </div>
                    <div className="player-controls-volume">
                        <Slider
                            value={volume}
                            onChange={this.handleVolumeChange}
                            min={0}
                            max={1}
                            labelRenderer={false}
                            stepSize={0.01}
                            disabled={!isReady || isMuted}
                        />
                    </div>
                </div>
                <div className="controls-time">
                    <span style={{marginLeft: '4px'}}>
                        {formatTime(audioTime)}
                    </span>
                </div>
                <div className="player-slider-container">
                    {!Number.isNaN(duration) &&
                        <Slider
                          value={Math.min(audioTime, duration)}
                          onChange={this.onSeek}
                          min={0}
                          max={duration}
                          stepSize={100}
                          labelStepSize={duration}
                          labelRenderer={formatTime}
                        />
                    }
                </div>
                <div className="controls-time time-duration">
                    <span style={{marginLeft: '4px'}}>
                        {formatTime(duration)}
                    </span>
                </div>
            </div>
        );
    };

    onStartPlayback = () => {
        this.props.dispatch({type: ActionTypes.PlayerStart});
    };

    onPausePlayback = () => {
        this.props.dispatch({type: ActionTypes.PlayerPause});
    };

    onSeek = (audioTime) => {
        this.props.dispatch({type: ActionTypes.PlayerSeek, payload: {audioTime}});
    };

    handleVolumeChange = (volume) => {
        this.props.dispatch({type: ActionTypes.PlayerVolumeChanged, payload: {volume}});
    };

    handleMuteChange = (isMuted) => {
        this.props.dispatch({type: ActionTypes.PlayerMutedChanged, payload: {isMuted}});
    };
}

export const PlayerControlsTask = connect(mapStateToProps)(_PlayerControlsTask);
