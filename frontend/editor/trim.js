
import React from 'react';
import {Button, ProgressBar, Icon, Intent} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';
import {call, put, select, takeLatest} from 'redux-saga/effects';
import AudioBuffer from 'audio-buffer';
import update from 'immutability-helper';

import {RECORDING_FORMAT_VERSION} from '../version';
import {asyncRequestJson} from '../utils/api';
import {uploadBlobChannel} from '../utils/blobs';
import {spawnWorker} from '../utils/worker_utils';
import AudioWorker from 'worker-loader?inline!../audio_worker';
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

  bundle.defineAction('trimEditorSavingStepChanged', 'Editor.Trim.Saving.Step.Changed');
  bundle.addReducer('trimEditorSavingStepChanged', trimEditorSavingStepChangedReducer);

};

function editorPrepareReducer (state) {
  const intervals = intervalTree(true);
  const saving = {
    prepareUpload: 'done',
    uploadEvents: 'pending',
    assembleAudio: null,
    encodeAudio: null,
    uploadAudio: null,
    progress: 0.1,
  };
  return state.setIn(['editor', 'trim'], {intervals, saving});
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
  const {saving} = state.getIn(['editor', 'trim']);
  return {trimEditorEnter, trimEditorSave, saving};
}

class TrimEditor extends React.PureComponent {
  render () {
    const {saving} = this.props;
    return (
      <div>
        <Button onClick={this._beginEdit} icon={IconNames.EDIT} text={"Edit"}/>
        <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"}/>
        <hr/>
        <h2>{"Saving"}</h2>
        <table>
          <StepRow title={"Preparing upload"} status={saving.prepareUpload} />
          <StepRow title={"Uploading events"} status={saving.uploadEvents} />
          <StepRow title={"Assembling audio stream"} status={saving.assembleAudio} />
          <StepRow title={"Encoding audio stream"} status={saving.encodeAudio} />
          <StepRow title={"Uploading audio"} status={saving.uploadAudio} />
        </table>
        <div style={{margin: '10px'}}>
          <ProgressBar value={saving.progress} />
        </div>
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

function StepRow ({title, status}) {
  return (
    <tr style={{height: '28px'}}>
      <td style={{width: '40px', textAlign: 'center'}}>
        {status === 'done' && <Icon icon='tick' intent={Intent.SUCCESS} />}
        {status === 'error' && <Icon icon={cross} intent={Intent.DANGER} />}
      </td>
      <td style={status === 'pending' ? {fontWeight: 'bold'} : null}>
        {title}
      </td>
    </tr>
  );
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

function trimEditorSavingStepChangedReducer (state, {payload: {step, status, progress, error}}) {
  const saving = {};
  if (status !== undefined) {
    saving[step] = {$set: status};
  }
  if (typeof progress === 'number') {
    saving.progress = {$set: progress};
  }
  if (error !== undefined) {
    saving.error = {$set: error};
  }
  return state.updateIn(['editor', 'trim'], st => update(st, {saving}));
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
  // TODO: put 'saving starts' action
  try {
    const editor = yield select(state => state.get('editor'));
    const {intervals} = editor.get('trim');
    const {targets, playerUrl} = yield call(trimEditorPrepareUpload);
    const data = editor.get('data');
    const eventsBlob = trimEvents(data, intervals);
    yield call(trimEditorUpload, 'uploadEvents', targets.events, eventsBlob);
    const worker = yield call(spawnWorker, AudioWorker);
    const audioBuffer = editor.get('audioBuffer');
    yield call(trimEditorAssembleAudio, worker, audioBuffer, intervals);
    const {mp3Blob} = yield call(trimEditorEncodeAudio, worker);
    yield call(trimEditorUpload, 'uploadAudio', targets.audio, mp3Blob);
    // TODO: put 'saving success' action, passing `playerUrl`
  } catch (ex) {
    // TODO: put 'saving failed' action
  }
}

function trimEvents (data, intervals) {
  const events = [];
  const it = intervals.intervals();
  let interval = {end: -1, value: false}, start = 0;
  for (let event of data.events) {
    if (event[0] >= interval.end) {
      if (interval.value) {
        start += interval.end - interval.start;
      }
      interval = it.next().value;
    }
    event = event.slice();
    if (interval.value) {
      event[0] = start + (event[0] - interval.start);
    } else {
      event[0] = start;
    }
  }
  return new Blob([JSON.stringify({
    version: RECORDING_FORMAT_VERSION,
    events,
    subtitles: []
  })], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
}

function* trimEditorPrepareUpload () {
  const {trimEditorSavingStep} = yield select(state => state.get('scope'));
  yield put({type: trimEditorSavingStep, payload: {step: 'prepareUpload', status: 'pending'}});
  const token = yield select(getUploadToken);
  const targets = yield call(asyncRequestJson, 'upload', {token});
  yield put({type: trimEditorSavingStep, payload: {step: 'prepareUpload', status: 'done'}});
  return {targets, playerUrl: targets.player_url}; // XXX clean up /upload endpoint interface
}

function* trimEditorUpload (step, target, data) {
  const {trimEditorSavingStep} = yield select(state => state.get('scope'));
  yield put({type: trimEditorSavingStep, payload: {step, status: 'pending'}});
  const channel = yield call(uploadBlobChannel, target, data);
  while (true) {
    const event = yield take(channel);
    if (!event) break;
    switch (event.type) {
      case 'response':
        yield put({type: trimEditorSavingStep, payload: {step, status: 'done'}});
        channel.close();
        return event.response;
      case 'error':
        yield put({type: trimEditorSavingStep, payload: {step, status: 'error', error: event.error}});
        break;
      case 'progress':
        yield put({type: trimEditorSavingStep, payload: {step, progress: event.percent}});
        break;
    }
  }
  yield put({type: trimEditorSavingStep, payload: {step, status: 'error', error: 'unexpected end'}});
}

function* trimEditorAssembleAudio (worker, audioBuffer, intervals) {
  const {trimEditorSavingStep} = yield select(state => state.get('scope'));
  yield put({type: trimEditorSavingStep, payload: {step: 'assembleAudio', status: 'pending'}});
  const {sampleRate, numberOfChannels, duration} = audioBuffer;
  /* Extract the list of chunks to retain. */
  const chunks = [];
  let length = 0;
  for (let it of intervals.intervals()) {
    if (it.value) {
      const sourceStart = Math.round(it.start / 1000 * sampleRate);
      const sourceEnd = Math.round(Math.min(it.end / 1000, duration) * sampleRate);
      const chunkLength = sourceEnd - sourceStart;
      chunks.push({start: sourceStart, length: chunkLength});
      length += chunkLength;
    }
  }
  const init = yield call(worker.call, 'init', {sampleRate, numberOfChannels});
  let addedLength = 0;
  for (let {start: sourceStart, length: chunkLength} of chunks) {
    let samples = [];
    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
      const chunkBuffer = new Float32Array(chunkLength);
      audioBuffer.copyFromChannel(chunkBuffer, channelNumber, sourceStart);
      samples.push(chunkBuffer);
    }
    addedLength += chunkLength;
    yield call(worker.call, 'addSamples', {samples});
    yield put({type: trimEditorSavingStep, payload: {step: 'assembleAudio', progress: addedLength / length}});
  }
  yield put({type: trimEditorSavingStep, payload: {step: 'assembleAudio', status: 'done'}});
}

function* trimEditorEncodeAudio (worker) {
  const {trimEditorSavingStep} = yield select(state => state.get('scope'));
  const step = 'encodeAudio';
  yield put({type: trimEditorSavingStep, payload: {step, status: 'pending'}});
  const {mp3: mp3Blob} = yield call(worker.call, 'export', {mp3: true},
    function* (progress) {
      yield put({type: trimEditorSavingStep, payload: {step, progress}});
    });
  yield put({type: trimEditorSavingStep, payload: {step, status: 'done'}});
}
