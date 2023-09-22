import {App, Codecast} from "../../index";
import {AppStore} from "../../store";
import {QuickAlgoLibrary} from "./quickalgo_library";
import {Bundle} from "../../linker";
import {apply, call, put, spawn, takeEvery} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes} from "../../stepper/actionTypes";
import {extractLevelSpecific, extractVariantSpecific, getCurrentImmerState} from "../utils";
import {PrinterLib} from "./printer/printer_lib";
import {hasBlockPlatform, loadBlocklyHelperSaga} from "../../stepper/js";
import {
    QuickalgoTaskGridInfos,
    selectCurrentTestData,
    taskIncreaseContextId, taskSetAvailablePlatforms,
    taskSetBlocksPanelCollapsed,
    taskSetContextIncludeBlocks,
    taskSetContextStrings,
    taskUpdateState
} from "../task_slice";
import {ActionTypes as IOActionTypes} from "../../stepper/io/actionTypes";
import {IoMode} from "../../stepper/io";
import {makeContext, QuickalgoLibraryCall} from "../../stepper/api";
import {importModules, importPlatformModules, loadFonts} from "./import_modules";
import {createRunnerSaga} from "../../stepper";
import {cancelModal, displayModal} from "../../common/prompt_modal";
import {ModalType} from "../../common/modal_slice";
import log from 'loglevel';
import {appSelect} from '../../hooks';
import {SmartContractLib} from './smart_contract/smart_contract_lib';
import {DefaultQuickalgoLibrary} from './default_quickalgo_library';
import {platformsList} from '../../stepper/platforms';
import {ActionTypes as CommonActionTypes} from '../../common/actionTypes';
import {taskApi} from '../platform/platform';
import {DebugLib} from './debug/debug_lib';

export enum QuickAlgoLibrariesActionType {
    QuickAlgoLibrariesRedrawDisplay = 'quickalgoLibraries/redrawDisplay',
}

//TODO: Handle multiples libraries at once.
// For now, we only use 1 library
export class QuickAlgoLibraries {
    libraries: {[name: string]: {[environment: string]: QuickAlgoLibrary}} = {};

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

