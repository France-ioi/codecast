/*
    python_runner:
        Python code runner.
*/

import log from "loglevel";
import {Block, BlockType} from "../../task/blocks/blocks";
import AbstractRunner from "../abstract_runner";
import {StepperContext} from "../api";
import {StepperState} from "../index";

function definePythonNumber() {
    // Create a class which behaves as a Number, but can have extra properties
    const pythonNumber = function(val) {
        this.val = Number(val);
    };
    pythonNumber.prototype = Object.create(Number.prototype);

    function makePrototype(func) {
        return function() {
            return Number.prototype[func].call(this.val);
        }
    }

    let funcs = ['toExponential', 'toFixed', 'toLocaleString', 'toPrecision', 'toSource', 'toString', 'valueOf'];
    for (let i = 0; i < funcs.length; i++) {
        pythonNumber.prototype[funcs[i]] = makePrototype(funcs[i]);
    }

    return pythonNumber;
}

const PythonNumber = definePythonNumber();

export default class PythonRunner extends AbstractRunner {
    private context;
    public _debugger;
    public _code = '';
    private _editor_filename = "<stdin>";
    private _maxIterations = 4000;
    private _resetCallstackOnNextStep = false;
    private _paused = false;
    private _isRunning = false;
    private _stepInProgress = false;
    private stepMode = false;
    private _timeouts = [];
    private _editorMarker = null;
    private availableModules = [];
    private availableBlocks = [] as Block[];
    public _isFinished = false;
    private quickAlgoCallsExecutor;
    private _nbActions = 0;
    public hasCalledHandler = false;

    constructor(context) {
        super(context);
        this.context = context;
    }

    public static needsCompilation(): boolean {
        return true;
    }

    public enrichStepperContext(stepperContext: StepperContext, state: StepperState) {
        if (state.analysis) {
            stepperContext.state.lastAnalysis = Object.freeze(state.analysis);
        }
    }

    public isStuck(stepperState: StepperState): boolean {
        return stepperState.isFinished;
    }

    public async runNewStep(stepperContext: StepperContext, noInteractive = false) {
        log.getLogger('python_runner').debug('[Python runner] Run new step, no interactive = ', noInteractive);
        const result = await this.runStep(stepperContext.quickAlgoCallsExecutor, noInteractive);

        if (noInteractive && !this._isFinished) {
            return;
        }

        log.getLogger('python_runner').debug('FINAL INTERACT', result);
        stepperContext.makeDelay = true;
        await stepperContext.interactAfter({
            position: 0,
        });
        log.getLogger('python_runner').debug('AFTER FINAL INTERACT');
    }

    private static _skulptifyHandler(name, generatorName, blockName, nbArgs, type) {
        let handler = '';
        handler += "\tCodecast.runner.checkArgs('" + name + "', '" + generatorName + "', '" + blockName + "', arguments);";
        handler += "\tCodecast.runner.hasCalledHandler = true;";

        handler += "\n\tvar susp = new Sk.misceval.Suspension();";
        handler += "\n\tvar result = Sk.builtin.none.none$;";

        // If there are arguments, convert them from Skulpt format to the libs format
        handler += "\n\tvar args = Array.prototype.slice.call(arguments);";
        handler += "\n\tfor(var i=0; i<args.length; i++) { args[i] = Codecast.runner.skToJs(args[i]); };";

        handler += "\n\tsusp.resume = function() { return result; };";
        handler += "\n\tsusp.data = {type: 'Sk.promise', promise: new Promise(function(resolve) {";

        // Count actions
        if(type == 'actions') {
            handler += "\n\tCodecast.runner._nbActions += 1;";
        }

        handler += "\n\ttry {";
        handler += '\n\t\tconst result = Codecast.runner.quickAlgoCallsExecutor("' + generatorName + '", "' + blockName + '", args);';
        handler += '\n\t\tif (result instanceof Promise) {';
        handler += '\n\t\t\tresult.then(resolve).catch((e) => { Codecast.runner._onStepError(e) })';
        handler += '\n\t\t}';
        handler += "\n\t} catch (e) {";
        handler += "\n\t\tCodecast.runner._onStepError(e)}";
        handler += '\n\t}).then(function (value) {\nresult = value;\nreturn value;\n })};';
        handler += '\n\treturn susp;';

        return '\nmod.' + name + ' = new Sk.builtin.func(function () {\n' + handler + '\n});\n';
    }

