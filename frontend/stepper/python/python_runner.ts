/*
    python_runner:
        Python code runner.
*/

import log from "loglevel";
import AbstractRunner from "../abstract_runner";
import {StepperContext} from "../api";
import {Block, BlockType} from '../../task/blocks/block_types';
import {ActionTypes, ContextEnrichingTypes} from '../actionTypes';
import {Codecast} from '../../app_types';
import {convertSkulptStateToAnalysisSnapshot, getSkulptSuspensionsCopy} from './analysis';
import {parseDirectives} from './directives';
import {convertAnalysisDAPToCodecastFormat} from '../analysis/analysis';
import {appSelect} from '../../hooks';
import {quickAlgoLibraries} from '../../task/libs/quick_algo_libraries_model';
import {CONSTRUCTOR_NAME, getContextBlocksDataSelector} from '../../task/blocks/blocks';
import {delay} from '../../player/sagas';
import {put} from 'typed-redux-saga';
import {LibraryTestResult} from '../../task/libs/library_test_result';
import {TaskAnswer} from '../../task/task_types';
import {documentToString} from '../../buffers/document';
import {StepperState} from '../index';

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

const PROXY_IDENTITY = Symbol('proxy_target_identity');

const PythonNumber = definePythonNumber();

export default class PythonRunner extends AbstractRunner {
    private context;
    public _debugger;
    public _code = '';
    private _editor_filename = "<stdin>";
    private _maxIterations = 4000;
    private _resetCallstackOnNextStep = false;
    private _isRunning = false;
    private _stepInProgress = false;
    private stepMode = false;
    private _editorMarker = null;
    private availableModules = [];
    private availableBlocks = [] as Block[];
    public _isFinished = false;
    private quickAlgoCallsExecutor;
    public hasCalledHandler = false;

    constructor(context) {
        super(context);
        this.context = context;
    }

    public static needsCompilation(): boolean {
        return true;
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
        stepperContext.hasMadeFinalInteract = true;
        log.getLogger('python_runner').debug('AFTER FINAL INTERACT');
    }

    private static _skulptifyHandler(name, generatorName, blockName, nbArgs, type, toExecute, moduleMethodName?: string) {
        return `
mod.${moduleMethodName ?? name} = new Sk.builtin.func(function () {
    Codecast.runner.checkArgs('${name}', '${generatorName}', '${blockName}', arguments);
    Codecast.runner.hasCalledHandler = true;
    
    var susp = new Sk.misceval.Suspension();
    var result = Sk.builtin.none.none$;
    var args = Array.prototype.slice.call(arguments);
    for (var i=0; i<args.length; i++) {
        args[i] = Codecast.runner.skToJs(args[i]);
    }
    
    susp.resume = function() {
        return result;
    };
    susp.data = {
        type: 'Sk.promise',
        promise: new Promise(function (resolve) {
            ${'actions' === type ? `Codecast.runner._nbActions += 1;` : ''}
            
            try {
                const result = Codecast.runner.quickAlgoCallsExecutor("${generatorName}", "${toExecute}", args);
                if (result instanceof Promise) {
                    result.then(resolve).catch((e) => { Codecast.runner._onStepError(e) })
                }
            } catch (e) {
                Codecast.runner._onStepError(e)
            }
        }).then(function (value) {
            result = value;
            
            return value;
        })
    };
    
    return susp;
});
`;
    }

    private static _skulptifyClassHandler(methodName, generatorName, blockName, nbArgs, type, className: string, moduleMethodName: string) {
        const handler = PythonRunner._skulptifyHandler(methodName, generatorName, blockName, nbArgs, type, `${className}->${methodName}`, moduleMethodName);

        return handler.replace(/mod\./, '$loc.');
    }

    private static _skulptifyClassInstance(classInstance: string, className: string) {
        return `
mod.${classInstance} = Sk.misceval.callsimArray(mod.${className});
mod.${classInstance}.__variableName = '${classInstance}';
`;
    }

