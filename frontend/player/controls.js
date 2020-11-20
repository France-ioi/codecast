import React from 'react';
import {Button, Slider} from '@blueprintjs/core';

import {formatTime} from '../common/utils';

export default function (bundle) {
  bundle.defineSelector('PlayerControlsSelector', PlayerControlsSelector);
  bundle.defineView('PlayerControls', 'PlayerControlsSelector', PlayerControls);
};

function PlayerControlsSelector (state, props) {
  const actionTypes = state.get('actionTypes');
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

  return {actionTypes, views, getMessage, isReady, isPlaying, isAtEnd, audioTime, duration, volume, isMuted};
}

class PlayerControls extends React.PureComponent {

  render () {
    const {views, isReady, isPlaying, isAtEnd, audioTime, duration, volume, isMuted, getMessage} = this.props;
    const showStartPlayback = !isPlaying;
    const canStartPlayback = isReady && !isPlaying;
    const showPausePlayback = isPlaying;
    const canPausePlayback = isPlaying;
    const canStep = isReady || isPlaying;

    return (
      <div id='player-controls'>
        <div className='player-controls-row row' style={{width: '100%', marginTop: '5px'}}>
          <div className="player-slider-container">
            {!Number.isNaN(duration) &&
              <Slider
                  value={audioTime}
                  onChange={this.onSeek}
                  min={0}
                  max={duration}
                  stepSize={100}
                  labelStepSize={duration}
                  labelRenderer={formatTime}
              />
            }
          </div>
        </div>
        <div className='player-controls-row row' style={{width: '100%', marginBottom: '4px'}}>
          <div className="player-controls controls controls-main col-sm-4">
            <div className="player-controls-playback">
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
            </div>
            <div className="player-controls-times">
              {formatTime(audioTime)}
              {' / '}
              {formatTime(duration)}
            </div>
            <div className="player-controls-mute">
              {isMuted ?
                  <Button
                      className='round-button'
                      title={getMessage('SOUND_OFF')}
                      onClick={(isReady) ? this.handleMuteChange.bind(this, false) : undefined}
                      icon='volume-off'
                      disabled={!isReady}
                  />
                  :
                  <Button
                      className='round-button'
                      title={getMessage('SOUND_ON')}
                      onClick={(isReady) ? this.handleMuteChange.bind(this, true) : undefined}
                      icon='volume-up'
                      disabled={!isReady}
                  />
              }

            </div>
            <div className="player-controls-volume">
              <Slider
                  className='volume-slider'
                  value={volume}
                  onChange={this.handleVolumeChange}
                  min={0}
                  max={1}
                  labelRenderer={false}
                  stepSize={0.01}
                  disabled={!isReady}
              />

              {/*<SliderControl*/}
              {/*  style={{height: '8px', width: '100px', transition: 'width: 0.3s, height: 0.05s'}}*/}
              {/*  direction={Direction.HORIZONTAL}*/}
              {/*  value={volume}*/}
              {/*  onChange={this.handleVolumeChange}*/}
              {/*  //isEnabled={isReady}*/}
              {/*/>*/}
            </div>
          </div>
          <div className="player-controls player-controls-stepper col-sm-6">
            <views.StepperControls enabled={canStep}/>
          </div>
          <div className="player-controls player-controls-right col-sm-2">
            <views.Menu/>
          </div>
        </div>
      </div>
    );
  };

  onStartPlayback = () => {
    this.props.dispatch({type: this.props.actionTypes.playerStart});
  };

  onPausePlayback = () => {
    this.props.dispatch({type: this.props.actionTypes.playerPause});
  };

  onSeek = (audioTime) => {
    this.props.dispatch({type: this.props.actionTypes.playerSeek, payload: {audioTime}});
  };

  handleVolumeChange = (volume) => {
    this.props.dispatch({type: this.props.actionTypes.playerVolumeChanged, payload: {volume}});
  };

  handleMuteChange = (isMuted) => {
    this.props.dispatch({type: this.props.actionTypes.playerMutedChanged, payload: {isMuted}});
  };

}
