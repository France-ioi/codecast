import {takeLatest, put, call, select} from 'redux-saga/effects';
import {RECORDING_FORMAT_VERSION} from '../version';
import {asyncRequestJson} from '../utils/api';
import {getBlob, uploadBlob} from '../utils/blobs';
import {ActionTypes} from "./actionTypes";

export default function (bundle) {
  bundle.defineAction(ActionTypes.SaveScreenEncodingStart);
  bundle.defineAction(ActionTypes.SaveScreenEncodingProgress);
  bundle.defineAction(ActionTypes.SaveScreenEncodingDone);
  bundle.defineAction(ActionTypes.SaveScreenUpload);
  bundle.defineAction(ActionTypes.SaveScreenPreparing);
  bundle.defineAction(ActionTypes.SaveScreenEventsUploading);
  bundle.defineAction(ActionTypes.SaveScreenEventsUploaded);
  bundle.defineAction(ActionTypes.SaveScreenAudioUploading);
  bundle.defineAction(ActionTypes.SaveScreenAudioUploaded);
  bundle.defineAction(ActionTypes.SaveScreenUploadSucceeded);
  bundle.defineAction(ActionTypes.SaveScreenUploadFailed);

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
    yield takeLatest(ActionTypes.SaveScreenUpload, uploadSaga, arg);
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

function* encodingSaga ({actionTypes, selectors}) {
  yield put({type: ActionTypes.SaveScreenEncodingStart, payload: {}});
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
  const options = yield select(state => state.get('options'));
  const data = {version, options, events, subtitles};
  const eventsBlob = new Blob([JSON.stringify(data)], {encoding: "UTF-8", type:"application/json;charset=UTF-8"});
  const eventsUrl = URL.createObjectURL(eventsBlob);

  /* Signal that the recorder has stopped. */
  yield put({
    type: ActionTypes.SaveScreenEncodingDone,
    payload: {
      audioUrl: mp3Url,
      wavAudioUrl: wavUrl,
      eventsUrl: eventsUrl,
    }
  });

  function* encodingProgressSaga ({step, progress}) {
    /* step: copy|wav|mp3 */
    yield put({type: ActionTypes.SaveScreenEncodingProgress, payload: {step, progress}});
  }
}

function* uploadSaga ({actionTypes, selectors}, {payload: {target}}) {
  try {
    // Step 1: prepare the upload by getting the S3 form parameters
    // from the server.
    yield put({type: ActionTypes.SaveScreenPreparing});
    const save = yield select(state => state.get('save'));
    const response = yield call(asyncRequestJson, 'upload', target);
    if (response.error) {
      throw new Error(`cannot upload: ${response.error}`);
    }

    // Upload the events file.
    yield put({type: ActionTypes.SaveScreenEventsUploading});
    const eventsBlob = yield call(getBlob, save.eventsUrl);
    yield call(uploadBlob, response.events, eventsBlob);
    yield put({type: ActionTypes.SaveScreenEventsUploaded, payload: {url: response.events.public_url}});

    // Upload the audio file.
    yield put({type: ActionTypes.SaveScreenAudioUploading});
    const audioBlob = yield call(getBlob, save.audioUrl);
    yield call(uploadBlob, response.audio, audioBlob);
    yield put({type: ActionTypes.SaveScreenEventsUploaded, payload: {url: response.audio.public_url}});

    // Signal completion.
    yield put({type: ActionTypes.SaveScreenUploadSucceeded, payload: {playerUrl: response.player_url}});
  } catch (error) {
    yield put({type: ActionTypes.SaveScreenUploadFailed, payload: {error}});
  }
}
