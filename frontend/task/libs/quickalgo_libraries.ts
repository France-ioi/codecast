import {App, Codecast} from "../../index";
import {AppStore} from "../../store";
import {QuickAlgoLibrary} from "./quickalgo_library";
import {Bundle} from "../../linker";
import {apply, call, put, select, spawn, takeEvery} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes} from "../../stepper/actionTypes";
import {extractLevelSpecific, getCurrentImmerState} from "../utils";
import {PrinterLib} from "./printer/printer_lib";
import {hasBlockPlatform, loadBlocklyHelperSaga} from "../../stepper/js";
import {
    selectCurrentTest,
    taskIncreaseContextId,
    taskSetBlocksPanelCollapsed,
    taskSetContextIncludeBlocks,
    taskSetContextStrings,
    taskUpdateState
} from "../task_slice";
import {ActionTypes as IOActionTypes} from "../../stepper/io/actionTypes";
import {IoMode} from "../../stepper/io";
import {PlayerInstant} from "../../player";
import {makeContext, QuickalgoLibraryCall} from "../../stepper/api";
import {importModules, importPlatformModules, loadFonts} from "./import_modules";
import {createRunnerSaga} from "../../stepper";
import {cancelModal, displayModal} from "../../common/prompt_modal";
import {ModalType} from "../../common/modal_slice";
import log from 'loglevel';

export enum QuickAlgoLibrariesActionType {
    QuickAlgoLibrariesRedrawDisplay = 'quickalgoLibraries/redrawDisplay',
}

//TODO: Handle multiples libraries at once.
// For now, we only use 1 library
export class QuickAlgoLibraries {
    libraries: {[name: string]: {[mode: string]: QuickAlgoLibrary}} = {};

    addLibrary(library: QuickAlgoLibrary, name: string, environment: string) {
        if (!(name in this.libraries)) {
            this.libraries[name] = {};
        }
        this.libraries[name][environment] = library;
    }

    getContext(name: string = null, environment: string): QuickAlgoLibrary {
        if (name in this.libraries) {
            return this.libraries[name][environment];
        }

        return Object.keys(this.libraries).length ? this.libraries[Object.keys(this.libraries)[0]][environment] : null;
    }

    reset(taskInfos = null, appState: AppStore = null) {
        this.applyOnLibraries('reset', [taskInfos, appState]);
    }

    applyOnLibraries(method, args) {
        for (let library of this.getAllLibraries()) {
            library[method].apply(library, args);
        }
    }

    getVisualization() {
        for (let library of this.getAllLibraries()) {
            if (library.getComponent()) {
                return library.getComponent();
            }
        }

        return null;
    }

    getSagas(app: App) {
        const sagas = [];
        for (let library of this.getAllLibraries()) {
            const librarySagas = library.getSaga(app);
            if (librarySagas) {
                sagas.push(librarySagas);
            }
        }

        return sagas;
    }

    getEventListeners() {
        let listeners = {} as {[key: string]: {module: string, method: string}};
        for (let [module, libraries] of Object.entries(this.libraries)) {
            for (let library of Object.values(libraries)) {
                const libraryListeners = library.getEventListeners();
                if (libraryListeners && Object.keys(libraryListeners).length) {
                    for (let [eventName, method] of Object.entries(libraryListeners)) {
                        listeners[eventName] = {module, method};
                    }
                }
            }
        }

        return listeners;
    }

    getAllLibraries() {
        return Object.values(this.libraries).reduce((prev, libs) => [...prev, ...Object.values(libs)], []);
    }
}

export const quickAlgoLibraries = new QuickAlgoLibraries();
window.quickAlgoLoadedLibraries = quickAlgoLibraries;
window.quickAlgoResponsive = true;
window.quickAlgoContext = function (display: boolean, infos: any) {
    return new QuickAlgoLibrary(display, infos);
}

