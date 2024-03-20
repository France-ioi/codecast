import {VIEW_DIRECTIVE_PREFIX} from "./directives";
import {AnalysisScope, AnalysisSnapshot, AnalysisStackFrame, AnalysisVariable} from "../analysis/analysis";
import {DebugProtocol} from "vscode-debugprotocol";
import log from 'loglevel';

/**
 * Enable debug of skulpt analysis.
 *
 * 0 : No analysis
 * 1 : Only the result of analysis
 * 2 : The details of analysis
 *
 * @type {int}
 */
const SKULPT_ANALYSIS_DEBUG = 1;

export const convertSkulptStateToAnalysisSnapshot = function (suspensions: readonly any[], lastAnalysis: AnalysisSnapshot, newStepNum: number): AnalysisSnapshot {
    // @ts-ignore
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        log.getLogger('python_runner').debug('[¥¥¥¥¥¥¥] Building analysis');
        log.getLogger('python_runner').debug(suspensions);
        log.getLogger('python_runner').debug(lastAnalysis);
    }

    let stackFrames: AnalysisStackFrame[] = [];

    if (suspensions) {
        let stackFrameIndex = 0;
        for (let suspensionIdx = 0; suspensionIdx < suspensions.length; suspensionIdx++) {
            const suspension = suspensions[suspensionIdx];
            if (!isProgramSuspension(suspension)) {
                continue;
            }

            let lastScopeAnalysis = null;
            if (lastAnalysis && lastAnalysis.stackFrames && lastAnalysis.stackFrames.length > stackFrameIndex) {
                lastScopeAnalysis = lastAnalysis.stackFrames[stackFrameIndex];
            }

            let suspVariables;
            if (Object.keys(suspension.$loc).length === 0 && suspension.$loc.constructor === Object) {
                // If $loc is empty, we are in a function's scope.
                suspVariables = suspension.$tmps;
            } else {
                suspVariables = suspension.$loc;
            }

            const stackFrame: AnalysisStackFrame = {
                id: suspensionIdx,
                name: null,
                column: suspension.$colno + 1,
                line: suspension.$lineno,
                directives: getDirectiveVariables(suspVariables),
                scopes: [],
                args: suspension._argnames,
            };

            log.getLogger('python_runner').debug('suspension loaded', suspension.$loaded_references);

            const scope = analyseSkulptScope(suspension);
            stackFrame.scopes.push(scope);
            stackFrame.name = scope.name;
            stackFrames.push(stackFrame);

            stackFrameIndex++;
        }
    }

    const analysis = {
        ...lastAnalysis,
        stackFrames,
        stepNum: newStepNum
    };

    if (SKULPT_ANALYSIS_DEBUG > 0) {
        log.getLogger('python_runner').debug('[¥¥¥¥¥¥¥] End of building analysis');
        log.getLogger('python_runner').debug(analysis);
    }

    return Object.freeze(analysis);
};

/**
 * Checks whether a suspension is a program's suspension.
 * It can also be only a promise encapsulated in a suspension when certain functions are called.
 *
 * @param {Object} suspension The suspension.
 *
 * @returns {boolean}
 */
const isProgramSuspension = function(suspension): boolean {
    return suspension.hasOwnProperty('$lineno');
};

/**
 * Transforms the skulpt scope (one suspension) to something readable with the variables content.
 */
export const analyseSkulptScope = function(suspension: any): AnalysisScope {
    // @ts-ignore
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        log.getLogger('python_runner').debug('////// Analyse scope...');
        log.getLogger('python_runner').debug(suspension);
    }

    let variables: (string | DebugProtocol.Variable)[] = [];

    let name = suspension._name;
    if (name === '<module>') {
        name = '';
    }

    let suspVariables;
    if (Object.keys(suspension.$loc).length === 0 && suspension.$loc.constructor === Object) {
        // If $loc is empty, we are in a function's scope.

        suspVariables = suspension.$tmps;
    } else {
        suspVariables = suspension.$loc;
    }

    const variableNames = sortArgumentsFirst(filterInternalVariables(Object.keys(suspVariables)), suspension._argnames);
    const loadedReferences = suspension.$loaded_references ? suspension.$loaded_references : {};

    for (let variableName of variableNames) {
        let value = suspVariables[variableName];
        if (value === undefined) {
            continue;
        }

        if (typeof value === 'function') {
            if (!value.prototype || !value.prototype.tp$name) {
                continue;
            }
        }

        const variable = convertSkulptValueToDAPVariable(Sk.unfixReserved(variableName), value, {}, null, loadedReferences);
        variables.push(variable);
    }

    const analysis: AnalysisScope = {
        variables,
        variablesReference: 0,
        expensive: false,
        name,
    };

    // @ts-ignore
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        log.getLogger('python_runner').debug('////// End of analyse scope...');
        log.getLogger('python_runner').debug(analysis);
    }

    return analysis;
};

