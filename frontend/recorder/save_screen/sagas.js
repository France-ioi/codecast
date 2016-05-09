
import {take, put, call, select} from 'redux-saga/effects';
import superagent from 'superagent';

import {asyncRequestJson} from '../../utils/api';

export default function (m) {

  const {actions, selectors} = m;

  function getBlob (url) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = function () { resolve(xhr.response); };
      xhr.onerror = function (err) { reject(err); }
      xhr.open('GET', url);
      xhr.send();
    });
  }

  function uploadBlob (upload, blob) {
    return new Promise(function (resolve, reject) {
      const formData = new FormData();
      const params = upload.params;
      Object.keys(params).forEach(function (key) {
        formData.append(key, params[key]);
      });
      formData.append('file', blob);
      console.log('upload', upload, formData);
      superagent.post(upload.form_url).send(formData)
        .end(function (err, response) {
          if (err) return reject(err);
          resolve(response);
        });
    });
  }

  function* uploadRecording () {
    try {
      // Step 1: prepare the upload by getting the S3 form parameters
      // from the server.
      yield put({type: actions.saveScreenPreparing});
      const save = yield select(selectors.getSaveState);
      const response = yield call(asyncRequestJson, '/upload', {/*title*/});
      yield put({type: actions.saveScreenPrepared});
      // Upload the events file.
      yield put({type: actions.saveScreenEventsUploading});
      const eventsBlob = yield call(getBlob, save.get('eventsUrl'));
      yield call(uploadBlob, response.events, eventsBlob);
      yield put({type: actions.saveScreenEventsUploaded, url: response.events.public_url});
      // Upload the audio file.
      yield put({type: actions.saveScreenAudioUploading});
      const audioBlob = yield call(getBlob, save.get('audioUrl'));
      yield call(uploadBlob, response.audio, audioBlob);
      yield put({type: actions.saveScreenAudioUploaded, url: response.audio.public_url});
      // Signal completion.
      const playerUrl = `${document.location}player?id=${response.id}`;
      yield put({type: actions.saveScreenUploadSucceeded, url: playerUrl});
    } catch (error) {
      yield put({type: actions.saveScreenUploadFailed, error});
    }
  }

  m.saga(function* watchUploadStart () {
    while (true) {
      yield take(actions.saveScreenUploadStart);
      yield call(uploadRecording);
    }
  });

};
