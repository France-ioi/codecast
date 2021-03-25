import {takeEvery} from 'redux-saga/effects';
import {Bundle} from "../linker";
import {ActionTypes} from "./actionTypes";
import {DelayFactory} from "../utils/sleep";

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

export interface Subtask {
    gridInfos: any,
    data: any,
}

// Merges arrays by values
// (Flat-Copy only)
function mergeIntoArray(into, other) {
    for (let iOther in other) {
        let intoContains = false;

        for (let iInto in into) {
            if (other[iOther] == into[iInto]) {
                intoContains = true;
            }
        }

        if (!intoContains) {
            into.push(other[iOther]);
        }
    }
}

// Merges objects into each other similar to $.extend, but
// merges Arrays differently (see above)
// (Deep-Copy only)
function mergeIntoObject(into, other) {
    for (let property in other) {
        if (other[property] instanceof Array) {
            if (!(into[property] instanceof Array)) {
                into[property] = [];
            }
            mergeIntoArray(into[property], other[property]);
        }
        if (other[property] instanceof Object) {
            if (!(into[property] instanceof Object)) {
                into[property] = {};
            }
            mergeIntoObject(into[property], other[property]);
        }
        into[property] = other[property];
    }
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
                if (getContext) {
                    return getContext.apply(getContext, arguments);
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

export function extractLevelSpecific(item, level) {
    if ((typeof item != "object")) {
        return item;
    }
    if (Array.isArray(item)) {
        return item.map((val) => {
            return extractLevelSpecific(val, level);
        });
    }
    if (item.shared === undefined) {
        if (item[level] === undefined) {
            let newItem = {};
            for (let prop in item) {
                newItem[prop] = extractLevelSpecific(item[prop], level);
            }
            return newItem;
        }
        return extractLevelSpecific(item[level], level);
    }
    if (Array.isArray(item.shared)) {
        let newItem = [];
        for (let iElem = 0; iElem < item.shared.length; iElem++) {
            newItem.push(extractLevelSpecific(item.shared[iElem], level));
        }
        if (item[level] != undefined) {
            if (!Array.isArray(item[level])) {
                console.error("Incompatible types when merging shared and " + level);
            }
            for (let iElem = 0; iElem < item[level].length; iElem++) {
                newItem.push(extractLevelSpecific(item[level][iElem], level));
            }
        }
        return newItem;
    }
    if (typeof item.shared == "object") {
        let newItem = {};
        for (let prop in item.shared) {
            newItem[prop] = extractLevelSpecific(item.shared[prop], level);
        }
        if (item[level] != undefined) {
            if (typeof item[level] != "object") {
                console.error("Incompatible types when merging shared and " + level);
            }
            for (let prop in item[level]) {
                newItem[prop] = extractLevelSpecific(item[level][prop], level);
            }
        }
        return newItem;
    }
    console.error("Invalid type for shared property");
}

export function getRunningContext () {
    // Feature data beyond
    const subTask = {
        gridInfos: {
            hideSaveOrLoad: true,
            conceptViewer: true,
            actionDelay: 200,
            maxIterWithoutAction: 5000,
            includeBlocks: {
                groupByCategory: false  ,
                generatedBlocks: {
                    printer: ["print","read"]
                },
                standardBlocks: {
                    includeAll: false,
                    wholeCategories: {
                        easy: ["variables"],
                        medium: ["variables"],
                        hard: ["variables"]
                    },
                    singleBlocks: ["text", "logic_compare", "controls_if_else","controls_repeat","lists_repeat", "lists_getIndex", "lists_setIndex","text_length","text_join","text_charAt"]
                },
                variables: {
                },
                pythonAdditionalFunctions: ["len"]
            },
            maxInstructions: {easy:40, medium:40, hard: 100},
            checkEndEveryTurn: false,
            checkEndCondition: function(context, lastTurn) {
                if (!lastTurn) return;

                // throws, if something is wrong …
                context.checkOutputHelper();

                // Seems like everything is okay: Right number of lines and all lines match …
                context.success = true;
                throw(window.languageStrings.messages.outputCorrect);
            },
            computeGrade: function(context, message) {
                var rate = 0;
                if (context.success) {
                    rate = 1;
                    if (context.nbMoves > 100) {
                        rate /= 2;
                        message += languageStrings.messages.moreThan100Moves;
                    }
                }
                return {
                    successRate: rate,
                    message: message
                };
            }
        },
        data: {
            easy: [
                {
                    input: "grecon\nenghar\nennejuli\nlanmer\nbottur\nonth\nnettesaumo\neuli\nroiebaud\nvevi\n",
                    output: "congre\nhareng\njulienne\nmerlan\nturbot\nthon\nsaumonette\nlieu\nbaudroie\nvive\n"
                }
            ],
            medium: [
                {
                    input: "ndeama\norneaubig\notbul\nuecoq\nteaucou\nsinour\nourdepal\nonclepét\nirepra\nlinetel\n",
                    output: "amande\nbigorneau\nbulot\ncoque\ncouteau\noursin\npalourde\npétoncle\npraire\ntelline\n"
                }
            ],
            hard: [
                {
                    input: "néegraia\nleaigc\ntteerevc\nssesicrevé\nesbrac\nasbamg\nstesuangol\neautourt\ntinessangoul\nlesltrié\n",
                    output: "araignée\ncigale\ncrevette\nécrevisses\ncrabes\ngambas\nlangoustes\ntourteau\nlangoustines\nétrilles\n"
                }
            ],
        }
    };

    const curLevel = 'easy';
    const levelGridInfos = extractLevelSpecific(subTask.gridInfos, curLevel);
    const display = true;

    let context = window.quickAlgoLibraries.getContext(display, levelGridInfos, curLevel);
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

function* taskLoadSaga() {
    quickAlgoInit();
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.TaskLoad, taskLoadSaga);
    });
}
