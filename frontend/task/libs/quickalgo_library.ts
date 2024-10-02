import {AppStoreReplay} from "../../store";
import {createDraft} from "immer";
import merge from 'lodash.merge';
import {getCurrentImmerState} from "../utils";
import {stepperMaxSpeed} from "../../stepper";
import log from 'loglevel';
import {QuickalgoLibraryInfos, TaskTest} from '../task_types';
import {defaultNotions, NotionArborescence} from '../blocks/notions';
import {LibraryTestResult} from './library_test_result';
import {TaskSubmissionServerTestResult} from '../../submission/submission_types';
import {CodecastPlatform} from '../../stepper/codecast_platform';
import {App, Codecast} from '../../app_types';
import {mainQuickAlgoLogger} from './quick_algo_logger';
import AbstractRunner from '../../stepper/abstract_runner';
import {asyncRequestJson} from '../../utils/api';

export interface LibraryEventListener {
    condition: (callback: (result: boolean) => void) => void,
    callback: () => Promise<void>,
    justActivated: boolean,
}

export interface QuickalgoLibraryBlock {
    name?: string,
    yieldsValue?: boolean|string,
    params?: string[],
    blocklyJson?: any,
    anyArgs?: boolean,
    variants?: any,
    hidden?: boolean,
}

export interface QuickAlgoCustomClass {
    defaultInstanceName?: string,
    init?: QuickalgoLibraryBlock,
    blocks: QuickalgoLibraryBlock[],
    constants?: {name: string, value: any}[],
}

export abstract class QuickAlgoLibrary {
    display: boolean;
    infos: QuickalgoLibraryInfos;
    placeholderBlocks: any;
    iTestCase: number; // Required for some libs such as barcode
    nbCodes: number;
    nbNodes: number;
    nbMoves?: number;
    strings: any;
    customBlocks: {[generatorName: string]: {[categoryName: string]: QuickalgoLibraryBlock[]}};
    customConstants: {[generatorName: string]: {name: string, value: any}[]};
    customClasses: {[generatorName: string]: {[categoryName: string]: {[className: string]: QuickAlgoCustomClass}}};
    customClassInstances: {[generatorName: string]: {[instanceName: string]: string}};
    conceptList: any[];
    conceptDisabledList?: string[];
    notionsList: NotionArborescence;
    runner: AbstractRunner;
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
    success?: boolean;
    doNotStartGrade?: boolean;
    callsToExecute: {action: string, args: any[], callback?: Function}[] = [];
    plannedNewDelay: number = null;
    childContexts: QuickAlgoLibrary[] = [];
    forceGradingWithoutDisplay?: boolean;
    eventListeners: LibraryEventListener[] = [];

    constructor(display: boolean, infos: any) {
        this.display = display;
        this.infos = infos;
        this.nbCodes = 1; // How many different codes the user can edit
        this.nbNodes = 1; // How many nodes will be executing programs, for QuickPi distributed

        // Properties we expect the context to have
        this.strings = {};
        this.customBlocks = {};
        this.customConstants = {};
        this.customClasses = {};
        this.customClassInstances = {};
        this.conceptList = [];

        this.aceEditor = null;
        this.messagePrefixFailure = '';
        this.messagePrefixSuccess = '';
        this.linkBack = false;

        // These classes are provided by the bebras-modules
        this.delayFactory = new window.DelayFactory();
        this.raphaelFactory = new window.RaphaelFactory();

        this.setLocalLanguageStrings(window.quickAlgoLanguageStrings);
    }

    // Set the localLanguageStrings for this context
    setLocalLanguageStrings(localLanguageStrings = {}) {
        log.getLogger('libraries').debug('set local language strings', localLanguageStrings, this.infos.blocksLanguage, window.currentPlatform);
        const stringsLanguage = window.stringsLanguage && window.stringsLanguage in localLanguageStrings ? window.stringsLanguage : "fr";

        if (this.infos?.blocksLanguage) {
            localLanguageStrings = this.mutateBlockStrings(
                localLanguageStrings,
                this.infos?.blocksLanguage
            );
        }

        if (typeof window.languageStrings != "object") {
            console.error("window.languageStrings is not an object");
        } else { // merge translations into new object
            window.languageStrings = merge(
                {},
                window.languageStrings,
                localLanguageStrings[stringsLanguage],
            );
        }
        this.strings = window.languageStrings;

        return this.strings;
    };

    mutateBlockStrings(strings, blocksLanguage) {
        let src = window.stringsLanguage;
        if (typeof blocksLanguage == 'string') {
            src = blocksLanguage;
        } else if (typeof blocksLanguage == 'object' && window.currentPlatform in blocksLanguage) {
            src = blocksLanguage[window.currentPlatform];
        }
        const dst = window.stringsLanguage;

        if (src === dst || !strings[src]?.code) {
            return strings;
        }

        for (let k in strings[dst].description) {
            if (k in strings[src]?.code) {
                strings[dst].description[k] = strings[dst].description[k].replace(
                    new RegExp('%' + k, 'g'),
                    strings[src].code[k],
                );
                strings[dst].description[k] = strings[dst].description[k].replace(
                    new RegExp(strings[dst].code[k] + '\\(', 'g'),
                    strings[src].code[k] + '(',
                );
            }
        }

        strings[dst].code = {...strings[src].code};

        return strings;
    }

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
    getConceptList(baseConceptUrl?: string) {
        return this.conceptList || [];
    };

