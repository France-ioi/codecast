import Immutable from 'immutable';

/**
 * Enable debug of skulpt analysis.
 *
 * 0 : No analysis
 * 1 : Only the result of analysis
 * 2 : The details of analysis
 *
 * @type {int}
 */
const SKULPT_ANALYSIS_DEBUG = 2;

/**
 * Transforms the skulpt state (the suspensions) to something readable with the variables content.
 *
 * @param {Array} suspensions   The skulpt suspensions.
 * @param {Object} lastAnalysis The last analysis (this function on the precedent step).
 *
 * @returns {Object}
 */
export const analyseSkulptState = function (suspensions, lastAnalysis) {
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        console.log('[¥¥¥¥¥¥¥] Building analysis');
        console.log(suspensions);
        console.log(lastAnalysis);
    }

    let functionCallStack = Immutable.List();

    if (suspensions) {
        for (let suspensionIdx = 0; suspensionIdx < suspensions.length; suspensionIdx++) {
            const suspension = suspensions[suspensionIdx];
            if (!isProgramSuspension(suspension)) {
                continue;
            }

            let lastScopeAnalysis = null;
            if (lastAnalysis && lastAnalysis.functionCallStack.size > suspensionIdx) {
                lastScopeAnalysis = lastAnalysis.functionCallStack.get(suspensionIdx);
            }

            const analysedScope = analyseSkulptScope(suspension, lastScopeAnalysis);
            analysedScope.key = suspensionIdx;

            functionCallStack = functionCallStack.push(analysedScope);
        }
    }

    const analysis = {
        ...lastAnalysis,
        functionCallStack: functionCallStack,
        stepNum: (lastAnalysis.stepNum + 1)
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
var isProgramSuspension = function(suspension) {
    return suspension.hasOwnProperty('$lineno');
};

/**
 * Transforms the skulpt scope (one suspension) to something readable with the variables content.
 *
 * @param {Object} suspension   The skulpt suspension.
 * @param {Object} lastAnalysis The last analysis (this function on the precedent step and the same scope).
 *
 * @returns {Object}
 */
export const analyseSkulptScope = function (suspension, lastAnalysis) {
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        console.log('////// Analyse scope...');
        console.log(suspension);
        console.log(lastAnalysis);
    }

    let variables = Immutable.Map();

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

    for (const variableIdx in variableNames) {
        const variableName = variableNames[variableIdx];
        const value = suspVariables[variableName];

        if (typeof value === 'function') {
            continue;
        }
        if (value instanceof Sk.builtin.func) {
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

    const analysis = {
        variables,
        name,
        args
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
    '$compareres',
    '$loadgbl',
    '$binop'
];
/**
 * Filter the variable names by removing those useed internally by Skulpt.
 *
 * @param {Array} variableNames The names.
 *
 * @returns {Array}
 */
const filterInternalVariables = (variableNames) => {
    return variableNames.filter((name) => {
        let ignore = false;
        for (const variableBeginWithIgnoreIdx in variablesBeginWithIgnore) {
            const variableBeginWithIgnore = variablesBeginWithIgnore[variableBeginWithIgnoreIdx];
            if (name.indexOf(variableBeginWithIgnore) === 0) {
                return false;
            }
        }

        return true;
    });
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
export const getSkulptSuspensionsCopy = function(suspensions)
{
    const copies = [];
    for (let suspensionIdx in suspensions) {
        const suspension = suspensions[suspensionIdx];
        const copy = {
            ...suspension
        };

        copies[suspensionIdx] = copy;
    }

    return copies;
}
