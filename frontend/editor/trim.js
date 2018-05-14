
import React from 'react';
import {Button} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';
import {put, select, takeLatest} from 'redux-saga/effects';

import FullWaveform from './waveform/full';
import ExpandedWaveform from './waveform/expanded';
import intervalTree from './interval_tree';

export default function (bundle, deps) {

  bundle.addReducer('editorPrepare', editorPrepareReducer);
  bundle.defineAction('trimEditorEnter', 'Editor.Trim.Enter');
  bundle.defineAction('trimEditorReturn', 'Editor.Trim.Return');
  bundle.defineAction('trimEditorSave', 'Editor.Trim.Save');
  bundle.defineAction('trimEditorIntervalsChanged', 'Editor.Trim.Intervals.Changed');
  bundle.defineAction('trimEditorMarkerAdded', 'Editor.Trim.MarkerAdded');
  bundle.defineAction('trimEditorMarkerRemoved', 'Editor.Trim.MarkerRemoved');
  bundle.defineAction('trimEditorIntervalToggled', 'Editor.Trim.IntervalToggled');
  bundle.addReducer('trimEditorMarkerAdded', trimEditorMarkerAddedReducer);
  bundle.addReducer('trimEditorMarkerRemoved', trimEditorMarkerRemovedReducer);
  bundle.addReducer('trimEditorIntervalToggled', trimEditorIntervalToggledReducer);
  bundle.defineView('TrimEditor', TrimEditorSelector, TrimEditor);
  bundle.defineView('TrimEditorControls', TrimEditorControlsSelector, TrimEditorControls);
  bundle.defineView('TrimEditorReturn', TrimEditorReturnSelector, TrimEditorReturn);
  bundle.addSaga(trimSaga);

};

function editorPrepareReducer (state) {
  const intervals = intervalTree(true);
  return state.setIn(['editor', 'trim'], {intervals});
}

function trimEditorMarkerAddedReducer (state, {payload: {position}}) {
  return state.updateIn(['editor', 'trim'], st => ({...st,
    intervals: st.intervals.split(position)}));
}

function trimEditorMarkerRemovedReducer (state, {payload: {position}}) {
  return state.updateIn(['editor', 'trim'], st => ({...st,
    intervals: st.intervals.mergeLeft(st.intervals.get(position).start)}));
}

function trimEditorIntervalToggledReducer (state, {payload: {position}}) {
  return state.updateIn(['editor', 'trim'], st => ({...st,
    intervals: st.intervals.set(position, !st.intervals.get(position).value)}));
}

function TrimEditorSelector (state) {
  const {trimEditorEnter, trimEditorSave} = state.get('scope');
  return {trimEditorEnter, trimEditorSave};
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
  };
  _save = () => {
    this.props.dispatch({type: this.props.trimEditorSave});
  };
}

function TrimEditorControlsSelector (state, props) {
  const {width} = props;
  const {getPlayerState, playerSeek, trimEditorMarkerAdded,
    trimEditorMarkerRemoved, trimEditorIntervalToggled} = state.get('scope');
  const editor = state.get('editor');
  const player = getPlayerState(state);
  const position = player.get('audioTime');
  const duration = player.get('duration');
  const waveform = editor.get('waveform');
  const {events} = editor.get('data');
  const {intervals} = editor.get('trim');
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
    position, viewStart, viewEnd, duration, waveform, events, intervals,
    playerSeek, trimEditorMarkerAdded, trimEditorMarkerRemoved, trimEditorIntervalToggled
  };
}

class TrimEditorControls extends React.PureComponent {
  render () {
    const {position, viewStart, viewEnd, duration, waveform, events, width, intervals} = this.props;
    return (
      <div>
        <div>
          <Button onClick={this.addMarker} text="Add Marker"/>
          <Button onClick={this.removeMarker} text="Remove Marker"/>
          <Button onClick={this.toggleInterval} text="Toggle"/>
        </div>
        <ExpandedWaveform height={100} width={width} position={position} duration={duration}
          waveform={waveform} events={events} intervals={intervals} onPan={this.seekTo} />
        <FullWaveform height={60} width={width} position={position} duration={duration}
          waveform={waveform} events={events} viewStart={viewStart} viewEnd={viewEnd}
          intervals={intervals} onPan={this.seekTo} />
      </div>
    );
  }
  seekTo = (position) => {
    this.props.dispatch({type: this.props.playerSeek, payload: {audioTime: position}});
  };
  addMarker = () => {
    const {position} = this.props;
    this.props.dispatch({type: this.props.trimEditorMarkerAdded, payload: {position}});
  };
  removeMarker = () => {
    const {position} = this.props;
    this.props.dispatch({type: this.props.trimEditorMarkerRemoved, payload: {position}});
  };
  toggleInterval = () => {
    const {position} = this.props;
    this.props.dispatch({type: this.props.trimEditorIntervalToggled, payload: {position}});
  };
}

function TrimEditorReturnSelector (state) {
  const {trimEditorReturn} = state.get('actionTypes');
  return {return: trimEditorReturn};
}

class TrimEditorReturn extends React.PureComponent {
  render () {
    return <Button onClick={this._return}><i className='fa fa-reply'/></Button>;
  }
  _return = () => {
    this.props.dispatch({type: this.props.return});
  };
}

function* trimSaga () {
  const scope = yield select(state => state.get('scope'));
  yield takeLatest(scope.trimEditorEnter, trimEditorEnterSaga);
  yield takeLatest(scope.trimEditorReturn, trimEditorReturnSaga);
  yield takeLatest(scope.trimEditorSave, trimEditorSaveSaga);
}

function* trimEditorEnterSaga (_action) {
  const {editorControlsChanged, TrimEditorControls, PlayerControls, TrimEditorReturn, switchToScreen} = yield select(state => state.get('scope'));
  /* XXX install return button */
  yield put({type: editorControlsChanged, payload: {
    controls: {
      top: [TrimEditorControls, PlayerControls],
      floating: [TrimEditorReturn]
    }}});
  yield put({type: switchToScreen, payload: {screen: 'edit'}});
}

function* trimEditorReturnSaga (_action) {
  const {editorControlsChanged, switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: editorControlsChanged, payload: {controls: {floating: []}}});
  yield put({type: switchToScreen, payload: {screen: 'setup'}});
}

function* trimEditorSaveSaga (_action) {
  const {intervals} = yield select(state => state.getIn(['editor', 'trim']));
  console.log('save', intervals);
}
