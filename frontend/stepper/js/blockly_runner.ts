import AbstractRunner from "../abstract_runner";
import {Stepper} from "../index";
import {StepperContext} from "../api";

export default class BlocklyRunner extends AbstractRunner {
    private context;
    private interpreters = [];
    private isRunningInterpreter = [];
    private toStopInterpreter = [];
    private interpreterEnded = [];

    private hasActions = false;
    private nbActions = 0;
    private scratchMode = false;
    private delayFactory
    private resetDone = false;
    private oneStepDone = false;

    // Node status
    private nbNodes = 1;
    private curNode = 0;
    private nodesReady = [];
    private waitingOnReadyNode = false;

    // Iteration limits
    private maxIter = 400000;
    private maxIterWithoutAction = 500;
    private allowStepsWithoutDelay = 0;

    // Counts the call stack depth to know when to reset it
    private stackCount = 0;
    private stackResetting = false;

    // During step-by-step mode
    private stepInProgress = false;
    private stepMode = false;
    private messageCallback;
    private nextCallback;

    // TODO: use our own translation system?
    private strings;

    // First highlightBlock of this run
    private firstHighlight = true;

    constructor(context, messageCallback, languageStrings) {
        super();
        this.context = context;
        this.strings = languageStrings;
        this.messageCallback = messageCallback;
        this.scratchMode = context.blocklyHelper ? context.blocklyHelper.scratchMode : false;
        this.delayFactory = new window.DelayFactory();
    }

    public needsCompilation(): boolean {
        return false;
    }

    private valueToString(value) {
        if(this.interpreters.length == 0) {
            return value.toString(); // We "need" an interpreter to access ARRAY prototype
        }
        let itp = this.interpreters[0];
        if(itp.isa(value, itp.ARRAY)) {
            let strs = [];
            for(let i = 0; i < value.properties.length; i++) {
                strs[i] = this.valueToString(value.properties[i]);
            }
            return '['+strs.join(', ')+']';
        } else if(value && value.toString) {
            return value.toString();
        } else {
            return "" + value;
        }
    };

    reportBlockValue(id, value, varName) {
        // Show a popup displaying the value of a block in step-by-step mode
        if (this.context.display && this.stepMode) {
            let displayStr = this.valueToString(value);
            if(value && value.type == 'boolean') {
                displayStr = value.data ? this.strings.valueTrue : this.strings.valueFalse;
            }
            if(varName == '@@LOOP_ITERATION@@') {
                displayStr = this.strings.loopIteration + ' ' + displayStr;
            } else if(varName) {
                varName = varName.toString();
                // Get the original variable name
                for(let dbIdx in window.Blockly.JavaScript.variableDB_.db_) {
                    if(window.Blockly.JavaScript.variableDB_.db_[dbIdx] == varName) {
                        varName = dbIdx.substring(0, dbIdx.length - 9);
                        // Get the variable name with the right case
                        for(let i=0; i<this.context.blocklyHelper.workspace.variableList.length; i++) {
                            let varNameCase = this.context.blocklyHelper.workspace.variableList[i];
                            if(varName.toLowerCase() == varNameCase.toLowerCase()) {
                                varName = varNameCase;
                                break;
                            }
                        }
                        break;
                    }
                }
                displayStr = varName + ' = ' + displayStr;
            }
            this.context.blocklyHelper.workspace.reportValue(id, displayStr);
        }
        return value;
    };

    waitDelay(callback, value, delay) {
        if (delay > 0) {
            this.stackCount = 0;
            this.delayFactory.createTimeout("wait" + this.context.curNode + "_" + Math.random(), () => {
                    this.noDelay(callback, value);
                },
                delay
            );
            this.allowStepsWithoutDelay = Math.min(this.allowStepsWithoutDelay + Math.ceil(delay/10), 100);
        } else {
            this.noDelay(callback, value);
        }
    };

    waitEvent(callback, target, eventName, func) {
        this.stackCount = 0;
        let listenerFunc = null;
        listenerFunc = (e) => {
            target.removeEventListener(eventName, listenerFunc);
            this.noDelay(callback, func(e));
        };
        target.addEventListener(eventName, listenerFunc);
    };

