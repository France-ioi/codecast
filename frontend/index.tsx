import './style.scss';

import url from 'url';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch';
import MultiBackend from 'react-dnd-multi-backend';
import log from 'loglevel';
import 'rc-slider/assets/index.css?global';
import {AppStore} from './store';
import {Bundle, link} from './linker';
import commonBundle from './common/index';
import playerBundle from './player/index';
import recorderBundle from './recorder/index';
import editorBundle from './editor/index';
import statisticsBundle from './statistics/index';
import {isLocalMode} from "./utils/app";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "./common/actionTypes";
import {ActionTypes as StatisticsActionTypes} from "./statistics/actionTypes";
import {TaskApp} from "./task/TaskApp";
import {StatisticsApp} from "./statistics/StatisticsApp";
import {AppErrorBoundary} from "./common/AppErrorBoundary";
import {setAutoFreeze} from "immer";
import {ReplayApi} from "./player/replay";
import {RecordApi} from "./recorder/record";
import {StepperApi} from "./stepper/api";
import {EnhancedStore} from "@reduxjs/toolkit";
import {ConceptViewer} from "./task/documentation/doc";
import {Documentation} from "./task/documentation/Documentation";
import '@france-ioi/skulpt/dist/skulpt.min.js';
import '@france-ioi/skulpt/dist/skulpt-stdlib.js';
import '@france-ioi/skulpt/dist/debugger.js';
import {Portal} from "@blueprintjs/core";
import {DndProvider} from "react-dnd";
import {CustomDragLayer} from "./task/CustomDragLayer";
import AbstractRunner from "./stepper/abstract_runner";
import {TralalereApp} from "./tralalere/TralalereApp";
import {TaskLevelName} from "./task/platform/platform_slice";

setAutoFreeze(true);
log.setLevel('trace');
log.getLogger('performance').setLevel('info');
log.getLogger('blockly_runner').setLevel('info');
log.getLogger('python_runner').setLevel('info');
log.getLogger('printer_lib').setLevel('info');
log.getLogger('tests').setLevel('info');
log.getLogger('platform').setLevel('info');
log.getLogger('stepper').setLevel('info');
log.getLogger('quickalgo_executor').setLevel('info');
log.getLogger('replay').setLevel('info');

export interface CodecastEnvironmentMonitoring {
    effectTriggered: Function,
    effectResolved: Function,
    effectRejected: Function,
    effectCancelled: Function,
    clearListeners: Function,
}

interface CodecastEnvironment {
    store: AppStore,
    restart: Function,
    monitoring: CodecastEnvironmentMonitoring,
}

interface Codecast {
    environments: {[key: string]: CodecastEnvironment},
    start?: Function,
    restartSagas?: Function,
    runner?: AbstractRunner,
}

export interface App {
    recordApi: RecordApi,
    replayApi: ReplayApi,
    stepperApi: StepperApi,
    dispatch: Function,
    environment: string,
}

declare global {
    const Sk: any;

    interface Window extends WindowLocalStorage {
        store: EnhancedStore<AppStore>,
        replayStore: EnhancedStore<AppStore>,
        Codecast: Codecast,
        currentPythonRunner: any,
        languageStrings: any,
        __REDUX_DEVTOOLS_EXTENSION__: any,
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any,
        quickAlgoLoadedLibraries: any,
        quickAlgoLibraries: any,
        quickAlgoLibrariesList: any,
        quickAlgoContext: Function,
        quickAlgoResponsive: boolean,
        stringsLanguage: any,
        getContext: Function,
        getConceptViewerBaseConcepts: Function,
        getConceptsFromBlocks: Function,
        conceptViewer: ConceptViewer,
        conceptsFill: Function,
        Channel: any,
        DelayFactory: any,
        Interpreter: any, // JsInterpreter
        RaphaelFactory: any,
        jQuery: any,
        task: any, // task object defined to receive data from platform
        platform: any, // platform object defined to send data to platform
        json: any, // object that contains the data of a task, defined in the index.html of such task
        task_token: any, // instance that can generate a task token
        options: any, // this is used to store default data about task
        Blockly: any,
        goog: any,
        FioiBlockly: any,
        getBlocklyHelper: any,
        quickAlgoInterface: any,
        displayHelper: any,
        arrayContains: any,
        mergeIntoArray: any,
        mergeIntoObject: any,
        debounce: any,
        processingEndConditions: any,
        modulesPath: string,
        app: string,
        algoreaInstructionsStrings: string[][],
        getAlgoreaInstructionsAsHtml: (strings: string[], gridInfos: any, data: any, taskLevel: TaskLevelName) => string,
        SrlLogger: any,
        ace: any,
        subTask: any,
        changeTaskLevel: (levelName: TaskLevelName) => void,
        taskGetResourcesPost: (res, callback) => void,
        FontsLoader: any,
        implementGetResources?: (task: any) => void,
    }
}