    unloadContext(environment: string): void {
        for (let name of Object.keys(this.libraries)) {
            const context = this.libraries[name][environment];
            if (context) {
                context.unload();
                delete this.libraries[name][environment];
            }
        }
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

    getSagas(app: App, environment: string) {
        const sagas = [];
        for (let library of this.getAllLibraries(environment)) {
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

    getAllLibraries(environment: string = null): QuickAlgoLibrary[] {
        if (environment) {
            return Object.values(this.libraries).reduce((prev, libs) => [...prev, ...(environment in libs ? [libs[environment]] : [])], []);
        } else {
            return Object.values(this.libraries).reduce((prev, libs) => [...prev, ...Object.values(libs)], []);
        }
    }

    getAllLibrariesByName(environment: string = null): {[name: string]: QuickAlgoLibrary} {
        const libraries = {};
        for (let name of Object.keys(this.libraries)) {
            if (!(environment in this.libraries[name])) {
                continue;
            }
            libraries[name] = this.libraries[name][environment];
        }

        return libraries;
    }

    getLibrariesInnerState(environment: string = null) {
        const innerState = {};
        for (let [name, library] of Object.entries(this.getAllLibrariesByName(environment))) {
            if (library.implementsInnerState()) {
                innerState[name] = getCurrentImmerState(library.getInnerState());
            }
        }

        return innerState;
    }
}

export const quickAlgoLibraries = new QuickAlgoLibraries();
window.quickAlgoLoadedLibraries = quickAlgoLibraries;
window.quickAlgoResponsive = true;
window.quickAlgoContext = function (display: boolean, infos: any) {
    return new DefaultQuickalgoLibrary(display, infos);
}

export function* createQuickalgoLibrary() {
    let state = yield* appSelect();
    let oldContext = quickAlgoLibraries.getContext(null, state.environment);
    log.getLogger('libraries').debug('Create a context', state.environment);
    if (oldContext) {
        log.getLogger('libraries').debug('Unload initial context first');
        quickAlgoLibraries.unloadContext(state.environment);
    }

    const display = 'main' === state.environment;

    const currentTask = yield* appSelect(state => state.task.currentTask);
    const currentLevel = yield* appSelect(state => state.task.currentLevel);
    window.subTask = currentTask;

    let levelGridInfos: QuickalgoTaskGridInfos = {
        includeBlocks: {
            generatedBlocks: {
                printer: ["print", "read", "manipulate"]
            },
            standardBlocks: {
                includeAll: true,
            },
        },
    };
    if (currentTask) {
        levelGridInfos = extractLevelSpecific(currentTask.gridInfos, currentLevel);
        const taskVariant = state.options.taskVariant;
        if (null !== taskVariant && undefined !== taskVariant) {
            levelGridInfos = extractVariantSpecific(levelGridInfos, taskVariant, currentLevel);
        }
    }

    if (!state.options.preload) {
        const platform = state.options.platform
        yield* call(importPlatformModules, platform, window.modulesPath);

        if (levelGridInfos.importModules) {
            yield* call(importModules, levelGridInfos.importModules, window.modulesPath);
        }
    }
    yield* call(loadFonts, state.options.theme, currentTask);

    // Reset fully local strings when creating a new context to avoid keeping strings from an other language
    window.languageStrings = {};

    let contextLib;
    if (levelGridInfos.context) {
        if (!window.quickAlgoLibrariesList) {
            window.quickAlgoLibrariesList = [];
        }
        if (!window.quickAlgoLibrariesList.find(lib => 'smart_contract' === lib[0])) {
            window.quickAlgoLibrariesList.push(['smart_contract', (display, infos) => {
                return new SmartContractLib(display, infos);
            }]);
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
                contextLib = new DefaultQuickalgoLibrary(display, levelGridInfos);
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
            contextLib = new DefaultQuickalgoLibrary(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'default', state.environment);
        }
    }

    const context = quickAlgoLibraries.getContext(null, state.environment);

    let availablePlatforms = context.getSupportedPlatforms();
    if (null !== currentTask && currentTask.supportedLanguages?.length && '*' !== currentTask.supportedLanguages) {
        availablePlatforms = availablePlatforms.filter(platform => -1 !== currentTask.supportedLanguages.split(',').indexOf(platform));
    }
    if (-1 === availablePlatforms.indexOf(state.options.platform) && availablePlatforms.length) {
        yield* put({type: CommonActionTypes.PlatformChanged, payload: {platform: availablePlatforms[0], reloadTask: true}});

        return false;
    }


    yield* put(taskSetAvailablePlatforms(availablePlatforms));

    log.getLogger('libraries').debug('created context', context);
    context.iTestCase = state.task.currentTestId;
    context.environment = state.environment;
    // For QuickPi lib, with this option, the program is graded even when context.display = false
    // (which happens in particular in the case of a replay)
    context.forceGradingWithoutDisplay = true;
    yield* call(addCustomBlocksToQuickalgoLibrary, context, display, levelGridInfos);

    if (context.changeSoundEnabled) {
        context.changeSoundEnabled('main' === state.environment ? state.task.soundEnabled : false);
    }

    yield* call(createDisplayHelper);
    if (hasBlockPlatform(state.options.platform) && currentTask) {
        yield* call(loadBlocklyHelperSaga, context, currentLevel);
    } else {
        // Create a fake blockly helper to make other libs like Turtle work
        context.blocklyHelper = {
            updateSize() {

            },
        };
    }

    const testData = selectCurrentTestData(state);
    log.getLogger('libraries').debug('Created context with', {currentTask, currentLevel, testData, context});
    taskApi.displayedSubTask = {
        context,
    };
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
        // Don't freeze any objet inside context.infos.includeBlocks because
        // these objects can be modified by blockly_blocks.js,
        // for example for Scratch: `tsiSingleBlocks = this.blocksToScratch(tsiSingleBlocks);`
        yield* put(taskSetContextIncludeBlocks(JSON.parse(JSON.stringify(context.infos.includeBlocks))));
    }
    if (context.infos && context.infos.panelCollapsed) {
        yield* put(taskSetBlocksPanelCollapsed({collapsed: false, manual: true}));
    }

    yield* call(quickAlgoLibraryResetAndReloadStateSaga);
    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});

