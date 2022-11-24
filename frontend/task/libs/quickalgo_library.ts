import {App} from "../../index";
import {AppStoreReplay} from "../../store";
import {createDraft} from "immer";
import quickalgoI18n from "../../lang/quickalgoI18n";
import merge from 'lodash.merge';
import {getCurrentImmerState} from "../utils";
import {mainQuickAlgoLogger} from "./quickalgo_libraries";
import {stepperMaxSpeed} from "../../stepper";
import log from 'loglevel';

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
    delaysStartedCount: number = 0;
    delaysEndedCount: number = 0;
    callbacksOnReady: Function[] = [];
    needsRedrawDisplay: boolean = false;
    environment: string;

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
        log.getLogger('libraries').debug('set local language strings', localLanguageStrings);
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
        this.infos.actionDelay = newDelay;
    };

    // Default implementation
    changeSoundEnabled(soundEnabled: boolean): void {
    };

    getDelay(): number {
        return this.infos.actionDelay;
    };

    waitDelay(callback, value = null, delay = null) {
        // This function is used only to call the callback to move to next step,
        // but we handle the speed delay in an upper level
        let computedDelay = null !== delay ? delay : (this.infos && undefined !== this.infos.actionDelay ? this.infos.actionDelay : stepperMaxSpeed);
        log.getLogger('libraries').debug('Quickalgo wait delay', callback, this.runner, computedDelay);
        if (this.runner) {
            this.runner.noDelay(callback, value);
            if (computedDelay > 0 && 'main' === this.environment) {
                this.delaysStartedCount++;
                setTimeout(() => {
                    this.delayOver();
                }, computedDelay);
            }
        } else {
            // When a function is used outside an execution
            setTimeout(function () {
                callback(value);
            }, computedDelay);
        }
    };

    callCallback (callback, value) {
        // Call the callback with value directly
        if (this.runner) {
            this.runner.noDelay(callback, value);
        } else {
            // When a function is used outside an execution
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
        log.getLogger('libraries').debug('reset and reload state', taskInfos, innerState);
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
                log.getLogger('libraries').debug('TODO replay calls', newInnerState.calls);
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
                    logic: 215,
                    loops: 181,
                    control: 215,
                    math: 120,
                    operator: 0,
                    texts: 160,
                    lists: 222,
                    colour: 20,
                    variables: 38,
                    functions: 30,
                    actions: 215,
                    sensors: 215,
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

    addSound(sound: string): void {
    }

    delayOver() {
        this.delaysEndedCount++;
        log.getLogger('libraries').debug('delay over', this.delaysStartedCount, this.delaysEndedCount, this.callbacksOnReady);
        if (this.delaysEndedCount === this.delaysStartedCount) {
            if (this.callbacksOnReady.length) {
                for (let callback of this.callbacksOnReady) {
                    callback();
                }
            }
        }
    }

    // Execute this function when all animation delays are over
    executeWhenReady(callback: Function) {
        log.getLogger('libraries').debug('execute on ready', this.delaysStartedCount, this.delaysEndedCount, performance.now());
        if (this.delaysEndedCount === this.delaysStartedCount) {
            log.getLogger('libraries').debug('already ready');
            callback();
        } else {
            log.getLogger('libraries').debug('not ready yet');
            this.callbacksOnReady.push(callback);
        }
    }
}

