
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineSelector, defineView} from '../utils/linker';

export default function* (deps) {

  yield use(
    'playerStart', 'playerPause', 'playerResume', 'getPlayerState',
    'StepperControls', 'FullscreenButton'
  );

  yield defineSelector('PlayerControlsSelector', function (state, props) {
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const current = player.get('current');
    return {status, t: current && current.t};
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

    self.render = function () {
      const {status, t} = self.props;
      const showStartPlayback = /preparing|starting|ready|paused/.test(status);
      const canStartPlayback = /ready|paused/.test(status);
      const showPausePlayback = /playing|pausing/.test(status);
      const canPausePlayback = status === 'playing';
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
          <deps.StepperControls/>
          <deps.FullscreenButton/>
          <p>{status}{' '}{t}</p>
        </div>
      );
    };

  }));

};
