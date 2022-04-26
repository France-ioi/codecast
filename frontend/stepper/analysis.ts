import {DebugProtocol} from 'vscode-debugprotocol';

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
    variables: (DebugProtocol.Variable | string)[], // It can be a variablesReference to avoid cycles
}
export interface AnalysisVariable extends DebugProtocol.Variable {
    variables?: (DebugProtocol.Variable | string)[], // It can be a variablesReference to avoid cycles
    variablesByReference?: {[reference:string]: DebugProtocol.Variable},
}

// Codecast format for visual display
export interface CodecastAnalysisSnapshot {
    stackFrames?: CodecastAnalysisStackFrame[],
}

export interface CodecastAnalysisStackFrame extends DebugProtocol.StackFrame {
    variables: CodecastAnalysisVariable[],
    directives?: any[],
}

export interface CodecastAnalysisVariable extends DebugProtocol.Variable {
    variables: DebugProtocol.Variable[],
    previousValue: AnalysisVariable,
}


export const convertAnalysisDAPToCodecastFormat = (analysis: AnalysisSnapshot, lastAnalysis: AnalysisSnapshot): CodecastAnalysisSnapshot => {
    let codecastAnalysis: CodecastAnalysisSnapshot = {
        ...analysis,
        stackFrames: [],
    };

    let variablesByReference: {[reference: string]: DebugProtocol.Variable} = {};

    for (let stackFrame of analysis.stackFrames) {
        let codecastStackFrame: CodecastAnalysisStackFrame = {
            ...stackFrame,
            variables: [],
        };

        for (let scopeId in stackFrame.scopes) {
            let variablesHashMap: {[name: string]: CodecastAnalysisVariable} = {};
            for (let variable of stackFrame.scopes[scopeId].variables) {
                if (typeof variable === 'string') {
                    variable = variablesByReference[variable];
                }

                // variablesHashMap[variable.name] = {
                //     ...variable,
                //     value: {
                //         current: variable,
                //         previous: null,
                //     },
                // };

                codecastStackFrame.variables.push({
                    ...variable,
                    previousValue: null,
                } as CodecastAnalysisVariable);
            }
        }

        codecastAnalysis.stackFrames.push(codecastStackFrame);
    }

    return codecastAnalysis;
}