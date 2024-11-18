import {call, put, select, takeLatest} from 'typed-redux-saga';
import {RECORDING_FORMAT_VERSION} from '../version';
import {asyncGetJson, asyncRequestJson} from '../utils/api';
import {getBlob, uploadBlob} from '../utils/blobs';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as RecorderActionTypes} from "../recorder/actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {getRecorderState} from "./selectors";
import {AppStore, CodecastOptions} from "../store";
import {Bundle} from "../linker";
import {Screen} from "../common/screens";
import {isLocalStorageEnabled} from "../common/utils";
import {appSelect} from '../hooks';
import log from 'loglevel';
import {App} from '../app_types';

export type CodecastRecord = {
    version: string,
    events: any[],
    options: CodecastOptions,
    subtitles: any[]
}

export enum SaveStep {
    EncodingPending = 'encoding pending',
    EncodingDone = 'encoding done',
    UploadPreparing = 'upload preparing',
    UploadEventsPending = 'upload events pending',
    UploadEventsDone = 'upload events done',
    UploadAudioPending = 'upload audio pending',
    UploadAudioDone = 'upload audio done',
    UploadAdditionalFilesPending = 'upload files pending',
    UploadAdditionalFilesDone = 'upload files done',
    Done = 'done',
    Error = 'error'
}

export interface SaveStateFileUrl {
    name: string,
    blob: string,
    originalUrl: string,
}

export interface SaveState {
    step: SaveStep,
    progress: number,
    audioUrl: string,
    wavAudioUrl: string,
    eventsUrl: string,
    playerUrl: string,
    editorUrl: string,
    filesUrl: SaveStateFileUrl[],
    error: any,
}

export const initialStateSave: SaveState = {
    step: null,
    progress: 0,
    audioUrl: '',
    wavAudioUrl: '',
    eventsUrl: '',
    playerUrl: '',
    editorUrl: '',
    filesUrl: [],
    error: '',
};

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.save = {...initialStateSave};
    });

    bundle.defineAction(ActionTypes.SaveScreenEncodingStart);
    bundle.addReducer(ActionTypes.SaveScreenEncodingStart, (state: AppStore) => {
        state.save.step = SaveStep.EncodingPending;
        state.save.progress = 0;
        state.save.playerUrl = '';
        state.save.editorUrl = '';
    });

    bundle.defineAction(ActionTypes.SaveScreenEncodingProgress);
    bundle.addReducer(ActionTypes.SaveScreenEncodingProgress, (state: AppStore, {payload: progress}) => {
        state.save.progress = progress;
    });

    bundle.defineAction(ActionTypes.SaveScreenEncodingDone);
    bundle.addReducer(ActionTypes.SaveScreenEncodingDone, (state: AppStore, {payload: {audioUrl, wavAudioUrl, eventsUrl, filesUrl}}) => {
        state.save.step = SaveStep.EncodingDone;
        state.save.audioUrl = audioUrl;
        state.save.wavAudioUrl = wavAudioUrl;
        state.save.eventsUrl = eventsUrl;
        state.save.filesUrl = filesUrl;
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

    bundle.defineAction(ActionTypes.SaveScreenAdditionalFilesUploading);
    bundle.addReducer(ActionTypes.SaveScreenAdditionalFilesUploading, (state: AppStore) => {
        state.save.step = SaveStep.UploadAdditionalFilesPending;
    });

    bundle.defineAction(ActionTypes.SaveScreenAdditionalFilesUploaded);
    bundle.addReducer(ActionTypes.SaveScreenAdditionalFilesUploaded, (state: AppStore) => {
        state.save.step = SaveStep.UploadAdditionalFilesDone;
    });

    bundle.defineAction(ActionTypes.SaveScreenUploadSucceeded);
    bundle.addReducer(ActionTypes.SaveScreenUploadSucceeded, (state: AppStore, {payload: {playerUrl, editorUrl}}) => {
        state.save.step = SaveStep.Done;
        state.save.playerUrl = playerUrl;
        state.save.editorUrl = editorUrl;
    });

    bundle.defineAction(ActionTypes.SaveScreenUploadFailed);
    bundle.addReducer(ActionTypes.SaveScreenUploadFailed, (state: AppStore, {payload: {error}}) => {
        state.save.step = SaveStep.Error;
        state.save.error = error;
    });

    bundle.addSaga(function* saveSaga(arg) {
        yield* takeLatest(RecorderActionTypes.RecorderStopped, encodingSaga);
        yield* takeLatest(RecorderActionTypes.SaveScreenEncodingDone, ensureLoggedSaga);
        yield* takeLatest(ActionTypes.SaveScreenUpload, uploadSaga, arg);
    });
}

export function* ensureLoggedSaga() {
    const state = yield* appSelect();
    const {baseUrl} = state.options;

    const token = isLocalStorageEnabled() ? window.localStorage.getItem('token') : null;
    if (token) {
        const response: any = yield* call(asyncGetJson, baseUrl + '/me', {}, true);
        if (response.user) {
            yield* put({type: CommonActionTypes.LoginFeedback, payload: {user: response.user, token}});
            return;
        }
    }

    yield* put({type: CommonActionTypes.LoginFeedback, payload: {user: null}});
}

function* encodingSaga() {
    yield* put({type: ActionTypes.SaveScreenEncodingStart, payload: {}});
    yield* put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Save}});

    const state = yield* appSelect();
    const recorder = getRecorderState(state);

    /* Encode the audio track, reporting progress. */
    const {worker} = recorder.context;
    const {mp3, wav, duration}: any = yield* call(worker.call, 'export', {mp3: true, wav: true}, encodingProgressSaga);
    const mp3Url = URL.createObjectURL(mp3);
    const wavUrl = URL.createObjectURL(wav);

    /* Ensure the 'end' event occurs before the end of the audio track. */
    const version = RECORDING_FORMAT_VERSION;
    const endTime = Math.floor(duration * 1000);

    let events = [...recorder.events];
    events.push([endTime, 'end']);

    const urlParameters = new URLSearchParams(window.location.search);

    const subtitles = [];
    const options = state.options;
    const data = {
        version,
        selectedTask: urlParameters.has('task') ? urlParameters.get('task') : null,
        options,
        events,
        subtitles,
    } as CodecastRecord;

    log.getLogger('recorder').debug('data to serialize', data);
    const eventsBlob = new Blob([JSON.stringify(data)], {type: "application/json;charset=UTF-8"});
    const eventsUrl = URL.createObjectURL(eventsBlob);

    const additionalFiles: SaveStateFileUrl[] = [];
    for (let file of recorder.files) {
        const result = yield* call(fetch, file.fileUrl);
        const blob = yield* call([result, result.blob]);
        additionalFiles.push({
            originalUrl: file.fileUrl,
            name: file.fileUrl.split('/').pop(),
            blob: URL.createObjectURL(blob),
        });
    }

    /* Signal that the recorder has stopped. */
    yield* put({
        type: ActionTypes.SaveScreenEncodingDone,
        payload: {
            audioUrl: mp3Url,
            wavAudioUrl: wavUrl,
            eventsUrl: eventsUrl,
            filesUrl: additionalFiles,
        }
    });

    function* encodingProgressSaga({step, progress}) {
        /* step: copy|wav|mp3 */
        yield* put({type: ActionTypes.SaveScreenEncodingProgress, payload: {step, progress}});
    }
}

