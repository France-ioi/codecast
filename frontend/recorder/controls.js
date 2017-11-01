
import React from 'react';
import {Button, ButtonGroup} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import Slider from 'rc-slider';

export default function (bundle, deps) {

  bundle.use(
    'recorderStart', 'recorderStop', 'recorderPause', 'playerSeek',
    'Menu', 'StepperControls'
  );

  function RecorderControlsSelector (state, props) {
    const getMessage = state.get('getMessage');
    const recorder = state.get('recorder');
    const status = recorder.get('status');
    const isPlayback = status === 'paused';
    let canRecord, canPlay, canPause, canStop, canStep, position, duration;
    if (isPlayback) {
      const player = state.get('player');
      const playerStatus = player.get('status');
      canPlay = canStop = canRecord = canStep = playerStatus === 'paused';
      canPause = playerStatus === 'playing';
      position = player.get('audioTime');
      duration = player.get('duration');
    } else {
      canRecord = /ready|paused/.test(status);
      canPlay = status === 'paused';
      canPause = canStep = status === 'recording';
      canStop = /recording|paused/.test(status);
      position = duration = recorder.get('elapsed') || 0;
    }
    // const events = recorder.get('events');
    // const eventCount = events && events.count();
    return {getMessage, canRecord, canPlay, canPause, canStop, canStep, isPlayback, position, duration};
  }

  class RecorderControls extends React.PureComponent {

    render () {
      const {getMessage, canRecord, canPlay, canPause, canStop, canStep, isPlayback, position, duration} = this.props;
      return (
        <div className="pane pane-controls clearfix">
          <div className="pane-controls-right">
            <deps.Menu/>
          </div>
          <div className="controls controls-main">
            <ButtonGroup>
              <Button onClick={this.onStartRecording} className="float-left" disabled={!canRecord}
                title={getMessage('START_RECORDING')}>
                <i className="fa fa-circle" style={{color: '#a01'}}/>
              </Button>
              <Button onClick={this.onPauseRecording} disabled={!canPause}>
                <i className="fa fa-pause"/>
              </Button>
              <Button onClick={this.onStartPlayback} disabled={!canPlay}
                title={getMessage('START_PLAYBACK')}>
                <i className="fa fa-play"/>
              </Button>
              <Button onClick={this.onStopRecording} disabled={!canStop}>
                <i className="fa fa-stop"/>
              </Button>
            </ButtonGroup>
            {isPlayback
              ? <p>
                  <i className="fa fa-clock-o"/>
                  {' '}
                  {timeFormatter(position)}
                </p>
              : <p className="player-controls-times">
                  <i className="fa fa-clock-o"/>
                  {' '}
                  {timeFormatter(position)}
                  {' / '}
                  {timeFormatter(duration)}
                </p>}
            {isPlayback &&
              <Slider tipFormatter={timeFormatter} tipTransitionName="rc-slider-tooltip-zoom-down"
                value={position} min={0} max={duration} onChange={this.onSeek}>
              </Slider>}
          </div>
          <deps.StepperControls enabled={canStep}/>
        </div>
      );
    }
    onStartRecording = () => {
      this.props.dispatch({type: deps.recorderStart});
    };
    onStartPlayback = () => {
      store.dispatch({type: scope.recorderReplay});
    };
    onStopRecording = () => {
      this.props.dispatch({type: deps.recorderStop});
    };
    onPauseRecording = () => {
      this.props.dispatch({type: deps.recorderPause});
    };
    onSeek = (audioTime) => {
      self.props.dispatch({type: deps.playerSeek, audioTime});
    };
  }
  bundle.defineView('RecorderControls', RecorderControlsSelector, RecorderControls);

};

function zeroPad2 (n) {
  return ('0'+n).slice(-2);
}

function timeFormatter (ms) {
  let s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  s -= m * 60;
  return zeroPad2(m) + ':' + zeroPad2(s);
}
