import Immutable from 'immutable';
import {VIEW_DIRECTIVE_PREFIX} from "../directives";

/**
 * Enable debug of skulpt analysis.
 *
 * 0 : No analysis
 * 1 : Only the result of analysis
 * 2 : The details of analysis
 *
 * @type {int}
 */
const SKULPT_ANALYSIS_DEBUG = 0;

/**
 * Transforms the skulpt state (the suspensions) to something readable with the variables content.
 *
 * @param {Array}  suspensions  The skulpt suspensions.
 * @param {Object} lastAnalysis The last analysis (this function on the precedent step).
 * @param {int}    newStepNum   The new Skulpt step number.
 *
 * @returns {Object}
 */
export const analyseSkulptState = function (suspensions, lastAnalysis, newStepNum) {
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        console.log('[¥¥¥¥¥¥¥] Building analysis');
        console.log(suspensions);
        console.log(lastAnalysis);
    }

    let functionCallStack = new Immutable.List();

    if (suspensions) {
        let scopeIndex = 0;
        for (let suspensionIdx = 0; suspensionIdx < suspensions.length; suspensionIdx++) {
            const suspension = suspensions[suspensionIdx];
            if (!isProgramSuspension(suspension)) {
                continue;
            }

            let lastScopeAnalysis = null;
            if (lastAnalysis && lastAnalysis.functionCallStack.size > scopeIndex) {
                lastScopeAnalysis = lastAnalysis.functionCallStack.get(scopeIndex);
            }

            const analysedScope = analyseSkulptScope(suspension, lastScopeAnalysis, newStepNum);
            analysedScope.key = suspensionIdx;
            analysedScope.scopeIndex = scopeIndex;

            functionCallStack = functionCallStack.push(analysedScope);

            scopeIndex++;
        }
    }

    const analysis = {
        ...lastAnalysis,
        functionCallStack: functionCallStack,
        stepNum: newStepNum
    };

    if (SKULPT_ANALYSIS_DEBUG > 0) {
        console.log('[¥¥¥¥¥¥¥] End of building analysis');
        console.log(analysis);
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
const isProgramSuspension = function (suspension) {
    return suspension.hasOwnProperty('$lineno');
};

/**
 * Transforms the skulpt scope (one suspension) to something readable with the variables content.
 *
 * @param {Object} suspension   The skulpt suspension.
 * @param {Object} lastAnalysis The last analysis (this function on the precedent step and the same scope).
 * @param {int}    newStepNum   The new Skulpt step number.
 *
 * @returns {{args: *, variables: Map, name: string, openedPaths: Map<any, any>, currentLine: *}}
 */
export const analyseSkulptScope = function (suspension, lastAnalysis, newStepNum) {
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        console.log('////// Analyse scope...');
        console.log(suspension);
        console.log(lastAnalysis);
    }

    let variables = new Immutable.Map();

    let name = suspension._name;
    if (name === '<module>') {
        name = '';
    }

    const args = suspension._argnames;

    let suspVariables;
    if (Object.keys(suspension.$loc).length === 0 && suspension.$loc.constructor === Object) {
        // If $loc is empty, we are in a function's scope.

        suspVariables = suspension.$tmps;
    } else {
        suspVariables = suspension.$loc;
    }

    const variableNames = sortArgumentsFirst(filterInternalVariables(Object.keys(suspVariables)), args);

    for (let variableName of variableNames) {
        const value = suspVariables[variableName];

        if (typeof value === 'function') {
            continue;
        }

        let lastValue = null;
        if (lastAnalysis) {
            lastValue = lastAnalysis.variables.get(variableName);
            if (lastValue) {
                lastValue = lastValue.cur;
            } else {
                lastValue = undefined;
            }
        }

        variables = variables.set(variableName, {
            cur: value,
            old: lastValue
        });
    }

    // The references of loaded objects and variables whithin the step.
    const loadedReferences = (lastAnalysis) ? {...lastAnalysis.loadedReferences} : {};
    for (let reference in suspension.$loaded_references) {
        loadedReferences[reference] = newStepNum;
    }

    // Opened objects / lists in the variables view.
    let openedPaths;
    if (lastAnalysis) {
        openedPaths = lastAnalysis.openedPaths;
    } else {
        openedPaths = new Immutable.Map();
    }

    const analysis = {
        variables,
        directives: getDirectiveVariables(suspVariables),
        name,
        args,
        openedPaths,
        loadedReferences,
        currentLine: suspension.$lineno
    };

    if (SKULPT_ANALYSIS_DEBUG === 2) {
        console.log('////// End of analyse scope...');
        console.log(analysis);
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
const filterInternalVariables = (variableNames) => {
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
const sortArgumentsFirst = (variableNames, args) => {
    return variableNames.sort((a, b) => {
        const aIsArg = (args.indexOf(a) !== -1);
        const bIsArg = (args.indexOf(b) !== -1);

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
export const getSkulptSuspensionsCopy = function (suspensions) {
    const copies = [];
    for (let suspensionIdx in suspensions) {
        const suspension = suspensions[suspensionIdx];

        copies[suspensionIdx] = {
            ...suspension
        };
    }

    return copies;
}

/**
 * Clears the loaded references.
 *
 * @param analysis
 */
export const clearLoadedReferences = function (analysis) {
    const clearedAnalysis = {
        ...analysis,
        functionCallStack: new Immutable.List()
    };
    for (let idx = 0; idx < analysis.functionCallStack.size; idx++) {
        const clearedFunctionCallStack = {
            ...analysis.functionCallStack.get(idx),
            loadedReferences: {}
        }

        clearedAnalysis.functionCallStack = clearedAnalysis.functionCallStack.push(clearedFunctionCallStack);
    }

    return clearedAnalysis;
}
