import React from "react";
import {Button, ButtonGroup, Icon, Slider} from "@blueprintjs/core";
import {formatTime} from "../common/utils";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {StepperControls} from "../stepper/views/StepperControls";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {Menu} from "../common/Menu";
import {getPlayerState} from "../player/selectors";
import {getRecorderState} from "./selectors";
import {RecorderStatus} from "./store";
import {getMessage} from "../lang";

interface RecorderControlsStateToProps {
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

function mapStateToProps (state: AppStore): RecorderControlsStateToProps {
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
        recorderStatus, isPlayback, playPause,
        canRecord, canPlay, canPause, canStop, canStep,
        position, duration
    };
}

interface RecorderControlsDispatchToProps {
    dispatch: Function
}

interface RecorderControlsProps extends RecorderControlsStateToProps, RecorderControlsDispatchToProps {
    enabled?: boolean
}

class _RecorderControls extends React.PureComponent<RecorderControlsProps> {
    render() {
        const {
            canRecord, canPlay, canPause, canStop, canStep,
            isPlayback, playPause, position, duration
        } = this.props;
        return (
            <div>
                <div className='hbox' style={{marginTop: '3px'}}>
                    <div className="controls controls-main" style={{flexGrow: 3}}>
                        <ButtonGroup>
                            <Button
                                onClick={this.onStartRecording}
                                disabled={!canRecord}
                                title={getMessage('START_RECORDING')}
                                icon={<Icon icon='record' color='#a01'/>}
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
                        <div className='ihbox' style={{margin: '7px 0 0 10px'}}>
                            <Icon icon='time'/>
                            <span style={{marginLeft: '4px'}}>
                                {formatTime(position)}
                                {isPlayback && ' / '}
                                {isPlayback && formatTime(duration)}
                            </span>
                        </div>
                    </div>
                    <div className='text-center' style={{flexGrow: 7}}>
                        <StepperControls enabled={canStep}/>
                    </div>
                    <div className='text-right' style={{flexGrow: 2}}>
                        <Menu />
                    </div>
                </div>
                {isPlayback &&
                    <div className='row' style={{marginTop: '3px'}}>
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
            this.props.dispatch({type: ActionTypes.RecorderStart});
        } else {
            this.props.dispatch({type: ActionTypes.RecorderResume});
        }
    };
    onPause = () => {
        const {recorderStatus} = this.props;
        if (recorderStatus === RecorderStatus.Recording) {
            this.props.dispatch({type: ActionTypes.RecorderPause});
        } else {
            this.props.dispatch({type: PlayerActionTypes.PlayerPause});
        }
    };
    onStartPlayback = () => {
        this.props.dispatch({type: PlayerActionTypes.PlayerStart});
    };
    onStopRecording = () => {
        this.props.dispatch({type: ActionTypes.RecorderStop});
    };
    onSeek = (audioTime) => {
        this.props.dispatch({type: PlayerActionTypes.PlayerSeek, payload: {audioTime}});
    };
}

export const RecorderControls = connect(mapStateToProps)(_RecorderControls);
