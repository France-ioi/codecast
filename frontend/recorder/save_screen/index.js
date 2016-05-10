
import {take, put, call, select} from 'redux-saga/effects';
import React from 'react';
import {Button, Input} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {asyncRequestJson} from '../../utils/api';
import {getBlob, uploadBlob} from '../../utils/blobs';

export default function (m) {

  m.action('saveScreenUploadStart', 'Save.Prepare.Start');
  m.action('saveScreenPreparing', 'Save.Prepare.Pending');
  m.action('saveScreenPrepared', 'Save.Prepare.Completed');
  m.action('saveScreenEventsUploading', 'Save.Events.Upload.Pending');
  m.action('saveScreenEventsUploaded', 'Save.Events.Upload.Success');
  m.action('saveScreenAudioUploading', 'Save.Audio.Upload.Pending');
  m.action('saveScreenAudioUploaded', 'Save.Audio.Upload.Success');
  m.action('saveScreenUploadSucceeded', 'Save.Success');
  m.action('saveScreenUploadFailed', 'Save.Failure');

  m.selector('getSaveState', state =>
    state.get('save')
  );

  m.reducer('saveScreenUploadStart', function (state, action) {
    return state.setIn(['save', 'busy'], true);
  });

  m.reducer('saveScreenPreparing', function (state, action) {
    return state.setIn(['save', 'prepare'], 'pending');
  });

  m.reducer('saveScreenPrepared', function (state, action) {
    return state.setIn(['save', 'prepare'], 'done');
  });

  m.reducer('saveScreenEventsUploading', function (state, action) {
    return state.setIn(['save', 'uploadEvents'], 'pending');
  });

  m.reducer('saveScreenEventsUploaded', function (state, action) {
    return state.update('save', save => save
      .set('uploadEvents', 'done').set('eventsUrl', action.url));
  });

  m.reducer('saveScreenAudioUploading', function (state, action) {
    return state.setIn(['save', 'uploadAudio'], 'pending');
  });

  m.reducer('saveScreenAudioUploaded', function (state, action) {
    return state.update('save', save => save
      .set('uploadAudio', 'done').set('audioUrl', action.url));
  });

  m.reducer('saveScreenUploadSucceeded', function (state, action) {
    // TODO: set recording id or URL.
    return state.update('save', save => save
      .set('busy', false).set('done', true).set('playerUrl', action.url));
  });

  m.reducer('saveScreenUploadFailed', function (state, action) {
    return state.update('save', save => save
      .set('busy', false).set('error', action.error));
  });

  function* uploadRecording () {
    try {
      // Step 1: prepare the upload by getting the S3 form parameters
      // from the server.
      yield put({type: m.actions.saveScreenPreparing});
      const save = yield select(m.selectors.getSaveState);
      const response = yield call(asyncRequestJson, '/upload', {/*title*/});
      yield put({type: m.actions.saveScreenPrepared});
      // Upload the events file.
      yield put({type: m.actions.saveScreenEventsUploading});
      const eventsBlob = yield call(getBlob, save.get('eventsUrl'));
      yield call(uploadBlob, response.events, eventsBlob);
      yield put({type: m.actions.saveScreenEventsUploaded, url: response.events.public_url});
      // Upload the audio file.
      yield put({type: m.actions.saveScreenAudioUploading});
      const audioBlob = yield call(getBlob, save.get('audioUrl'));
      yield call(uploadBlob, response.audio, audioBlob);
      yield put({type: m.actions.saveScreenAudioUploaded, url: response.audio.public_url});
      // Signal completion.
      const playerUrl = `${document.location}player?id=${response.id}`;
      yield put({type: m.actions.saveScreenUploadSucceeded, url: playerUrl});
    } catch (error) {
      yield put({type: m.actions.saveScreenUploadFailed, error});
    }
  }

  m.saga(function* watchUploadStart () {
    while (true) {
      yield take(m.actions.saveScreenUploadStart);
      yield call(uploadRecording);
    }
  });

  m.selector('SaveScreen', function (state, props) {
    const save = state.get('save')
    const result = {};
    ['audioUrl', 'eventsUrl', 'playerUrl', 'busy', 'done', 'prepare', 'uploadEvents', 'uploadAudio', 'error'].forEach(function (key) {
      result[key] = save.get(key);
    })
    return result;
  });

  m.view('SaveScreen', EpicComponent(self => {

    const onUpload = function () {
      self.props.dispatch({type: m.actions.saveScreenUploadStart});
    };

    self.render = function () {
      const {audioUrl, eventsUrl, playerUrl, busy, done, prepare, uploadEvents, uploadAudio, error} = self.props;
      return (
        <div>
          <p>
            <Button onClick={onUpload} disabled={busy || done}>
              {busy
                ? <i className="fa fa-spin fa-spinner"/>
                : (done
                    ? <i className="fa fa-check"/>
                    : <i className="fa fa-floppy-o"/>)}
            </Button>
          </p>
          <p>
            <Input type="text" label="URL évènements" readOnly value={eventsUrl}/>
          </p>
          <p>
            <Input type="text" label="URL audio" readOnly value={audioUrl}/>
          </p>
          {prepare === 'pending' && <p>Préparation de l'enregistrement…</p>}
          {uploadEvents === 'pending' && <p>Envoi des évènements en cours…</p>}
          {uploadAudio === 'pending' && <p>Envoi de l'audio en cours…</p>}
          {error && <p>Une erreur est survenue lors de l'enregistrement.</p>}
          {done &&
            <div>
              <p>Enregistrement terminé !</p>
              <Input type="text" label="Lien pour la lecture" readOnly value={playerUrl}/>
            </div>}
        </div>
      );
    };

  }));

};
