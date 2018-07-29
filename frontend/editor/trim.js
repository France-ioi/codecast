
import React from 'react';
import {AnchorButton, Button, Checkbox, FormGroup, ProgressBar, HTMLSelect, Icon, Intent, Spinner} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';
import {call, put, select, take, takeLatest} from 'redux-saga/effects';
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
import {findInstantIndex} from '../player/utils';

export default function (bundle, deps) {

  bundle.addReducer('editorPrepare', editorPrepareReducer);
  bundle.defineAction('trimEditorEnter', 'Editor.Trim.Enter');
  bundle.defineAction('trimEditorReturn', 'Editor.Trim.Return');
  bundle.defineAction('trimEditorSave', 'Editor.Trim.Save');
  bundle.addReducer('trimEditorSave', trimEditorSaveReducer);
  bundle.defineAction('trimEditorIntervalsChanged', 'Editor.Trim.Intervals.Changed');
  bundle.defineAction('trimEditorMarkerAdded', 'Editor.Trim.MarkerAdded');
  bundle.defineAction('trimEditorMarkerRemoved', 'Editor.Trim.MarkerRemoved');
  bundle.defineAction('trimEditorIntervalChanged', 'Editor.Trim.Interval.Changed');
  bundle.addReducer('trimEditorMarkerAdded', trimEditorMarkerAddedReducer);
  bundle.addReducer('trimEditorMarkerRemoved', trimEditorMarkerRemovedReducer);
  bundle.addReducer('trimEditorIntervalChanged', trimEditorIntervalChangedReducer);
  bundle.defineView('TrimEditor', TrimEditorSelector, TrimEditor);
  bundle.defineView('TrimEditorControls', TrimEditorControlsSelector, TrimEditorControls);
  bundle.defineView('TrimEditorReturn', TrimEditorReturnSelector, TrimEditorReturn);
  bundle.addSaga(trimSaga);

  bundle.defineAction('trimEditorSavingStep', 'Editor.Trim.Saving.Step');
  bundle.addReducer('trimEditorSavingStep', trimEditorSavingStepReducer);
  bundle.defineAction('trimEditorSavingDone', 'Editor.Trim.Saving.Done');
  bundle.addReducer('trimEditorSavingDone', trimEditorSavingDoneReducer);

};