/**
 * List of actions not to write in the console in development mode.
 *
 * @type {Object}
 */
const DEBUG_IGNORE_ACTIONS_MAP = {
    // 'Window.Resized': true,
    // 'Buffer.Reset': true,
    // 'Buffer.Highlight': true,
    // 'Buffer.Init': true,
    // 'Buffer.Model.Edit': true,
    // 'Player.Tick': true
};

window.Codecast = {
    environments: {},
}

for (let environment of ['main', 'replay', 'background']) {
    const initScope = {environment} as App;

    const {store, scope, finalize, start, monitoring} = link(function(bundle: Bundle) {
        bundle.defineAction(ActionTypes.AppInit);
        bundle.addReducer(ActionTypes.AppInit, () => {
            // return {};
        });

        bundle.include(commonBundle);
        bundle.include(playerBundle);
        bundle.include(recorderBundle);
        bundle.include(editorBundle);
        bundle.include(statisticsBundle);

        if (process.env['NODE_ENV'] === 'development') {
            bundle.addEarlyReducer(function(state: AppStore, action): void {
                if (!DEBUG_IGNORE_ACTIONS_MAP[action.type]) {
                    log.debug(`action on ${environment}`, action);
                }
            });
        }
    }, initScope);
    finalize(scope);

    let task = null;
    const restart = () => {
        if (null !== task) {
            task.cancel();
            task = null;
        }
        task = start(scope);
    }

    window.Codecast.environments[environment] = {store, restart, monitoring};
}

export const Codecast: Codecast = window.Codecast;
Codecast.restartSagas = () => {
    for (let [, {restart}] of Object.entries(Codecast.environments)) {
        restart();
    }
}

function clearUrl() {
    const currentUrl = url.parse(document.location.href, true);
    delete currentUrl.search;
    delete currentUrl.query['source'];

    window.history.replaceState(null, document.title, url.format(currentUrl));
}


/**
 * Options :
  {
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
**/
Codecast.start = function(options) {
    // Fix bug when bundle is loaded in head before body is initialized, dialogs would not appear
    Portal.defaultProps.container = document.body;

    const mainStore = Codecast.environments['main'].store;

    const urlParameters = new URLSearchParams(window.location.search);
    const queryParameters = Object.fromEntries(urlParameters);

    mainStore.dispatch({type: ActionTypes.AppInit, payload: {options, query: queryParameters}});

    // remove source from url wihtout reloading
    if (options.source) {
        clearUrl();
    }
    // XXX store.dispatch({type: scope.stepperConfigure, options: stepperOptions});

    /* Run the sagas (must be done before calling autoLogin) */
    Codecast.restartSagas();

    if (!isLocalMode() && /editor|player|sandbox/.test(options.start)) {
        mainStore.dispatch({type: StatisticsActionTypes.StatisticsInitLogData});
    }

    const urlParams = new URLSearchParams(window.location.search);
    let startScreen = options.start;
    if (!!urlParams.get('documentation')) {
        startScreen = 'documentation';
    }
    if ('tralalere' === options.app && 'task' === startScreen) {
        startScreen = 'tralalere';
    }

    let appDisplay;
    switch (startScreen) {
        case 'statistics':
            autoLogin();

            mainStore.dispatch({
                type: StatisticsActionTypes.StatisticsPrepare
            });

            appDisplay = <StatisticsApp />;

            break;

        case 'task':
            mainStore.dispatch({
                type: StatisticsActionTypes.StatisticsLogLoadingData
            });

            autoLogin();

            appDisplay = <TaskApp/>;

            break;
        case 'tralalere':
            appDisplay = <TralalereApp/>;

            break;
        case 'documentation':
            appDisplay = <Documentation standalone/>;

            break;
        default:
            appDisplay = function AppDisplay () {
                return <p>{"No such application: "}{startScreen}</p>;
            };

            break;
    }

    const container = document.getElementById('react-container');
    ReactDOM.render(
        <Provider store={mainStore}>
            <AppErrorBoundary>
                <DndProvider backend={MultiBackend} options={HTML5toTouch}>
                    <CustomDragLayer/>
                    {appDisplay}
                </DndProvider>
            </AppErrorBoundary>
        </Provider>, container
    );
};

function autoLogin() {
    let user = null;
    let token = null;
    try {
        user = JSON.parse(window.localStorage.getItem('user') || 'null');
        token = window.localStorage.getItem('token');
    } catch (ex) {
        return;
    }

    const mainStore = Codecast.environments['main'].store;
    mainStore.dispatch({type: CommonActionTypes.LoginFeedback, payload: {user, token}});
}