    waitCallback(callback) {
        // Returns a callback to be called once we can continue the execution
        //this.stackCount = 0;
        return (value) => {
            this.noDelay(callback, value);
        }
    };

    noDelay(callback, value = null) {
        let primitive = undefined;
        if (value !== undefined) {
            if(value && (typeof value.length != 'undefined' ||
                typeof value === 'object')) {
                // It's an array, create a primitive out of it
                primitive = this.interpreters[this.context.curNode].nativeToPseudo(value);
            } else {
                primitive = value;
            }
        }
        let infiniteLoopDelay = false;
        if(this.context.allowInfiniteLoop) {
            if(this.allowStepsWithoutDelay > 0) {
                this.allowStepsWithoutDelay -= 1;
            } else {
                infiniteLoopDelay = true;
            }
        }
        if(this.stackCount > 100 || (infiniteLoopDelay && this.stackCount > 5)) {
            // In case of an infinite loop, add some delay to slow down a bit
            let delay = infiniteLoopDelay ? 50 : 0;

            this.stackCount = 0;
            this.stackResetting = true;
            this.delayFactory.createTimeout("wait_" + Math.random(), () => {
                this.stackResetting = false;
                callback(primitive);
                this.runSyncBlock();
            }, delay);
        } else {
            this.stackCount += 1;
            callback(primitive);
            this.runSyncBlock();
        }
    };

    allowSwitch(callback) {
        // Tells the runner that we can switch the execution to another node
        let curNode = this.context.curNode;
        let ready = (readyCallback) => {
            if(!this.isRunning()) { return; }
            if(this.waitingOnReadyNode) {
                this.curNode = curNode;
                this.waitingOnReadyNode = false;
                this.context.setCurNode(curNode);
                readyCallback(callback);
            } else {
                this.nodesReady[curNode] = function() {
                    readyCallback(callback);
                };
            }
        };
        this.nodesReady[curNode] = false;
        this.startNextNode(curNode);
        return ready;
    };

    selectNextNode(runner, previousNode) {
        let i = previousNode + 1;
        if(i >= this.nbNodes) { i = 0; }
        while(i != previousNode) {
            if(this.nodesReady[i]) {
                break;
            } else {
                i++;
            }
            if(i >= this.nbNodes) { i = 0; }
        }
        return i;
    };


    startNextNode(curNode) {
        // Start the next node when one has been switched from
        let newNode = this.selectNextNode(this, curNode);
        let setWaiting = () => {
            for(let i = 0; i < this.nodesReady.length ; i++) {
                if(!this.context.programEnded[i]) {
                    // TODO :: Timeout?
                    this.waitingOnReadyNode = true;
                    return;
                }
            }
            // All nodes finished their program
            // TODO :: better message
            if(this.nodesReady.length > 1) {
                throw "all nodes finished (blockly_runner)";
            }
        }
        if(newNode == curNode) {
            // No ready node
            setWaiting();
        } else {
            this.curNode = newNode;
            let ready = this.nodesReady[newNode];
            if(ready) {
                this.context.setCurNode(newNode);
                this.nodesReady[newNode] = false;
                if(typeof ready == 'function') {
                    ready();
                } else {
                    this.runSyncBlock();
                }
            } else {
                setWaiting();
            }
        }
    };

