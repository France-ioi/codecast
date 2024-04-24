import {buffers, eventChannel} from 'redux-saga';
import {
    taskGetAnswerEvent,
    taskGetHeightEvent, taskGetMetadataEvent,
    taskGetStateEvent,
    taskGetViewsEvent, taskGradeAnswerEvent, taskLoadEvent, taskReloadAnswerEvent, taskReloadStateEvent,
    taskShowViewsEvent,
    taskUnloadEvent, taskUpdateTokenEvent
} from "./actionTypes";
import {Action} from "redux";
import {appSelect} from '../../hooks';
import {AppStore} from '../../store';

export default function* () {
    const state = yield* appSelect();

    return eventChannel<{task: any} | Action>(function (emit) {
        const task = makeTask(emit, state);
        emit({task});
        return function () {
            for (let prop of Object.keys(task)) {
                task[prop] = function () {
                    throw new Error('task channel is closed');
                };
            }
        };
    }, buffers.expanding(4));
}

function makeTask (emit, state: AppStore) {
    return {
        showViews: function (views, success, error) {
            emit(taskShowViewsEvent(views, success ?? (() => {}), error ?? (() => {})));
        },
        getViews: function (success, error) {
            emit(taskGetViewsEvent(success ?? (() => {}), error ?? (() => {})));
        },
        updateToken: function (token, success, error) {
            emit(taskUpdateTokenEvent(token, success ?? (() => {}), error ?? (() => {})));
        },
        getHeight: function (success, error) {
            emit(taskGetHeightEvent(success ?? (() => {}), error ?? (() => {})));
        },
        unload: function (success, error) {
            emit(taskUnloadEvent(success ?? (() => {}), error ?? (() => {})));
        },
        getState: function (success, error) {
            emit(taskGetStateEvent(success ?? (() => {}), error ?? (() => {})));
        },
        getMetaData: function (success, error) {
            emit(taskGetMetadataEvent(success ?? (() => {}), error ?? (() => {})));
        },
        reloadAnswer: function (answer, success, error) {
            emit(taskReloadAnswerEvent(answer, success ?? (() => {}), error ?? (() => {})));
        },
        reloadState: function (state, success, error) {
            emit(taskReloadStateEvent(state, success ?? (() => {}), error ?? (() => {})));
        },
        getAnswer: function (success, error) {
            emit(taskGetAnswerEvent(success ?? (() => {}), error ?? (() => {})));
        },
        load: function (views, success, error) {
            emit(taskLoadEvent(views, success ?? (() => {}), error ?? (() => {})));
        },
        gradeAnswer: function (answer, answerToken, success, error, silent) {
            const isTralalere = 'tralalere' === state.options.app;
            if (isTralalere && undefined === silent) {
                silent = false;
            } else {
                silent = true;
            }
            emit(taskGradeAnswerEvent(answer, answerToken, success ?? (() => {}), error ?? (() => {}), !silent, !silent));
        },
    };
}
