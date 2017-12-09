
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import Slider from 'rc-slider';

import {formatTime} from './utils';

export default function (bundle, deps) {

  bundle.use(
    'playerStart', 'playerPause', 'playerResume', 'playerSeek',
    'getPlayerState',
    'StepperControls', 'Menu'
  );

  bundle.defineSelector('PlayerControlsSelector', function (state, props) {
    const getMessage = state.get('getMessage');
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const audioTime = player.get('audioTime');
    const duration = player.get('duration');
    return {getMessage, status, audioTime, duration};
  });

  bundle.defineView('PlayerControls', 'PlayerControlsSelector', EpicComponent(self => {

    const onStartPlayback = function () {
      const {status} = self.props;
      if (status === 'ready') {
        self.props.dispatch({type: deps.playerStart});
      } else if (status === 'paused') {
        self.props.dispatch({type: deps.playerResume});
      }
    };

    const onPausePlayback = function () {
      self.props.dispatch({type: deps.playerPause});
    };

    const onSeek = function (audioTime) {
      self.props.dispatch({type: deps.playerSeek, audioTime});
    };

    self.render = function () {
      const {status, audioTime, duration, getMessage} = self.props;
      const showStartPlayback = /preparing|starting|ready|paused/.test(status);
      const canStartPlayback = /ready|paused/.test(status);
      const showPausePlayback = /playing|pausing/.test(status);
      const canPausePlayback = status === 'playing';
      const canStep = /ready|paused/.test(status);
      return (
        <div id='player-controls'>
          <div className='player-controls-row row' style={{width: '100%'}}>
            <div className="player-slider-container">
              <Slider tipFormatter={formatTime} tipTransitionName="rc-slider-tooltip-zoom-down" value={audioTime} min={0} max={duration} onChange={onSeek}>
              </Slider>
            </div>
          </div>
          <div className='player-controls-row row' style={{width: '100%'}}>
            <div className="player-controls controls controls-main col-sm-3">
              <div className="player-controls-playback">
                {showStartPlayback &&
                    <Button onClick={onStartPlayback} disabled={!canStartPlayback}
                      title={getMessage('START_PLAYBACK')}>
                      <i className="fa fa-play"/>
                    </Button>}
                {showPausePlayback &&
                  <Button onClick={onPausePlayback} disabled={!canPausePlayback}
                    title={getMessage('PAUSE_PLAYBACK')}>
                    <i className="fa fa-pause"/>
                  </Button>}
              </div>
              <p className="player-controls-times">
                {formatTime(audioTime)}
                {' / '}
                {formatTime(duration)}
              </p>
            </div>
            <div className="player-controls player-controls-stepper col-sm-7">
              <deps.StepperControls enabled={canStep}/>
            </div>
            <div className="player-controls player-controls-right col-sm-2">
              <deps.Menu/>
            </div>
          </div>
        </div>
      );
    };

  }));

};
