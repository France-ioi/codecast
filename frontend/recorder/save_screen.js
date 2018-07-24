
import {takeLatest, take, put, call, select} from 'redux-saga/effects';
import React from 'react';
import {Button, FormGroup, HTMLSelect, Icon, Intent, ProgressBar, Spinner} from '@blueprintjs/core';

import {RECORDING_FORMAT_VERSION} from '../version';
import {asyncRequestJson} from '../utils/api';
import {getBlob, uploadBlob} from '../utils/blobs';

export default function (bundle) {

  bundle.defineAction('saveScreenEncodingStart', 'Save.Encoding.Start');
  bundle.defineAction('saveScreenEncodingProgress', 'Save.Encoding.Progress');
  bundle.defineAction('saveScreenEncodingDone', 'Save.Encoding.Done');
  bundle.defineAction('saveScreenUpload', 'Save.Upload.Start');
  bundle.defineAction('saveScreenPreparing', 'Save.Prepare.Pending');
  bundle.defineAction('saveScreenEventsUploading', 'Save.Events.Upload.Pending');
  bundle.defineAction('saveScreenEventsUploaded', 'Save.Events.Upload.Success');
  bundle.defineAction('saveScreenAudioUploading', 'Save.Audio.Upload.Pending');
  bundle.defineAction('saveScreenAudioUploaded', 'Save.Audio.Upload.Success');
  bundle.defineAction('saveScreenUploadSucceeded', 'Save.Success');
  bundle.defineAction('saveScreenUploadFailed', 'Save.Failure');

  bundle.addReducer('saveScreenEncodingStart', function (state, action) {
    return state.update('save', save => ({...save, step: 'encoding pending', progress: 0}));
  });

  bundle.addReducer('saveScreenEncodingProgress', function (state, {payload: progress}) {
    return state.update('save', save => ({...save, progress}));
  });

  bundle.addReducer('saveScreenEncodingDone', function (state, {payload: {audioUrl, wavAudioUrl, eventsUrl}}) {
    return state.update('save', save => ({...save, step: 'encoding done', audioUrl, wavAudioUrl, eventsUrl, progress: false}));
  });

  bundle.addReducer('saveScreenPreparing', function (state, action) {
    return state.update('save', save => ({...save, step: 'upload preparing'}));
  });

  bundle.addReducer('saveScreenEventsUploading', function (state, _action) {
    return state.update('save', save => ({...save, step: 'upload events pending'}));
  });

  bundle.addReducer('saveScreenEventsUploaded', function (state, {payload: {url}}) {
    return state.update('save', save => ({...save, step: 'upload events done', eventsUrl: url}));
  });

  bundle.addReducer('saveScreenAudioUploading', function (state, action) {
    return state.update('save', save => ({...save, step: 'upload audio pending'}));
  });

  bundle.addReducer('saveScreenAudioUploaded', function (state, {payload: {url}}) {
    return state.update('save', save => ({...save, step: 'upload audio done', audioUrl: url}));
  });

  bundle.addReducer('saveScreenUploadSucceeded', function (state, {payload: {playerUrl}}) {
    return state.update('save', save => ({...save, step: 'done', playerUrl}));
  });

  bundle.addReducer('saveScreenUploadFailed', function (state, {payload: {error}}) {
    return state.update('save', save => ({...save, step: 'error', error}));
  });

  bundle.addSaga(function* saveSaga (arg) {
    const {actionTypes} = arg;
    yield takeLatest(actionTypes.recorderStopped, encodingSaga, arg)
    yield takeLatest(actionTypes.saveScreenUpload, uploadSaga, arg);
  });

  bundle.defineView('SaveScreen', SaveScreenSelector, SaveScreen);

};

function SaveScreenSelector (state, props) {
  const getMessage = state.get('getMessage');
  const actionTypes = state.get('actionTypes');
  const {grants} = state.get('user');
  const {step, progress, audioUrl, wavAudioUrl, eventsUrl, playerUrl, error} = state.get('save');
  return {getMessage, actionTypes, grants, step, progress, audioUrl, wavAudioUrl, eventsUrl, playerUrl, error};
}

class SaveScreen extends React.PureComponent {

