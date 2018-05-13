
import React from 'react';
import {Button} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';
import {put, select, takeLatest} from 'redux-saga/effects';

import FullWaveform from './waveform/full';
import ExpandedWaveform from './waveform/expanded';
import intervalTree from './interval_tree';

export default function (bundle, deps) {

  bundle.defineAction('trimEditorEnter', 'Editor.Trim.Enter');
  bundle.defineAction('trimEditorReturn', 'Editor.Trim.Return');
  bundle.defineView('TrimEditor', TrimEditorSelector, TrimEditor);
  bundle.defineView('TrimControls', TrimControlsSelector, TrimControls);
  bundle.addSaga(trimSaga);

};

function TrimEditorSelector (state) {
  const {trimEditorEnter} = state.get('scope');
  return {trimEditorEnter};
}

class TrimEditor extends React.PureComponent {
  render () {
    return (
      <div>
        <Button onClick={this._beginEdit} icon={IconNames.EDIT} text={"Edit"}/>
        <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"}/>
      </div>
    );
  }
  _beginEdit = () => {
    this.props.dispatch({type: this.props.trimEditorEnter});
    // TODO: open player w/ trim controls
  };
  _save = () => {
    // TODO: save
  };
}

function TrimControlsSelector (state, props) {
  const {width} = props;
  console.log('width', width);
  const {getPlayerState, playerSeek} = state.get('scope');
  const editor = state.get('editor');
  const player = getPlayerState(state);
  const position = player.get('audioTime');
  const duration = player.get('duration');
  const waveform = editor.get('waveform');
  const {events} = editor.get('data');
  const visibleDuration = width * 1000 / 60;
  let viewStart = position - visibleDuration / 2;
  let viewEnd = position + visibleDuration / 2;
  if (viewStart < 0) {
    viewStart = 0;
  } else if (viewEnd > duration) {
    viewStart = Math.max(0, duration - visibleDuration);
  }
  viewEnd = viewStart + visibleDuration;
  return {
    position, viewStart, viewEnd, duration, waveform, events,
    playerSeek
  };
}


class TrimControls extends React.PureComponent {
  render () {
    const {position, viewStart, viewEnd, duration, waveform, events, width} = this.props;
    const {intervals} = this.state;
    return (
      <div>
        <div>
          <Button onClick={this.addMarker} text="Add Marker"/>
          <Button onClick={this.removeMarker} text="Remove Marker"/>
          <Button onClick={this.toggle} text="Toggle"/>
        </div>
        <FullWaveform height={60} width={width} position={position} duration={duration}
          waveform={waveform} events={events} viewStart={viewStart} viewEnd={viewEnd}
          intervals={intervals} onPan={this.seekTo} />
        <ExpandedWaveform height={100} width={width} position={position} duration={duration}
          waveform={waveform} events={events} intervals={intervals} onPan={this.seekTo} />
      </div>
    );
  }
  state = {intervals: intervalTree(true)};
  seekTo = (position) => {
    this.props.dispatch({type: this.props.playerSeek, payload: {audioTime: position}});
  };
  addMarker = () => {
    const {position} = this.props;
    const {intervals} = this.state;
    this.setState({intervals: intervals.split(position)});
  };
  removeMarker = () => {
    const {position} = this.props;
    const {intervals} = this.state;
    const {start} = intervals.get(position);
    this.setState({intervals: intervals.mergeLeft(start)});
  };
  toggle = () => {
    const {position} = this.props;
    const {intervals} = this.state;
    const {value} = intervals.get(position);
    this.setState({intervals: intervals.set(position, !value)});
  };
}

function* trimSaga () {
  const scope = yield select(state => state.get('scope'));
  yield takeLatest(scope.trimEditorEnter, trimEditorEnterSaga);
  yield takeLatest(scope.trimEditorReturn, trimEditorReturnSaga);
}

function* trimEditorEnterSaga (_action) {
  const {editorControlsChanged, TrimControls, PlayerControls, switchToScreen} = yield select(state => state.get('scope'));
  /* XXX install return button */
  yield put({type: editorControlsChanged, payload: {controls: [TrimControls, PlayerControls]}});
  yield put({type: switchToScreen, payload: {screen: 'edit'}});
}

function* trimEditorReturnSaga (_action) {
  const {switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: switchToScreen, payload: {screen: 'setup'}});
}