export interface UploadResponse {
    player_url: string,
    editor_url: string,
    events: string,
    audio: string,
    additionalFiles: string[],
    error?: string,
}

function* uploadSaga(app: App, action) {
    try {
        // Step 1: prepare the upload by getting the S3 form parameters
        // from the server.
        yield* put({type: ActionTypes.SaveScreenPreparing});

        const state = yield* appSelect();
        const save = state.save;
        const {baseUrl} = state.options;

        const additionalFilesNames = save.filesUrl.map(file => file.name);

        const uploadParameters = {
            ...action.payload.target,
            basePlayerUrl: window.location.href.split('?')[0],
            additionalFiles: additionalFilesNames,
        };
        const response: UploadResponse = yield* call(asyncRequestJson, `${baseUrl}/upload`, uploadParameters);
        if (response.error) {
            throw new Error(`cannot upload: ${response.error}`);
        }

        // Upload the events file.
        yield* put({type: ActionTypes.SaveScreenEventsUploading});
        const eventsBlob = yield* call(getBlob, save.eventsUrl);
        let eventsText = yield* call([eventsBlob, eventsBlob.text]);

        for (let i = 0; i < save.filesUrl.length; i++) {
            const newUrl = response.additionalFiles[i].split('?')[0];
            eventsText = eventsText.replace(new RegExp(`"fileUrl":"${save.filesUrl[i].originalUrl}"`, 'g'), `"fileUrl":"${newUrl}"`);
        }

        const newEventsBlob = new Blob([eventsText], {type: "application/json;charset=UTF-8"});

        const eventsPublicUrl = yield* call(uploadBlob, response.events, newEventsBlob);
        yield* put({type: ActionTypes.SaveScreenEventsUploaded, payload: {url: eventsPublicUrl}});

        // Upload the audio file.
        yield* put({type: ActionTypes.SaveScreenAudioUploading});
        const audioBlob: Blob = yield* call(getBlob, save.audioUrl);
        const audioPublicUrl = yield* call(uploadBlob, response.audio, audioBlob);
        yield* put({type: ActionTypes.SaveScreenAudioUploaded, payload: {url: audioPublicUrl}});

        // Upload additional files
        if (save.filesUrl?.length) {
            yield* put({type: ActionTypes.SaveScreenAdditionalFilesUploading});
            const additionalFilesUrls = [];
            for (let i = 0; i < save.filesUrl.length; i++) {
                const fileBlob: Blob = yield* call(getBlob, save.filesUrl[i].blob);
                const filePublicUrl = yield* call(uploadBlob, response.additionalFiles[i], fileBlob);
                additionalFilesUrls.push(filePublicUrl);
            }

            yield* put({type: ActionTypes.SaveScreenAdditionalFilesUploaded, payload: {files: additionalFilesUrls}});
        }

        // Signal completion.
        yield* put({type: ActionTypes.SaveScreenUploadSucceeded, payload: {playerUrl: response.player_url, editorUrl: response.editor_url}});
    } catch (error) {
        yield* put({type: ActionTypes.SaveScreenUploadFailed, payload: {error}});
    }
}
