import {createAction} from "@reduxjs/toolkit";
import {Document} from '../../buffers/buffer_types';

const successErrorPayload = (success, error) => ({
    payload: {
        success,
        error,
    },
});

export const platformTaskRefresh = createAction('platformTaskRefresh');
export const platformTaskLink = createAction('platformTaskLink');

export const platformAnswerLoaded = createAction('platformAnswerLoaded', (answer: Document|null) => ({
    payload: {
        answer,
    },
}));

export const platformAnswerGraded = createAction('platformAnswerGraded', ({score, message, error}: {score?: number, message?: string, error?: string}) => ({
    payload: {
        score,
        message,
        error,
    },
}));

export const taskLoadEvent = createAction('taskEventLoad', (views, success, error) => ({
    payload: {
        views,
        success,
        error,
    },
}));
export const taskUnloadEvent = createAction('taskEventUnload', successErrorPayload);
export const taskShowViewsEvent = createAction('taskEventShowViews', (views, success, error) => ({
    payload: {
        views,
        success,
        error,
    },
}));
export const taskGetViewsEvent = createAction('taskEventGetViews', successErrorPayload);
export const taskUpdateTokenEvent = createAction('taskEventUpdateToken',(token, success, error) => ({
    payload: {
        token,
        success,
        error,
    },
}));
export const taskGetHeightEvent = createAction('taskEventGetHeight', successErrorPayload);
export const taskGetMetadataEvent = createAction('taskEventGetMetaData', successErrorPayload);
export const taskGetStateEvent = createAction('taskEventGetState', successErrorPayload);
export const taskReloadStateEvent = createAction('taskEventReloadState', (state, success, error) => ({
    payload: {
        state,
        success,
        error,
    },
}));
export const taskGetAnswerEvent = createAction('taskEventGetAnswer', successErrorPayload);
export const taskReloadAnswerEvent = createAction('taskEventReloadAnswer', (answer, success, error) => ({
    payload: {
        answer,
        success,
        error,
    },
}));
export const taskGradeAnswerEvent = createAction('taskEventGradeAnswer', (answer, answerToken, success, error, silent) => ({
    payload: {
        answer,
        answerToken,
        success,
        error,
        silent,
    },
}));
export const taskGetResourcesPost = createAction('taskEventGetResourcesPost', (resources, callback) => ({
    payload: {
        resources,
        callback,
    },
}));
