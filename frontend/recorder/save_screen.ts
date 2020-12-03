import {call, put, select, takeLatest} from 'redux-saga/effects';
import {RECORDING_FORMAT_VERSION} from '../version';
import {asyncRequestJson} from '../utils/api';
import {getBlob, uploadBlob} from '../utils/blobs';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {getRecorderState} from "./selectors";

export default function(bundle) {
    bundle.defineAction(ActionTypes.SaveScreenEncodingStart);
    bundle.addReducer(ActionTypes.SaveScreenEncodingStart, function(state, action) {
        return state.update('save', save => ({...save, step: 'encoding pending', progress: 0}));
    });

    bundle.defineAction(ActionTypes.SaveScreenEncodingProgress);
    bundle.addReducer(ActionTypes.SaveScreenEncodingProgress, function(state, {payload: progress}) {
        return state.update('save', save => ({...save, progress}));
    });

    bundle.defineAction(ActionTypes.SaveScreenEncodingDone);
    bundle.addReducer(ActionTypes.SaveScreenEncodingDone, function(state, {payload: {audioUrl, wavAudioUrl, eventsUrl}}) {
        return state.update('save', save => ({
            ...save,
            step: 'encoding done',
            audioUrl,
            wavAudioUrl,
            eventsUrl,
            progress: false
        }));
    });

    bundle.defineAction(ActionTypes.SaveScreenUpload);

    bundle.defineAction(ActionTypes.SaveScreenPreparing);
    bundle.addReducer(ActionTypes.SaveScreenPreparing, function(state, action) {
        return state.update('save', save => ({...save, step: 'upload preparing'}));
    });

    bundle.defineAction(ActionTypes.SaveScreenEventsUploading);
    bundle.addReducer(ActionTypes.SaveScreenEventsUploading, function(state, _action) {
        return state.update('save', save => ({...save, step: 'upload events pending'}));
    });

    bundle.defineAction(ActionTypes.SaveScreenEventsUploaded);
    bundle.addReducer(ActionTypes.SaveScreenEventsUploaded, function(state, {payload: {url}}) {
        return state.update('save', save => ({...save, step: 'upload events done', eventsUrl: url}));
    });

    bundle.defineAction(ActionTypes.SaveScreenAudioUploading);
    bundle.addReducer(ActionTypes.SaveScreenAudioUploading, function(state, action) {
        return state.update('save', save => ({...save, step: 'upload audio pending'}));
    });

    bundle.defineAction(ActionTypes.SaveScreenAudioUploaded);
    bundle.addReducer(ActionTypes.SaveScreenAudioUploaded, function(state, {payload: {url}}) {
        return state.update('save', save => ({...save, step: 'upload audio done', audioUrl: url}));
    });

    bundle.defineAction(ActionTypes.SaveScreenUploadSucceeded);
    bundle.addReducer(ActionTypes.SaveScreenUploadSucceeded, function(state, {payload: {playerUrl}}) {
        return state.update('save', save => ({...save, step: 'done', playerUrl}));
    });

    bundle.defineAction(ActionTypes.SaveScreenUploadFailed);
    bundle.addReducer(ActionTypes.SaveScreenUploadFailed, function(state, {payload: {error}}) {
        return state.update('save', save => ({...save, step: 'error', error}));
    });

    bundle.addSaga(function* saveSaga(arg) {
        yield takeLatest(RecorderActionTypes.RecorderStopped, encodingSaga)
        yield takeLatest(ActionTypes.SaveScreenUpload, uploadSaga, arg);
    });
};

function* encodingSaga() {
    yield put({type: ActionTypes.SaveScreenEncodingStart, payload: {}});
    yield put({type: CommonActionTypes.SystemSwitchToScreen, payload: {screen: 'save'}});

    const recorder = yield select(getRecorderState);

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
    const eventsBlob = new Blob([JSON.stringify(data)], {type: "application/json;charset=UTF-8"});
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

    function* encodingProgressSaga({step, progress}) {
        /* step: copy|wav|mp3 */
        yield put({type: ActionTypes.SaveScreenEncodingProgress, payload: {step, progress}});
    }
}

function* uploadSaga(app, action) {
    try {
        // Step 1: prepare the upload by getting the S3 form parameters
        // from the server.
        yield put({type: ActionTypes.SaveScreenPreparing});
        const save = yield select(state => state.get('save'));
        const response = yield call(asyncRequestJson, 'upload', action.payload.target);
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
