
import React from 'react';
import {Button, ButtonGroup, Icon, Slider} from '@blueprintjs/core';

import {formatTime} from '../common/utils';

export default function (bundle) {

  bundle.use(
    'recorderStart', 'recorderStop', 'recorderPause', 'recorderResume',
    'playerStart', 'playerPause', 'playerSeek',
    'getRecorderState', 'getPlayerState',
    'Menu', 'StepperControls'
  );

  bundle.defineView('RecorderControls', RecorderControlsSelector, RecorderControls);

};

function RecorderControlsSelector (state, props) {
  const {getRecorderState, getPlayerState, StepperControls, Menu} = state.get('scope');
  const {recorderStart, recorderPause, recorderResume, recorderStop, playerStart, playerPause, playerSeek} = state.get('actionTypes');
  const getMessage = state.get('getMessage');
  const recorder = getRecorderState(state);
  const recorderStatus = recorder.get('status');
  const isPlayback = recorderStatus === 'paused';
  let canRecord, canPlay, canPause, canStop, canStep, position, duration, playPause;
  if (isPlayback) {
    const player = getPlayerState(state);
    const isReady = player.get('isReady');
    const isPlaying = player.get('isPlaying');
    canPlay = canStop = canRecord = canStep = isReady && !isPlaying;
    canPause = isReady && isPlaying;
    playPause = isPlaying ? 'pause' : 'play';
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
  return {
    getMessage,
    recorderStatus, isPlayback, playPause,
    canRecord, canPlay, canPause, canStop, canStep,
    position, duration,
    StepperControls, Menu,
    recorderStart, recorderPause, recorderResume, recorderStop,
    playerStart, playerPause, playerSeek,
  };
}

class RecorderControls extends React.PureComponent {

  render () {
    const {
      getMessage, canRecord, canPlay, canPause, canStop, canStep,
      isPlayback, playPause, position, duration,
      StepperControls, Menu
    } = this.props;
    return (
      <div>
        <div className='hbox' style={{marginTop: '3px'}}>
          <div className="controls controls-main" style={{flexGrow: '3'}}>
            <ButtonGroup>
              <Button onClick={this.onStartRecording} disabled={!canRecord}
                title={getMessage('START_RECORDING')} icon={<Icon icon='record' color='#a01'/>}/>
              <Button onClick={this.onStopRecording} disabled={!canStop}
                icon='stop' title={getMessage('STOP_RECORDING')} />
              {playPause === 'play'
                ? <Button onClick={this.onStartPlayback} disabled={!canPlay}
                    title={getMessage('START_PLAYBACK')} icon='play' />
                : <Button onClick={this.onPause} disabled={!canPause}
                    title={getMessage('PAUSE_PLAYBACK')} icon='pause' />}
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
          <div className='text-center' style={{flexGrow: '7'}}>
            <StepperControls enabled={canStep}/>
          </div>
          <div className='text-right' style={{flexGrow: '2'}}>
            <Menu/>
          </div>
        </div>
        {isPlayback &&
          <div className='row' style={{marginTop: '3px'}}>
            <Slider value={position} onChange={this.onSeek}
              stepSize={100} labelStepSize={30000} min={0} max={duration}
              labelRenderer={formatTime} />
          </div>}
      </div>
    );
  }
  onStartRecording = () => {
    const {recorderStatus} = this.props;
    if (recorderStatus === 'ready') {
      this.props.dispatch({type: this.props.recorderStart});
    } else {
      this.props.dispatch({type: this.props.recorderResume});
    }
  };
  onPause = () => {
    const {recorderStatus} = this.props;
    if (recorderStatus === 'recording') {
      this.props.dispatch({type: this.props.recorderPause});
    } else {
      this.props.dispatch({type: this.props.playerPause});
    }
  };
  onStartPlayback = () => {
    this.props.dispatch({type: this.props.playerStart});
  };
  onStopRecording = () => {
    this.props.dispatch({type: this.props.recorderStop});
  };
  onSeek = (audioTime) => {
    this.props.dispatch({type: this.props.playerSeek, payload: {audioTime}});
  };
}