// To filter the internal variables of Skulpt.
const variablesBeginWithIgnore = [
    '__name__',
    '__doc__',
    '__package__',
    '__file__',
    '__class__',
    '__refs__',
    VIEW_DIRECTIVE_PREFIX,
    '$compareres',
    '$loadgbl',
    '$binop',
    '$lsubscr',
    '$iter',
    '$call',
    '$loadtuple',
    '$loaddict',
    '$loadlist',
    '$items',
    '$elem',
    '$lattr'
];

/**
 * Filter the variable names by removing those used internally by Skulpt.
 *
 * @param {Array} variableNames The names.
 *
 * @returns {Array}
 */
const filterInternalVariables = (variableNames: string[]): string[] => {
    return variableNames.filter((name) => {
        let ignore = false;
        for (let variableBeginWithIgnore of variablesBeginWithIgnore) {
            if (name.indexOf(variableBeginWithIgnore) === 0) {
                return false;
            }
        }

        return true;
    });
};

const getDirectiveVariables = (variables) => {
    let directiveVariables = [];
    for (let variableName in variables) {
        if (variableName.startsWith(VIEW_DIRECTIVE_PREFIX)) {
            const directiveName = variableName.substr(VIEW_DIRECTIVE_PREFIX.length);

            if (variables[variableName]) {
                directiveVariables.push(directiveName + ' = ' + variables[variableName].v);
            }
        }
    }

    return directiveVariables;
};

/**
 * Sort by putting arguments first.
 *
 * @param {Array} variableNames The variable names.
 * @param {Array} args          The arguments.
 *
 * @return {Array}
 */
const sortArgumentsFirst = (variableNames: string[], args) => {
    return variableNames.sort((a, b) => {
        const aIsArg = (args && args.indexOf(a) !== -1);
        const bIsArg = (args && args.indexOf(b) !== -1);

        if (aIsArg && !bIsArg) {
            return -1;
        } else if (bIsArg && !aIsArg) {
            return 1;
        }

        return a.localeCompare(b);
    });
};

/**
 * Gets a copy of skulpt suspensions.
 *
 * @param {Array} suspensions The suspensions.
 *
 * @return {Array} A copy of the suspensions.
 */
export const getSkulptSuspensionsCopy = function(suspensions) {
    const copies = [];
    for (let suspensionIdx in suspensions) {
        const suspension = suspensions[suspensionIdx];

        copies[suspensionIdx] = {
            ...suspension
        };
    }

    return Object.freeze(copies);
}

let variableReferenceCount = 1;

