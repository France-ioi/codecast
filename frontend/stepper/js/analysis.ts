import {AnalysisScope, AnalysisSnapshot, AnalysisStackFrame, AnalysisVariable} from "../analysis/analysis";

export const fetchLatestBlocklyAnalysis = function (localVariables: any, lastAnalysis: AnalysisSnapshot, newStepNum: number): AnalysisSnapshot {
    let stackFrames: AnalysisStackFrame[] = [];

    console.log('local variables', localVariables);

    const stackFrame: AnalysisStackFrame = {
        id: 1,
        name: null,
        column: null,
        line: null,
        scopes: [],
    };

    const variables = [];
    if (localVariables) {
        for (let [name, value] of Object.entries(localVariables)) {
            const variable = convertBlocklyValueToDAPFormat(name, value, []);
            variables.push(variable);
        }
    }

    const scope: AnalysisScope = {
        variables,
        variablesReference: 0,
        expensive: false,
        name: null,
    };

    stackFrame.scopes.push(scope);
    stackFrames.push(stackFrame);

    const analysis = {
        ...lastAnalysis,
        stackFrames,
        stepNum: newStepNum
    };

    return Object.freeze(analysis);
}

let variableReferenceCount = 1;

export const convertBlocklyValueToDAPFormat = (name: string, value: any, visited: any[]): AnalysisVariable => {
    console.log('convert value', name, value, visited);
    let variableData = {
        name,
        type: value && value.class ? value.class : (value && value.type ? value.type : typeof value),
    };

    if (visited.find(visitedElement => visitedElement === value)) {
        console.log('already visited', visited);
        return {
            ...variableData,
            value: null,
            alreadyVisited: true,
            variablesReference: 0,
        };
    }

    if (value && value.class === 'Array') {
        return {
            ...variableData,
            value: null,
            variables: Object.entries(value.properties).map(([index, item]) => {
                return convertBlocklyValueToDAPFormat(index, item, [...visited, value]);
            }),
            indexedVariables: Object.entries(value.properties).length,
            variablesReference: variableReferenceCount++,
        };
    }

    if (value && value.class === 'Object') {
        return {
            ...variableData,
            value: null,
            variables: Object.entries(value.properties).map(([key, item]) => {
                return convertBlocklyValueToDAPFormat(key, item, [...visited, value]);
            }),
            namedVariables: Object.entries(value.properties).length,
            variablesReference: variableReferenceCount++,
        };
    }

    if ('string' === variableData.type) {
        return {
            ...variableData,
            value: `"${value}"`,
            variablesReference: 0,
        };
    }

    if ('boolean' === variableData.type) {
        return {
            ...variableData,
            value: value ? 'True' : 'False',
            variablesReference: 0,
        };
    }

    return {
        ...variableData,
        value: value,
        variablesReference: 0,
    };
}
