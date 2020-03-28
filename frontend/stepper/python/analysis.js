import Immutable from 'immutable';

export const analyseSkulptState = function (suspensions) {
    console.log('[¥¥¥¥¥¥¥] Building analysis');
    console.log(suspensions);

    let functionCallStack = Immutable.List();
    let currentIdx = 0;
    for (const suspensionIdx in suspensions) {
        const suspension = suspensions[suspensionIdx];
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

                variables = variables.set(variableName, value);
            }
        } else {
            // Global scope.
            const variableNames = sortArgumentsFirst(filterInternalVariables(Object.keys(suspension.$loc)));
            for (const variableIdx in variableNames) {
                const variableName = variableNames[variableIdx];
                const value = suspension.$loc[variableName];

                if (value instanceof Sk.builtin.func) {
                    continue;
                }

                variables = variables.set(variableName, value);
            }
        }

        functionCallStack = functionCallStack.push({
            variables,
            name,
            args,
            key: currentIdx,
        });

        currentIdx = currentIdx + 1;
    }

    const result = {
        functionCallStack: functionCallStack.reverse()
    };

    console.log('[¥¥¥¥¥¥¥] End of building analysis');
    console.log(result);

    return Object.freeze(result);
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
