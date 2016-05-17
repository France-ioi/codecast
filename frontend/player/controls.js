
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import Slider from 'rc-slider';

import {use, defineSelector, defineView} from '../utils/linker';

export default function* (deps) {

  yield use(
    'playerStart', 'playerPause', 'playerResume', 'playerSeek',
    'getPlayerState', 'isTranslated',
    'StepperControls', 'ExamplePicker', 'FullscreenButton'
  );

  yield defineSelector('PlayerControlsSelector', function (state, props) {
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const audioTime = player.get('audioTime');
    const duration = player.get('duration');
    const isTranslated = deps.isTranslated(state);
    return {status, audioTime, duration, isTranslated};
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

    const zeroPad2 = function (n) {
      return ('0'+n).substring(-2);
    };
    const timeFormatter = function (ms) {
      let s = Math.round(ms / 1000);
      const m = Math.floor(s / 60);
      s -= m * 60;
      return zeroPad2(m) + ':' + zeroPad2(s);
    };

    self.render = function () {
      const {status, audioTime, duration, isTranslated} = self.props;
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
          <p>
            <i className="fa fa-clock-o"/>
            {' '}
            {timeFormatter(audioTime)}
            {' / '}
            {timeFormatter(duration)}
          </p>
          <div className="player-slider-container">
            <Slider prefixCls="player-slider" tipFormatter={timeFormatter} tipTransitionName="rc-slider-tooltip-zoom-down" value={audioTime} min={0} max={duration} onChange={onSeek}>
              <div className="player-slider-background"/>
            </Slider>
          </div>
          <deps.StepperControls enabled={canStep}/>
          <div className="pull-right">
            <deps.FullscreenButton/>
            <deps.ExamplePicker disabled={isTranslated}/>
          </div>
        </div>
      );
    };

  }));

};
