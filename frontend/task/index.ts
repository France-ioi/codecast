import {DelayFactory} from "../utils/sleep";
import {extractLevelSpecific, mergeIntoArray, mergeIntoObject} from "./utils";
import StringRotation from './fixtures/14_strings_05_rotation';
import {ActionTypes} from "./actionTypes";
import {Bundle} from "../linker";
import {put, takeEvery} from "redux-saga/effects";
import {AppStore} from "../store";
import {ActionTypes as AppActionTypes} from "../actionTypes";

export interface QuickAlgoContext {
    display: boolean,
    infos: any,
    nbCodes: number,
    nbNodes: number,
    setLocalLanguageStrings?: Function,
    strings?: any,
    importLanguageStrings?: Function,
    getConceptList?: Function,
    changeDelay?: Function,
    waitDelay?: Function,
    callCallback?: Function,
    setCurNode?: Function,
    debug_alert?: Function,
    reset?: Function,
    resetDisplay?: Function,
    updateScale?: Function,
    unload?: Function,
    provideBlocklyColours?: Function,
    localLanguageStrings?: any,
    customBlocks?: any,
    customConstants?: any,
    conceptList?: any,
    curNode?: any,
    stringsLanguage?: any,
    runner?: any,
    propagate?: Function,
}

export function quickAlgoInit() {
    // @ts-ignore
    if (!String.prototype.format) {
        // @ts-ignore
        String.prototype.format = function() {
            let str = this.toString();
            if (!arguments.length) {
                return str;
            }

            let args = typeof arguments[0];
            args = (("string" == args || "number" == args) ? arguments : arguments[0]);

            for (let arg in args as any) {
                str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
            }

            return str;
        }
    }

    window.quickAlgoContext = function (display: boolean, infos: any) {
        const context: QuickAlgoContext = {
            display: display,
            infos: infos,
            nbCodes: 1, // How many different codes the user can edit
            nbNodes: 1 // How many nodes will be executing programs
        };

        // Set the localLanguageStrings for this context
        context.setLocalLanguageStrings = function (localLanguageStrings) {
            context.localLanguageStrings = localLanguageStrings;
            window.stringsLanguage = window.stringsLanguage || "fr";
            window.languageStrings = window.languageStrings || {};

            if (typeof window.languageStrings != "object") {
                console.error("window.languageStrings is not an object");
            } else { // merge translations
                window.languageStrings = {
                    ...window.languageStrings,
                    ...localLanguageStrings[window.stringsLanguage],
                }
            }
            context.strings = window.languageStrings;
            return context.strings;
        };

        // Import more language strings
        context.importLanguageStrings = function (source, dest) {
            if ((typeof source != "object") || (typeof dest != "object")) {
                return;
            }
            for (let key1 in source) {
                if (dest[key1] != undefined && typeof dest[key1] == "object") {
                    context.importLanguageStrings(source[key1], dest[key1]);
                } else {
                    dest[key1] = source[key1];
                }
            }
        };

        // Get the list of concepts
        // List can be defined either in context.conceptList, or by redefining this
        // function
        context.getConceptList = function () {
            return context.conceptList || [];
        };

        // Default implementations
        context.changeDelay = function (newDelay) {
            // Change the action delay while displaying
            infos.actionDelay = newDelay;
        };

        context.waitDelay = function (callback, value) {
            // This function is used only to call the callback to move to next step,
            // but we handle the speed delay in an upper level
            if (context.runner) {
                context.runner.returnCallback(callback, value);
            }
        };

        context.callCallback = function (callback, value) {
            // Call the callback with value directly
            if (context.runner) {
                context.runner.noDelay(callback, value);
            } else {
                // When a function is used outside of an execution
                callback(value);
            }
        };

        context.setCurNode = function (curNode) {
            // Set the current node
            context.curNode = curNode;
        };

        context.debug_alert = function (message, callback) {
            // Display debug information
            message = message ? message.toString() : '';
            if (context.display) {
                alert(message);
            }
            context.callCallback(callback);
        };

        // Placeholders, should be actually defined by the library
        context.reset = function () {
            // Reset the context
            if (display) {
                context.resetDisplay();
            }
        };

        context.resetDisplay = function () {
            // Reset the context display
        };

        context.updateScale = function () {
            // Update the display scale when the window is resized for instance
        };

        context.unload = function () {
            // Unload the context, cleaning up
        };

        context.provideBlocklyColours = function () {
            // Provide colours for Blockly
            return {};
        };

        // Properties we expect the context to have
        context.localLanguageStrings = {};
        context.customBlocks = {};
        context.customConstants = {};
        context.conceptList = [];

        return context;
    };


    // Global variable allowing access to each getContext
    window.quickAlgoLibraries = {
        libs: {},
        order: [],
        contexts: {},
        mergedMode: false,

        get: function (name) {
            return this.libs[name];
        },

        getContext: function () {
            // Get last context registered
            if (this.order.length) {
                if (this.mergedMode) {
                    let gc = this.getMergedContext();
                    return gc.apply(gc, arguments);
                } else {
                    let gc = this.libs[this.order[this.order.length - 1]];
                    return gc.apply(gc, arguments);
                }
            } else {
                if (window.getContext) {
                    return window.getContext.apply(window.getContext, arguments);
                } else {
                    throw "No context registered!";
                }
            }
        },

        setMergedMode: function (options) {
            // Set to retrieve a context merged from all contexts registered
            // options can be true or an object with the following properties:
            // -displayed: name of module to display first
            this.mergedMode = options;
        },

        getMergedContext: function () {
            // Make a context merged from multiple contexts
            if (this.mergedMode.displayed && this.order.indexOf(this.mergedMode.displayed) > -1) {
                this.order.splice(this.order.indexOf(this.mergedMode.displayed), 1);
                this.order.unshift(this.mergedMode.displayed);
            }
            let that = this;

            return function (display, infos) {
                // Merged context
                let context = window.quickAlgoContext(display, infos);
                let localLanguageStrings = {};
                context.customBlocks = {};
                context.customConstants = {};
                context.conceptList = [];

                let subContexts = [];
                for (let scIdx = 0; scIdx < that.order.length; scIdx++) {
                    // Only the first context gets display = true
                    let newContext = that.libs[that.order[scIdx]](display && (scIdx == 0), infos);
                    subContexts.push(newContext);

                    // Merge objects
                    mergeIntoObject(localLanguageStrings, newContext.localLanguageStrings);
                    mergeIntoObject(context.customBlocks, newContext.customBlocks);
                    mergeIntoObject(context.customConstants, newContext.customConstants);
                    mergeIntoArray(context.conceptList, newContext.conceptList);

                    // Merge namespaces
                    for (let namespace in newContext.customBlocks) {
                        if (!context[namespace]) {
                            context[namespace] = {};
                        }
                        for (let category in newContext.customBlocks[namespace]) {
                            let blockList = newContext.customBlocks[namespace][category];
                            for (let i = 0; i < blockList.length; i++) {
                                let name = blockList[i].name;
                                if (name && !context[namespace][name] && newContext[namespace][name]) {
                                    context[namespace][name] = function (nc, func) {
                                        return function () {
                                            context.propagate(nc);
                                            func.apply(nc, arguments);
                                        };
                                    }(newContext, newContext[namespace][name]);
                                }
                            }
                        }
                    }
                }

                let strings = context.setLocalLanguageStrings(localLanguageStrings);

                // Propagate properties to the subcontexts
                context.propagate = function (subContext) {
                    let properties = ['raphaelFactory', 'delayFactory', 'blocklyHelper', 'display', 'runner'];
                    for (let i = 0; i < properties.length; i++) {
                        subContext[properties[i]] = context[properties[i]];
                    }
                }

                // Merge functions
                context.reset = function (taskInfos) {
                    for (let i = 0; i < subContexts.length; i++) {
                        context.propagate(subContexts[i]);
                        subContexts[i].reset(taskInfos);
                    }
                };
                context.resetDisplay = function () {
                    for (let i = 0; i < subContexts.length; i++) {
                        context.propagate(subContexts[i]);
                        subContexts[i].resetDisplay();
                    }
                };
                context.updateScale = function () {
                    for (let i = 0; i < subContexts.length; i++) {
                        context.propagate(subContexts[i]);
                        subContexts[i].updateScale();
                    }
                };
                context.unload = function () {
                    for (let i = subContexts.length - 1; i >= 0; i--) {
                        // Do the unload in reverse order
                        context.propagate(subContexts[i]);
                        subContexts[i].unload();
                    }
                };
                context.provideBlocklyColours = function () {
                    let colours = {};
                    for (let i = 0; i < subContexts.length; i++) {
                        mergeIntoObject(colours, subContexts[i].provideBlocklyColours());
                    }
                    return colours;
                };

                // Fetch some other data / functions some contexts have
                for (let i = 0; i < subContexts.length; i++) {
                    for (let prop in subContexts[i]) {
                        if (typeof context[prop] != 'undefined') {
                            continue;
                        }
                        if (typeof subContexts[i][prop] == 'function') {
                            context[prop] = function (sc, func) {
                                return function () {
                                    context.propagate(sc);
                                    func.apply(sc, arguments);
                                }
                            }(subContexts[i], subContexts[i][prop]);
                        } else {
                            context[prop] = subContexts[i][prop];
                        }
                    }
                }

                return context;
            };
        },

        register: function (name, func) {
            if (this.order.indexOf(name) > -1) {
                return;
            }
            this.libs[name] = func;
            this.order.push(name);
        }
    };

    // Initialize with contexts loaded before
    if (window.quickAlgoLibrariesList) {
        for (let i = 0; i < window.quickAlgoLibrariesList.length; i++) {
            window.quickAlgoLibraries.register(window.quickAlgoLibrariesList[i][0], window.quickAlgoLibrariesList[i][1]);
        }
    }
}

