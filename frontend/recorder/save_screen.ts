import {call, put, select, takeLatest} from 'redux-saga/effects';
import {RECORDING_FORMAT_VERSION} from '../version';
import {asyncGetJson, asyncRequestJson} from '../utils/api';
import {getBlob, uploadBlob} from '../utils/blobs';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {getRecorderState} from "./selectors";
import {AppStore} from "../store";
import {Bundle} from "../linker";

export enum SaveStep {
    EncodingPending = 'encoding pending',
    EncodingDone = 'encoding done',
    UploadPreparing = 'upload preparing',
    UploadEventsPending = 'upload events pending',
    UploadEventsDone = 'upload events done',
    UploadAudioPending = 'upload audio pending',
    UploadAudioDone = 'upload audio done',
    Done = 'done',
    Error = 'error'
}

export const initialStateSave = {
    step: null as SaveStep,
    progress: 0,
    audioUrl: '',
    wavAudioUrl: '',
    eventsUrl: '',
    playerUrl: '',
    error: ''
};

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.save = initialStateSave;
    });

    bundle.defineAction(ActionTypes.SaveScreenEncodingStart);
    bundle.addReducer(ActionTypes.SaveScreenEncodingStart, (state: AppStore) => {
        state.save.step = SaveStep.EncodingPending;
        state.save.progress = 0;
    });

    bundle.defineAction(ActionTypes.SaveScreenEncodingProgress);
    bundle.addReducer(ActionTypes.SaveScreenEncodingProgress, (state: AppStore, {payload: progress}) => {
        state.save.progress = progress;
    });

    bundle.defineAction(ActionTypes.SaveScreenEncodingDone);
    bundle.addReducer(ActionTypes.SaveScreenEncodingDone, (state: AppStore, {payload: {audioUrl, wavAudioUrl, eventsUrl}}) => {
        state.save.step = SaveStep.EncodingDone;
        state.save.audioUrl = audioUrl;
        state.save.wavAudioUrl = wavAudioUrl;
        state.save.eventsUrl = eventsUrl;
        state.save.progress = 0;
    });

    bundle.defineAction(ActionTypes.SaveScreenUpload);

    bundle.defineAction(ActionTypes.SaveScreenPreparing);
    bundle.addReducer(ActionTypes.SaveScreenPreparing, (state: AppStore) => {
        state.save.step = SaveStep.UploadPreparing;
    });

    bundle.defineAction(ActionTypes.SaveScreenEventsUploading);
    bundle.addReducer(ActionTypes.SaveScreenEventsUploading, (state: AppStore) => {
        state.save.step = SaveStep.UploadEventsPending;
    });

    bundle.defineAction(ActionTypes.SaveScreenEventsUploaded);
    bundle.addReducer(ActionTypes.SaveScreenEventsUploaded, (state: AppStore, {payload: {url}}) => {
        state.save.step = SaveStep.UploadEventsDone;
        state.save.eventsUrl = url;
    });

    bundle.defineAction(ActionTypes.SaveScreenAudioUploading);
    bundle.addReducer(ActionTypes.SaveScreenAudioUploading, (state: AppStore) => {
        state.save.step = SaveStep.UploadAudioPending;
    });

    bundle.defineAction(ActionTypes.SaveScreenAudioUploaded);
    bundle.addReducer(ActionTypes.SaveScreenAudioUploaded, (state: AppStore, {payload: {url}}) => {
        state.save.step = SaveStep.UploadAudioDone;
        state.save.audioUrl = url;
    });

    bundle.defineAction(ActionTypes.SaveScreenUploadSucceeded);
    bundle.addReducer(ActionTypes.SaveScreenUploadSucceeded, (state: AppStore, {payload: {playerUrl}}) => {
        state.save.step = SaveStep.Done;
        state.save.playerUrl = playerUrl;
    });

    bundle.defineAction(ActionTypes.SaveScreenUploadFailed);
    bundle.addReducer(ActionTypes.SaveScreenUploadFailed, (state: AppStore, {payload: {error}}) => {
        state.save.step = SaveStep.Error;
        state.save.error = error;
    });

    bundle.addSaga(function* saveSaga(arg) {
        yield takeLatest(RecorderActionTypes.RecorderStopped, encodingSaga);
        yield takeLatest(RecorderActionTypes.SaveScreenEncodingDone, ensureLoggedSaga);
        yield takeLatest(ActionTypes.SaveScreenUpload, uploadSaga, arg);
    });
}

function* ensureLoggedSaga() {
    const state: AppStore = yield select();
    const {baseUrl} = state.options;

    const response = yield call(asyncGetJson, baseUrl + '/me', []);
    if (response.user) {
        yield put({type: CommonActionTypes.LoginFeedback, payload: {user: response.user}});
    } else {
        yield put({type: CommonActionTypes.LoginFeedback, payload: {user: false}});
    }
}

function* encodingSaga() {
    yield put({type: ActionTypes.SaveScreenEncodingStart, payload: {}});
    yield put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: 'save'}});

    const state: AppStore = yield select();
    const recorder = getRecorderState(state);

    /* Encode the audio track, reporting progress. */
    const {worker} = recorder.context;
    const {mp3, wav, duration} = yield call(worker.call, 'export', {mp3: true, wav: true}, encodingProgressSaga);
    const mp3Url = URL.createObjectURL(mp3);
    const wavUrl = URL.createObjectURL(wav);

    /* Ensure the 'end' event occurs before the end of the audio track. */
    const version = RECORDING_FORMAT_VERSION;
    const endTime = Math.floor(duration * 1000);

    let events = [...recorder.events];
    events.push([endTime, 'end']);

    const subtitles = [];
    const options = state.options;
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

        const state: AppStore = yield select();
        const save = state.save;
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
