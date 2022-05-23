import {App} from "../../index";
import {AppStore} from "../../store";
import {QuickAlgoLibrary} from "./quickalgo_library";
import {Bundle} from "../../linker";
import {call, put, select, spawn, takeEvery} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes} from "../../stepper/actionTypes";
import {extractLevelSpecific, getCurrentImmerState} from "../utils";
import {PrinterLib} from "./printer/printer_lib";
import {hasBlockPlatform, loadBlocklyHelperSaga} from "../../stepper/js";
import {
    selectCurrentTest,
    taskIncreaseContextId, taskSetBlocksPanelCollapsed,
    taskSetContextIncludeBlocks,
    taskSetContextStrings, taskUpdateState
} from "../task_slice";
import {ActionTypes as IOActionTypes} from "../../stepper/io/actionTypes";
import {IoMode} from "../../stepper/io";
import {PlayerInstant} from "../../player";
import {makeContext, QuickalgoLibraryCall} from "../../stepper/api";
import {importModules} from "./import_modules";

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
    console.log('Create a context', context, state.environment);
    if (context) {
        console.log('Unload initial context first');
        context.unload();
    }

    const display = 'main' === state.environment;

    const currentTask = yield* select(state => state.task.currentTask);
    const currentLevel = yield* select(state => state.task.currentLevel);

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
    if (levelGridInfos.importModules) {
        yield* call(importModules, levelGridInfos.importModules, 'bebras-modules');
    }
    if (levelGridInfos.context) {
        if (!window.quickAlgoLibrariesList) {
            window.quickAlgoLibrariesList = [];
        }
        const libraryIndex = window.quickAlgoLibrariesList.findIndex(element => levelGridInfos.context === element[0]);
        if (-1 !== libraryIndex) {
            const contextFactory = window.quickAlgoLibrariesList[libraryIndex][1];
            try {
                contextLib = contextFactory(display, levelGridInfos);
                console.log('create new library', contextLib);
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

    console.log('created context', contextLib);
    contextLib.iTestCase = state.task.currentTestId;

    if (hasBlockPlatform(state.options.platform) && currentTask) {
        yield* call(loadBlocklyHelperSaga, contextLib, currentLevel);
    }

    const testData = selectCurrentTest(state);
    console.log('Create context with', {currentTask, currentLevel, testData});
    context = quickAlgoLibraries.getContext(null, state.environment);
    console.log('Created context', context);
    if (!context.blocklyHelper) {
        context.blocklyHelper = {
            updateSize: () => {},
        };
    }
    if (context instanceof PrinterLib && currentTask) {
        yield* put({type: IOActionTypes.IoPaneModeChanged, payload: {mode: IoMode.Split}});
    }
    yield* put(taskIncreaseContextId());
    yield* put(taskSetContextStrings(context.strings));
    if (context.infos && context.infos.includeBlocks) {
        yield* put(taskSetContextIncludeBlocks(context.infos.includeBlocks));
    }
    if (context.infos && context.infos.panelCollapsed) {
        yield* put(taskSetBlocksPanelCollapsed(true));
    }
    context.resetAndReloadState(testData, state);
}

export function* quickAlgoLibraryResetAndReloadStateSaga(app: App, innerState = null, instant: PlayerInstant = null) {
    const state: AppStore = yield* select();
    const currentTest = selectCurrentTest(state);

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context) {
        console.log('quickalgo reset and reload state', innerState);
        context.resetAndReloadState(currentTest, state, innerState);
        if (instant) {
            if (context.implementsInnerState()) {
                const contextState = getCurrentImmerState(context.getInnerState());
                console.log('get new state', contextState);
                yield* put(taskUpdateState(contextState));
            } else {
                const state: AppStore = yield* select();
                let instants = state.player.instants;
                let currentInstantIndex = instants.indexOf(instant);
                let startReplayInstantIndex = 0;
                for (let i = currentInstantIndex; i >= 0; i--) {
                    let consideredInstant = instants[i];
                    if (-1 !== ['stepper.exit', 'task/updateCurrentTestId', 'task/changeLevel'].indexOf(consideredInstant.event[1])) {
                        // If this is the first event we find (before compile.success), it means we weren't in a program
                        return;
                    }
                    if (consideredInstant.event[1] === 'compile.success') {
                        startReplayInstantIndex = i;
                        break;
                    }
                }

                const stepperState = instants[startReplayInstantIndex].state.stepper;
                if (stepperState.currentStepperState) {
                    let quickAlgoCalls = [];
                    for (let i = startReplayInstantIndex; i <= currentInstantIndex; i++) {
                        let consideredInstant = instants[i];
                        if (consideredInstant.quickalgoLibraryCalls && consideredInstant.quickalgoLibraryCalls.length) {
                            quickAlgoCalls = [...quickAlgoCalls, ...consideredInstant.quickalgoLibraryCalls];
                        }
                    }

                    mainQuickAlgoLogger.setQuickAlgoLibraryCalls(quickAlgoCalls);
                }
            }
        } else if (context.implementsInnerState()) {
            const contextState = getCurrentImmerState(context.getInnerState());
            console.log('get new state without instant', contextState);
            yield* put(taskUpdateState(contextState));
        }
    }
}

export function* quickAlgoLibraryRedrawDisplaySaga(app: App) {
    const state: AppStore = yield* select();

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context && 'main' === state.environment && !context.implementsInnerState()) {
        const callsToReplay = mainQuickAlgoLogger.getQuickAlgoLibraryCalls();
        console.log('calls to replay', callsToReplay);
        yield* call(contextReplayPreviousQuickalgoCalls, app, callsToReplay);
    }
}

export function* contextReplayPreviousQuickalgoCalls(app: App, quickAlgoCalls: QuickalgoLibraryCall[]) {
    yield* call(quickAlgoLibraryResetAndReloadStateSaga, app);

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

    console.log('our executor', executor);

    for (let quickalgoCall of quickAlgoCalls) {
        const {module, action, args} = quickalgoCall;
        console.log('start call execution', quickalgoCall);

        // @ts-ignore
        yield* spawn(executor, module, action, args);
    }
}

class MainQuickAlgoLogger {
    private quickalgoLibraryCalls: QuickalgoLibraryCall[] = [];

    logQuickAlgoLibraryCall(quickalgoLibraryCall: QuickalgoLibraryCall) {
        this.quickalgoLibraryCalls.push(quickalgoLibraryCall);
    }

    clearQuickAlgoLibraryCalls() {
        this.quickalgoLibraryCalls = [];
    }

    getQuickAlgoLibraryCalls(): QuickalgoLibraryCall[] {
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
            console.log('ici redraw display');
            const state = yield* select();
            const context = quickAlgoLibraries.getContext(null, state.environment);
            if (context) {
                // @ts-ignore
                if (context.redrawDisplay) {
                    // @ts-ignore
                    context.redrawDisplay();
                } else {
                    yield* call(quickAlgoLibraryRedrawDisplaySaga, app);
                }
            }
        });
    });
};