    initInterpreter(interpreter, scope) {
        console.log('init interpreter', this);
        // Wrapper for async functions
        let createAsync = (func) => {
            return () => {
                let args = [];
                for(let i=0; i < arguments.length-1; i++) {
                    // TODO :: Maybe JS-Interpreter has a better way of knowing?
                    if(typeof arguments[i] != 'undefined' && arguments[i].isObject) {
                        args.push(interpreter.pseudoToNative(arguments[i]));
                    } else {
                        args.push(arguments[i]);
                    }
                }
                args.push(arguments[arguments.length-1]);
                func.apply(func, args);
            };
        };

        let makeHandler = (runner, handler) => {
            // For commands belonging to the "actions" category, we count the
            // number of actions to put a limit on steps without actions
            return () => {
                this.nbActions += 1;
                handler.apply(this, arguments);
            };
        };

        for (let objectName in this.context.customBlocks) {
            for (let category in this.context.customBlocks[objectName]) {
                for (let iBlock in this.context.customBlocks[objectName][category]) {
                    let blockInfo = this.context.customBlocks[objectName][category][iBlock];
                    let code = this.context.strings.code[blockInfo.name];
                    if (typeof(code) == "undefined") {
                        code = blockInfo.name;
                    }

                    let handler;
                    if(category == 'actions') {
                        this.hasActions = true;
                        handler = makeHandler(this, blockInfo.handler);
                    } else {
                        handler = blockInfo.handler;
                    }

                    interpreter.setProperty(scope, code, interpreter.createAsyncFunction(createAsync(handler)));
                }
            }
        }

        let makeNative = (func) => {
            return () => {
                let value = func.apply(func, arguments);
                let primitive = undefined;
                if (value != undefined) {
                    if(typeof value.length != 'undefined') {
                        // It's an array, create a primitive out of it
                        primitive = this.interpreters[this.context.curNode].nativeToPseudo(value);
                    } else {
                        primitive = value;
                    }
                }
                return primitive;
            };
        }

        if(window.Blockly.JavaScript.externalFunctions) {
            for(let name in window.Blockly.JavaScript.externalFunctions) {
                interpreter.setProperty(scope, name, interpreter.createNativeFunction(makeNative(window.Blockly.JavaScript.externalFunctions[name])));
            }
        }

        /*for (let objectName in context.generators) {
           for (let iGen = 0; iGen < context.generators[objectName].length; iGen++) {
              let generator = context.generators[objectName][iGen];
              interpreter.setProperty(scope, objectName + "_" + generator.labelEn, interpreter.createAsyncFunction(generator.fct));
           }
        }*/
        interpreter.setProperty(scope, "program_end", interpreter.createAsyncFunction(createAsync(this.program_end)));

        let highlightBlock = (id, callback) => {
            id = id ? id.toString() : '';

            if (this.context.display) {
                try {
                    if (this.context.infos && !this.context.infos.actionDelay) {
                        id = null;
                    }
                    this.context.blocklyHelper.highlightBlock(id);
                } catch(e) {}
            }

            // We always execute directly the first highlightBlock
            if(this.firstHighlight || !this.stepMode) {
                this.firstHighlight = false;
                callback();
                this.runSyncBlock();
            } else {
                // Interrupt here for step mode, allows to stop before each
                // instruction
                this.nextCallback = callback;
                this.stepInProgress = false;
            }
        }

        // Add an API function for highlighting blocks.
        interpreter.setProperty(scope, 'highlightBlock', interpreter.createAsyncFunction(createAsync(highlightBlock)));

        // Add an API function to report a value.
        interpreter.setProperty(scope, 'reportBlockValue', interpreter.createNativeFunction(this.reportBlockValue));

    };

    program_end(callback) {
        let curNode = this.context.curNode;
        if(!this.context.programEnded[curNode]) {
            this.context.programEnded[curNode] = true;
            if(this.context.programEnded.indexOf(false) == -1) {
                this.context.infos.checkEndCondition(this.context, true);
            }
        }
        this.noDelay(callback);
    };

    stop(aboutToPlay) {
        for (let iInterpreter = 0; iInterpreter < this.interpreters.length; iInterpreter++) {
            if (this.isRunningInterpreter[iInterpreter]) {
                this.toStopInterpreter[iInterpreter] = true;
                this.isRunningInterpreter[iInterpreter] = false;
            }
        }

        if(this.scratchMode) {
            window.Blockly.DropDownDiv.hide();
            this.context.blocklyHelper.highlightBlock(null);
        }

        if(!aboutToPlay && window.quickAlgoInterface) {
            window.quickAlgoInterface.setPlayPause(false);
        }

        this.nbActions = 0;
        this.stepInProgress = false;
        this.stepMode = false;
        this.firstHighlight = true;
    };

