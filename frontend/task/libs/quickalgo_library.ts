import {App} from "../../index";
import {AppStoreReplay} from "../../store";
import {createDraft} from "immer";
import quickalgoI18n from "../../lang/quickalgoI18n";
import merge from 'lodash.merge';
import {getCurrentImmerState} from "../utils";
import {mainQuickAlgoLogger} from "./quickalgo_libraries";

export class QuickAlgoLibrary {
    display: boolean;
    infos: any;
    placeholderBlocks: any;
    iTestCase: number; // Required for some libs such as barcode
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
    blocklyHelper: any;
    onChange: any;
    docGenerator: any;

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

        this.setLocalLanguageStrings(quickalgoI18n);

        // this.blocklyHelper = {
        //     updateSize: function () {
        //     },
        // }
    }

    // Set the localLanguageStrings for this context
    setLocalLanguageStrings(localLanguageStrings) {
        console.log('set local language strings', localLanguageStrings);
        window.stringsLanguage = window.stringsLanguage && window.stringsLanguage in localLanguageStrings ? window.stringsLanguage : "fr";
        window.languageStrings = window.languageStrings || {};

        if (typeof window.languageStrings != "object") {
            console.error("window.languageStrings is not an object");
        } else { // merge translations
            window.languageStrings = merge(
                window.languageStrings,
                localLanguageStrings[window.stringsLanguage],
            );
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
        if (this.runner && this.runner.returnCallback) {
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

    debug_alert (message, callback) {
        // Display debug information
        message = message ? message.toString() : '';
        if (this.display) {
            alert(message);
        }
        this.callCallback(callback, null);
    };

    setCurNode(curNode) {
        // Set the current node
        this.curNode = curNode;
    };

    // Should be actually defined by the library
    reset(taskInfos = null, appState: AppStoreReplay = null) {
    };

    resetAndReloadState(taskInfos = null, appState: AppStoreReplay = null, innerState: any = null) {
        console.log('reset and reload state', taskInfos, innerState);
        this.reset(taskInfos, appState);
        // We do a second call because some libraries like barcode only reset their internal state when taskInfos is empty...
        this.reset();
        mainQuickAlgoLogger.clearQuickAlgoLibraryCalls();
        const newInnerState = innerState ? innerState : getCurrentImmerState(this.getInnerState());
        if (this.implementsInnerState()) {
            this.reloadInnerState(createDraft(newInnerState));
        } else {
            if (newInnerState.calls) {
                // in fact maybe not necessary since redrawDisplay is the method that should update the display
                console.log('TODO replay calls', newInnerState.calls);
                mainQuickAlgoLogger.setQuickAlgoLibraryCalls(newInnerState.calls);
            }
        }
    };

    updateScale() {
        // Update the display scale when the window is resized for instance
    };

    unload() {
        // Unload the context, cleaning up
    };

    provideBlocklyColours(): any {
        if ('tralalere' === window.app) {
            return {
                categories: {
                    logic: 210,
                    loops: 120,
                    control: 120,
                    math: 230,
                    operator: 230,
                    texts: 160,
                    lists: 260,
                    colour: 20,
                    variables: 330,
                    functions: 65,
                    _default: 290,
                },
                blocks: {}
            };
        }

        return {};
    };

    getComponent() {
        return null;
    };

    getInnerState(): any {
        // For libs that don't implement inner state, we replay them
        return {calls: [...mainQuickAlgoLogger.getQuickAlgoLibraryCalls()]};
    };

    implementsInnerState() {
        return false;
    }

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
}

