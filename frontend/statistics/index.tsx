import React from 'react';
import Immutable from 'immutable';
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';
import {asyncRequestJson} from '../utils/api';
import {isLocalMode} from "../utils/app";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import produce from "immer";
import {AppStore} from "../store";

interface LogData {
    type: any,
    referer: any,
    browser: any,
    language: any,
    resolution: any,
    folder?: any,
    codecast?: any,
    bucket?: any
}

function getBrowser() {
    // Opera 8.0+
    // @ts-ignore
    const isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    // @ts-ignore
    const isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]"
    // @ts-ignore
    const isSafari = /constructor/i.test(window.HTMLElement) || (function(p) {
        return p.toString() === "[object SafariRemoteNotification]";
    })
    // @ts-ignore
    (!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

    // Internet Explorer 6-11
    // @ts-ignore
    const isIE = /*@cc_on!@*/!!document.documentMode;

    // Edge 20+
    const isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1+
    // @ts-ignore
    const isChrome = !!window.chrome;

    if (isOpera) {
        return 'Opera: (' + navigator.userAgent + ')';
    }
    if (isFirefox) {
        return 'Firefox: (' + navigator.userAgent + ')';
    }
    if (isSafari) {
        return 'Safari: (' + navigator.userAgent + ')';
    }
    if (isIE) {
        return 'IE: (' + navigator.userAgent + ')';
    }
    if (isEdge) {
        return 'Edge: (' + navigator.userAgent + ')';
    }
    if (isChrome) {
        return 'Chrome: (' + navigator.userAgent + ')';
    }
}

export const initialStateStatistics = {
    isReady: false,
    logData: undefined as LogData
};

export default function(bundle) {
    if (isLocalMode()) {
        return;
    }

    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore, {payload: {options: {isStatisticsReady}}}) => {
        draft.statistics = initialStateStatistics;
        draft.statistics.isReady = isStatisticsReady;
    }));

    bundle.defineAction(ActionTypes.StatisticsInitLogData);
    bundle.defineAction(ActionTypes.StatisticsLogLoadingData);

    bundle.defineAction(ActionTypes.StatisticsPrepare);
    bundle.addReducer(ActionTypes.StatisticsPrepare, statisticsPrepareReducer);

    bundle.defineAction(ActionTypes.StatisticsDateRangeChanged);
    bundle.addReducer(ActionTypes.StatisticsDateRangeChanged, statisticsDateRangeChangedReducer);

    bundle.defineAction(ActionTypes.StatisticsFolderChanged);
    bundle.addReducer(ActionTypes.StatisticsFolderChanged, statisticsFolderChangedReducer);

    bundle.defineAction(ActionTypes.StatisticsPrefixChanged);
    bundle.addReducer(ActionTypes.StatisticsPrefixChanged, statisticsPrefixChangedReducer);

    bundle.defineAction(ActionTypes.StatisticsSearchSubmit);
    bundle.defineAction(ActionTypes.StatisticsSearchStatusChanged);
    bundle.addReducer(ActionTypes.StatisticsSearchStatusChanged, statisticsSearchStatusChangedReducer);

    bundle.defineAction(ActionTypes.StatisticsLogDataChanged);
    bundle.addReducer(ActionTypes.StatisticsLogDataChanged, produce((draft, {payload: {logData}}) => {
        draft.statistics.logData = logData;
    }));

    bundle.addSaga(function* editorSaga(app) {
        yield takeEvery(ActionTypes.StatisticsLogLoadingData, statisticsLogLoadingDataSaga);
        yield takeEvery(ActionTypes.StatisticsInitLogData, statisticsInitLogDataSaga);
        yield takeEvery(PlayerActionTypes.PlayerReady, statisticsPlayerReadySaga, app);
        yield takeEvery(ActionTypes.StatisticsPrepare, statisticsPrepareSaga);
        yield takeLatest(ActionTypes.StatisticsSearchSubmit, statisticsSearchSaga);
    });
}

function statisticsPrepareReducer(state) {
    return state.update('statistics', statistics =>
        statistics
            .set('dateRange', [null, null])
            .set('folder', {label: "Select a Folder", value: null})
            .set('prefix', '')
            .set('search', {
                status: 'success',
                data: [],
                error: null,
            }));
}

function statisticsDateRangeChangedReducer(state, {payload: {dateRange}}) {
    return state.setIn(['statistics', 'dateRange'], dateRange);
}

function statisticsFolderChangedReducer(state, {payload: {folder}}) {
    return state.setIn(['statistics', 'folder'], folder);
}

function statisticsPrefixChangedReducer(state, {payload: {prefix}}) {
    return state.setIn(['statistics', 'prefix'], prefix);
}

function statisticsSearchStatusChangedReducer(state, {payload}) {
    return state.setIn(['statistics', 'search'], {data: [], error: null, ...payload});
}

function* statisticsPrepareSaga() {
    /* Require the user to be logged in. */
    while (!(yield select(state => state.get('user')))) {
        yield take(CommonActionTypes.LoginFeedback);
    }

    yield put({type: CommonActionTypes.SystemSwitchToScreen, payload: {screen: 'statistics'}});
}

function* statisticsInitLogDataSaga() {
    const options = yield select(state => state.options);
    const {
        start: compileType,
        language,
        referer
    } = options;
    const resolution = window.innerWidth + 'x' + window.innerHeight;
    const browser = getBrowser();

    const logData: LogData = {
        type: compileType,
        referer,
        browser,
        language,
        resolution
    };

    if (compileType === 'sandbox') {
        const {origin} = options;
        logData.folder = origin;
    } else {
        const {codecastData: {codecast, folder, bucket}} = options;
        logData.codecast = codecast;
        logData.folder = folder;
        logData.bucket = bucket;
    }

    yield put({type: ActionTypes.StatisticsLogDataChanged, payload: {logData}});
}

function* statisticsPlayerReadySaga(app, action) {
    try {
        const logData = yield select(state => state.getIn(['statistics', 'logData']));

        logData.name = (action.payload.data.hasOwnProperty('name')) ? action.payload.data.name : 'default';

        yield put({type: ActionTypes.StatisticsLogDataChanged, payload: {logData}});
        yield put({type: ActionTypes.StatisticsLogLoadingData});
    } catch (error) {
        console.error('Error Codecast Load Log', error);
    }
}

function* statisticsLogLoadingDataSaga() {
    try {
        const {baseUrl} = yield select(state => state.options);
        const logData = yield select(state => state.statistics.logData);

        yield call(asyncRequestJson, `${baseUrl}/statistics/api/logLoadingData`, {logData});
    } catch (error) {
        console.error('Error Codecast Load Log', error);
    }
}

function* statisticsSearchSaga() {
    yield put({type: ActionTypes.StatisticsSearchStatusChanged, payload: {status: 'loading'}});

    let response;
    try {
        const {baseUrl} = yield select(state => state.get('options'));

        const statistics = yield select(state => state.get('statistics'));
        const dateRange = statistics.get('dateRange').map(date => date && date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate());
        const folder = statistics.get('folder').value;
        const prefix = statistics.get('prefix');

        response = yield call(asyncRequestJson, `${baseUrl}/statistics/api/search`, {
            dateRange,
            folder,
            prefix
        });
    } catch (ex) {
        response = {error: ex.toString()};
    }
    if (response.data) {
        yield put({type: ActionTypes.StatisticsSearchStatusChanged, payload: {status: 'success', data: response.data}});
    } else {
        yield put({
            type: ActionTypes.StatisticsSearchStatusChanged,
            payload: {status: 'failed', error: response.error}
        });
    }
}
