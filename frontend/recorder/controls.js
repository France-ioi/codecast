
import React from 'react';
import {Button, ButtonGroup} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import Slider from 'rc-slider';

export default function (bundle, deps) {

  bundle.use(
    'recorderStart', 'recorderStop', 'recorderPause', 'recorderResume',
    'playerStart', 'playerPause', 'playerResume', 'playerSeek',
    'getRecorderState', 'getPlayerState',
    'Menu', 'StepperControls'
  );

  function RecorderControlsSelector (state, props) {
    const getMessage = state.get('getMessage');
    const recorder = deps.getRecorderState(state);
    const recorderStatus = recorder.get('status');
    const isPlayback = recorderStatus === 'paused';
    let canRecord, canPlay, canPause, canStop, canStep, position, duration, playerStatus, playPause;
    if (isPlayback) {
      const player = deps.getPlayerState(state);
      playerStatus = player.get('status');
      // Pause button shows us only while playing.
      playPause = playerStatus === 'playing' ? 'pause' : 'play';
      // Buttons are enabled only in stable states.
      canPlay = canStop = canRecord = canStep = /ready|paused/.test(playerStatus);
      canPause = playerStatus === 'playing';
      position = player.get('audioTime');
      duration = player.get('duration');
    } else {
      canRecord = /ready|paused/.test(recorderStatus);
      canStop = /recording|paused/.test(recorderStatus);
      canPlay = recorderStatus === 'paused';
      canPause = canStep = recorderStatus === 'recording';
      position = duration = recorder.get('elapsed') || 0;
      playPause = 'pause';
    }
    // const events = recorder.get('events');
    // const eventCount = events && events.count();
    return {
      getMessage,
      recorderStatus, playerStatus, isPlayback, playPause,
      canRecord, canPlay, canPause, canStop, canStep,
      position, duration
    };
  }

  class RecorderControls extends React.PureComponent {

    render () {
      const {getMessage, canRecord, canPlay, canPause, canStop, canStep, isPlayback, playPause, position, duration} = this.props;
      return (
        <div className="row" style={{marginTop: '3px'}}>
          <div className="controls controls-main col-sm-3">
            <ButtonGroup>
              <Button onClick={this.onStartRecording} className="float-left" disabled={!canRecord}
                title={getMessage('START_RECORDING')}>
                <i className="fa fa-circle" style={{color: '#a01'}}/>
              </Button>
              <Button onClick={this.onStopRecording} disabled={!canStop}>
                <i className="fa fa-stop"/>
              </Button>
              {playPause === 'play'
                ? <Button onClick={this.onStartPlayback} disabled={!canPlay}
                    title={getMessage('START_PLAYBACK')}>
                    <i className="fa fa-play"/>
                  </Button>
                : <Button onClick={this.onPause} disabled={!canPause}>
                    <i className="fa fa-pause"/>
                  </Button>}
            </ButtonGroup>
            {isPlayback
              ? <p className="player-controls-times">
                  <i className="fa fa-clock-o"/>
                  {' '}
                  {timeFormatter(position)}
                  {' / '}
                  {timeFormatter(duration)}
                </p>
              : <p style={{paddingLeft: '10px'}}>
                  <i className="fa fa-clock-o"/>
                  {' '}
                  {timeFormatter(position)}
                </p>}
            {isPlayback &&
              <Slider tipFormatter={timeFormatter} tipTransitionName="rc-slider-tooltip-zoom-down"
                value={position} min={0} max={duration} onChange={this.onSeek}>
              </Slider>}
          </div>
          <div className="col-sm-7 text-center">
            <deps.StepperControls enabled={canStep}/>
          </div>
          <div className="col-sm-2 text-right">
            <deps.Menu/>
          </div>
        </div>
      );
    }
    onStartRecording = () => {
      const {recorderStatus} = this.props;
      if (recorderStatus === 'ready') {
        this.props.dispatch({type: deps.recorderStart});
      } else {
        this.props.dispatch({type: deps.recorderResume});
      }
    };
    onPause = () => {
      const {recorderStatus, playerStatus} = this.props;
      if (recorderStatus === 'recording') {
        this.props.dispatch({type: deps.recorderPause});
      } else if (playerStatus === 'playing') {
        this.props.dispatch({type: deps.playerPause});
      }
    };
    onStartPlayback = () => {
      const {playerStatus} = this.props;
      if (playerStatus === 'ready') {
        this.props.dispatch({type: deps.playerStart});
      } else if (playerStatus === 'paused') {
        this.props.dispatch({type: deps.playerResume});
      }
    };
    onStopRecording = () => {
      this.props.dispatch({type: deps.recorderStop});
    };
    onSeek = (audioTime) => {
      this.props.dispatch({type: deps.playerSeek, audioTime});
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