    private static _skulptifyClass(className: string, classComponents: string[]) {
        return `
newClass${className} = function ($gbl, $loc) {
    ${classComponents.join("")}
};

mod.${className} = Sk.misceval.buildClass(mod, newClass${className}, "${className}", []);
`;
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

    private static _skulptifyClassConstHandler(name, value) {
        const handler = PythonRunner._skulptifyConst(name, value);

        return handler.replace(/mod\./, '$loc.');
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
                modContents += PythonRunner._skulptifyHandler(code, generatorName, name, params, type, name);
                // We do want to override Python's naturel input and output to replace them with our own modules
                if (generatorName === 'printer' && ('input' === code || 'print' === code)) {
                    Sk.builtins[code] = this._createBuiltin(code, generatorName, name, params, type);
                }
            }

            const classInstancesToAdd: {[classInstance: string]: string} = {};
            const classParts: {[className: string]: {[methodName: string]: string}} = {};
            for (let block of blocks.filter(block => block.type === BlockType.ClassFunction)) {
                const {generatorName, name, params, type, methodName, className, classInstance} = block;
                if (!block.placeholderClassInstance) {
                    classInstancesToAdd[classInstance] = className;
                }
                if (!(className in classParts)) {
                    classParts[className] = {};
                }
                if (!(methodName in classParts[className])) {
                    let moduleMethodName = methodName;
                    if (CONSTRUCTOR_NAME === methodName) {
                        moduleMethodName = '__init__';
                    }
                    classParts[className][methodName] = PythonRunner._skulptifyClassHandler(methodName, generatorName, name, params, type, className, moduleMethodName);
                }
            }

            for (let block of blocks.filter(block => block.type === BlockType.ClassConstant)) {
                const {name, value, className, methodName} = block;
                if (!(className in classParts)) {
                    classParts[className] = {};
                }
                if (!(name in classParts[className])) {
                    classParts[className][name] = PythonRunner._skulptifyClassConstHandler(methodName, value);
                }
            }

            for (let [className, classPartsList] of Object.entries(classParts)) {
                modContents += PythonRunner._skulptifyClass(className, Object.values(classPartsList));
            }

            for (let [classInstance, className] of Object.entries(classInstancesToAdd)) {
                modContents += PythonRunner._skulptifyClassInstance(classInstance, className);
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

        let argsGivenCount = args.length;
        let params = block.paramsCount;
        if (block.type === BlockType.ClassFunction) {
            // The class handler received self as first argument
            argsGivenCount--;
        }

        if (params.length === 0) {
            // This function doesn't have arguments
            if (argsGivenCount > 0) {
                msg = name + "() takes no arguments (" + argsGivenCount + " given)";
                throw new Sk.builtin.TypeError(msg);
            }
        } else if (params.indexOf(argsGivenCount) === -1 && params.indexOf(Infinity) === -1) {
            let minArgs = params[0];
            let maxArgs = params[0];
            for (let i = 1; i < params.length; i++) {
                minArgs = Math.min(minArgs, params[i]);
                maxArgs = Math.max(maxArgs, params[i]);
            }

            if (minArgs === maxArgs) {
                msg = name + "() takes exactly " + minArgs + " arguments";
            } else if (argsGivenCount < minArgs) {
                msg = name + "() takes at least " + minArgs + " arguments";
            } else if (argsGivenCount > maxArgs) {
                msg = name + "() takes at most " + maxArgs + " arguments";
            } else {
                msg = name + "() doesn't have a variant accepting this number of arguments";
            }
            msg += " (" + argsGivenCount + " given)";

            throw new Sk.builtin.TypeError(msg);
        }
    }

    skToJs (val) {
        // Convert Skulpt item to JavaScript
        if (val instanceof Sk.builtin.bool) {
            return !!val.v;
        } else if (val instanceof Sk.builtin.func) {
            const self = this;

            return (...innerArgs) => {
                let args = [];
                for (let i = 0; i < innerArgs.length; i++) {
                    args.push(self._createPrimitive(innerArgs[i]));
                }

                try {
                    const suspendableFn = () => {
                        return val.tp$call(args);
                    };
                    let promise = this._debugger.asyncToPromise(suspendableFn, null, this._debugger);
                    // promise.then((response) => {
                    //     console.log('thened', response);
                    //     this._debugger.success.bind(this._debugger);
                    // }, (error) => {
                    //     console.log('errored', error);
                    //     this._debugger.error.bind(this._debugger);
                    //
                    //     this.context.onError(error + "\n");
                    // });

                    return promise;
                } catch (e) {
                    console.error(e);
                    this.context.onError(e.toString() + "\n");
                }

                // return new Promise((resolve, reject) => {
                //     Sk.misceval.asyncToPromise(() => {
                //         return val.tp$call(args);
                //     }).then((val) => {
                //         resolve(self.skToJs(val));
                //     });
                // });
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
        } else if (val instanceof Sk.builtin.object && val.hasOwnProperty('$d')) {
            return new Proxy(val, {
                get: (target, prop) => {
                    if (PROXY_IDENTITY === prop) {
                        return target
                    }
                    if ('__variableName' === prop) {
                        return target.__variableName;
                    }

                    const value = target.$d.entries[prop];

                    return value && value.length ? this.skToJs(value[1]) : null;
                },
                set: (target, prop, value) => {
                    Sk.abstr.objectSetItem(target['$d'], new Sk.builtin.str(prop), value[PROXY_IDENTITY] ?? this._createPrimitive(value));

                    return true;
                },
            });
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

    waitDelay(callback, value, delay) {
        log.getLogger('python_runner').debug('WAIT DELAY', value, delay);
        if (delay > 0) {
            let _noDelay = this.noDelay.bind(this, callback, value);
            this._setTimeout(_noDelay, delay);
        } else {
            this.noDelay(callback, value);
        }
    }

    noDelay(callback, value) {
        log.getLogger('python_runner').debug('NO DELAY');
        let primitive = this._createPrimitive(value);
        if (primitive !== Sk.builtin.none.none$) {
            // Apparently when we create a new primitive, the debugger adds a call to
            // the callstack.
            this._resetCallstackOnNextStep = true;
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
        log.getLogger('python_runner').debug('make continue', this._isRunning, this._steps);
        if (!this.context.allowInfiniteLoop && this._steps >= this._maxIterations) {
            this._onStepError(window.languageStrings.tooManyIterations);
        }
    }

    public initCodes(codes, availableBlocks: Block[]) {
        super.initCodes(codes, availableBlocks);

        // For reportValue in Skulpt.
        window.currentPythonRunner = this;

        this._resetInterpreterState();

        if (Sk.running) {
            log.getLogger('python_runner').debug('running already');
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
            this._maxIterations = this.context.infos.maxIter;
        }

        try {
            // let susp_handlers = {};
            // susp_handlers['*'] = this._debugger.suspension_handler.bind(this);
            let promise = this._debugger.asyncToPromise(this._asyncCallback.bind(this), null, this._debugger);
            promise.then((response) => {
                // this._debugger.success.bind(this._debugger);
            }, (error) => {
                // this._debugger.error.bind(this._debugger);

                this.context.onError(error + "\n");
            });
        } catch (e) {
            this.context.onError(e.toString() + "\n");
        }

        this._resetInterpreterState();
        this.registerNewThread(this._debugger.suspension_stack);

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

    reportValue(origValue) {
        return origValue;
    }

    public isRunning(): boolean {
        return this._isRunning;
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
        this._stepsWithoutAction = 0;
        this._lastNbActions = 0;
        this._nbActions = 0;
        this._allowStepsWithoutDelay = 0;

        this._isRunning = false;
        this.stepMode = false;
        this._stepInProgress = false;
        this._resetCallstackOnNextStep = false;
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
        log.getLogger('python_runner').debug('continue step', resolve, reject, this._resetCallstackOnNextStep);
        this._resetCallstack();
        this._stepInProgress = true;

        this.realStep(resolve, reject);
    }

    realStep(resolve, reject) {
        this._debugger.enable_step_mode();
        this._debugger.resume.call(this._debugger, resolve, reject);
        this._steps += 1;
        if(this._lastNbActions != this._nbActions) {
            this._lastNbActions = this._nbActions;
            this._stepsWithoutAction = 0;
        } else {
            this._stepsWithoutAction += 1;
        }
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

    public enrichStepperState(stepperState: StepperState, context: ContextEnrichingTypes, stepperContext?: StepperContext) {
        if (context === ContextEnrichingTypes.StepperProgress) {
            stepperContext.state.suspensions = getSkulptSuspensionsCopy((Codecast.runner as PythonRunner)._debugger.suspension_stack);

            // Don't reanalyse after program is finished :
            // keep the last state of the stack and set isFinished state.
            if (Codecast.runner._isFinished) {
                stepperState.isFinished = true;
            } else {
                log.getLogger('stepper').debug('INCREASE STEP NUM TO ', stepperState.analysis.stepNum + 1);
                stepperState.analysis = convertSkulptStateToAnalysisSnapshot(stepperState.suspensions, stepperState.lastAnalysis, stepperState.analysis.stepNum + 1);
                stepperState.directives = {
                    ordered: parseDirectives(stepperState.analysis),
                    functionCallStackMap: null,
                    functionCallStack: null
                };
            }
        }

        if (!stepperState.analysis) {
            stepperState.analysis =  {
                stackFrames: [],
                code: (Codecast.runner as PythonRunner)._code,
                lines: (Codecast.runner as PythonRunner)._code.split("\n"),
                stepNum: 0
            };

            stepperState.lastAnalysis = {
                stackFrames: [],
                code: (Codecast.runner as PythonRunner)._code,
                lines: (Codecast.runner as PythonRunner)._code.split("\n"),
                stepNum: 0
            };
        }

        log.getLogger('stepper').debug('python analysis', stepperState.analysis);
        stepperState.codecastAnalysis = convertAnalysisDAPToCodecastFormat(stepperState.analysis, stepperState.lastAnalysis);

        log.getLogger('stepper').debug('codecast analysis', stepperState.codecastAnalysis);
        super.enrichStepperState(stepperState, context, stepperContext);
    }

    public *compileAnswer(answer: TaskAnswer) {
        const source = documentToString(answer.document);
        log.getLogger('python_runner').debug('compile python code', source);
        const state = yield* appSelect();
        const context = quickAlgoLibraries.getContext(null, state.environment);

        let compileError = null;
        context.onError = (error) => {
            compileError = error;
        }

        /**
         * Add a last instruction at the end of the code so Skulpt will generate a Suspension state
         * for after the user's last instruction. Otherwise it would be impossible to retrieve the
         * modifications made by the last user's line.
         *
         * @type {string} pythonSource
         */
        const pythonSource = source + "\npass";

        const blocksData = getContextBlocksDataSelector({state, context});

        const pythonInterpreter = Codecast.runner;
        pythonInterpreter.initCodes([pythonSource], blocksData);

        yield* delay(0);

        if (compileError) {
            yield* put({
                type: ActionTypes.CompileFailed,
                payload: {
                    testResult: LibraryTestResult.fromString(String(compileError)),
                },
            });
        } else {
            yield* put({
                type: ActionTypes.CompileSucceeded,
            });
        }
    }

    public makeQuickalgoCall(quickalgoMethod, callback) {
        quickalgoMethod((result: any) => {
            this._resetCallstackOnNextStep = false;
            const realResult = this.skToJs(result);
            callback(realResult);
        });
    }

    public createNewThread(promiseCreator) {
        log.getLogger('multithread').debug('[multithread] create new thread -> promise', promiseCreator);

        // Save previous state
        this.saveCurrentThreadData([...this._debugger.suspension_stack]);

        // Execute promise to get new state
        const promise = promiseCreator();

        // Add main suspension stack before this one, so that when this thread finishes, the program does not finishes
        const mainThreadStack = this.getAllThreads()[0];

        const newSuspensionStack = [
            ...mainThreadStack,
        ];

        const lastSuspension = this._debugger.suspension_stack[this._debugger.suspension_stack.length - 1];
        newSuspensionStack[newSuspensionStack.length - 1] = {
            ...newSuspensionStack[newSuspensionStack.length - 1],
            child: lastSuspension,
        };
        newSuspensionStack.push(lastSuspension);

        // Register new thread
        const newThreadId = this.registerNewThread(newSuspensionStack);

        // Restore previous state, since we haven't switched yet to the new thread
        this._debugger.suspension_stack = this.getAllThreads()[this.currentThreadId];

        promise
            .then(() => {
                log.getLogger('multithread').debug('[multithread] end of thread');
                this.currentThreadFinished(newThreadId);
            })
    }

    public swapCurrentThreadId(newThreadId: number) {
        this.saveCurrentThreadData([...this._debugger.suspension_stack]);
        this.currentThreadId = newThreadId;
        const threads = this.getAllThreads();
        const suspensionStack = threads[newThreadId];
        log.getLogger('multithread').debug('[multithread] change current thread', suspensionStack);
        this._debugger.suspension_stack = suspensionStack;
    }
}