    getNotionsList(): NotionArborescence {
        return {
            ...defaultNotions,
            ...(this.notionsList || {}),
        }
    };

    // The effective change will occur in the Quickalgo executor
    // just before the call to the lib endpoint. Because
    // if we change the delay during the execution of a call
    // and between two animations, it can break the delay calculations
    planNewDelay(newDelay) {
        this.plannedNewDelay = newDelay;
    }

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
        log.getLogger('libraries').debug('Quickalgo wait delay', callback, this.runner, computedDelay, delay, this.infos.actionDelay, stepperMaxSpeed);
        if (this.runner) {
            if (computedDelay > 0 && 'main' === this.environment) {
                this.delaysStartedCount++;
                setTimeout(() => {
                    this.delayOver();
                }, computedDelay);
            }
            this.runner.noDelay(callback, value);
        } else {
            // When a function is used outside an execution
            setTimeout(function () {
                callback(value);
            }, computedDelay);
        }
    }

    waitUntilCallback(callback, value = null) {
        log.getLogger('libraries').debug('Wait until callback', callback, value);
        if (this.runner) {
            this.delaysStartedCount++;
            this.runner.noDelay(callback, value);
        } else {
            callback(value);
        }
    }

    signalExecutionIsOver() {
        this.delayOver();
    }

    onStepperInit() {
        this.delaysStartedCount = 0;
        this.delaysEndedCount = 0;
        this.eventListeners = [];
    }

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

        // Avoid resetting context visualization if the paper does not have a visible container on the page
        const hasVisualization = 0 < document.getElementsByClassName('task-visualization').length;
        if (!hasVisualization) {
            this.display = false;
        }

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

    usesStack() {
        return true;
    }

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
                const callbacks = this.callbacksOnReady;
                this.callbacksOnReady = [];
                for (let callback of callbacks) {
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

    executeCallWhenReady(action: string, args: any[] = [], callback?: Function) {
        this.callsToExecute.push({action, args, callback});
    }

    checkOutputHelper() {
    }

    getErrorFromTestResult?(testResult: TaskSubmissionServerTestResult): LibraryTestResult;

    getContextStateFromTestResult?(testResult: TaskSubmissionServerTestResult, test: TaskTest): any|null;

    hasFeedback?(): boolean;

    getSupportedPlatforms(): string[] {
        return [
            CodecastPlatform.Blockly,
            CodecastPlatform.Scratch,
            CodecastPlatform.Python,
            CodecastPlatform.C,
            CodecastPlatform.Cpp,
        ];
    }

    dispatchContextEvent(event) {
        Codecast.environments['main'].store.dispatch(event);
    }

    showViews() {
        return false;
    }

    supportsCustomTests(): boolean {
        return false;
    }

    getDefaultEmptyTest() {
        return null;
    }

    waitForEvent(condition: (callback: (result: boolean) => void) => void, callback: () => Promise<void>) {
        this.eventListeners.push({
            condition,
            callback,
            justActivated: false,
        });
        log.getLogger('multithread').debug('[multithread] event listeners', this.eventListeners);
    }

    multiThreadingPreExecute() {
        log.getLogger('multithread').debug('[multithread] multi-threading pre-execute');
        this.triggerEventListenersIfNecessary();
        this.scheduleNextThread();
    }

    async checkEventListeners() {
        log.getLogger('multithread').debug('[multithread] check event listeners');
        for (let listener of this.eventListeners) {
            const result = await this.isEventListenerConditionActive(listener);
            log.getLogger('multithread').debug('[multithread] button is ', result);
            if (result &&!listener.justActivated) {
                listener.justActivated = true;
                log.getLogger('multithread').debug('[multithread] listener just activated');
            }
        }
    }

    isEventListenerConditionActive(listener: LibraryEventListener) {
        return new Promise((resolve) => {
            this.runner.makeQuickalgoCall(listener.condition, resolve);
        });
    }

    triggerEventListener(listener: LibraryEventListener) {
        // this.waitingEventListener = true;
        log.getLogger('multithread').debug('[multithread] trigger event listener', listener.callback);

        this.runner.createNewThread(listener.callback);
    }

    triggerEventListenersIfNecessary() {
        for (let listener of this.eventListeners) {
            if (listener.justActivated) {
                log.getLogger('multithread').debug('[multithread] before trigger event listener');
                listener.justActivated = false;
                this.triggerEventListener(listener);
            }
        }
    }

    scheduleNextThread() {
        const nextThreadId = this.runner.getNextThreadId();
        log.getLogger('multithread').debug('[multithread] -----------------------------------------------');
        log.getLogger('multithread').debug('[multithread] schedule thread', nextThreadId);
        this.runner.swapCurrentThreadId(nextThreadId);
    }

    generateRemoteHandler(libraryName: string, callName: string) {
        const self = this;
        return async function () {
            const taskPlatformUrl = Codecast.options.taskPlatformUrl;

            let args = [...arguments];
            const callback = args.pop();

            const body = {
                libraryName,
                callName,
                args,
            };

            const result = (await asyncRequestJson(taskPlatformUrl + '/remote-lib-call', body, false)) as {success: boolean, result?: any, error?: string};
            if (result?.success) {
                self.waitDelay(callback, result.result);
            } else {
                throw(result.error);
            }
        }
    }
}