    private _createBuiltin(name, generatorName, blockName, nbArgs, type) {
        const self = this;

        return function () {
            self.checkArgs(name, generatorName, blockName, arguments);
            self.hasCalledHandler = true;

            let susp = new Sk.misceval.Suspension();
            let result = Sk.builtin.none.none$;

            let args = Array.prototype.slice.call(arguments);

            susp.resume = function() { return result; };
            susp.data = {
                type: 'Sk.promise',
                promise: new Promise(function(resolve) {
                    // Count actions
                    if (type == 'actions') {
                        self._nbActions += 1;
                    }

                    try {
                        const result = self.quickAlgoCallsExecutor(generatorName, blockName, args);
                        if (result instanceof Promise) {
                            result.then(resolve).catch((e) => { self._onStepError(e) })
                        }
                    } catch (e) {
                        self._onStepError(e)
                    }
                }).then(function (value) {
                    result = value;
                    return value;
                })};

            return susp;
        }
    }

    private static _skulptifyConst(name, value) {
        let handler = '';
        if (typeof value === "number") {
            handler = 'Sk.builtin.int_(' + value + ');';
        } else if (typeof value === "boolean") {
            handler = 'Sk.builtin.bool(' + value.toString() + ');';
        } else if (typeof value === "string") {
            handler = 'Sk.builtin.str(' + JSON.stringify(value) + ');';
        } else {
            throw "Unable to translate value '" + value + "' into a Skulpt constant.";
        }

        return '\nmod.' + name + ' = new ' + handler + '\n';
    }