function editorPrepareReducer (state) {
  const intervals = intervalTree({skip: false, mute: false});
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

function trimEditorIntervalChangedReducer (state, {payload: {position, value}}) {
  /* TODO: update instants in the player, to add/remove jump at position */
  let {intervals} = state.getIn(['editor', 'trim']);
  intervals = intervals.set(position, value);
  let instants = state.getIn(['player', 'instants']);
  instants = addJumpInstants(instants, intervals);
  return state
    .updateIn(['editor', 'trim'], st => ({...st, intervals}))
    .setIn(['player', 'instants'], instants);
}

function addJumpInstants (instants, intervals) {
  /* Clear existing annotations (also copy the Array we will mutate). */
  instants = instants.filter(instant => instant.event);
  let skip = false, skipStart, skipTarget;
  for (let interval of intervals) {
    const mute = interval.value.mute;
    insertAnnotation(Math.max(1, interval.start), {mute});
    if (skip !== interval.value.skip) {
      if (!skip) {
        skipStart = Math.max(1, interval.start);
      } else {
        /* At jump target. */
        insertAnnotation(skipStart, {jump: interval.start, mute});
      }
      skip = interval.value.skip;
    }
  }
  if (skip) {
    insertAnnotation(skipStart, {jump: instants[instants.length - 1].t})
  }
  return instants;
  function insertAnnotation (t, data) {
    let index = findInstantIndex(instants, t);
    /* Insert an annotation at the requested position, if necessary. */
    if (instants[index].t < t || instants[index].event) {
      const state = instants[index].state;
      index += 1;
      instants.splice(index, 0, {t, state});
    }
    instants[index] = {...instants[index], ...data};
  }
}

function TrimEditorSelector (state) {
  const {trimEditorEnter, trimEditorSave} = state.get('scope');
  const {saving} = state.getIn(['editor', 'trim']);
  const {grants} = state.get('user');
  return {trimEditorEnter, trimEditorSave, saving, grants};
}

const savingSteps = [
  {key: 'prepareUpload', label: "Preparing upload"},
  {key: 'uploadEvents', label: "Uploading events"},
  {key: 'assembleAudio', label: "Assembling audio stream"},
  {key: 'encodeAudio', label: "Encoding audio stream"},
  {key: 'uploadAudio', label: "Uploading audio"},
];

class TrimEditor extends React.PureComponent {
  render () {
    const {saving, grants} = this.props;
    const {targetUrl} = this.state;
    const grantOptions = grants.map(({url, description}) => ({value: url, label: description}));
    let savingView = false;
    if (saving) {
      const stepRows = [];
      for (let step of savingSteps) {
        const status = saving[step.key];
        stepRows.push(<StepRow title={step.label} status={status} />);
        if (status === 'pending') {
          stepRows.push(
            <div style={{margin: '10px 0 20px 0'}}>
              <ProgressBar value={saving.progress} />
            </div>
          );
        }
      }
      savingView = (
        <div style={{marginTop: '10px'}}>
          <h2>{"Saving"}</h2>
          <div className="vbox">
            {stepRows}
          </div>
          {saving.done &&
            <div style={{textAlign: 'center'}}>
              <AnchorButton href={saving.playerUrl} target='_blank' text="Open in player"/>
            </div>}
        </div>
      );
    }
    return (
      <div>
        <Button onClick={this._beginEdit} icon={IconNames.EDIT} text={"Edit"}/>
        <FormGroup label="Target">
          <HTMLSelect options={grantOptions} value={targetUrl} onChange={this.handleTargetChange} />
        </FormGroup>
        <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"}/>
        {savingView}
      </div>
    );
  }
  static getDerivedStateFromProps (props, state) {
    /* Default to first valid grant. */
    if (!state.targetUrl) {
      return {targetUrl: props.grants[0].url};
    }
    return null;
  }
  state = {targetUrl: ''};
  handleTargetChange = (event) => {
    this.setState({targetUrl: event.target.value});
  };
  _beginEdit = () => {
    this.props.dispatch({type: this.props.trimEditorEnter});
  };
  _save = () => {
    const {targetUrl} = this.state;
    const grant = this.props.grants.find(grant => grant.url === targetUrl);
    if (grant) {
      this.props.dispatch({type: this.props.trimEditorSave, payload: {target: grant}});
    }
  };
}

function StepRow ({title, status}) {
  return (
    <tr style={{height: '28px'}}>
      <td style={{width: '40px', textAlign: 'center'}}>
        {status === 'done' && <Icon icon='tick' intent={Intent.SUCCESS} />}
        {status === 'error' && <Icon icon='cross' intent={Intent.DANGER} />}
        {status === 'pending' && <Spinner size={20}/>}
      </td>
      <td style={status === 'pending' ? {fontWeight: 'bold'} : null}>
        {title}
      </td>
    </tr>
  );
}

function TrimEditorControlsSelector (state, props) {
  const {width} = props;
  const {getPlayerState} = state.get('scope');
  const actionTypes = state.get('actionTypes');
  const editor = state.get('editor');
  const player = getPlayerState(state);
  const position = Math.round(player.get('audioTime'));
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
  const selectedInterval = intervals.get(position);
  viewEnd = viewStart + visibleDuration;
  return {
    actionTypes, position, viewStart, viewEnd, duration, waveform, events, intervals, selectedInterval,
  };
}

class TrimEditorControls extends React.PureComponent {
  render () {
    const {position, viewStart, viewEnd, duration, waveform, events, width, intervals, selectedInterval} = this.props;
    return (
      <div>
        <div className='hbox'>
          <Button onClick={this.addMarker} text="Add Marker"/>
          <Button onClick={this.removeMarker} text="Remove Marker"/>
          {/*<Button onClick={this.toggleInterval} text="Toggle"/>*/}
          <div>
            <Checkbox checked={selectedInterval.value.skip} onChange={this.intervalSkipChanged}>
              {"Skip"}
            </Checkbox>
            <Checkbox checked={selectedInterval.value.mute} onChange={this.intervalMuteChanged}>
              {"Mute"}
            </Checkbox>
          </div>
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
    this.props.dispatch({type: this.props.actionTypes.playerSeek, payload: {audioTime: position}});
  };
  addMarker = () => {
    const {position} = this.props;
    this.props.dispatch({type: this.props.actionTypes.trimEditorMarkerAdded, payload: {position}});
  };
  removeMarker = () => {
    const {position} = this.props;
    this.props.dispatch({type: this.props.actionTypes.trimEditorMarkerRemoved, payload: {position}});
  };
  intervalSkipChanged = (event) => {
    const {position, selectedInterval} = this.props;
    const skip = event.target.checked;
    let {value} = selectedInterval;
    this.props.dispatch({type: this.props.actionTypes.trimEditorIntervalChanged, payload: {position, value: {...value, skip}}});
  };
  intervalMuteChanged = (event) => {
    const {position, selectedInterval} = this.props;
    let {value} = selectedInterval;
    const mute = event.target.checked;
    this.props.dispatch({type: this.props.actionTypes.trimEditorIntervalChanged, payload: {position, value: {...value, mute}}});
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

function trimEditorSavingStepReducer (state, {payload: {step, status, progress, error}}) {
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

function trimEditorSaveReducer (state, _action) {
  const saving = {
    prepareUpload: null,
    uploadEvents: null,
    assembleAudio: null,
    encodeAudio: null,
    uploadAudio: null,
    progress: 0,
  };
  return state.updateIn(['editor', 'trim'], st => ({...st, saving}));
}

function trimEditorSavingDoneReducer (state, {payload: {playerUrl}}) {
  return state.updateIn(['editor', 'trim'], st => update(st, {
    saving: {
      done: {$set: true},
      playerUrl: {$set: playerUrl}
    }}));
}

function* trimEditorSaveSaga ({payload: {target}}) {
  // TODO: put 'saving starts' action
  const {trimEditorSavingDone} = yield select(state => state.get('scope'));
  try {
    const editor = yield select(state => state.get('editor'));
    const {intervals} = editor.get('trim');
    const {targets, playerUrl} = yield call(trimEditorPrepareUpload, target);
    const data = editor.get('data');
    const eventsBlob = trimEvents(data, intervals);
    yield call(trimEditorUpload, 'uploadEvents', targets.events, eventsBlob);
    const audioBuffer = editor.get('audioBuffer');
    const worker = yield call(trimEditorAssembleAudio, audioBuffer, intervals);
    const mp3Blob = yield call(trimEditorEncodeAudio, worker);
    yield call(trimEditorUpload, 'uploadAudio', targets.audio, mp3Blob);
    yield put({type: trimEditorSavingDone, payload: {playerUrl}});
  } catch (ex) {
    console.log('failed', ex);
    // TODO: put 'saving failed' action
  }
}

function trimEvents (data, intervals) {
  const it = intervals[Symbol.iterator]();
  let start = 0;
  const endTime = data.events[data.events.length - 1][0];
  let interval = {start: -1, end: -1, value: {skip: true, mute: false}};
  const events = [];
  for (let event of data.events) {
    if (event[0] >= interval.end) {
      /* Advance start time if past interval was not skipped. */
      if (!interval.value.skip) {
        start += interval.end - interval.start;
      }
      interval = it.next().value;
      /* Truncate the events if we get to the last interval and it is skipped. */
      console.log('end?', event[0], interval.end, interval.value.skip);
      if (interval.value.skip && interval.end >= endTime) {
        events.push([interval.start, 'end']);
        break;
      }
    }
    event = event.slice();
    if (interval.value.skip) {
      event[0] = start;
    } else {
      event[0] = start + (event[0] - interval.start);
    }
    events.push(event);
  }
  return new Blob([JSON.stringify({
    version: RECORDING_FORMAT_VERSION,
    events,
    subtitles: []
  })], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
}

function* trimEditorPrepareUpload (target) {
  const {trimEditorSavingStep} = yield select(state => state.get('scope'));
  yield put({type: trimEditorSavingStep, payload: {step: 'prepareUpload', status: 'pending'}});
  const targets = yield call(asyncRequestJson, 'upload', target);
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
        yield put({type: trimEditorSavingStep, payload: {step, progress: event.percent / 100}});
        break;
    }
  }
  yield put({type: trimEditorSavingStep, payload: {step, status: 'error', error: 'unexpected end'}});
}

function* trimEditorAssembleAudio (audioBuffer, intervals) {
  const {trimEditorSavingStep} = yield select(state => state.get('scope'));
  yield put({type: trimEditorSavingStep, payload: {step: 'assembleAudio', status: 'pending'}});
  const worker = yield call(spawnWorker, AudioWorker);
  const {sampleRate, numberOfChannels, duration} = audioBuffer;
  /* Extract the list of chunks to retain. */
  const chunks = [];
  let length = 0;
  for (let it of intervals) {
    let {skip, mute} = it.value;
    if (!skip) {
      const sourceStart = Math.round(it.start / 1000 * sampleRate);
      const sourceEnd = Math.round(Math.min(it.end / 1000, duration) * sampleRate);
      const chunkLength = sourceEnd - sourceStart;
      chunks.push({start: sourceStart, length: chunkLength, mute});  // add muted flag here
      length += chunkLength;
    }
  }
  const init = yield call(worker.call, 'init', {sampleRate, numberOfChannels});
  let addedLength = 0;
  for (let chunk of chunks) {
    let samples = [];
    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
      const chunkBuffer = new Float32Array(chunk.length);
      if (!chunk.mute) {
        audioBuffer.copyFromChannel(chunkBuffer, channelNumber, chunk.start);
      }
      samples.push(chunkBuffer);
    }
    addedLength += chunk.length;
    yield call(worker.call, 'addSamples', {samples});
    yield put({type: trimEditorSavingStep, payload: {step: 'assembleAudio', progress: addedLength / length}});
  }
  yield put({type: trimEditorSavingStep, payload: {step: 'assembleAudio', status: 'done'}});
  return worker;
}

function* trimEditorEncodeAudio (worker) {
  const {trimEditorSavingStep} = yield select(state => state.get('scope'));
  const step = 'encodeAudio';
  yield put({type: trimEditorSavingStep, payload: {step, status: 'pending'}});
  const {mp3: mp3Blob} = yield call(worker.call, 'export', {mp3: true},
    function* ({progress}) {
      yield put({type: trimEditorSavingStep, payload: {step, progress}});
    });
  yield put({type: trimEditorSavingStep, payload: {step, status: 'done'}});
  return mp3Blob;
}