export function* createQuickalgoLibrary() {
    let state: AppStore = yield* select();
    let context = quickAlgoLibraries.getContext(null, state.environment);
    log.getLogger('libraries').debug('Create a context', context, state.environment);
    if (context) {
        log.getLogger('libraries').debug('Unload initial context first');
        context.unload();
    }

    const display = 'main' === state.environment;

    const currentTask = yield* select(state => state.task.currentTask);
    const currentLevel = yield* select(state => state.task.currentLevel);
    window.subTask = currentTask;

    let contextLib;
    let levelGridInfos = currentTask ? extractLevelSpecific(currentTask.gridInfos, currentLevel) : {
        includeBlocks: {
            generatedBlocks: {
                printer: ["print", "read", "manipulate"]
            },
            standardBlocks: {
                includeAll: true,
            },
        },
    };

    if (!state.options.preload) {
        const platform = state.options.platform
        yield* call(importPlatformModules, platform, window.modulesPath);

        if (levelGridInfos.importModules) {
            yield* call(importModules, levelGridInfos.importModules, window.modulesPath);
        }
    }
    yield* call(loadFonts, state.options.theme);

    if (levelGridInfos.context) {
        if (!window.quickAlgoLibrariesList) {
            window.quickAlgoLibrariesList = [];
        }
        const libraryIndex = window.quickAlgoLibrariesList.findIndex(element => levelGridInfos.context === element[0]);
        if (-1 !== libraryIndex) {
            const contextFactory = window.quickAlgoLibrariesList[libraryIndex][1];
            try {
                contextLib = contextFactory(display, levelGridInfos);
                log.getLogger('libraries').debug('create new library', contextLib);
                quickAlgoLibraries.addLibrary(contextLib, levelGridInfos.context, state.environment);
            } catch (e) {
                console.error("Cannot create context", e);
                contextLib = new QuickAlgoLibrary(display, levelGridInfos);
                quickAlgoLibraries.addLibrary(contextLib, 'default', state.environment);
            }
        }
    }
    if (!contextLib) {
        try {
            contextLib = new PrinterLib(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'printer', state.environment);
        } catch (e) {
            console.error("Cannot create context", e);
            contextLib = new QuickAlgoLibrary(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'default', state.environment);
        }
    }

    log.getLogger('libraries').debug('created context', contextLib);
    contextLib.iTestCase = state.task.currentTestId;
    contextLib.environment = state.environment;

    if (contextLib.changeSoundEnabled) {
        contextLib.changeSoundEnabled('main' === state.environment ? state.task.soundEnabled : false);
    }

    yield* call(createDisplayHelper);
    if (hasBlockPlatform(state.options.platform) && currentTask) {
        yield* call(loadBlocklyHelperSaga, contextLib, currentLevel);
    }

    const testData = selectCurrentTest(state);
    log.getLogger('libraries').debug('Create context with', {currentTask, currentLevel, testData});
    context = quickAlgoLibraries.getContext(null, state.environment);
    log.getLogger('libraries').debug('Created context', context);
    // if (!context.blocklyHelper) {
    //     context.blocklyHelper = {
    //         updateSize: () => {},
    //     };
    // }
    if (context instanceof PrinterLib && currentTask) {
        yield* put({type: IOActionTypes.IoPaneModeChanged, payload: {mode: IoMode.Split}});
    }
    yield* put(taskIncreaseContextId());
    yield* put(taskSetContextStrings(context.strings));
    if (context.infos && context.infos.includeBlocks) {
        yield* put(taskSetContextIncludeBlocks({...context.infos.includeBlocks}));
    }
    if (context.infos && context.infos.panelCollapsed) {
        yield* put(taskSetBlocksPanelCollapsed(true));
    }
    context.resetAndReloadState(testData, state);
    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
}

export function* quickAlgoLibraryResetAndReloadStateSaga(app: App, innerState = null, instant: PlayerInstant = null) {
    const state: AppStore = yield* select();
    const currentTest = selectCurrentTest(state);

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context) {
        log.getLogger('libraries').debug('quickalgo reset and reload state', state.environment, context, innerState, currentTest);
        context.resetAndReloadState(currentTest, state, innerState);

        const contextState = getCurrentImmerState(context.getInnerState());
        log.getLogger('libraries').debug('get new state without instant', contextState);
        yield* put(taskUpdateState(contextState));
    }
}

export function* quickAlgoLibraryRedrawDisplaySaga(app: App) {
    const state: AppStore = yield* select();

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context && 'main' === state.environment && !context.implementsInnerState()) {
        const callsToReplay = mainQuickAlgoLogger.getQuickAlgoLibraryCalls();
        log.getLogger('libraries').debug('calls to replay', callsToReplay);
        yield* call(contextReplayPreviousQuickalgoCalls, app, callsToReplay);
    }
}

