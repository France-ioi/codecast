/* XXX to be integrated using stepper API

A `Stored Value` can have one of these shapes:
  {kind: 'scalar', ref, current, previous, load, store}
  {kind: 'array', count, cells: [{index, address, content}]}

*/

import {Record, List, Map} from 'immutable';

interface AnalysisC {
    functionCallStack: any,
    callReturn?: {
        func: any,
        args: any,
        result: any
    }
}

export const StackFrame = Record({
    scope: null, key: null, func: null, args: null,
    localNames: List(),
    localMap: Map(),
    directives: List()
});

export const analyseState = function (programState): AnalysisC {
    const functionCallStack = analyseScope(programState.scope);
    const result: AnalysisC = {functionCallStack};
    if (programState.direction === 'out') {
        result.callReturn = {
            func: programState.control.values[0],
            args: programState.control.values.slice(1),
            result: programState.result
        };
    }

    return Object.freeze(result);
};

/*
  Recursively analyse the interpreter's scope structure and build convenient
  Immutable data structures. Good candidate for memoisation.
*/
const analyseScope = function (scope) {
    if (!scope) {
        return List();
    }
    let functionCallStack = analyseScope(scope.parent);
    // 'function' and 'block' scopes have directives,
    // 'function' scopes clears the active directives.
    switch (scope.kind) {
        case 'function': {
            const func = scope.values[0];
            const args = scope.values.slice(1);
            functionCallStack = functionCallStack.push(StackFrame({
                scope: scope,
                key: scope.key,
                func,
                args,
                directives: List(scope.directives)
            }));
            break;
        }
        case 'block': {
            functionCallStack = functionCallStack.updateIn([functionCallStack.size - 1, 'directives'], directives =>
                directives.concat(scope.directives));
            break;
        }
        case 'variable': {
            const {name, type, ref} = scope;
            functionCallStack = functionCallStack.update(functionCallStack.size - 1, function (stackFrame) {
                // Append the name to the list of local names, taking care of shadowing.
                stackFrame = stackFrame.update('localNames', function (localNames) {
                    const i = localNames.indexOf(name);
                    if (-1 !== i) {
                        localNames = localNames.delete(i);
                    }
                    localNames = localNames.push(name);
                    return localNames;
                });
                // Associate the name with a (frozen) {type, ref} object.
                stackFrame = stackFrame.setIn(['localMap', name], Object.freeze({type, ref}));
                return stackFrame;
            });
            break;
        }
    }
    return functionCallStack;
};

export const collectDirectives = function (functionCallStack, focusDepth) {
    const ordered = [];
    const functionCallStackMap = {};
    // StackFrames are collected in reverse order, so that the directive's render
    // function should use functionCallStack[key][0] to access the innermost stackFrame.
    for (let depth = functionCallStack.size - 1 - focusDepth; depth >= 0; depth -= 1) {
        const stackFrame = functionCallStack.get(depth);
        const directives = stackFrame.get('directives');
        directives.forEach(function (directive) {
            const {key} = directive;
            if (key in functionCallStackMap) {
                functionCallStackMap[key].push(stackFrame);
            } else {
                ordered.push(directive);
                functionCallStackMap[key] = [stackFrame];
            }
        })
    }
    return {ordered, functionCallStackMap};
};
