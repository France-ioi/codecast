
import {take, put, call, select} from 'redux-saga/effects';
import React from 'react';
import {Button, FormGroup} from '@blueprintjs/core';

import {asyncRequestJson} from '../utils/api';
import {getBlob, uploadBlob} from '../utils/blobs';

export default function (bundle, deps) {

  bundle.defineAction('saveScreenUploadStart', 'Save.Prepare.Start');
  bundle.defineAction('saveScreenPreparing', 'Save.Prepare.Pending');
  bundle.defineAction('saveScreenPrepared', 'Save.Prepare.Completed');
  bundle.defineAction('saveScreenEventsUploading', 'Save.Events.Upload.Pending');
  bundle.defineAction('saveScreenEventsUploaded', 'Save.Events.Upload.Success');
  bundle.defineAction('saveScreenAudioUploading', 'Save.Audio.Upload.Pending');
  bundle.defineAction('saveScreenAudioUploaded', 'Save.Audio.Upload.Success');
  bundle.defineAction('saveScreenUploadSucceeded', 'Save.Success');
  bundle.defineAction('saveScreenUploadFailed', 'Save.Failure');

  bundle.defineSelector('getSaveState', state =>
    state.get('save')
  );

  bundle.addReducer('saveScreenUploadStart', function (state, action) {
    return state.setIn(['save', 'busy'], true);
  });

  bundle.addReducer('saveScreenPreparing', function (state, action) {
    return state.setIn(['save', 'prepare'], 'pending');
  });

  bundle.addReducer('saveScreenPrepared', function (state, action) {
    return state.setIn(['save', 'prepare'], 'done');
  });

  bundle.addReducer('saveScreenEventsUploading', function (state, action) {
    return state.setIn(['save', 'uploadEvents'], 'pending');
  });

  bundle.addReducer('saveScreenEventsUploaded', function (state, action) {
    return state.update('save', save => save
      .set('uploadEvents', 'done').set('eventsUrl', action.url));
  });

  bundle.addReducer('saveScreenAudioUploading', function (state, action) {
    return state.setIn(['save', 'uploadAudio'], 'pending');
  });

  bundle.addReducer('saveScreenAudioUploaded', function (state, action) {
    return state.update('save', save => save
      .set('uploadAudio', 'done').set('audioUrl', action.url));
  });

  bundle.addReducer('saveScreenUploadSucceeded', function (state, action) {
    const {playerUrl} = action;
    return state.update('save', save => save
      .set('busy', false).set('done', true).set('playerUrl', playerUrl));
  });

  bundle.addReducer('saveScreenUploadFailed', function (state, action) {
    return state.update('save', save => save
      .set('busy', false).set('error', action.error));
  });

  bundle.defineAction('uploadTokenChanged', 'Save.UploadToken.Changed');
  bundle.addReducer('uploadTokenChanged', function (state, {token}) {
    return state.set('uploadToken', token);
  });
  function getUploadToken (state) {
    return state.get('uploadToken');
  }

  function* uploadRecording () {
    try {
      // Step 1: prepare the upload by getting the S3 form parameters
      // from the server.
      yield put({type: deps.saveScreenPreparing});
      const save = yield select(deps.getSaveState);
      const token = yield select(getUploadToken);
      const response = yield call(asyncRequestJson, 'upload', {token});
      yield put({type: deps.saveScreenPrepared});
      // Upload the events file.
      yield put({type: deps.saveScreenEventsUploading});
      const eventsBlob = yield call(getBlob, save.get('eventsUrl'));
      yield call(uploadBlob, response.events, eventsBlob);
      yield put({type: deps.saveScreenEventsUploaded, url: response.events.public_url});
      // Upload the audio file.
      yield put({type: deps.saveScreenAudioUploading});
      const audioBlob = yield call(getBlob, save.get('audioUrl'));
      yield call(uploadBlob, response.audio, audioBlob);
      yield put({type: deps.saveScreenAudioUploaded, url: response.audio.public_url});
      // Signal completion.
      yield put({type: deps.saveScreenUploadSucceeded, playerUrl: response.player_url});
    } catch (error) {
      yield put({type: deps.saveScreenUploadFailed, error});
    }
  }

  bundle.addSaga(function* watchUploadStart () {
    while (true) {
      yield take(deps.saveScreenUploadStart);
      yield call(uploadRecording);
    }
  });

  bundle.defineSelector('SaveScreenSelector', function (state, props) {
    const getMessage = state.get('getMessage');
    const save = state.get('save')
    const result = {getMessage};
    ['audioUrl', 'wavAudioUrl', 'eventsUrl', 'playerUrl', 'busy', 'done', 'prepare', 'uploadEvents', 'uploadAudio', 'error'].forEach(function (key) {
      result[key] = save.get(key);
    })
    return result;
  });

  class SaveScreen extends React.PureComponent {

    onUpload = () => {
      this.props.dispatch({type: deps.saveScreenUploadStart});
    };

    render () {
      const {getMessage, audioUrl, wavAudioUrl, eventsUrl, playerUrl, busy, done, prepare, uploadEvents, uploadAudio, error} = this.props;
      return (
        <form>
          <FormGroup labelFor='eventsUrlInput' label={"URL évènements"}>
            <input id='eventsUrlInput' type='text' className='pt-input' value={eventsUrl} readOnly/>
          </FormGroup>
          <FormGroup labelFor='audioUrlInput' label={"URL audio"}>
            <input id='audioUrlInput' type='text' className='pt-input' value={audioUrl} readOnly/>
          </FormGroup>
          {wavAudioUrl &&
            <FormGroup labelFor='wavAudioUrlInput' label={"URL audio (wav)"}>
              <input id='wavAudioUrlInput' type='text' className='pt-input' value={wavAudioUrl} readOnly/>
            </FormGroup>}
          <p>
            <Button onClick={this.onUpload} disabled={busy || done} intent={done && Intents.PRIMARY}
              icon='floppy-disk' text="Save" />
            {/* TODO: cleanup status */}
            {busy
              ? <i className="fa fa-spin fa-spinner"/>
              : (done
                  ? <i className="fa fa-check"/>
                  : false)}
          </p>
          {prepare === 'pending' && <p>{getMessage('PREPARING_RECORDING')}</p>}
          {uploadEvents === 'pending' && <p>{getMessage('UPLOADING_EVENTS')}</p>}
          {uploadAudio === 'pending' && <p>{getMessage('UPLOADING_AUDIO')}</p>}
          {error && <p>{getMessage('UPLOADING_ERROR')}</p>}
          {done && <p>{getMessage('UPLOADING_COMPLETE')}</p>}
          {done &&
            <FormGroup labelFor='playerUrlInput' label={getMessage('PLAYBACK_LINK')}>
              <input id='playerUrlInput' type='text' className='pt-input' value={playerUrl} readOnly/>
            </FormGroup>}
        </form>
      );
    };

  }
  bundle.defineView('SaveScreen', 'SaveScreenSelector', SaveScreen);

};