export const convertSkulptValueToDAPVariable = (name: string, value: any, visited: {[uuid: string]: boolean}, loadReference: string, loadedReferences): AnalysisVariable => {
    // log.getLogger('python_runner').debug('convert value', name, value, visited, loadedReferences);
    let variableData = {
        name,
        type: value.constructor.prototype.tp$name,
        loaded: name in loadedReferences || (null !== loadReference && loadReference in loadedReferences),
    };

    if (value._uuid && value._uuid in visited) {
        log.getLogger('python_runner').debug('already visited', visited, value._uuid);
        return {
            ...variableData,
            value: null,
            alreadyVisited: true,
            variablesReference: 0,
        };
    }

    if (typeof value === 'function') {
        return {
            ...variableData,
            value: `<class '${value.prototype.tp$name}'>`,
            variablesReference: 0,
        };
    }

    if (value instanceof Sk.builtin.module) {
        return {
            ...variableData,
            value: '<module>',
            variablesReference: 0,
        };
    }

    if (value instanceof Sk.builtin.func) {
        return {
            ...variableData,
            value: '<func>',
            variablesReference: 0,
        };
    }

    if (value instanceof Sk.builtin.dict) {
        return {
            ...variableData,
            value: null,
            variables: Object.entries(value.entries).map(([key, item]) => {
                return convertSkulptValueToDAPVariable(key, item[1], {...visited, [value._uuid]: true}, value._uuid + '_' + key, loadedReferences);
            }),
            namedVariables: Object.keys(value.entries).length,
            variablesReference: variableReferenceCount++,
        };
    }

    if (value instanceof Sk.builtin.set || value instanceof Sk.builtin.frozenset) {
        return {
            ...variableData,
            value: null,
            variables: Object.entries(value.v.entries).map(([key, item]) => {
                return convertSkulptValueToDAPVariable(key, item[0], {...visited, [value.v._uuid]: true}, value._uuid + '_' + key, loadedReferences);
            }),
            namedVariables: Object.keys(value.v.entries).length,
            withCurlyBraces: true,
            variablesReference: variableReferenceCount++,
            collapsed: true,
        };
    }

    if (value instanceof Sk.builtin.list || value instanceof Sk.builtin.tuple || value instanceof Sk.builtin.range_) {
        return {
            ...variableData,
            value: null,
            variables: value.v.map((item, index) => {
                return convertSkulptValueToDAPVariable(index, item, {...visited, [value._uuid]: true}, value._uuid + '_' + index, loadedReferences);
            }),
            indexedVariables: value.v.length,
            variablesReference: variableReferenceCount++,
            collapsed: true,
        };
    }

    if (value instanceof Sk.builtin.object && value.hasOwnProperty('$d')) {
        return {
            ...variableData,
            value: null,
            variables: Object.entries(value.$d.entries).map(([key, item]) => {
                return convertSkulptValueToDAPVariable(key, item[1], {...visited, [value.$d._uuid]: true}, value._uuid + '_' + key, loadedReferences);
            }),
            namedVariables: Object.keys(value.$d.entries).length,
            variablesReference: variableReferenceCount++,
        };

    }

    if (value && value.hasOwnProperty('$__iterType')) {
        return {
            ...variableData,
            value: null,
            variables: Object.entries(value.myobj.entries).map(([key, item]) => {
                return convertSkulptValueToDAPVariable(key, item[1], {...visited, [value.myobj._uuid]: true}, value._uuid + '_' + key, loadedReferences);
            }),
            namedVariables: Object.keys(value.myobj.entries).length,
            variablesReference: variableReferenceCount++,
        };
    }

    if (value instanceof Sk.builtin.str) {
        return {
            ...variableData,
            value: `"${value.v}"`,
            variablesReference: 0,
        };
    }

    if (value instanceof Sk.builtin.bool) {
        return {
            ...variableData,
            value: Sk.misceval.isTrue(value.v) ? 'True' : 'False',
            variablesReference: 0,
        };
    }

    if (value instanceof Sk.builtin.float_) {
        return {
            ...variableData,
            value: String(value.v).indexOf('.') !== -1 ? value.v : value.v + '.0',
            variablesReference: 0,
        };
    }

    if (value instanceof Sk.builtin.bytes) {
        const byteToString = (byte: number) => {
            return String.fromCharCode(byte).match(/^[a-zA-Z0-9]$/) ? String.fromCharCode(byte) : "\\x" + byte.toString(16);
        };

        return {
            ...variableData,
            value: `b'${Array.from<number>(value.v).map(byteToString).join('')}'`,
            variablesReference: 0,
        };
    }

    if (value instanceof Sk.builtin.complex) {
        const complexToString = (complex: {imag: number, real: number}) => {
            const parts = [
                ...(complex.real !== 0 ? [complex.real] : []),
                ...(complex.imag !== 0 ? [complex.imag + 'j'] : []),
            ];

            return parts.length ? parts.join('+') : '0';
        };

        return {
            ...variableData,
            value: complexToString(value),
            variablesReference: 0,
        };
    }

    return {
        ...variableData,
        value: value.v,
        variablesReference: 0,
    };
}
