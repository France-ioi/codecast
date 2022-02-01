import {App} from "../../index";
import {AppStore, AppStoreReplay} from "../../store";
import {createDraft} from "immer";

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

    redrawDisplay(taskInfos = null) {
        this.applyOnLibraries('redrawDisplay', [taskInfos]);
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

export class QuickAlgoLibrary {
    display: boolean;
    infos: any;
    nbCodes: number;
    nbNodes: number;
    strings: any;
    customBlocks: any;
    customConstants: any;
    conceptList: any[];
    runner: any;
    curNode: any;
    lost: boolean = false;
    aceEditor: any;
    messagePrefixFailure: string;
    messagePrefixSuccess: string;
    linkBack: boolean;
    delayFactory: any;
    raphaelFactory: any;

    constructor(display: boolean, infos: any) {
        this.display = display;
        this.infos = infos;
        this.nbCodes = 1; // How many different codes the user can edit
        this.nbNodes = 1; // How many nodes will be executing programs, for QuickPi distributed

        // Properties we expect the context to have
        this.strings = {};
        this.customBlocks = {};
        this.customConstants = {};
        this.conceptList = [];

        this.aceEditor = null;
        this.messagePrefixFailure = '';
        this.messagePrefixSuccess = '';
        this.linkBack = false;

        // These classes are provided by the bebras-modules
        this.delayFactory = new window.DelayFactory();
        this.raphaelFactory = new window.RaphaelFactory();

        // this.blocklyHelper = {
        //     updateSize: function () {
        //     },
        // }
    }

    // Set the localLanguageStrings for this context
    setLocalLanguageStrings(localLanguageStrings) {
        window.stringsLanguage = window.stringsLanguage && window.stringsLanguage in localLanguageStrings ? window.stringsLanguage : "fr";
        window.languageStrings = window.languageStrings || {};

        if (typeof window.languageStrings != "object") {
            console.error("window.languageStrings is not an object");
        } else { // merge translations
            window.languageStrings = {
                ...window.languageStrings,
                ...localLanguageStrings[window.stringsLanguage],
            }
        }
        this.strings = window.languageStrings;

        return this.strings;
    };

    // Import more language strings
    importLanguageStrings(source, dest) {
        if ((typeof source != "object") || (typeof dest != "object")) {
            return;
        }
        for (let key1 of Object.keys(source)) {
            if (dest[key1] != undefined && typeof dest[key1] == "object") {
                this.importLanguageStrings(source[key1], dest[key1]);
            } else {
                dest[key1] = source[key1];
            }
        }
    };

    // Get the list of concepts
    // List can be defined either in context.conceptList, or by redefining this
    // function
    getConceptList() {
        return this.conceptList || [];
    };

    // Default implementations
    changeDelay(newDelay) {
        // Change the action delay while displaying
        this.infos.actionDelay = newDelay;
    };

    waitDelay(callback, value = null) {
        // This function is used only to call the callback to move to next step,
        // but we handle the speed delay in an upper level
        if (this.runner) {
            this.runner.returnCallback(callback, value);
        } else {
            callback(value);
        }
    };

    callCallback (callback, value) {
        // Call the callback with value directly
        if (this.runner) {
            this.runner.noDelay(callback, value);
        } else {
            // When a function is used outside of an execution
            callback(value);
        }
    };

    setCurNode(curNode) {
        // Set the current node
        this.curNode = curNode;
    };

    // Placeholders, should be actually defined by the library
    reset(taskInfos = null, appState: AppStoreReplay = null) {
        // Reset the context
        if (this.display) {
            this.redrawDisplay();
        }
    };

    resetAndReloadState(taskInfos = null, appState: AppStoreReplay = null, innerState: any = null) {
        this.reset(taskInfos, appState);
        if (this.reloadInnerState) {
            this.reloadInnerState(createDraft(innerState ? innerState : this.getInnerState()));
        }
    };

    redrawDisplay() {
        // Reset the context display
    };

    updateScale() {
        // Update the display scale when the window is resized for instance
    };

    unload() {
        // Unload the context, cleaning up
    };

    provideBlocklyColours() {
        // Provide colours for Blockly
        return {};
    };

    getComponent() {
        return null;
    };

    getInnerState() {
        return {};
    };

    reloadInnerState(state: any): void {
    }

    getSaga(app: App) {
        return null;
    }

    getEventListeners(): {[eventName: string]: string} {
        return null;
    };

    onError(diagnostics: any): void {

    }

    onSuccess(message: any): void {

    }

    onInput(): void {

    }
}

window.quickAlgoResponsive = true;

window.quickAlgoContext = function (display: boolean, infos: any) {
    return new QuickAlgoLibrary(display, infos);
}
