
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import Slider from 'rc-slider';

import {use, defineSelector, defineView} from '../utils/linker';

export default function* (deps) {

  yield use(
    'playerStart', 'playerPause', 'playerResume', 'playerSeek',
    'getPlayerState',
    'StepperControls', 'FullscreenButton'
  );

  yield defineSelector('PlayerControlsSelector', function (state, props) {
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const audioTime = player.get('audioTime');
    const duration = player.get('duration');
    return {status, audioTime, duration};
  });

  yield defineView('PlayerControls', 'PlayerControlsSelector', EpicComponent(self => {

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

    const timeFormatter = function (t) {
      return Math.round(t / 1000) + 's';
    };

    self.render = function () {
      const {status, audioTime, duration} = self.props;
      const showStartPlayback = /preparing|starting|ready|paused/.test(status);
      const canStartPlayback = /ready|paused/.test(status);
      const showPausePlayback = /playing|pausing/.test(status);
      const canPausePlayback = status === 'playing';
      const canStep = status === 'paused';
      return (
        <div className="pane pane-controls">
          {showStartPlayback &&
            <Button onClick={onStartPlayback} enabled={canStartPlayback}>
              <i className="fa fa-play"/>
            </Button>}
          {showPausePlayback &&
            <Button onClick={onPausePlayback} enabled={canPausePlayback}>
              <i className="fa fa-pause"/>
            </Button>}
          <div className="player-slider-container">
            <Slider prefixCls="player-slider" tipFormatter={timeFormatter} tipTransitionName="rc-slider-tooltip-zoom-down" value={audioTime} min={0} max={duration} onChange={onSeek}>
              <div className="player-slider-background"/>
            </Slider>
          </div>
          <deps.StepperControls enabled={canStep}/>
          <deps.FullscreenButton/>
          {false && <p>{status}{' '}{audioTime}{' / '}{duration}</p>}
        </div>
      );
    };

  }));

};
