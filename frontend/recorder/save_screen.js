
import {take, put, call, select} from 'redux-saga/effects';
import React from 'react';
import {Button, FormControl, ControlLabel, FormGroup} from 'react-bootstrap';
import EpicComponent from 'epic-component';

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
    const getPlayerUrl = state.get('getPlayerUrl');
    const playerUrl = getPlayerUrl(action.id);
    return state.update('save', save => save
      .set('busy', false).set('done', true).set('playerUrl', playerUrl));
  });

  bundle.addReducer('saveScreenUploadFailed', function (state, action) {
    return state.update('save', save => save
      .set('busy', false).set('error', action.error));
  });

  function* uploadRecording () {
    try {
      // Step 1: prepare the upload by getting the S3 form parameters
      // from the server.
      yield put({type: deps.saveScreenPreparing});
      const save = yield select(yield deps.getSaveState);
      const response = yield call(asyncRequestJson, 'upload', {/*title*/});
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
      yield put({type: deps.saveScreenUploadSucceeded, id: response.id});
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
    const save = state.get('save')
    const result = {};
    ['audioUrl', 'wavAudioUrl', 'eventsUrl', 'playerUrl', 'busy', 'done', 'prepare', 'uploadEvents', 'uploadAudio', 'error'].forEach(function (key) {
      result[key] = save.get(key);
    })
    return result;
  });

  bundle.defineView('SaveScreen', 'SaveScreenSelector', EpicComponent(self => {

    const onUpload = function () {
      self.props.dispatch({type: deps.saveScreenUploadStart});
    };

    self.render = function () {
      const {audioUrl, wavAudioUrl, eventsUrl, playerUrl, busy, done, prepare, uploadEvents, uploadAudio, error} = self.props;
      return (
        <form>
          <FormGroup controlId="eventsUrlInput">
            <ControlLabel>{"URL évènements"}</ControlLabel>
            <FormControl type="text" value={eventsUrl} readOnly/>
          </FormGroup>
          <FormGroup controlId="audioUrlInput">
            <ControlLabel>{"URL audio"}</ControlLabel>
            <FormControl type="text" value={audioUrl} readOnly/>
          </FormGroup>
          {wavAudioUrl &&
            <FormGroup controlId="wavAudioUrlInput">
              <ControlLabel>{"URL audio (wav)"}</ControlLabel>
              <FormControl type="text" value={wavAudioUrl} readOnly/>
            </FormGroup>}
          <p>
            <Button onClick={onUpload} disabled={busy || done} bsStyle={done ? 'default' : 'primary'}>
              {busy
                ? <i className="fa fa-spin fa-spinner"/>
                : (done
                    ? <i className="fa fa-check"/>
                    : <i className="fa fa-floppy-o"/>)}
            </Button>
          </p>
          {prepare === 'pending' && <p>Préparation de l'enregistrement…</p>}
          {uploadEvents === 'pending' && <p>Envoi des évènements en cours…</p>}
          {uploadAudio === 'pending' && <p>Envoi de l'audio en cours…</p>}
          {error && <p>Une erreur est survenue lors de l'enregistrement.</p>}
          {done && <p>Enregistrement terminé !</p>}
          {done &&
            <FormGroup controlId="playerUrlInput">
              <ControlLabel>{"Lien pour la lecture"}</ControlLabel>
              <FormControl type="text" value={playerUrl} readOnly/>
            </FormGroup>}
        </form>
      );
    };

  }));

};
