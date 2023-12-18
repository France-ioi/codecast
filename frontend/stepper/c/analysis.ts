/* XXX to be integrated using stepper API

A `Stored Value` can have one of these shapes:
  {kind: 'scalar', ref, current, previous, load, store}
  {kind: 'array', count, cells: [{index, address, content}]}

*/

import {StepperDirectives} from "../index";
import {AnalysisScope, AnalysisSnapshot, AnalysisStackFrame, AnalysisVariable} from '../analysis/analysis';
import {readValue} from '../views/c/utils';
import * as C from '@france-ioi/persistent-c';

export interface AnalysisC {
    functionCallStack: any,
    callReturn?: {
        func: any,
        args: any,
        result: any
    }
}

export interface StackFrameUnixAnalysis {
    scope: any,
    key: number,
    func: {
        name: string,
        body: any[],
    },
    args: any[],
    localNames: string[],
    localMap: {[name: string]: {ref: any, type: any}},
    directives: any[],
}

export const analyseState = function(programState): AnalysisC {
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
const analyseScope = function(scope): StackFrameUnixAnalysis[] {
    if (!scope) {
        return [];
    }

    let functionCallStack = analyseScope(scope.parent);

    // 'function' and 'block' scopes have directives,
    // 'function' scopes clears the active directives.
    switch (scope.kind) {
        case 'function': {
            const func = scope.values[0];
            const args = scope.values.slice(1);
            functionCallStack.push({
                scope: scope,
                key: scope.key,
                func,
                args,
                directives: scope.directives,
                localNames: [],
                localMap: {},
            });

            break;
        }
        case 'block': {
            functionCallStack[functionCallStack.length - 1].directives = [
                ...functionCallStack[functionCallStack.length - 1].directives,
                ...scope.directives,
            ];
            break;
        }
        case 'variable': {
            const {name, type, ref} = scope;
            const localNames = functionCallStack[functionCallStack.length - 1].localNames;
            const i = localNames.indexOf(name);
            if (-1 !== i) {
                localNames.splice(i, 1);
            }
            localNames.push(name);

            functionCallStack[functionCallStack.length - 1].localMap[name] = {type, ref};
            break;
        }
    }

    return functionCallStack;
};

export const collectDirectives = function(functionCallStack, focusDepth): StepperDirectives {
    const ordered = [];
    const functionCallStackMap = {};
    // StackFrames are collected in reverse order, so that the directive's render
    // function should use functionCallStack[key][0] to access the innermost stackFrame.
    for (let depth = functionCallStack.size - 1 - focusDepth; depth >= 0; depth -= 1) {
        const stackFrame = functionCallStack.get(depth);
        const directives = stackFrame.get('directives');
        directives.forEach(function(directive) {
            const {key} = directive;
            if (key in functionCallStackMap) {
                functionCallStackMap[key].push(stackFrame);
            } else {
                ordered.push(directive);
                functionCallStackMap[key] = [stackFrame];
            }
        })
    }

    return Object.freeze({
        ordered,
        functionCallStackMap,
        functionCallStack: null
    });
};

export function convertUnixStateToAnalysisSnapshot(programState: any, lastProgramState: any): AnalysisSnapshot {
    const functionCallStack = analyseScope(programState.scope);
    const result: AnalysisC = {functionCallStack};
    if (programState.direction === 'out') {
        result.callReturn = {
            func: programState.control.values[0],
            args: programState.control.values.slice(1),
            result: programState.result
        };
    }

    console.log('callstack', functionCallStack);

    /* Hide function calls that have no position in user code. */
    const filteredFunctionCallStack = functionCallStack.filter(function(stackFrame) {
        return stackFrame.func.body[1].range;
    });

    return {
        stackFrames: filteredFunctionCallStack.map(stackFrame => convertUnixStackFrameToAnalysisStackFrame(stackFrame, programState, lastProgramState)).slice().reverse(),
    };
}

function convertUnixStackFrameToAnalysisStackFrame(unixStackFrame: StackFrameUnixAnalysis, programState: any, lastProgramState: any): AnalysisStackFrame {
    const context = {programState, lastProgramState};
    const variables: AnalysisVariable[] = [];
    for (let variableName of unixStackFrame.localNames) {
        const {type, ref} = unixStackFrame.localMap[variableName];
        const limits = {scalars: 0, maxScalars: 15};
        const value =  readValue(context, C.pointerType(type), ref.address, limits)
        console.log({variableName, value});

        const typeDecl = renderDeclType(type, '', 0);
        console.log({typeDecl});

        const variable = convertUnixValueToDAPVariable(variableName, typeDecl, value, ref.address, {}, null, {});
        variables.push(variable);
    }

    const analysisScope: AnalysisScope = {
        variables,
        variablesReference: 0,
        expensive: false,
        name: null,
    };

    const rangeData = programState.control?.node[1]?.range;
    const range = rangeData ? {
        line: rangeData.start.row + 1,
        column: rangeData.start.column + 1,
        endLine: rangeData.end.row + 1,
        endColumn: rangeData.end.column + 1,
    } : {
        line: null,
        column: null,
    };

    return {
        id: null,
        name: unixStackFrame.func.name,
        args: unixStackFrame.args.map(arg => {
            console.log('arg', renderValue(arg));

            return {
                value: renderValue(arg),
            };
        }),
        ...range,
        scopes: [analysisScope],
        directives: [],
    };
}

function renderDeclType(type, subject, prec): string {
    switch (type.kind) {
        case 'function':
            // TODO: print param types?
            return renderDeclType(type.result, `${parensIf(prec > 0, subject)}()`, 0);
        case 'pointer':
            return renderDeclType(type.pointee, `*${subject}`, 1);
        case 'array':
            return renderDeclType(type.elem,
                `${parensIf(prec > 0, subject)}[${type.count && type.count.toString()}]`, 0);
        case 'record':
            return `struct ${type.name}${subject}`;
        case 'builtin':
            return `${type.repr}${subject}`;
        default:
            return `invalid kind ${type.kind}`;
    }
}

function parensIf(cond, elem): string {
    return cond ? `(${elem})` : elem;
}

function renderValue(value: string) {
    if (value === undefined) {
        return 'noval';
    }
    if (value === null) {
        return 'void';
    }
    return value.toString();
}

export const convertUnixValueToDAPVariable = (name: string, type: string, value: any, address: any, visited: {[uuid: string]: boolean}, loadReference: string, loadedReferences): AnalysisVariable => {
    // log.getLogger('python_runner').debug('convert value', name, value, visited, loadedReferences);
    let variableData = {
        name,
        type,
        loaded: name in loadedReferences || (null !== loadReference && loadReference in loadedReferences),
        address: address ? '0x' + address.toString(16) : null,
    };

    console.log('value to convert', value);

    if (value.kind === 'ellipsis') {
        return {
            ...variableData,
            value: '...',
            alreadyVisited: true,
            variablesReference: 0,
        };
        // return <span className='value value-ellipsis'>{'…'}</span>;
    }
    if (value.kind === 'scalar') {
        // Value shape is {ref, current, previous, load, store}, see analysis.js for
        // details.
        return {
            ...variableData,
            value: renderValue(value.current),
            alreadyVisited: true,
            variablesReference: 0,
        };
    }
    if (value.kind === 'array') {
        return {
            ...variableData,
            value: renderValue(value.current),
            variables: value.cells.map((cell, index) => convertUnixValueToDAPVariable(index, null, cell.content, address, visited, loadReference, loadedReferences)),
            alreadyVisited: true,
            variablesReference: 0,
            collapsed: true,
            withCurlyBraces: true,
        };
    }
    if (value.kind === 'record') {
        return {
            ...variableData,
            value: renderValue(value.current),
            variables: value.fields.map((field) => convertUnixValueToDAPVariable(field.name, null, field.content, address, visited, loadReference, loadedReferences)),
            alreadyVisited: true,
            variablesReference: 0,
        };
    }

    throw `unknown value kind ${value.kind}`;
}