  render () {
    const {getMessage, grants} = this.props;
    const {audioUrl, wavAudioUrl, eventsUrl, playerUrl, step, error, progress} = this.props;
    const {targetUrl} = this.state;
    const grantOptions = grants.map(({url, description}) => ({value: url, label: description}));
    let message = null, canUpload = false, busy = false;
    switch (step) {
    case 'encoding pending':
      message = "Encoding, please wait…";
      busy = true;
      // PROGRESS
      break;
    case 'encoding done':
      message = "Encoding complete, ready to upload.";
      canUpload = true;
      break;
    case 'upload preparing':
      message = "Preparing to upload…";
      busy = true;
      break;
    case 'upload events pending':
      message = "Uploading events…";
      busy = true;
      break;
    case 'upload events done':
      message = "Uploading events… done.";
      break;
    case 'upload audio pending':
      message = "Uploading audio…";
      busy = true;
      break;
    case 'upload audio done':
      message = "Uploading audio done.";
      break;
    case 'done':
      message = "Save complete.";
      break;
    case 'error':
      message = "An error has occured.";
      break;
    }
    /* TODO: select target among user grants */
    return (
      <form>
        <FormGroup labelFor='eventsUrlInput' label={"URL évènements"}>
          <input id='eventsUrlInput' type='text' className='bp3-input bp3-fill' value={eventsUrl||''} readOnly/>
        </FormGroup>
        <FormGroup labelFor='audioUrlInput' label={"URL audio"}>
          <input id='audioUrlInput' type='text' className='bp3-input bp3-fill' value={audioUrl||''} readOnly/>
        </FormGroup>
        {wavAudioUrl &&
          <FormGroup labelFor='wavAudioUrlInput' label={"URL audio (wav)"}>
            <input id='wavAudioUrlInput' type='text' className='bp3-input bp3-fill' value={wavAudioUrl||''} readOnly/>
          </FormGroup>}
        <FormGroup label="Target">
          <HTMLSelect options={grantOptions} value={targetUrl} onChange={this.handleTargetChange} />
        </FormGroup>
        <Button onClick={this.onUpload} disabled={!canUpload} intent={canUpload ? Intent.PRIMARY : Intent.NONE}
          icon='floppy-disk' text="Save" />
        <p>
          {busy
            ? <Spinner small/>
            : (step === 'done'
                ? <Icon icon='tick' intent={Intent.SUCCESS} />
                : false)}
          {message}
        </p>
        {typeof progress === 'number' &&
          <ProgressBar value={progress} />}
        {playerUrl &&
          <FormGroup labelFor='playerUrlInput' label={getMessage('PLAYBACK_LINK')}>
            <input id='playerUrlInput' type='text' className='bp3-input bp3-fill' value={playerUrl} readOnly/>
          </FormGroup>}
      </form>
    );
  }

  state = {targetUrl: ''}; // TODO: default to first valid grant
  handleTargetChange = (event) => {
    this.setState({targetUrl: event.target.value});
  };

  onUpload = () => {
    const {targetUrl} = this.state;
    const grant = this.props.grants.find(grant => grant.url === targetUrl);
    if (grant) {
      const {s3Bucket, uploadPath} = grant;
      this.props.dispatch({type: this.props.actionTypes.saveScreenUpload, payload: {s3Bucket, uploadPath}});
    }
  };

}

function* encodingSaga ({actionTypes, selectors}) {
  yield put({type: actionTypes.saveScreenEncodingStart, payload: {}});
  yield put({type: actionTypes.switchToScreen, payload: {screen: 'save'}});
  const recorder = yield select(selectors.getRecorderState);
  /* Encode the audio track, reporting progress. */
  const {worker} = recorder.get('context');
  const {mp3, wav, duration} = yield call(worker.call, 'export', {mp3: true, wav: true}, encodingProgressSaga);
  const mp3Url = URL.createObjectURL(mp3);
  const wavUrl = URL.createObjectURL(wav);
   /* Ensure the 'end' event occurs before the end of the audio track. */
  const version = RECORDING_FORMAT_VERSION;
  const endTime = Math.floor(duration * 1000);
  const events = recorder.get('events').push([endTime, 'end']);
  const subtitles = [];
  const data = {version, events, subtitles};
  const eventsBlob = new Blob([JSON.stringify(data)], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
  const eventsUrl = URL.createObjectURL(eventsBlob);
  /* Signal that the recorder has stopped. */
  yield put({
    type: actionTypes.saveScreenEncodingDone,
    payload: {
      audioUrl: mp3Url,
      wavAudioUrl: wavUrl,
      eventsUrl: eventsUrl,
    }
  });
  function* encodingProgressSaga ({step, progress}) {
    /* step: copy|wav|mp3 */
    yield put({type: actionTypes.saveScreenEncodingProgress, payload: {step, progress}});
  }
}

function* uploadSaga ({actionTypes, selectors}, {payload: {s3Bucket, uploadPath}}) {
  try {
    // Step 1: prepare the upload by getting the S3 form parameters
    // from the server.
    yield put({type: actionTypes.saveScreenPreparing});
    const save = yield select(state => state.get('save'));
    const response = yield call(asyncRequestJson, 'upload', {s3Bucket, uploadPath});
    // Upload the events file.
    yield put({type: actionTypes.saveScreenEventsUploading});
    const eventsBlob = yield call(getBlob, save.eventsUrl);
    yield call(uploadBlob, response.events, eventsBlob);
    yield put({type: actionTypes.saveScreenEventsUploaded, payload: {url: response.events.public_url}});
    // Upload the audio file.
    yield put({type: actionTypes.saveScreenAudioUploading});
    const audioBlob = yield call(getBlob, save.audioUrl);
    yield call(uploadBlob, response.audio, audioBlob);
    yield put({type: actionTypes.saveScreenAudioUploaded, payload: {url: response.audio.public_url}});
    // Signal completion.
    yield put({type: actionTypes.saveScreenUploadSucceeded, payload: {playerUrl: response.player_url}});
  } catch (error) {
    yield put({type: actionTypes.saveScreenUploadFailed, payload: {error}});
  }
}


/*
  Use as part of restarting the recorder:
    const context = state.getIn(['recorder', 'context']);
      .set('recorder', Immutable.Map({status: 'ready', context}))
*/
