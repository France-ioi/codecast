import 'es5-shim';
import 'es6-shim';
import 'array.prototype.fill'; // Array.prototype.fill
import 'es6-symbol/implement'; // Symbol.iterator
import './style.scss';

import url from 'url';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import 'rc-slider/assets/index.css?global';

import {Map} from 'immutable';
import {AppStore} from './store';
import {link} from './linker';

import commonBundle from './common/index';
import playerBundle from './player/index';
import recorderBundle from './recorder/index';
import editorBundle from './editor/index';
import statisticsBundle from './statistics/index';
import {isLocalMode} from "./utils/app";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "./common/actionTypes";
import {ActionTypes as PlayerActionTypes} from "./player/actionTypes";
import {ActionTypes as EditorActionTypes} from "./editor/actionTypes";
import {ActionTypes as RecorderActionTypes} from "./recorder/actionTypes";
import {ActionTypes as StatisticsActionTypes} from "./statistics/actionTypes";
import {SandboxApp} from "./sandbox/SandboxApp";
import {StatisticsApp} from "./statistics/StatisticsApp";
import {EditorApp} from "./editor/EditorApp";
import {PlayerApp} from "./player/PlayerApp";
import {RecorderApp} from "./recorder/RecorderApp";

interface Codecast {
    store: AppStore,
    scope: any,
    task?: any,
    start?: Function,
    restart: Function
}

declare global {
    interface Window {
        store: any,
        Codecast: Codecast,
        currentPythonRunner: any,
        currentPythonContext: any,
        languageStrings: any,
        quickAlgoInterface: any
    }
}

/**
 * List of actions not to write in the console in development mode.
 *
 * @type {Object}
 */
const DEBUG_IGNORE_ACTIONS_MAP = {
    'Window.Resized': true,
    'Buffer.Reset': true,
    'Buffer.Highlight': true,
    'Buffer.Init': true,
    'Buffer.Model.Edit': true,
    'Player.Tick': true
};

const {store, scope, finalize, start} = link(function (bundle) {
    bundle.defineAction(ActionTypes.AppInit);
    bundle.addReducer(ActionTypes.AppInit, (_state, _action) => {
        return Map({scope});
    });

    bundle.include(commonBundle);
    bundle.include(playerBundle);
    bundle.include(recorderBundle);
    bundle.include(editorBundle);
    bundle.include(statisticsBundle);

    if (process.env.NODE_ENV === 'development') {
        bundle.addEarlyReducer(function (state, action) {
            if (!DEBUG_IGNORE_ACTIONS_MAP[action.type]) {
                console.log('action', action);
            }

            return state;
        });

        /**
         * Enable Immutable debug dev-tools.
         *
         * @see https://github.com/andrewdavey/immutable-devtools
         */
        // installDevTools(Immutable);
    }

});
finalize(scope);

/* In-browser API */
const Codecast: Codecast = window.Codecast = {store, scope, restart};

/*
  options :: {
    start: 'sandbox'|'player'|'recorder'|'editor',
    baseUrl: url,
    examplesUrl: url,
    baseDataUrl: url,
    user: {…},
    platform: 'python'|'unix'|'arduino',
    controls: {…},
    showStepper: boolean,
    showStack: boolean,
    showViews: boolean,
    showIO: boolean,
    source: string,
    input: string,
    token: string
  }
*/

function restart() {
    if (Codecast.task) {
        Codecast.task.cancel();
        Codecast.task = null;
    }

    /* XXX Make a separate object for selectors in the linker? */
    Codecast.task = start({
        dispatch: store.dispatch,
        globals: scope
    });
}

function clearUrl() {
    const currentUrl = url.parse(document.location.href, true);
    delete currentUrl.search;
    delete currentUrl.query.source;

    window.history.replaceState(null, document.title, url.format(currentUrl));
}

Codecast.start = function (options) {
    store.dispatch({type: ActionTypes.AppInit, payload: {options}});

    // remove source from url wihtout reloading
    if (options.source) {
        clearUrl();
    }
    // XXX store.dispatch({type: scope.stepperConfigure, options: stepperOptions});

    /* Run the sagas (must be done before calling autoLogin) */
    restart();

    if (!isLocalMode() && /editor|player|sandbox/.test(options.start)) {
        store.dispatch({type: StatisticsActionTypes.StatisticsInitLogData});
    }

    let App;
    switch (options.start) {
        case 'recorder':
            autoLogin();
            store.dispatch({type: RecorderActionTypes.RecorderPrepare});
            App = RecorderApp;
            break;
        case 'player':
            let audioUrl = options.audioUrl || `${options.baseDataUrl}.mp3`;
            store.dispatch({
                type: PlayerActionTypes.PlayerPrepare,
                payload: {
                    baseDataUrl: options.baseDataUrl,
                    audioUrl: audioUrl,
                    eventsUrl: `${options.baseDataUrl}.json`,
                    data: options.data
                }
            });
            App = PlayerApp;
            break;
        case 'editor':
            autoLogin();
            store.dispatch({
                type: EditorActionTypes.EditorPrepare,
                payload: {
                    baseDataUrl: options.baseDataUrl
                }
            });
            App = EditorApp;
            break;
        case 'statistics':
            autoLogin();
            store.dispatch({
                type: StatisticsActionTypes.StatisticsPrepare
            });
            App = StatisticsApp;
            break;
        case 'sandbox':
            store.dispatch({
                type: StatisticsActionTypes.StatisticsLogLoadingData
            });
            App = SandboxApp;
            break;
        default:
            App = () => <p>{"No such application: "}{options.start}</p>;
            break;
    }

    const {AppErrorBoundary} = scope;
    const container = document.getElementById('react-container');
    ReactDOM.render(
        <Provider store={store}>
            <AppErrorBoundary>
                <App/>
            </AppErrorBoundary>
        </Provider>, container
    );
};

function autoLogin() {
    let user = null;
    try {
        user = JSON.parse(window.localStorage.user || 'null');
    } catch (ex) {
        return;
    }

    store.dispatch({type: CommonActionTypes.LoginFeedback, payload: {user}});
}