    private _injectFunctions() {
        // Generate Python custom libraries from all generated blocks
        log.getLogger('python_runner').debug('inject functions', this.availableBlocks);

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
            let modContents = "var $builtinmodule = function(name) {\n\nvar mod = {};\nmod.__package__ = Sk.builtin.none.none$;\n";

            for (let block of blocks.filter(block => block.type === BlockType.Function)) {
                const {code, generatorName, name, params, type} = block;
                modContents += PythonRunner._skulptifyHandler(code, generatorName, name, params, type);
                // We do want to override Python's naturel input and output to replace them with our own modules
                if (generatorName === 'printer' && ('input' === code || 'print' === code)) {
                    Sk.builtins[code] = this._createBuiltin(code, generatorName, name, params, type);
                }
            }

            for (let block of blocks.filter(block => block.type === BlockType.Constant)) {
                const {name, value} = block;
                modContents += PythonRunner._skulptifyConst(name, value);
            }

            modContents += "\nreturn mod;\n};";
            Sk.builtinFiles["files"]["src/lib/" + generatorName + ".js"] = modContents;
            this.availableModules.push(generatorName);
        }
    };

    checkArgs(name, generatorName, blockName, args) {
        let msg = '';

        // Check the number of arguments corresponds to a variant of the function
        const block = this.availableBlocks.find(block => generatorName === block.generatorName && blockName === block.name);
        if (!block) {
            console.error("Couldn't find the number of arguments for " + generatorName + "/" + blockName + ".");
            return;
        }
        let nbsArgs = block.params;
        if (nbsArgs.length === 0) {
            // This function doesn't have arguments
            if (args.length > 0) {
                msg = name + "() takes no arguments (" + args.length + " given)";
                throw new Sk.builtin.TypeError(msg);
            }
        } else if (nbsArgs.indexOf(args.length) === -1 && nbsArgs.indexOf(Infinity) === -1) {
            let minArgs = nbsArgs[0];
            let maxArgs = nbsArgs[0];
            for (let i = 1; i < nbsArgs.length; i++) {
                minArgs = Math.min(minArgs, nbsArgs[i]);
                maxArgs = Math.max(maxArgs, nbsArgs[i]);
            }

            if (minArgs === maxArgs) {
                msg = name + "() takes exactly " + minArgs + " arguments";
            } else if (args.length < minArgs) {
                msg = name + "() takes at least " + minArgs + " arguments";
            } else if (args.length > maxArgs) {
                msg = name + "() takes at most " + maxArgs + " arguments";
            } else {
                msg = name + "() doesn't have a variant accepting this number of arguments";
            }
            msg += " (" + args.length + " given)";

            throw new Sk.builtin.TypeError(msg);
        }
    }

    skToJs (val) {
        // Convert Skulpt item to JavaScript
        if (val instanceof Sk.builtin.bool) {
            return !!val.v;
        } else if (val instanceof Sk.builtin.func) {
            return () => {
                let args = [];
                for (let i = 0; i < arguments.length; i++) {
                    args.push(this._createPrimitive(arguments[i]));
                }

                return new Promise((resolve, reject) => {
                    Sk.misceval.asyncToPromise(() => {
                        return val.tp$call(args);
                    }).then((val) => {
                        resolve(this.skToJs(val));
                    });
                });
            }
        } else if (val instanceof Sk.builtin.dict) {
            let dictKeys = Object.keys(val);
            let retVal = {};
            for (let i = 0; i < dictKeys.length; i++) {
                let key = dictKeys[i];
                if (key == 'size' || key == '__class__') {
                    continue;
                }
                let subItems = val[key].items;
                for (let j = 0; j < subItems.length; j++) {
                    let subItem = subItems[j];

                    retVal[subItem.lhs.v] = this.skToJs(subItem.rhs);
                }
            }

            return retVal;
        } else {
            let retVal = val.v;
            if (val instanceof Sk.builtin.tuple || val instanceof Sk.builtin.list) {
                retVal = [];
                for (let i = 0; i < val.v.length; i++) {
                    retVal[i] = this.skToJs(val.v[i]);
                }
            }
            if (val instanceof Sk.builtin.tuple) {
                retVal.isTuple = true;
            }
            if (val instanceof Sk.builtin.float_) {
                retVal = new PythonNumber(retVal);
                retVal.isFloat = true;
            }

            return retVal;
        }
    };

    private _setTimeout(func, time) {
        let timeoutId = window.setTimeout(() => {
            let idx = this._timeouts.indexOf(timeoutId);
            if (idx > -1) {
                this._timeouts.splice(idx, 1);
            }

            func();
        }, time);

        this._timeouts.push(timeoutId);
    }

    waitDelay(callback, value, delay) {
        log.getLogger('python_runner').debug('WAIT DELAY', value, delay);
        this._paused = true;
        if (delay > 0) {
            let _noDelay = this.noDelay.bind(this, callback, value);
            this._setTimeout(_noDelay, delay);
        } else {
            this.noDelay(callback, value);
        }
    }

    waitCallback(callback) {
        // Returns a callback to be called once we can continue the execution
        log.getLogger('python_runner').debug('WAIT CALLBACK');
        this._paused = true;

        return (value) => {
            this.noDelay(callback, value);
        };
    }

    noDelay(callback, value) {
        log.getLogger('python_runner').debug('NO DELAY');
        let primitive = this._createPrimitive(value);
        if (primitive !== Sk.builtin.none.none$) {
            // Apparently when we create a new primitive, the debugger adds a call to
            // the callstack.
            this._resetCallstackOnNextStep = true;
            this.reportValue(value);
        }
        callback(primitive);
    }

    private _createPrimitive(data) {
        if (data === undefined || data === null) {
            return Sk.builtin.none.none$;  // Reuse the same object.
        }
        let type = typeof data;
        let result = {v: data}; // Emulate a Skulpt object as default
        if (type === 'number') {
            if (Math.floor(data) == data) { // isInteger isn't supported by IE
                result = new Sk.builtin.int_(data);
            } else {
                result = new Sk.builtin.float_(data);
            }
        } else if (type === 'string') {
            result = new Sk.builtin.str(data);
        } else if (type === 'boolean') {
            result = new Sk.builtin.bool(data);
        } else if (typeof data.length != 'undefined') {
            let skl = [];
            for (let i = 0; i < data.length; i++) {
                skl.push(this._createPrimitive(data[i]));
            }

            result = new Sk.builtin.list(skl);
        }
        return result;
    }

    private _configure() {
        Sk.configure({
            // output: this.print,
            inputfun: () => { log.getLogger('python_runner').debug('input should be overloaded by our input method'); },
            inputfunTakesPrompt: true,
            debugout: log.getLogger('python_runner').debug,
            read: PythonRunner._builtinRead,
            yieldLimit: null,
            execLimit: null,
            debugging: true,
            breakpoints: this._debugger.check_breakpoints.bind(this._debugger),
            __future__: Sk.python3
        });
        Sk.pre = 'edoutput';
        Sk.pre = 'codeoutput';

        // Disable document library
        delete Sk.builtinFiles['files']['src/lib/document.js'];

        this.context.callCallback = this.noDelay.bind(this);
    }

    print(message) {
        if (message.trim() === 'Program execution complete') {
            this._isFinished = true;
        }
    }

    private static _builtinRead(x) {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
            throw 'File not found: ' + x;
        }

        return Sk.builtinFiles["files"][x];
    }

    // Used in Skulpt
    public get_source_line(lineno) {
        return this._code.split('\n')[lineno];
    };

    _continue() {
        log.getLogger('python_runner').debug('make continue', this._paused, this._isRunning);
        if (this._steps >= this._maxIterations) {
            this._onStepError(window.languageStrings.tooManyIterations);
        }
    }

    public initCodes(codes, availableBlocks) {
        // For reportValue in Skulpt.
        window.currentPythonRunner = this;

        this._resetInterpreterState();

        if (Sk.running) {
            log.getLogger('python_runner').debug('running aleady');
            if (typeof Sk.runQueue === 'undefined') {
                Sk.runQueue = [];
            }
            Sk.runQueue.push({ctrl: this, codes: codes});

            return;
        }

        this.availableBlocks = availableBlocks;
        this._debugger = new Sk.Debugger(this._editor_filename, this);
        this._configure();
        this._injectFunctions();
        this._code = codes[0];
        this._setBreakpoint(1, false);

        if (typeof this.context.infos.maxIter !== 'undefined') {
            this._maxIterations = Math.ceil(this.context.infos.maxIter / 10);
        }

        try {
            let susp_handlers = {};
            susp_handlers['*'] = this._debugger.suspension_handler.bind(this);
            let promise = this._debugger.asyncToPromise(this._asyncCallback.bind(this), susp_handlers, this._debugger);
            promise.then((response) => {
                this._debugger.success.bind(this._debugger);
            }, (error) => {
                this._debugger.error.bind(this._debugger);

                this.context.onError(error + "\n");
            });
        } catch (e) {
            this.context.onError(e.toString() + "\n");
        }

        this._resetInterpreterState();

        Sk.running = true;
        this._isRunning = true;
    }

    runStep(quickAlgoCallsExecutor, noInteractive = false) {
        this.quickAlgoCallsExecutor = quickAlgoCallsExecutor;
        return new Promise((resolve, reject) => {
            this.stepMode = !noInteractive;
            if (this._isRunning && !this._stepInProgress) {
                this.step(resolve, reject);
            }
        }).then(() => {
            if (this.hasCalledHandler) {
                // Fix for Python: when Skulpt executes a custom handler it counts this as two execution steps.
                // Therefore we need to do one more execution step
                this.hasCalledHandler = false;
                this._steps--;

                return this.runStep(quickAlgoCallsExecutor);
            }
        })
    }

    reportValue(origValue, varName = null) {
        // Show a popup displaying the value of a block in step-by-step mode
        if (origValue === undefined
            || (origValue && origValue.constructor === Sk.builtin.func)
            || !this._editorMarker
            || !this.context.display
            || !this.stepMode) {
            return origValue;
        }

        return origValue;
    }

    stop() {
        for (let i = 0; i < this._timeouts.length; i += 1) {
            window.clearTimeout(this._timeouts[i]);
        }
        this._timeouts = [];

        if (Sk.runQueue) {
            for (let i = 0; i < Sk.runQueue.length; i++) {
                if (Sk.runQueue[i].ctrl === this) {
                    Sk.runQueue.splice(i, 1);
                    i--;
                }
            }
        }

        Sk.running = false;
        this._isRunning = false;
        this._resetCallstackOnNextStep = false;
        this._isFinished = true;
    }

    private _resetInterpreterState() {
        this._steps = 0;
        this._nbActions = 0;

        this._isRunning = false;
        this.stepMode = false;
        this._stepInProgress = false;
        this._resetCallstackOnNextStep = false;
        this._paused = false;
        Sk.running = false;
        if (Sk.runQueue && Sk.runQueue.length > 0) {
            let nextExec = Sk.runQueue.shift();
            setTimeout(function() {
                nextExec.ctrl.runCodes(nextExec.codes);
            }, 100);
        }

        this._isFinished = false;
    }

    private _resetCallstack() {
        if (this._resetCallstackOnNextStep) {
            this._resetCallstackOnNextStep = false;
            this._debugger.suspension_stack.pop();
        }
    }

    step(resolve, reject) {
        log.getLogger('python_runner').debug('continue step', resolve, reject);
        this._resetCallstack();
        this._stepInProgress = true;

        this.realStep(resolve, reject);
    }

    realStep(resolve, reject) {
        this._paused = this.stepMode;
        this._debugger.enable_step_mode();
        this._debugger.resume.call(this._debugger, resolve, reject);
        this._steps += 1;
    }

    // Used in Skulpt
    _onStepSuccess(callback) {
        // If there are still timeouts, there's still a step in progress
        this._stepInProgress = !!this._timeouts.length;
        this._continue();

        if (typeof callback === 'function') {
            callback();
        }
    }

    _onStepError(message, callback = null) {
        console.error(message);
        this.context.onExecutionEnd && this.context.onExecutionEnd();
        // We always get there, even on a success
        this.stop();

        message = '' + message;

        // Skulpt doesn't support well NoneTypes
        if (message.indexOf('TypeError: Cannot read property') > -1 && message.indexOf('undefined') > -1) {
            message = message.replace(/^.* line/, 'TypeError: NoneType value used in operation on line');
        }

        if (message.indexOf('undefined') > -1) {
            message += '. ' + window.languageStrings.undefinedMsg;
        }

        // Transform message depending on whether we successfully
        if (!this.context.success) {
            message = this.context.messagePrefixFailure + message;
            this.context.onError(message);
        }

        if (typeof callback === 'function') {
            callback();
        }
    }

    private _setBreakpoint(bp, isTemporary) {
        this._debugger.add_breakpoint(this._editor_filename + '.py', bp, '0', isTemporary);
    }

    private _asyncCallback() {
        return Sk.importMainWithBody(this._editor_filename, true, this._code, true);
    }

    /**
     * Checks whether the interpreter is synchronized with the analysis object.
     *
     * @param {object} analysis The analysis object.
     *
     * @return {boolean}
     */
    public isSynchronizedWithAnalysis(analysis) {
        // Must be at the same step number and have the same source code.

        const analysisStepNum = analysis.stepNum;
        const analysisCode = analysis.code;
        const currentPythonStepNum = this._steps;
        const currentPythonCode = this._code;
        log.getLogger('python_runner').debug('check sync analysis, runner = ', analysisStepNum, 'executer = ', currentPythonStepNum);

        return !(analysisStepNum !== currentPythonStepNum || analysisCode !== currentPythonCode);
    }
}