    return true;
}

export function* addCustomBlocksToQuickalgoLibrary(context: QuickAlgoLibrary, display, gridInfos) {
    const debugLib = new DebugLib(display, gridInfos);
    yield* call(mergeQuickalgoLibrary, 'debug', context, debugLib);
}

export function* mergeQuickalgoLibrary(libName: string, parentContext: QuickAlgoLibrary, childContext: QuickAlgoLibrary) {
    const environment = yield* appSelect(state => state.environment);
    quickAlgoLibraries.addLibrary(childContext, libName, environment);

    parentContext.childContexts.push(childContext);

    parentContext.customBlocks = {
        ...parentContext.customBlocks,
        ...childContext.customBlocks,
    };

    parentContext.notionsList = {
        ...parentContext.notionsList,
        ...childContext.notionsList,
    };

    // Copy handlers
    for (let generatorName in childContext.customBlocks) {
        // Execute function in the context of the child
        parentContext[generatorName] = {};
        for (let [name, method] of Object.entries<Function>(childContext[generatorName])) {
            parentContext[generatorName][name] = function () {
                return method.apply(childContext, arguments);
            };
        }
    }
}

export function* quickAlgoLibraryResetAndReloadStateSaga(innerState = null) {
    const state = yield* appSelect();
    const currentTest = selectCurrentTestData(state);

    for (let [name, library] of Object.entries(quickAlgoLibraries.getAllLibrariesByName(state.environment))) {
        log.getLogger('libraries').debug('quickalgo reset and reload state', state.environment, library, innerState, currentTest);
        const libraryInnerState = 'object' === typeof innerState && innerState && name in innerState ? innerState[name] : null;
        library.resetAndReloadState(currentTest, state, libraryInnerState);
    }

    const contextState = quickAlgoLibraries.getLibrariesInnerState(state.environment);
    log.getLogger('libraries').debug('get new state without instant', contextState);
    yield* put(taskUpdateState(contextState));
}

export function* quickAlgoLibraryRedrawDisplaySaga(app: App) {
    const state = yield* appSelect();

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context && 'main' === state.environment && !context.implementsInnerState()) {
        const callsToReplay = mainQuickAlgoLogger.getQuickAlgoLibraryCalls();
        log.getLogger('libraries').debug('calls to replay', callsToReplay);
        yield* call(contextReplayPreviousQuickalgoCalls, app, callsToReplay);
    }
}

export function* contextReplayPreviousQuickalgoCalls(app: App, quickAlgoCalls: QuickalgoLibraryCall[]) {
    yield* call(quickAlgoLibraryResetAndReloadStateSaga);

    log.getLogger('libraries').debug('replay previous quickalgo calls', quickAlgoCalls);
    if (!Codecast.runner) {
        Codecast.runner = yield* call(createRunnerSaga);
    }
    const environment = yield* appSelect(state => state.environment);
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
    public avatarType = 'none';

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
        const dialog = `<div id="popupMessage" class="dialog-message" style="display: block">${message}</div>`;
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
        yield* takeEvery(QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay, function* () {
            log.getLogger('libraries').debug('ici redraw display');
            const state = yield* appSelect();
            const context = quickAlgoLibraries.getContext(null, state.environment);
            if (context) {
                context.needsRedrawDisplay = false;
                if ('main' === app.environment) {
                    context.display = true;
                }
            }

            const contextState = quickAlgoLibraries.getLibrariesInnerState(state.environment);
            yield* call(quickAlgoLibraryResetAndReloadStateSaga, contextState);

            if (context) {
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
