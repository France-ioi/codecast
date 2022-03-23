import AbstractRunner from "../abstract_runner";
import {Stepper, StepperState} from "../index";
import {StepperContext} from "../api";
import {Block, BlockType} from "../../task/blocks/blocks";
import {Codecast} from "../../index";

export default class BlocklyRunner extends AbstractRunner {
    private context;
    private interpreters = [];
    private isRunningInterpreter = [];
    private toStopInterpreter = [];
    private interpreterEnded = [];
    private availableBlocks = [] as Block[];
    private executeQuickAlgoLibraryCall;
    private executeOnResolve;

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
    private nextCallback;

    // TODO: use our own translation system?
    private strings;

    // First highlightBlock of this run
    private firstHighlight = true;
    public _isFinished: boolean = false;

    constructor(context, languageStrings) {
        super();
        this.context = context;
        this.strings = languageStrings;
        this.scratchMode = context.blocklyHelper ? context.blocklyHelper.scratchMode : false;
        this.delayFactory = new window.DelayFactory();
    }

    public static needsCompilation(): boolean {
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
        console.log('report block value', id, value, varName);
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
        console.log('Call no delay with values', callback, value);
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
                // this.runSyncBlock();
            }, delay);
        } else {
            console.log('callback primitive', primitive);
            this.stackCount += 1;
            callback(primitive);
            // this.runSyncBlock();
        }
    };

    initInterpreter(interpreter, scope) {
        const self = this;

        // Wrapper for async functions
        let createAsync = (func) => {
            return function () {
                let args = [];
                for(let i=0; i < arguments.length-1; i++) {
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

        let makeHandler = (code, generatorName, blockName, category) => {
            // For commands belonging to the "actions" category, we count the
            // number of actions to put a limit on steps without actions
            return function () {
                console.log('elements', arguments);
                if ('actions' === category) {
                    self.nbActions += 1;
                }

                let args = [...arguments].slice(0, arguments.length - 1);
                let resolve = arguments[arguments.length - 1];

                try {
                    console.log('start quickalgo call', generatorName, blockName, args);
                    const result = self.executeQuickAlgoLibraryCall(generatorName, blockName, args, (res) => {
                        console.log('after execution', res);
                        resolve(res);
                    });
                    console.log('the result', result);
                    if (result instanceof Promise) result.catch((e) => { Codecast.runner.onError(e) });

                    return result;
                } catch (e) {
                    window.currentPythonContext.runner._onStepError(e)
                }
            };
        };

        let blocksByGeneratorName: {[generatorName: string]: Block[]} = {};
        for (let block of this.availableBlocks) {
            if (block.generatorName) {
                if (!(block.generatorName in blocksByGeneratorName)) {
                    blocksByGeneratorName[block.generatorName] = [];
                }
                blocksByGeneratorName[block.generatorName].push(block);
            }
        }

        for (let [generatorName, blocks] of Object.entries(blocksByGeneratorName)) {
            for (let block of blocks.filter(block => block.type === BlockType.Function)) {
                const {code, generatorName, name, category, type} = block;
                let handler;
                if (category === 'actions') {
                    this.hasActions = true;
                }

                handler = makeHandler(code, generatorName, name, category);
                interpreter.setProperty(scope, code, interpreter.createAsyncFunction(createAsync(handler)));
            }
        }

        let makeNative = (func) => {
            return function() {
                let value = func.apply(func, arguments);
                let primitive = undefined;
                if (value != undefined) {
                    if(typeof value.length != 'undefined') {
                        // It's an array, create a primitive out of it
                        primitive = self.interpreters[self.context.curNode].nativeToPseudo(value);
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

        interpreter.setProperty(scope, "program_end", interpreter.createAsyncFunction(createAsync((callback) => {
            this.program_end(callback);
        })));

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
                // this.runSyncBlock();
            } else {
                // Interrupt here for step mode, allows to stop before each
                // instruction
                console.log('highlight, stop here');
                this.nextCallback = callback;
                if (this.executeOnResolve) {
                    console.log('do execute on resolve');
                    this.executeOnResolve();
                }
                this.stepInProgress = false;
            }
        }

        // Add an API function for highlighting blocks.
        interpreter.setProperty(scope, 'highlightBlock', interpreter.createAsyncFunction(createAsync(highlightBlock)));

        // Add an API function to report a value.
        interpreter.setProperty(scope, 'reportBlockValue', interpreter.createNativeFunction((id, value, varName) => {
            return this.reportBlockValue(id, value, varName);
        }));
    };

    program_end(callback) {
        this._isFinished = true;
        console.log('program end, is finished = true');
        let curNode = this.context.curNode;
        if(!this.context.programEnded[curNode]) {
            this.context.programEnded[curNode] = true;
            if(this.context.programEnded.indexOf(false) == -1) {
                this.context.infos.checkEndCondition(this.context, true);
            }
        }
        this.noDelay(callback);
    };

    public isStuck(stepperState: StepperState): boolean {
        console.log('check is stuck', stepperState.isFinished);
        return stepperState.isFinished;
    }

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

    runSyncBlock(reject) {
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
                    console.log('interpreter not running');
                    this.isRunningInterpreter[iInterpreter] = false;
                    return;
                }
                if (interpreter.paused_) {
                    console.log('interpreter paused');
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
            }

            console.log('end run sync block');
        } catch (e: any) {
            console.error(e);
            console.log('error during run');
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
            console.log('call reject', message);
            this.executeOnResolve = null;
            this._isFinished = true;
            reject(message);
        }
    };

    initCodes(codes, availableBlocks) {
        this.delayFactory.destroyAll();
        this.interpreters = [];
        this.nbNodes = codes.length;
        this.availableBlocks = availableBlocks;
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
        this.context.callCallback = this.noDelay.bind(this);
        this._isFinished = false;
        // this.reset(true);
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

    continueExecution(resolve, reject) {
        console.log('continue execution', this.nextCallback, this.executeOnResolve)
        if (!this.nextCallback && this.executeOnResolve) {
            console.log('interpreter paused, continue');
            setTimeout(() => {
                console.log('start new round');
                this.runSyncBlock(reject);
                this.continueExecution(resolve, reject);
            });
        }
    }

    step(executeQuickAlgoLibraryCall) {
        return new Promise<void>((resolve, reject) => {
            this.stepMode = true;
            this.executeQuickAlgoLibraryCall = executeQuickAlgoLibraryCall;
            this.executeOnResolve = resolve;
            console.log('step in progress', this.stepInProgress);
            if (this.stepInProgress) {
                resolve();
                return;
            } else {
                if (this.interpreters.length == 1) {
                    this.interpreters[0].paused_ = false;
                }

                this.runSyncBlock(reject);
                console.log('after first run sync');
                this.continueExecution(resolve, reject);
            }
        }).finally(() => {
            console.log('make finally');
            this.executeOnResolve = null;
        })
    };

    public async runNewStep(stepperContext: StepperContext) {
        console.log('init new step');
        await this.step(stepperContext.quickAlgoCallsExecutor);
        console.log('end new step');

        stepperContext.makeDelay = true;
        await stepperContext.interactAfter({
            position: 0,
        });
        console.log('AFTER FINAL INTERACT');
    }
}