    runSyncBlock() {
        this.resetDone = false;
        this.stepInProgress = true;
        this.oneStepDone = false;
        // Handle the callback from last highlightBlock
        if(this.nextCallback) {
            this.nextCallback();
            this.nextCallback = null;
        }

        try {
            if(this.stepMode && this.oneStepDone) {
                this.stepInProgress = false;
                return;
            }
            let iInterpreter = this.curNode;
            this.context.setCurNode(iInterpreter);
            if (this.context.infos.checkEndEveryTurn) {
                this.context.infos.checkEndCondition(this.context, false);
            }
            let interpreter = this.interpreters[iInterpreter];
            let wasPaused = interpreter.paused_;
            while(!this.context.programEnded[iInterpreter]) {
                if(!this.context.allowInfiniteLoop &&
                    (this.context.curSteps[iInterpreter].total >= this.maxIter || this.context.curSteps[iInterpreter].withoutAction >= this.maxIterWithoutAction)) {
                    break;
                }
                if (!interpreter.step() || this.toStopInterpreter[iInterpreter]) {
                    this.isRunningInterpreter[iInterpreter] = false;
                    return;
                }
                if (interpreter.paused_) {
                    this.oneStepDone = !wasPaused;
                    return;
                }
                this.context.curSteps[iInterpreter].total++;
                if(this.context.curSteps[iInterpreter].lastNbMoves != this.nbActions) {
                    this.context.curSteps[iInterpreter].lastNbMoves = this.nbActions;
                    this.context.curSteps[iInterpreter].withoutAction = 0;
                } else {
                    this.context.curSteps[iInterpreter].withoutAction++;
                }
            }

            if (!this.context.programEnded[iInterpreter] && !this.context.allowInfiniteLoop) {
                if (this.context.curSteps[iInterpreter].total >= this.maxIter) {
                    this.isRunningInterpreter[iInterpreter] = false;
                    throw this.context.blocklyHelper.strings.tooManyIterations;
                } else if(this.context.curSteps[iInterpreter].withoutAction >= this.maxIterWithoutAction) {
                    this.isRunningInterpreter[iInterpreter] = false;
                    throw this.context.blocklyHelper.strings.tooManyIterationsWithoutAction;
                }
            }

            if(this.context.programEnded[iInterpreter] && !this.interpreterEnded[iInterpreter]) {
                this.interpreterEnded[iInterpreter] = true;
                this.startNextNode(iInterpreter);
            }
        } catch (e: any) {
            console.error(e);
            this.context.onExecutionEnd && this.context.onExecutionEnd();
            this.stepInProgress = false;

            for (let iInterpreter = 0; iInterpreter < this.interpreters.length; iInterpreter++) {
                this.isRunningInterpreter[iInterpreter] = false;
                this.context.programEnded[iInterpreter] = true;
            }

            let message = e.message || e.toString();

            // Translate "Unknown identifier" message
            if(message.substring(0, 20) == "Unknown identifier: ") {
                let varName = message.substring(20);
                // Get original variable name if possible
                for(let dbIdx in window.Blockly.JavaScript.variableDB_.db_) {
                    if(window.Blockly.JavaScript.variableDB_.db_[dbIdx] == varName) {
                        varName = dbIdx.substring(0, dbIdx.length - 9);
                        break;
                    }
                }
                message = this.strings.uninitializedlet + ' ' + varName;
            }

            if(message.indexOf('undefined') != -1) {
                console.error(e)
                message += '. ' + this.strings.undefinedMsg;
            }

            if ((this.context.nbTestCases != undefined) && (this.context.nbTestCases > 1)) {
                if (this.context.success) {
                    message = this.context.messagePrefixSuccess + message;
                } else {
                    message = this.context.messagePrefixFailure + message;
                }
            }
            if (this.context.success) {
                message = "<span style='color:green;font-weight:bold'>" + message + "</span>";
                if (this.context.linkBack) {
                    //message += "<br/><span onclick='window.parent.backToList()' style='font-weight:bold;cursor:pointer;text-decoration:underline;color:blue'>Retour à la liste des questions</span>";
                }
            }
            this.delayFactory.destroyAll();
            if(window.quickAlgoInterface) {
                window.quickAlgoInterface.setPlayPause(false);
            }
            setTimeout(() => {
                this.messageCallback(message);
            }, 0);
        }
    };

