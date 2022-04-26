import {DebugProtocol, VariablePresentationHint} from 'vscode-debugprotocol';

export const isLoaded = function(loadedReferences, variable) {
    return (variable.cur.hasOwnProperty('_uuid') && loadedReferences.hasOwnProperty(variable.cur._uuid));
};

// DebugAdapterProtocol format
export interface AnalysisSnapshot {
    stackFrames?: AnalysisStackFrame[],
    stepNum?: number,
    code?: string,
    lines?: string[]
    stdout?: string[],
    stderr?: string[],
    terminated?: boolean,
    terminatedReason?: string,
}
export interface AnalysisStackFrame extends DebugProtocol.StackFrame {
    scopes: AnalysisScope[],
    directives?: any[],
}
export interface AnalysisScope extends DebugProtocol.Scope {
    variables: (AnalysisVariable | string)[], // It can be a variablesReference to avoid cycles
    variablesByReference?: {[reference:string]: AnalysisVariable},
}
export interface AnalysisVariable extends DebugProtocol.Variable {
    variables?: (DebugProtocol.Variable | string)[], // It can be a variablesReference to avoid cycles
}

// Codecast format for visual display
export interface CodecastAnalysisSnapshot {
    stackFrames?: CodecastAnalysisStackFrame[],
}

export interface CodecastAnalysisStackFrame extends DebugProtocol.StackFrame {
    variables: CodecastAnalysisVariable[],
    directives?: any[],
}

export interface CodecastAnalysisVariable {
    name: string,
    value: DebugProtocol.Variable[] | string,
    previousValue: DebugProtocol.Variable[] | string,
    type?: string;
    variablesReference: number,
}


export const convertAnalysisDAPToCodecastFormat = (analysis: AnalysisSnapshot, lastAnalysis: AnalysisSnapshot): CodecastAnalysisSnapshot => {
    let codecastAnalysis: CodecastAnalysisSnapshot = {
        ...analysis,
        stackFrames: [],
    };

    //TODO: handle this
    let variablesByReference: {[reference: string]: AnalysisVariable} = {};

    for (let stackFrameId = 0; stackFrameId < analysis.stackFrames.length; stackFrameId++) {
        let stackFrame = analysis.stackFrames[stackFrameId];
        let codecastStackFrame: CodecastAnalysisStackFrame = {
            ...stackFrame,
            variables: [],
        };

        for (let scopeId = 0; scopeId < stackFrame.scopes.length; scopeId++) {
            for (let variable of stackFrame.scopes[scopeId].variables) {
                if (typeof variable === 'string') {
                    variable = variablesByReference[variable];
                }

                let previousValue = fetchPreviousValueFromLastAnalysis(lastAnalysis, stackFrameId, scopeId, variable);

                codecastStackFrame.variables.push({
                    ...variable,
                    previousValue,
                } as CodecastAnalysisVariable);
            }
        }

        codecastAnalysis.stackFrames.push(codecastStackFrame);
    }

    return codecastAnalysis;
}

const fetchPreviousValueFromLastAnalysis = (lastAnalysis: AnalysisSnapshot, stackFrameId: number, scopeId: number, variable: AnalysisVariable): string|(string|DebugProtocol.Variable)[] => {
    let variablesByReference: {[reference: string]: DebugProtocol.Variable} = {};

    if (lastAnalysis.stackFrames && lastAnalysis.stackFrames.length > stackFrameId) {
        let lastAnalysisStackFrame = lastAnalysis.stackFrames[stackFrameId];
        if (lastAnalysisStackFrame.scopes && lastAnalysisStackFrame.scopes.length > scopeId) {
            let lastAnalysisScope = lastAnalysisStackFrame.scopes[scopeId];
            let lastVariables = lastAnalysisScope.variables;
            for (let lastVariable of lastVariables) {
                if (typeof lastVariable === 'string') {
                    lastVariable = variablesByReference[lastVariable];
                }
                if (variable.name === lastVariable.name) {
                    return null !== lastVariable.value && undefined !== lastVariable.value ? lastVariable.value : lastVariable.variables;
                }
            }
        }
    }

    return null;
}