export function* contextReplayPreviousQuickalgoCalls(app: App, quickAlgoCalls: QuickalgoLibraryCall[]) {
    yield* call(quickAlgoLibraryResetAndReloadStateSaga, app);

    log.getLogger('libraries').debug('replay previous quickalgo calls', quickAlgoCalls);
    if (!Codecast.runner) {
        Codecast.runner = yield* call(createRunnerSaga);
    }
    const environment = yield* select((state: AppStore) => state.environment);
    const context = quickAlgoLibraries.getContext(null, environment);
    if (context) {
        context.runner = Codecast.runner;
    }

    const stepperContext = makeContext(null, {
        interactAfter: (arg) => {
            return new Promise((resolve, reject) => {
                app.dispatch({
                    type: StepperActionTypes.StepperInteract,
                    payload: {stepperContext, arg},
                    meta: {resolve, reject}
                });
            });
        },
        dispatch: app.dispatch,
        environment: app.environment,
        // Don't re-log already logged calls
        quickAlgoCallsLogger: () => {},
    });

    const executor = stepperContext.quickAlgoCallsExecutor;

    log.getLogger('libraries').debug('our executor', executor);

    for (let quickalgoCall of quickAlgoCalls) {
        const {module, action, args} = quickalgoCall;
        log.getLogger('libraries').debug('start call execution', quickalgoCall);

        // @ts-ignore
        yield* spawn(executor, module, action, args);
    }

    mainQuickAlgoLogger.setQuickAlgoLibraryCalls(quickAlgoCalls);
}

function* createDisplayHelper() {
    if (!window.displayHelper) {
        window.displayHelper = new DisplayHelper();
    }
}

class DisplayHelper {
    async showPopupMessage(message, mode, yesButtonText, agreeFunc, noButtonText, avatarMood, defaultText, disagreeFunc) {
        log.getLogger('libraries').debug('popup message', defaultText, noButtonText);
        const result = await new Promise(resolve => {
            const mainStore = Codecast.environments['main'].store;
            mainStore.dispatch(displayModal({message, mode, defaultInput: defaultText, yesButtonText, noButtonText, callback: resolve}));
        });

        if (false !== result && agreeFunc) {
            if (mode === 'input') {
                agreeFunc(result);
            } else {
                agreeFunc();
            }
        }

        if (false === result && disagreeFunc) {
            disagreeFunc();
        }
    }
    async showPopupDialog(message) {
        const dialog = `<div id="popupMessage">${message}</div>`;
        const mainStore = Codecast.environments['main'].store;
        mainStore.dispatch(displayModal({message: dialog, mode: ModalType.dialog}));
    }
    async showKeypad(initialValue, position, callbackModify, callbackFinished, options) {
        const mainStore = Codecast.environments['main'].store;
        mainStore.dispatch(displayModal({mode: ModalType.keypad, callbackFinished, defaultInput: initialValue, position, callbackModify, options}));
    }
    set popupMessageShown(value) {
        log.getLogger('libraries').debug('change value', value);
        if (false === value) {
            const mainStore = Codecast.environments['main'].store;
            mainStore.dispatch(cancelModal());
        }
    }
}

class MainQuickAlgoLogger {
    private quickalgoLibraryCalls: QuickalgoLibraryCall[] = [];

    logQuickAlgoLibraryCall(quickalgoLibraryCall: QuickalgoLibraryCall) {
        log.getLogger('libraries').debug('LOG ACTION', quickalgoLibraryCall);
        this.quickalgoLibraryCalls.push(quickalgoLibraryCall);
    }

    clearQuickAlgoLibraryCalls() {
        log.getLogger('libraries').debug('clear quickalgo calls');
        this.quickalgoLibraryCalls = [];
    }

    getQuickAlgoLibraryCalls(): QuickalgoLibraryCall[] {
        log.getLogger('libraries').debug('get quickalgo calls', this.quickalgoLibraryCalls);
        return [...this.quickalgoLibraryCalls];
    }

    setQuickAlgoLibraryCalls(calls: QuickalgoLibraryCall[]) {
        this.quickalgoLibraryCalls = calls;
    }
}

export const mainQuickAlgoLogger = new MainQuickAlgoLogger();

export default function(bundle: Bundle) {
    bundle.addSaga(function* (app: App) {
        // @ts-ignore
        yield* takeEvery(QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay, function* ({payload}) {
            log.getLogger('libraries').debug('ici redraw display');
            const state = yield* select();
            const context = quickAlgoLibraries.getContext(null, state.environment);
            if (context) {
                context.needsRedrawDisplay = false;
                const currentTest = selectCurrentTest(state);
                const contextState = getCurrentImmerState(context.getInnerState());
                if ('main' === app.environment){
                    context.display = true;
                }
                // For libs like barcode where we need to call context.reset to recreate context
                context.resetAndReloadState(currentTest, state, contextState);

                // @ts-ignore
                if (context.redrawDisplay) {
                    // @ts-ignore
                    yield* apply(context, context.redrawDisplay);
                    log.getLogger('libraries').debug('redraw display done it');
                } else {
                    yield* call(quickAlgoLibraryRedrawDisplaySaga, app);
                }
            }
        });
    });
};