import React from "react";
import {Button, ButtonGroup, Dialog, Icon, Slider} from "@blueprintjs/core";
import {formatTime} from "../common/utils";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {useDispatch} from "react-redux";
import {getPlayerState} from "../player/selectors";
import {getRecorderState} from "../recorder/selectors";
import {RecorderStatus} from "../recorder/store";
import {MemoryUsage} from "../recorder/MemoryUsage";
import {SaveScreen} from "../recorder/SaveScreen";
import {Screen} from "../common/screens";
import {LoginScreen} from "../common/LoginScreen";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {Vumeter} from "../recorder/Vumeter";
import {useAppSelector} from "../hooks";
import {SaveStep} from "../recorder/save_screen";
import {getMessage} from "../lang";

interface RecorderControlsProps {
    enabled?: boolean
}

export function RecorderControls(props: RecorderControlsProps) {
    const screen = useAppSelector(state => state.screen);
    const user = useAppSelector(state => state.user);
    const recorder = useAppSelector(state => getRecorderState(state));
    const recorderStatus = recorder.status;
    const isPlayback = recorderStatus === RecorderStatus.Paused;
    const player = useAppSelector(state => getPlayerState(state));

    let canRecord, canPlay, canPause, canStop, position, duration, playPause;
    if (isPlayback) {
        const isReady = player.isReady;
        const isPlaying = player.isPlaying;
        canPlay = canStop = canRecord = isReady && !isPlaying;
        canPause = isReady && isPlaying;
        playPause = isPlaying ? 'pause' : 'play';
        position = player.audioTime;
        duration = player.duration;
    } else {
        canRecord = /ready|paused/.test(recorderStatus);
        canStop = /recording|paused/.test(recorderStatus);
        canPlay = false;
        canPause = recorderStatus === RecorderStatus.Recording;
        position = duration = recorder.elapsed || 0;
        playPause = 'pause';
    }

    const saveDialogCanClose = useAppSelector(state => SaveStep.Done === state.save.step);

    const dispatch = useDispatch();

    const onStartRecording = () => {
        if (recorderStatus === RecorderStatus.Ready) {
            dispatch({type: RecorderActionTypes.RecorderStart});
        } else {
            dispatch({type: RecorderActionTypes.RecorderResume});
        }
    };
    const onPause = () => {
        if (recorderStatus === RecorderStatus.Recording) {
            dispatch({type: RecorderActionTypes.RecorderPause});
        } else {
            dispatch({type: PlayerActionTypes.PlayerPause});
        }
    };
    const onCancel = () => {
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Record}});
        dispatch({type: RecorderActionTypes.RecorderPrepare});
    };
    const onStartPlayback = () => {
        dispatch({type: PlayerActionTypes.PlayerStart});
    };
    const onStopRecording = () => {
        dispatch({type: RecorderActionTypes.RecorderStop});
    };
    const onSeek = (audioTime) => {
        dispatch({type: PlayerActionTypes.PlayerSeek, payload: {audioTime}});
    };

    return (
        <div className="task-recorder-controls cursor-recording-disabled">
            <div className="controls-recorder">
                <ButtonGroup>
                    <Button
                        onClick={onStartRecording}
                        disabled={!canRecord}
                        title={getMessage('START_RECORDING')}
                        icon={<Icon icon='record' color='#ff001f'/>}
                    />
                    {playPause === 'play' ?
                        <Button
                            onClick={onStartPlayback}
                            disabled={!canPlay}
                            title={getMessage('START_PLAYBACK')}
                            icon='play'
                        />
                        :
                        <Button
                            onClick={onPause}
                            disabled={!canPause}
                            title={getMessage('PAUSE_PLAYBACK')}
                            icon='pause'
                        />
                    }
                    <Button
                        onClick={onStopRecording}
                        disabled={!canStop}
                        icon='stop'
                        title={getMessage('SAVE_RECORDING')}
                    />
                </ButtonGroup>
            </div>
            <div className="memory-usage">
                <MemoryUsage />
            </div>
            {recorderStatus === RecorderStatus.Recording &&
                <div className="sound-meter">
                    <Vumeter width={82} height={20} />
                </div>
            }
            <div className="controls-time">
                <Icon icon='time'/>
                <span style={{marginLeft: '4px'}}>
                    {formatTime(position)}
                </span>
            </div>
            {isPlayback &&
                <div className="player-slider-container">
                    <Slider
                        value={Math.min(position, duration)}
                        onChange={onSeek}
                        stepSize={100}
                        labelStepSize={30000}
                        min={0}
                        max={duration}
                        labelRenderer={formatTime}
                    />
                </div>
            }
            {isPlayback &&
                <div className="controls-time time-duration">
                    <span style={{marginLeft: '4px'}}>
                        {isPlayback && formatTime(duration)}
                    </span>
                </div>
            }

            <Dialog isOpen={Screen.Save === screen} title={getMessage("UPLOADING_TITLE")} isCloseButtonShown={saveDialogCanClose} onClose={() => saveDialogCanClose && onCancel()}>
                <div className='bp3-dialog-body'>
                    {user ? <SaveScreen onCancel={onCancel}/> : <LoginScreen/>}
                </div>
            </Dialog>
        </div>
    );
}
