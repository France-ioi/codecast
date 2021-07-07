/*
    python_runner:
        Python code runner.
*/

if (!window.hasOwnProperty('currentPythonContext')) {
    window.currentPythonContext = null;
}
if (!window.hasOwnProperty('currentPythonRunner')) {
    window.currentPythonRunner = null;
}

export default function(context) {
    this.context = context;
    this._code = '';
    this._editor_filename = "<stdin>";
    this.context.runner = this;
    this._maxIterations = 4000;
    this._resetCallstackOnNextStep = false;
    this._paused = false;
    this._isRunning = false;
    this._stepInProgress = false;
    this.stepMode = false;
    this._steps = 0;
    this._timeouts = [];
    this._editorMarker = null;
    this.availableModules = [];
    this._argumentsByBlock = {};
    this._definedFunctions = [];
    this._isFinished = false;
    this._printedDuringStep = '';
    this._inputPos = 0;
    this._futureInputValue = null;
    this._synchronizingAnalysis = false;
    this.onInput = context.onInput;
    this.onError = context.onError;
    this.onSuccess = context.onSuccess;

    var that = this;

    this._skulptifyHandler = function (name, generatorName, blockName, nbArgs, type) {
        if(-1 === this._definedFunctions.indexOf(name)) { this._definedFunctions.push(name); }

        var handler = '';
        handler += "\tcurrentPythonContext.runner.checkArgs('" + name + "', '" + generatorName + "', '" + blockName + "', arguments);";

        handler += "\n\tvar susp = new Sk.misceval.Suspension();";
        handler += "\n\tvar result = Sk.builtin.none.none$;";

        // If there are arguments, convert them from Skulpt format to the libs format
        handler += "\n\tvar args = Array.prototype.slice.call(arguments);";
        handler += "\n\tfor(var i=0; i<args.length; i++) { args[i] = currentPythonContext.runner.skToJs(args[i]); };";

        handler += "\n\tsusp.resume = function() { return result; };";
        handler += "\n\tsusp.data = {type: 'Sk.promise', promise: new Promise(function(resolve) {";
        handler += "\n\targs.push(resolve);";

        // Count actions
        if(type == 'actions') {
            handler += "\n\tcurrentPythonContext.runner._nbActions += 1;";
        }

        handler += "\n\ttry {";
        handler += '\n\t\tconst result = currentPythonContext["' + generatorName + '"]["' + blockName + '"].apply(currentPythonContext, args);';
        handler += '\n\t\tif (result instanceof Promise) result.catch((e) => { currentPythonContext.runner._onStepError(e) })';
        handler += "\n\t} catch (e) {";
        handler += "\n\t\tcurrentPythonContext.runner._onStepError(e)}";
        handler += '\n\t}).then(function (value) {\nresult = value;\nreturn value;\n })};';
        handler += '\n\treturn susp;';
        return '\nmod.' + name + ' = new Sk.builtin.func(function () {\n' + handler + '\n});\n';
    };

    this._createBuiltin = function (name, generatorName, blockName, nbArgs, type) {
        return function () {
            window.currentPythonContext.runner.checkArgs(name, generatorName, blockName, arguments);

            var susp = new Sk.misceval.Suspension();
            var result = Sk.builtin.none.none$;

            var args = Array.prototype.slice.call(arguments);

            susp.resume = function() { return result; };
            susp.data = {
                type: 'Sk.promise',
                promise: new Promise(function(resolve) {
                    args.push(resolve);

                    // Count actions
                    if (type == 'actions') {
                        window.currentPythonContext.runner._nbActions += 1;
                    }

                    try {
                        const result = window.currentPythonContext[generatorName][blockName].apply(window.currentPythonContext, args);
                        if (result instanceof Promise) result.catch((e) => { window.currentPythonContext.runner._onStepError(e) })
                    } catch (e) {
                        window.currentPythonContext.runner._onStepError(e)}
                }).then(function (value) {
                    result = value;
                    return value;
                })};

            return susp;
        }
    };

    this._skulptifyConst = (name, value) => {
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
    };

    this._injectFunctions = () => {
        // Generate Python custom libraries from all generated blocks
        this._definedFunctions = [];

        if (this.context.infos && this.context.infos.includeBlocks && this.context.infos.includeBlocks.generatedBlocks) {
            // Flatten customBlocks information for easy access
            var blocksInfos = {};
            for (let generatorName in this.context.customBlocks) {
                for (let typeName in this.context.customBlocks[generatorName]) {
                    let blockList = this.context.customBlocks[generatorName][typeName];
                    for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
                        var blockInfo = blockList[iBlock];
                        blocksInfos[blockInfo.name] = {
                            nbArgs: 0, // handled below
                            type: typeName
                        };
                        blocksInfos[blockInfo.name].nbsArgs = [];
                        if (blockInfo.anyArgs) {
                            // Allows to specify the function can accept any number of arguments
                            blocksInfos[blockInfo.name].nbsArgs.push(Infinity);
                        }
                        let variants = blockInfo.variants ? blockInfo.variants : (blockInfo.params ? [blockInfo.params] : []);
                        if (variants.length) {
                            for (let i = 0; i < variants.length; i++) {
                                blocksInfos[blockInfo.name].nbsArgs.push(variants[i].length);
                            }
                        }
                    }
                }
            }

            // Generate functions used in the task
            for (let generatorName in this.context.infos.includeBlocks.generatedBlocks) {
                let blockList = this.context.infos.includeBlocks.generatedBlocks[generatorName];
                if (!blockList.length) {
                    continue;
                }
                let modContents = "var $builtinmodule = function(name) {\n\nvar mod = {};\nmod.__package__ = Sk.builtin.none.none$;\n";
                if (!this._argumentsByBlock[generatorName]) {
                    this._argumentsByBlock[generatorName] = {};
                }
                for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
                    let blockName = blockList[iBlock];
                    let code = this.context.strings.code[blockName];
                    if (typeof (code) == "undefined") {
                        code = blockName;
                    }
                    let nbsArgs = blocksInfos[blockName] ? (blocksInfos[blockName].nbsArgs ? blocksInfos[blockName].nbsArgs : []) : [];
                    let type = blocksInfos[blockName] ? blocksInfos[blockName].type : 'actions';

                    if (type == 'actions') {
                        // this._hasActions = true;
                    }

                    this._argumentsByBlock[generatorName][blockName] = nbsArgs;
                    modContents += this._skulptifyHandler(code, generatorName, blockName, nbsArgs, type);

                    // We do want to override Python's naturel input and output to replace them with our own modules
                    if (generatorName === 'printer' && ('input' === code || 'print' === code)) {
                        const newCode = 'print' === code ? 'customPrint' : code;
                        Sk.builtins[newCode] = this._createBuiltin(code, generatorName, blockName, nbsArgs, type);
                    }
                }

                if (this.context.customConstants && this.context.customConstants[generatorName]) {
                    let constList = this.context.customConstants[generatorName];
                    for (let iConst = 0; iConst < constList.length; iConst++) {
                        let name = constList[iConst].name;
                        if (this.context.strings.constant && this.context.strings.constant[name]) {
                            name = this.context.strings.constant[name];
                        }
                        modContents += this._skulptifyConst(name, constList[iConst].value)
                    }
                }

                modContents += "\nreturn mod;\n};";
                Sk.builtinFiles["files"]["src/lib/" + generatorName + ".js"] = modContents;
                this.availableModules.push(generatorName);
            }
        }
    };

    this.checkArgs = (name, generatorName, blockName, args) => {
        let msg = '';

        // Check the number of arguments corresponds to a variant of the function
        if (!this._argumentsByBlock[generatorName] || !this._argumentsByBlock[generatorName][blockName]) {
            console.error("Couldn't find the number of arguments for " + generatorName + "/" + blockName + ".");
            return;
        }
        var nbsArgs = this._argumentsByBlock[generatorName][blockName];
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
    };

    this._definePythonNumber = () => {
        // Create a class which behaves as a Number, but can have extra properties
        this.pythonNumber = function(val) {
            this.val = Number(val);
        };
        this.pythonNumber.prototype = Object.create(Number.prototype);

        function makePrototype(func) {
            return function() {
                return Number.prototype[func].call(this.val);
            }
        }

        var funcs = ['toExponential', 'toFixed', 'toLocaleString', 'toPrecision', 'toSource', 'toString', 'valueOf'];
        for (let i = 0; i < funcs.length; i++) {
            this.pythonNumber.prototype[funcs[i]] = makePrototype(funcs[i]);
        }
    };

    this.skToJs = (val) => {
        // Convert Skulpt item to JavaScript
        if (val instanceof Sk.builtin.bool) {
            return val.v ? true : false;
        } else if (val instanceof Sk.builtin.func) {
            return () => {
                var args = [];
                for (let i = 0; i < arguments.length; i++) {
                    args.push(that._createPrimitive(arguments[i]));
                }

                let retp = new Promise(function(resolve, reject) {
                    let p = Sk.misceval.asyncToPromise(() => {
                        return val.tp$call(args);
                    });
                    p.then((val) => {
                        resolve(that.skToJs(val));
                    });
                });

                return retp;
            }
        } else if (val instanceof Sk.builtin.dict) {
            let dictKeys = Object.keys(val);
            let retVal = {};
            for (let i = 0; i < dictKeys.length; i++) {
                let key = dictKeys[i];
                if (key == 'size' || key == '__class__') {
                    continue;
                }
                var subItems = val[key].items;
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
                retVal = new this.pythonNumber(retVal);
                retVal.isFloat = true;
            }

            return retVal;
        }
    };

    this.getDefinedFunctions = () => {
        this._injectFunctions();
        return this._definedFunctions.slice();
    };

    this._setTimeout = (func, time) => {
        let timeoutId = null;
        let that = this;

        function wrapper() {
            let idx = that._timeouts.indexOf(timeoutId);
            if (idx > -1) {
                that._timeouts.splice(idx, 1);
            }

            func();
        }

        timeoutId = window.setTimeout(wrapper, time);

        this._timeouts.push(timeoutId);
    };

    this.returnCallback = (callback, value) => {
        var primitive = this._createPrimitive(value);
        if (primitive !== Sk.builtin.none.none$) {
            this._resetCallstackOnNextStep = true;
            this.reportValue(value);
        }

        callback(primitive);
    };

    this.waitDelay = (callback, value, delay) => {
        this._paused = true;
        if (delay > 0) {
            let _noDelay = this.noDelay.bind(this, callback, value);
            this._setTimeout(_noDelay, delay);
        } else {
            this.noDelay(callback, value);
        }
    };

    this.waitEvent = (callback, target, eventName, func) => {
        this._paused = true;
        var listenerFunc = null;
        var that = this;
        listenerFunc = function(e) {
            target.removeEventListener(eventName, listenerFunc);
            that.noDelay(callback, func(e));
        };
        target.addEventListener(eventName, listenerFunc);
    };

    this.waitCallback = (callback) => {
        // Returns a callback to be called once we can continue the execution
        this._paused = true;
        var that = this;
        return (value) => {
            that.noDelay(callback, value);
        };
    };

    this.noDelay = (callback, value) => {
        var primitive = this._createPrimitive(value);
        if (primitive !== Sk.builtin.none.none$) {
            // Apparently when we create a new primitive, the debugger adds a call to
            // the callstack.
            this._resetCallstackOnNextStep = true;
            this.reportValue(value);
        }

        this._paused = false;
        callback(primitive);

        this._setTimeout(this._continue.bind(this), 10);
    };

    this._createPrimitive = (data) => {
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
    };

    this._onDebugOut = (text) => {

    };

    this._configure = () => {
        Sk.configure({
            output: this.print,
            inputfun: this.onInput,
            inputfunTakesPrompt: true,
            debugout: this._onDebugOut,
            read: this._builtinRead.bind(this),
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

        this._definePythonNumber();

        this.context.callCallback = this.noDelay.bind(this);
    };

    this.print = (message) => {
        if (message.trim() === 'Program execution complete') {
            this._isFinished = true;
        } else {
            if (message) {
                Sk.builtins['customPrint'](message.trim());
            }
            this._printedDuringStep += message;
        }
    };

    this._onFinished = () => {
        this.stop();
    };

    this._builtinRead = (x) => {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
            throw 'File not found: ' + x;
        }

        return Sk.builtinFiles["files"][x];
    };

    this.get_source_line = (lineno) => {
        return this._code.split('\n')[lineno];
    };

    this._continue = () => {
        if (this._steps >= this._maxIterations) {
            this._onStepError(window.languageStrings.tooManyIterations);
        } else if (!this._paused && this._isRunning) {
            this.step();
        }
    };

    this.initCodes = (codes) => {
        // For reportValue in Skulpt.
        window.currentPythonRunner = this;

        this._resetInterpreterState();

        if (Sk.running) {
            console.log('running aleady');
            if (typeof Sk.runQueue === 'undefined') {
                Sk.runQueue = [];
            }
            Sk.runQueue.push({ctrl: this, codes: codes});

            return;
        }

        window.currentPythonContext = this.context;
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

                this.onError(error + "\n");
            });
        } catch (e) {
            this.onError(e.toString() + "\n");
        }

        this._resetInterpreterState();

        Sk.running = true;
        this._isRunning = true;
    };

    this.runStep = () => {
        return new Promise((resolve, reject) => {
            this.stepMode = true;
            this._printedDuringStep = '';
            if (this._isRunning && !this._stepInProgress) {
                this.step(resolve, reject);
            }
        });
    };

    this.nbRunning = () => {
        return this._isRunning ? 1 : 0;
    };

    this.unSkulptValue = (origValue) => {
        let value = null;

        // Transform a value, possibly a Skulpt one, into a printable value
        if (typeof origValue !== 'object' || origValue === null) {
            value = origValue;
        } else if (origValue.constructor === Sk.builtin.dict) {
            let keys = Object.keys(origValue);
            let dictElems = [];
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] == 'size' || keys[i] == '__class__'
                    || !origValue[keys[i]].items
                    || !origValue[keys[i]].items[0]) {

                    continue;
                }

                var items = origValue[keys[i]].items[0];
                dictElems.push('' + this.unSkulptValue(items.lhs) + ': ' + this.unSkulptValue(items.rhs));
            }
            value = '{' + dictElems.join(',') + '}';
        } else if (origValue.constructor === Sk.builtin.list) {
            let oldArray = origValue.v;
            let newArray = [];
            for (let i = 0; i < oldArray.length; i++) {
                newArray.push(this.unSkulptValue(oldArray[i]));
            }
            value = '[' + newArray.join(', ') + ']';
        } else if (origValue.v !== undefined) {
            value = origValue.v;
            if (typeof value == 'string') {
                value = '"' + value + '"';
            }
        } else if (typeof origValue == 'object') {
            value = origValue;
        }

        return value;
    };

    this.reportValue = (origValue, varName) => {
        // Show a popup displaying the value of a block in step-by-step mode
        if (origValue === undefined
            || (origValue && origValue.constructor === Sk.builtin.func)
            || !this._editorMarker
            || !context.display
            || !this.stepMode) {
            return origValue;
        }

        return origValue;
    };

    this.stop = () => {
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
        this._resetInterpreterState();

        this._isFinished = true;
    };

    this._resetInterpreterState = () => {
        this._steps = 0;
        this._nbActions = 0;

        this._isRunning = false;
        this.stepMode = false;
        this._stepInProgress = false;
        this._resetCallstackOnNextStep = false;
        this._paused = false;
        Sk.running = false;
        if (Sk.runQueue && Sk.runQueue.length > 0) {
            var nextExec = Sk.runQueue.shift();
            setTimeout(function() {
                nextExec.ctrl.runCodes(nextExec.codes);
            }, 100);
        }

        this._isFinished = false;
    };

    this._resetCallstack = () => {
        if (this._resetCallstackOnNextStep) {
            this._resetCallstackOnNextStep = false;
            this._debugger.suspension_stack.pop();
        }
    };

    this.step = (resolve, reject) => {
        this._resetCallstack();
        this._stepInProgress = true;

        this.realStep(resolve, reject);
    };

    this.realStep = (resolve, reject) => {
        this._paused = this.stepMode;
        this._debugger.enable_step_mode();
        this._debugger.resume.call(this._debugger, resolve, reject);
        this._steps += 1;
    };

    /**
     * Get the current debugger's suspension.
     */
    this.getCurrentSuspension = () => {
        let curIndex = (this._debugger.suspension_stack.length - 1);
        let suspension = null;
        do {
            suspension = this._debugger.suspension_stack[curIndex];

            curIndex--;
        } while (curIndex >= 0 && !suspension.hasOwnProperty('$loc'));

        return suspension;
    };

    this._onStepSuccess = (callback) => {
        // If there are still timeouts, there's still a step in progress
        this._stepInProgress = !!this._timeouts.length;
        this._continue();

        if (typeof callback === 'function') {
            callback();
        }
    };

    this._onStepError = (message, callback) => {
        console.error(message);
        context.onExecutionEnd && context.onExecutionEnd();
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
        if (this.context.success) {
            this.onSuccess(message);
        } else {
            message = this.context.messagePrefixFailure + message;
            this.onError(message);
        }

        if (typeof callback === 'function') {
            callback();
        }
    };

    this._setBreakpoint = (bp, isTemporary) => {
        this._debugger.add_breakpoint(this._editor_filename + '.py', bp, '0', isTemporary);
    };

    this._asyncCallback = function() {
        return Sk.importMainWithBody(this._editor_filename, true, this._code, true);
    };

    /**
     * Checks whether the interpreter is synchronized with the analysis object.
     *
     * @param {object} analysis The analysis object.
     *
     * @return {boolean}
     */
    this.isSynchronizedWithAnalysis = function(analysis) {
        // Must be at the same step number and have the same source code.

        const analysisStepNum = analysis.stepNum;
        const analysisCode = analysis.code;
        const currentPythonStepNum = window.currentPythonRunner._steps;
        const currentPythonCode = window.currentPythonRunner._code;
        console.log('check sync analysis', analysisStepNum, currentPythonStepNum);
        if (analysisStepNum !== currentPythonStepNum || analysisCode !== currentPythonCode) {
            return false;
        }

        return true;
    }
}
