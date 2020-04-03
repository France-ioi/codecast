import Immutable from 'immutable';

/**
 * Transforms the skulpt state (the suspensions) to something readable with the variables content.
 *
 * @param {Array} suspensions   The skulpt suspensions.
 * @param {Object} lastAnalysis The last analysis (this function on the precedent step).
 *
 * @returns {Object}
 */
export const analyseSkulptState = function (suspensions, lastAnalysis) {
    console.log('[¥¥¥¥¥¥¥] Building analysis');
    console.log(suspensions);
    console.log(lastAnalysis);

    let functionCallStack = Immutable.List();

    if (suspensions) {
        for (let suspensionIdx = 0; suspensionIdx < suspensions.length; suspensionIdx++) {
            const suspension = suspensions[suspensionIdx];

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
        functionCallStack: functionCallStack
    };

    console.log('[¥¥¥¥¥¥¥] End of building analysis');
    console.log(analysis);

    return Object.freeze(analysis);
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
    console.log('////// Analyse scope...');
    console.log(suspension);
    console.log(lastAnalysis);

    let variables = Immutable.Map();

    let name = suspension._name;
    if (name === '<module>') {
        name = '';
    }

    const args = suspension._argnames;

    // If $loc is empty, we are in a function's scope.
    if (Object.keys(suspension.$loc).length === 0 && suspension.$loc.constructor === Object) {
        const variableNames = sortArgumentsFirst(filterInternalVariables(Object.keys(suspension.$tmps)), args);
        for (const variableIdx in variableNames) {
            const variableName = variableNames[variableIdx];
            const value = suspension.$tmps[variableName];

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
            // const newValue = cloneSkuptValue(value);
            // const valueWithPrevious = valuesWithPrevious(newValue, lastValue);

            // variables = variables.set(variableName, valueWithPrevious);

            variables = variables.set(variableName, {
                cur: value,
                old: lastValue
            });
        }
    } else {
        // Global scope.
        const variableNames = sortArgumentsFirst(filterInternalVariables(Object.keys(suspension.$loc)), args);
        for (const variableIdx in variableNames) {
            const variableName = variableNames[variableIdx];
            const value = suspension.$loc[variableName];

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
            // const newValue = cloneSkuptValue(value);
            // const valueWithPrevious = valuesWithPrevious(newValue, lastValue);

            // variables = variables.set(variableName, valueWithPrevious);

            variables = variables.set(variableName, {
                cur: value,
                old: lastValue
            });
        }
    }

    const analysis = {
        variables,
        name,
        args
    };

    console.log('////// End of analyse scope...');
    console.log(analysis);

    return analysis;
};

/**
 * Gets the values with the new and previous value.
 *
 * @param {*} newValue
 * @param {*} oldValue
 *
 * @return {*}
 */
const valuesWithPrevious = (newValue, oldValue) => {
    console.log(newValue, oldValue);
    if (Array.isArray(newValue) && Array.isArray(oldValue)) {
        let values = [];
        const maxIdx = Math.max(newValue.length, oldValue.length);
        for (let idx = 0; idx < maxIdx; idx++) {
            let curNewValue = undefined;
            if (newValue.length > idx) {
                curNewValue = newValue[idx];
            }
            let curOldValue = undefined;
            if (oldValue.length > idx) {
                curOldValue = oldValue[idx];
            }

            values.push(valuesWithPrevious(curNewValue, curOldValue));
        }

        return values;
    } else if (Array.isArray(oldValue)) {
        return {
            cur: newValue,
            old: undefined
        };
    } else if (Array.isArray(newValue)) {
        let values = [];
        for (let idx = 0; idx < newValue.length; idx++) {
            values.push(valuesWithPrevious(newValue[idx], undefined));
        }

        return values;
    } else {
        let newOldValue = undefined;
        if (oldValue) {
            newOldValue = oldValue.cur;
        }
        return {
            cur: newValue,
            old: newOldValue
        };
    }
};

/**
 * Clone a skulpt value.
 *
 * @param {Object} value The skulpt bultin object.
 *
 * @returns {[]|*}
 */
const cloneSkuptValue = (value) => {
    if (Array.isArray(value)) {
        let values = [];
        for (let idx = 0; idx < value.length; idx++) {
            values.push(cloneSkuptValue(value[idx]));
        }

        return values;
    } else if (value.hasOwnProperty('v')) {
        return cloneSkuptValue(value.v);
    } else {
        return value;
    }
};

// To filter the internal variables of Skulpt.
const variablesBeginWithIgnore = [
    '__name__',
    '__doc__',
    '__package__',
    '__file__',
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
