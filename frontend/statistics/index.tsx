import React from 'react';
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';
import {asyncRequestJson} from '../utils/api';
import {isLocalMode} from "../utils/app";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {App} from "../index";
import {Screen} from "../common/screens";

interface LogData {
    type: any,
    referer: any,
    browser: any,
    language: any,
    resolution: any,
    folder?: any,
    codecast?: any,
    bucket?: any,
    name?: string
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

    return null;
}

export const initialStateStatistics = {
    isReady: false,
    logData: undefined as LogData,
    dateRange: [null, null],
    folder: {
        label: 'Select a Folder',
        value: null
    },
    prefix: '',
    search: {
        status: 'success',
        data: [],
        error: null
    }
};

export default function(bundle: Bundle) {
    if (isLocalMode()) {
        return;
    }

    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore, {payload: {options: {isStatisticsReady}}}) => {
        state.statistics = {...initialStateStatistics};
        state.statistics.isReady = isStatisticsReady;
    });

    bundle.defineAction(ActionTypes.StatisticsInitLogData);
    bundle.defineAction(ActionTypes.StatisticsLogLoadingData);

    bundle.defineAction(ActionTypes.StatisticsPrepare);
    bundle.addReducer(ActionTypes.StatisticsPrepare, (state: AppStore) => {
        state.statistics.dateRange = [null, null];
        state.statistics.folder = {
            label: 'Select a Folder',
            value: null
        };
        state.statistics.prefix = '';
        state.statistics.search = {
            status: 'success',
            data: [],
            error: null
        };
    });

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
    bundle.addReducer(ActionTypes.StatisticsLogDataChanged, (state, {payload: {logData}}) => {
        state.statistics.logData = logData;
    });

    bundle.addSaga(function* editorSaga(app: App) {
        yield takeEvery(ActionTypes.StatisticsLogLoadingData, statisticsLogLoadingDataSaga);
        yield takeEvery(ActionTypes.StatisticsInitLogData, statisticsInitLogDataSaga);
        yield takeEvery(PlayerActionTypes.PlayerReady, statisticsPlayerReadySaga, app);
        yield takeEvery(ActionTypes.StatisticsPrepare, statisticsPrepareSaga);
        yield takeLatest(ActionTypes.StatisticsSearchSubmit, statisticsSearchSaga);
    });
}

function statisticsDateRangeChangedReducer(state: AppStore, {payload: {dateRange}}): void {
    state.statistics.dateRange = dateRange;
}

function statisticsFolderChangedReducer(state: AppStore, {payload: {folder}}): void {
    state.statistics.folder = folder;
}

function statisticsPrefixChangedReducer(state: AppStore, {payload: {prefix}}): void {
    state.statistics.prefix = prefix;
}

function statisticsSearchStatusChangedReducer(state: AppStore): void {
    state.statistics.search.data = [];
    state.statistics.search.error = null;
}

function* statisticsPrepareSaga() {
    /* Require the user to be logged in. */
    while (!(yield select((state: AppStore) => state.user))) {
        yield take(CommonActionTypes.LoginFeedback);
    }

    yield put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Statistics}});
}

function* statisticsInitLogDataSaga() {
    const state: AppStore = yield select();
    const options = state.options;
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

function* statisticsPlayerReadySaga(app: App, action) {
    try {
        const state: AppStore = yield select();
        const logData = state.statistics.logData;
        if (logData) {
            logData.name = (action.payload.data.hasOwnProperty('name')) ? action.payload.data.name : 'default';

            yield put({type: ActionTypes.StatisticsLogDataChanged, payload: {logData}});
            yield put({type: ActionTypes.StatisticsLogLoadingData});
        }
    } catch (error) {
        console.error('Error Codecast Load Log', error);
    }
}

function* statisticsLogLoadingDataSaga() {
    try {
        const state: AppStore = yield select();
        const {baseUrl} = state.options;
        const logData = state.statistics.logData;

        yield call(asyncRequestJson, `${baseUrl}/statistics/api/logLoadingData`, {logData});
    } catch (error) {
        console.error('Error Codecast Load Log', error);
    }
}

function* statisticsSearchSaga() {
    yield put({type: ActionTypes.StatisticsSearchStatusChanged, payload: {status: 'loading'}});

    let response;
    try {
        const state: AppStore = yield select();
        const {baseUrl} = state.options;

        const statistics = state.statistics;
        const dateRange = statistics.dateRange.map(date => date && date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate());
        const folder = statistics.folder.value;
        const prefix = statistics.prefix;

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
