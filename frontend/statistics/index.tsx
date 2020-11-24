import React from 'react';
import Immutable from 'immutable';
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';
import {asyncRequestJson} from '../utils/api';
import {isLocalMode} from "../utils/app";
import {ActionTypes} from "./actionTypes";
import {StatisticsApp} from "./StatisticsApp";
import {StatisticsScreen} from "./StatisticsScreen";

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
    const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
        return p.toString() === "[object SafariRemoteNotification]";
    })
    // @ts-ignore
    (!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

    // Internet Explorer 6-11
    // @ts-ignore
    const isIE = /*@cc_on!@*/false || !!document.documentMode;

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

export default function (bundle, deps) {
    if (isLocalMode()) {
        return;
    }

    bundle.addReducer('init', (state, {payload: {options: {isStatisticsReady}}}) => {
        return state.set('statistics', Immutable.Map({isReady: isStatisticsReady}))
    });

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
    bundle.addReducer(ActionTypes.StatisticsLogDataChanged, statisticsLogDataChangedReducer);

    bundle.defineView('StatisticsApp', StatisticsAppSelector, StatisticsApp);

    bundle.defineView('StatisticsScreen', StatisticsScreenSelector, StatisticsScreen);

    bundle.addSaga(function* editorSaga(app) {
        yield takeEvery(ActionTypes.StatisticsLogLoadingData, statisticsLogLoadingDataSaga, app);
        yield takeEvery(ActionTypes.StatisticsInitLogData, statisticsInitLogDataSaga, app);
        yield takeEvery(ActionTypes.PlayerReady, statisticsPlayerReadySaga, app);
        yield takeEvery(ActionTypes.StatisticsPrepare, statisticsPrepareSaga, app);
        yield takeLatest(ActionTypes.StatisticsSearchSubmit, statisticsSearchSaga, app);
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

function statisticsLogDataChangedReducer(state, {payload: {logData}}) {
    return state.setIn(['statistics', 'logData'], logData);
}


function* statisticsPrepareSaga({actionTypes}) {
    /* Require the user to be logged in. */
    while (!(yield select(state => state.get('user')))) {
        yield take(actionTypes.loginFeedback);
    }

    yield put({type: actionTypes.switchToScreen, payload: {screen: 'statistics'}});
}

function* statisticsInitLogDataSaga({actionTypes}) {
    const options = yield select(state => state.get('options'));
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

    yield put({type: actionTypes.statisticsLogDataChanged, payload: {logData}});
}

function* statisticsPlayerReadySaga({actionTypes}, {payload: {data}}) {
    try {
        const logData = yield select(state => state.getIn(['statistics', 'logData']));

        const name = (data.hasOwnProperty('name')) ? data.name : 'default';
        logData.name = name;

        yield put({type: actionTypes.statisticsLogDataChanged, payload: {logData}});
        yield put({type: actionTypes.statisticsLogLoadingData});
    } catch (error) {
        console.error('Error Codecast Load Log', error);
    }
}

function* statisticsLogLoadingDataSaga() {
    try {
        const {baseUrl} = yield select(state => state.get('options'));
        const logData = yield select(state => state.getIn(['statistics', 'logData']));
        yield call(asyncRequestJson, `${baseUrl}/statistics/api/logLoadingData`, {logData});
    } catch (error) {
        console.error('Error Codecast Load Log', error);
    }
}

function* statisticsSearchSaga({actionTypes}) {
    yield put({type: actionTypes.statisticsSearchStatusChanged, payload: {status: 'loading'}});
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
        yield put({type: actionTypes.statisticsSearchStatusChanged, payload: {status: 'success', data: response.data}});
    } else {
        yield put({
            type: actionTypes.statisticsSearchStatusChanged,
            payload: {status: 'failed', error: response.error}
        });
    }
}


function StatisticsAppSelector(state, props) {
    const scope = state.get('scope');
    const user = state.get('user');
    const screen = state.get('screen');
    const {LogoutButton} = scope;
    let activity, screenProp, Screen;
    if (!user) {
        activity = 'login';
        screenProp = 'LoginScreen';
    } else if (screen === 'statistics') {
        activity = 'statistics';
        screenProp = 'StatisticsScreen';
    } else {
        Screen = () => <p>{'undefined state'}</p>;
    }
    if (!Screen && screenProp) {
        Screen = scope[screenProp];
    }
    return {Screen, activity, LogoutButton};
}

function StatisticsScreenSelector(state, props) {
    const statistics = state.get('statistics');
    const user = state.get('user');
    const actionTypes = state.get('actionTypes');

    const dateRange = statistics.get('dateRange');

    const folders = (user.grants || []).reduce(
        (obj, {description, s3Bucket, uploadPath}) => {
            obj[description] = [s3Bucket, uploadPath];
            return obj;
        }, {"Select a Folder": null});
    const folderOptions = Object.keys(folders);
    const folder = statistics.get('folder').label;

    const prefix = statistics.get('prefix');
    const isReady = statistics.get('isReady');

    const rowData = statistics.getIn(['search', 'data']);
    const searchStatus = statistics.getIn(['search', 'status']);
    const searchError = statistics.getIn(['search', 'error']);

    return {
        isReady,
        rowData,
        searchError,
        searchStatus,
        dateRange,
        folderOptions,
        folder,
        folders,
        prefix,
        actionTypes
    };
}
