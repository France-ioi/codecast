import React, {useEffect, useRef, useState} from "react";
import {Button, ButtonGroup, Slider} from "@blueprintjs/core";
import {formatTime} from "../common/utils";
import {ActionTypes} from "../player/actionTypes";
import {ActionTypes as LayoutActionTypes} from "./layout/actionTypes";
import {useDispatch} from "react-redux";
import {getMessage} from "../lang";
import {SubtitlesPopup} from "../subtitles/SubtitlesPopup";
import {useAppSelector} from "../hooks";
import {LayoutPlayerMode} from "./layout/layout";

export function PlayerControls() {
    const player = useAppSelector(state => state.player);
    const isReady = player.isReady;
    const isPlaying = player.isPlaying;
    const currentInstant = player.current;
    const isAtEnd = currentInstant && currentInstant.isEnd;
    const audioTime = player.audioTime;
    const duration = player.duration;
    const volume = player.volume;
    const isMuted = player.audio.muted;
    const showStartPlayback = !isPlaying;
    const canStartPlayback = isReady && !isPlaying;
    const showPausePlayback = isPlaying;
    const canPausePlayback = isPlaying;
    const [subtitlesOpen, setSubtitlesOpen] = useState(false);
    const subtitles = useAppSelector(state => state.subtitles);
    const playerData = useAppSelector(state => state.player.data);
    const showSubtitles = !subtitles.editing && playerData && playerData.subtitles && !!playerData.subtitles.length;
    const layoutPlayerMode = useAppSelector(state => state.layout.playerMode);

    const wrapperRef = useRef(null);
    const dispatch = useDispatch();

    useEffect(() => {
        if (LayoutPlayerMode.Replay !== layoutPlayerMode) {
            return () => {};
        }

        function handleClickOutside(event) {
            const excludedClasses = '.bp3-portal, .bp3-portal *, .subtitles-band, .subtitles-band *, .subtitles-pane-container, .subtitles-pane-container *, .editor-footer, .editor-footer *';
            if (wrapperRef.current && !wrapperRef.current.contains(event.target) && !event.target.matches(excludedClasses)) {
                onPausePlayback();
                dispatch({type: LayoutActionTypes.LayoutPlayerModeChanged, payload: {playerMode: LayoutPlayerMode.Execution}});
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, layoutPlayerMode]);

    const onStartPlayback = () => {
        dispatch({type: ActionTypes.PlayerStart});
    };

    const onPausePlayback = () => {
        dispatch({type: ActionTypes.PlayerPause});
    };

    const onResumePlayback = () => {
        dispatch({type: LayoutActionTypes.LayoutPlayerModeBackToReplay});
    };

    const onSeek = (audioTime) => {
        dispatch({type: ActionTypes.PlayerSeek, payload: {audioTime}});
    };

    const handleVolumeChange = (volume) => {
        dispatch({type: ActionTypes.PlayerVolumeChanged, payload: {volume}});
    };

    const handleMuteChange = (isMuted) => {
        dispatch({type: ActionTypes.PlayerMutedChanged, payload: {isMuted}});
    };

    if (LayoutPlayerMode.Execution === layoutPlayerMode) {
        return (
            <div className="task-recorder-controls task-player-resume">
                <Button
                    onClick={onResumePlayback}
                    title={getMessage('RESUME_PLAYBACK')}
                    icon={'play'}
                >
                    {getMessage('RESUME_PLAYBACK')}
                </Button>
            </div>
        );
    }

    return (
        <div className="task-recorder-controls" ref={wrapperRef}>
            <div className="controls-recorder">
                <ButtonGroup>
                    {showStartPlayback &&
                        <Button
                          onClick={onStartPlayback}
                          disabled={!canStartPlayback}
                          title={getMessage('START_PLAYBACK')}
                          icon={isAtEnd ? 'repeat' : 'play'}
                        />
                    }
                    {showPausePlayback &&
                        <Button
                          onClick={onPausePlayback}
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
                            onClick={(isReady) ? () => handleMuteChange(false) : undefined}
                            icon='volume-off'
                            disabled={!isReady}
                        />
                        :
                        <Button
                            title={getMessage('SOUND_ON')}
                            onClick={(isReady) ? () => handleMuteChange( true) : undefined}
                            icon='volume-up'
                            disabled={!isReady}
                        />
                    }
                </div>
                <div className="player-controls-volume">
                    <Slider
                        value={volume}
                        onChange={handleVolumeChange}
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
                      onChange={onSeek}
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
            {showSubtitles &&
                <div className="controls-subtitles">
                  <Button
                    onClick={() => setSubtitlesOpen(!subtitlesOpen)}
                    title={getMessage('CLOSED_CAPTIONS_TOOLTIP').s}
                    text='CC'
                  />
                  <SubtitlesPopup open={subtitlesOpen} onClose={() => setSubtitlesOpen(false)}/>
                </div>
            }
        </div>
    );
}