    initCodes(codes) {
        this.delayFactory.destroyAll();
        this.interpreters = [];
        this.nbNodes = codes.length;
        this.curNode = 0;
        this.nodesReady = [];
        this.waitingOnReadyNode = false;
        this.nbActions = 0;
        this.stepInProgress = false;
        this.stepMode = false;
        this.allowStepsWithoutDelay = 0;
        this.firstHighlight = true;
        this.stackCount = 0;
        this.context.programEnded = [];
        this.interpreterEnded = [];
        this.context.curSteps = [];
        this.reset(true);
        for (let iInterpreter = 0; iInterpreter < codes.length; iInterpreter++) {
            this.context.curSteps[iInterpreter] = {
                total: 0,
                withoutAction: 0,
                lastNbMoves: 0
            };
            this.context.programEnded[iInterpreter] = false;
            this.interpreterEnded[iInterpreter] = false;

            this.interpreters.push(new window.Interpreter(codes[iInterpreter], (interpreter, scope) => {
                this.initInterpreter(interpreter, scope);
            }));
            this.nodesReady.push(true);
            this.isRunningInterpreter[iInterpreter] = true;
            this.toStopInterpreter[iInterpreter] = false;

            if(iInterpreter > 0) {
                // This is a fix for pseudoToNative identity comparisons (===),
                // as without that fix, pseudo-objects coming from another
                // interpreter would not get recognized to the right type.
                this.interpreters[iInterpreter].ARRAY = this.interpreters[0].ARRAY;
                this.interpreters[iInterpreter].ARRAY_PROTO = this.interpreters[0].ARRAY_PROTO;
                this.interpreters[iInterpreter].REGEXP = this.interpreters[0].REGEXP;
            }
        }
        this.maxIter = 400000;
        if (this.context.infos.maxIter != undefined) {
            this.maxIter = this.context.infos.maxIter;
        }
        if(this.hasActions) {
            this.maxIterWithoutAction = 500;
            if (this.context.infos.maxIterWithoutAction != undefined) {
                this.maxIterWithoutAction = this.context.infos.maxIterWithoutAction;
            }
        } else {
            // If there's no actions in the current task, "disable" the limit
            this.maxIterWithoutAction = this.maxIter;
        }
    };

    runCodes(codes) {
        if(!codes || !codes.length) { return; }
        this.initCodes(codes);
        this.runSyncBlock();
    };

    run() {
        this.stepMode = false;
        if(!this.stepInProgress) {
            // XXX :: left to avoid breaking tasks in case I'm wrong, but we
            // should be able to remove this code (it breaks multi-interpreter
            // step-by-step)
            if(this.interpreters.length == 1) {
                this.interpreters[0].paused_ = false;
            }
            this.runSyncBlock();
        }
    };

    step() {
        this.stepMode = true;
        if(!this.stepInProgress) {
            // XXX :: left to avoid breaking tasks in case I'm wrong, but we
            // should be able to remove this code (it breaks multi-interpreter
            // step-by-step)
            if(this.interpreters.length == 1) {
                this.interpreters[0].paused_ = false;
            }
            this.runSyncBlock();
        }
    };

    public async runNewStep(stepperContext: StepperContext) {
        const result = this.step();

        console.log('FINAL INTERACT', result);
        stepperContext.makeDelay = true;
        await stepperContext.interactAfter({
            position: 0,
        });
        console.log('AFTER FINAL INTERACT');
    }

    nbRunning() {
        let nbRunning = 0;
        for (let iInterpreter = 0; iInterpreter < this.interpreters.length; iInterpreter++) {
            if (this.isRunningInterpreter[iInterpreter]) {
                nbRunning++;
            }
        }
        return nbRunning;
    };

    isRunning() {
        return this.nbRunning() > 0;
    };

    reset(aboutToPlay) {
        if(this.resetDone) { return; }
        this.context.reset();
        this.stop(aboutToPlay);
        this.resetDone = true;
    };

    signalAction() {
        // Allows contexts to signal an "action" happened
        for (let iInterpreter = 0; iInterpreter < this.interpreters.length; iInterpreter++) {
            this.context.curSteps[iInterpreter].withoutAction = 0;
        }
    };
}


// context.runner = runner;
// context.callCallback = this.noDelay;
// context.programEnded = [];