import React from "react";
import {Button, ButtonGroup, Icon, Slider} from "@blueprintjs/core";
import {formatTime} from "../common/utils";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {getPlayerState} from "../player/selectors";
import {getRecorderState} from "../recorder/selectors";
import {RecorderStatus} from "../recorder/store";

interface RecorderControlsTaskStateToProps {
    getMessage: Function,
    canRecord: boolean,
    canPlay: boolean,
    canPause: boolean,
    canStop: boolean,
    canStep: boolean,
    isPlayback: boolean,
    playPause: 'play' | 'pause',
    position: number,
    duration: number,
    recorderStatus: RecorderStatus
}

function mapStateToProps (state: AppStore): RecorderControlsTaskStateToProps {
    const getMessage = state.getMessage;
    const recorder = getRecorderState(state);
    const recorderStatus = recorder.status;
    const isPlayback = recorderStatus === RecorderStatus.Paused;
    let canRecord, canPlay, canPause, canStop, canStep, position, duration, playPause;

    if (isPlayback) {
        const player = getPlayerState(state);
        const isReady = player.isReady;
        const isPlaying = player.isPlaying;
        canPlay = canStop = canRecord = canStep = isReady && !isPlaying;
        canPause = isReady && isPlaying;
        playPause = isPlaying ? 'pause' : 'play';
        position = player.audioTime;
        duration = player.duration;
    } else {
        canRecord = /ready|paused/.test(recorderStatus);
        canStop = /recording|paused/.test(recorderStatus);
        canPlay = recorderStatus === RecorderStatus.Paused;
        canPause = canStep = recorderStatus === RecorderStatus.Recording;
        position = duration = recorder.elapsed || 0;
        playPause = 'pause';
    }

    return {
        getMessage,
        recorderStatus, isPlayback, playPause,
        canRecord, canPlay, canPause, canStop, canStep,
        position, duration
    };
}

interface RecorderControlsTaskDispatchToProps {
    dispatch: Function
}

interface RecorderControlsTaskProps extends RecorderControlsTaskStateToProps, RecorderControlsTaskDispatchToProps {
    enabled?: boolean
}

class _RecorderControlsTask extends React.PureComponent<RecorderControlsTaskProps> {
    render() {
        const {
            getMessage, canRecord, canPlay, canPause, canStop, canStep,
            isPlayback, playPause, position, duration
        } = this.props;
        return (
            <div className="task-recorder-controls">
                <div className="controls-recorder">
                    <ButtonGroup>
                        <Button
                            onClick={this.onStartRecording}
                            disabled={!canRecord}
                            title={getMessage('START_RECORDING')}
                            icon={<Icon icon='record' color='#ff001f'/>}
                        />
                        <Button
                            onClick={this.onStopRecording}
                            disabled={!canStop}
                            icon='stop'
                            title={getMessage('STOP_RECORDING')}
                        />
                        {playPause === 'play' ?
                            <Button
                                onClick={this.onStartPlayback}
                                disabled={!canPlay}
                                title={getMessage('START_PLAYBACK')}
                                icon='play'
                            />
                            :
                            <Button
                                onClick={this.onPause}
                                disabled={!canPause}
                                title={getMessage('PAUSE_PLAYBACK')}
                                icon='pause'
                            />
                        }
                    </ButtonGroup>
                    <div className="controls-time">
                        <Icon icon='time'/>
                        <span style={{marginLeft: '4px'}}>
                            {formatTime(position)}
                            {isPlayback && ' / '}
                            {isPlayback && formatTime(duration)}
                        </span>
                    </div>
                </div>
                {isPlayback &&
                    <div className='row'>
                      <Slider
                        value={position}
                        onChange={this.onSeek}
                        stepSize={100}
                        labelStepSize={30000}
                        min={0}
                        max={duration}
                        labelRenderer={formatTime}
                      />
                    </div>
                }
            </div>
        );
    }

    onStartRecording = () => {
        const {recorderStatus} = this.props;
        if (recorderStatus === RecorderStatus.Ready) {
            this.props.dispatch({type: RecorderActionTypes.RecorderStart});
        } else {
            this.props.dispatch({type: RecorderActionTypes.RecorderResume});
        }
    };
    onPause = () => {
        const {recorderStatus} = this.props;
        if (recorderStatus === RecorderStatus.Recording) {
            this.props.dispatch({type: RecorderActionTypes.RecorderPause});
        } else {
            this.props.dispatch({type: PlayerActionTypes.PlayerPause});
        }
    };
    onStartPlayback = () => {
        this.props.dispatch({type: PlayerActionTypes.PlayerStart});
    };
    onStopRecording = () => {
        this.props.dispatch({type: RecorderActionTypes.RecorderStop});
    };
    onSeek = (audioTime) => {
        this.props.dispatch({type: PlayerActionTypes.PlayerSeek, payload: {audioTime}});
    };
}

export const RecorderControlsTask = connect(mapStateToProps)(_RecorderControlsTask);