export function createContext () {
    const curLevel = 'easy';
    const subTask = StringRotation;
    const levelGridInfos = extractLevelSpecific(subTask.gridInfos, curLevel);
    const display = true;

    let context;
    try {
        context = window.quickAlgoLibraries.getContext(display, levelGridInfos, curLevel);
    } catch (e) {
        context = {
            infos: {},
            reset: function () {
            },
        };
    }

    context.aceEditor = null;
    context.messagePrefixFailure = '';
    context.messagePrefixSuccess = '';
    context.linkBack = false;
    context.delayFactory = new DelayFactory();
    context.blocklyHelper = {
        updateSize: function () {
        },
    }
    context.reset(subTask.data[curLevel][0]);

    return context;
}

export function getAutocompletionParameters (context) {
    const curLevel = 'easy';
    const curIncludeBlocks = extractLevelSpecific(context.infos.includeBlocks, curLevel);

    return {
        includeBlocks: curIncludeBlocks,
        strings: context.strings,
        constants: context.customConstants,
    };
}

function taskUpdateContextReducer(state: AppStore, {payload: {context}}): void {
    state.task.context = context;
}

export default function (bundle: Bundle) {
    quickAlgoInit();

    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.task = {};
    });

    bundle.defineAction(ActionTypes.TaskLoad);

    bundle.defineAction(ActionTypes.TaskUpdateContext);
    bundle.addReducer(ActionTypes.TaskUpdateContext, taskUpdateContextReducer);

    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.TaskLoad, function* () {
            const context = createContext();
            yield put({type: ActionTypes.TaskUpdateContext, payload: {context}});
        });
    });
}
