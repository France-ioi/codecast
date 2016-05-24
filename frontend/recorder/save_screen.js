
import {take, put, call, select} from 'redux-saga/effects';
import React from 'react';
import {Button, Input} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {defineAction, defineSelector, addReducer, addSaga, defineView} from '../utils/linker';
import {asyncRequestJson} from '../utils/api';
import {getBlob, uploadBlob} from '../utils/blobs';

export default function* (deps) {

  yield defineAction('saveScreenUploadStart', 'Save.Prepare.Start');
  yield defineAction('saveScreenPreparing', 'Save.Prepare.Pending');
  yield defineAction('saveScreenPrepared', 'Save.Prepare.Completed');
  yield defineAction('saveScreenEventsUploading', 'Save.Events.Upload.Pending');
  yield defineAction('saveScreenEventsUploaded', 'Save.Events.Upload.Success');
  yield defineAction('saveScreenAudioUploading', 'Save.Audio.Upload.Pending');
  yield defineAction('saveScreenAudioUploaded', 'Save.Audio.Upload.Success');
  yield defineAction('saveScreenUploadSucceeded', 'Save.Success');
  yield defineAction('saveScreenUploadFailed', 'Save.Failure');

  yield defineSelector('getSaveState', state =>
    state.get('save')
  );

  yield addReducer('saveScreenUploadStart', function (state, action) {
    return state.setIn(['save', 'busy'], true);
  });

  yield addReducer('saveScreenPreparing', function (state, action) {
    return state.setIn(['save', 'prepare'], 'pending');
  });

  yield addReducer('saveScreenPrepared', function (state, action) {
    return state.setIn(['save', 'prepare'], 'done');
  });

  yield addReducer('saveScreenEventsUploading', function (state, action) {
    return state.setIn(['save', 'uploadEvents'], 'pending');
  });

  yield addReducer('saveScreenEventsUploaded', function (state, action) {
    return state.update('save', save => save
      .set('uploadEvents', 'done').set('eventsUrl', action.url));
  });

  yield addReducer('saveScreenAudioUploading', function (state, action) {
    return state.setIn(['save', 'uploadAudio'], 'pending');
  });

  yield addReducer('saveScreenAudioUploaded', function (state, action) {
    return state.update('save', save => save
      .set('uploadAudio', 'done').set('audioUrl', action.url));
  });

  yield addReducer('saveScreenUploadSucceeded', function (state, action) {
    return state.update('save', save => save
      .set('busy', false).set('done', true).set('playerUrl', action.url));
  });

  yield addReducer('saveScreenUploadFailed', function (state, action) {
    return state.update('save', save => save
      .set('busy', false).set('error', action.error));
  });

  function* uploadRecording () {
    try {
      // Step 1: prepare the upload by getting the S3 form parameters
      // from the server.
      yield put({type: deps.saveScreenPreparing});
      const save = yield select(yield deps.getSaveState);
      const response = yield call(asyncRequestJson, '/upload', {/*title*/});
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
      const baseUrl = document.location.replace(/\/recorder$/, '/player')
      const playerUrl = `${baseUrl}?id=${response.id}`;
      yield put({type: deps.saveScreenUploadSucceeded, url: playerUrl});
    } catch (error) {
      yield put({type: deps.saveScreenUploadFailed, error});
    }
  }

  yield addSaga(function* watchUploadStart () {
    while (true) {
      yield take(deps.saveScreenUploadStart);
      yield call(uploadRecording);
    }
  });

  yield defineSelector('SaveScreenSelector', function (state, props) {
    const save = state.get('save')
    const result = {};
    ['audioUrl', 'wavAudioUrl', 'eventsUrl', 'playerUrl', 'busy', 'done', 'prepare', 'uploadEvents', 'uploadAudio', 'error'].forEach(function (key) {
      result[key] = save.get(key);
    })
    return result;
  });

  yield defineView('SaveScreen', 'SaveScreenSelector', EpicComponent(self => {

    const onUpload = function () {
      self.props.dispatch({type: deps.saveScreenUploadStart});
    };

    self.render = function () {
      const {audioUrl, wavAudioUrl, eventsUrl, playerUrl, busy, done, prepare, uploadEvents, uploadAudio, error} = self.props;
      return (
        <div>
          <p>
            <Input type="text" label="URL évènements" readOnly value={eventsUrl}/>
          </p>
          <p>
            <Input type="text" label="URL audio" readOnly value={audioUrl}/>
          </p>
          {wavAudioUrl && <p>
            <Input type="text" label="URL audio (wav)" readOnly value={wavAudioUrl}/>
          </p>}
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
