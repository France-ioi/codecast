import {DebugProtocol} from 'vscode-debugprotocol';
import {addAutoRecordingBehaviour} from "../../recorder/record";
import {Bundle} from "../../linker";
import {App} from "../../index";
import analysisSlice, {analysisRecordableActions} from "./analysis_slice";

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
    variables?: (AnalysisVariable | string)[], // It can be a variablesReference to avoid cycles
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
    value: string,
    path: string,
    variables: CodecastAnalysisVariable[],
    previousValue?: string,
    type?: string,
    variablesReference: number,
}


export const convertAnalysisDAPToCodecastFormat = (analysis: AnalysisSnapshot, lastAnalysis: AnalysisSnapshot): CodecastAnalysisSnapshot => {
    let codecastAnalysis: CodecastAnalysisSnapshot = {
        ...analysis,
        stackFrames: [],
    };

    const previousValues = fetchPreviousValuesFromLastAnalysis(lastAnalysis);

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

                const codecastVariable = convertVariableDAPToCodecastFormat(stackFrameId, scopeId, null, variable, previousValues, variablesByReference);
                codecastStackFrame.variables.push(codecastVariable);
            }
        }

        codecastAnalysis.stackFrames.push(codecastStackFrame);
    }

    return codecastAnalysis;
}

export const convertVariableDAPToCodecastFormat = (stackFrameId: number, scopeId: number, path: string, variable: AnalysisVariable, previousValues, variablesByReference: {[reference: string]: AnalysisVariable}): CodecastAnalysisVariable => {
    const newPath = null !== path ? path + '.' + variable.name : variable.name;
    let previousValueHash = `${stackFrameId}.${scopeId}.${newPath}`;
    let previousValue = previousValueHash in previousValues ? previousValues[previousValueHash] : null;

    return {
        ...variable,
        variables: variable.variables ? variable.variables.map(innerVariable => {
            if (typeof innerVariable === 'string') {
                innerVariable = variablesByReference[innerVariable];
            }

            return convertVariableDAPToCodecastFormat(stackFrameId, scopeId, newPath, innerVariable, previousValues, variablesByReference);
        }) : null,
        previousValue,
        path,
    } as CodecastAnalysisVariable;
}

const fetchPreviousValuesFromLastAnalysis = (lastAnalysis: AnalysisSnapshot) => {
    let variablesByReference: {[reference: string]: DebugProtocol.Variable} = {};

    const previousValues: {[hash: string]: string} = {};

    const walkVariable = (stackFrameId: number, scopeId: number, path: string, variable: string|AnalysisVariable) => {
        if (typeof variable === 'string') {
            variable = variablesByReference[variable];
        }

        const newPath = null !== path ? path + '.' + variable.name : variable.name;
        const hash = `${stackFrameId}.${scopeId}.${newPath}`;
        previousValues[hash] = variable.value;

        if (variable.variables) {
            for (let innerVariable of variable.variables) {
                walkVariable(stackFrameId, scopeId, newPath, innerVariable);
            }
        }
    }

    for (let stackFrameId = 0; stackFrameId < lastAnalysis.stackFrames.length; stackFrameId++) {
        let stackFrame = lastAnalysis.stackFrames[stackFrameId];
        for (let scopeId = 0; scopeId < stackFrame.scopes.length; scopeId++) {
            for (let variable of stackFrame.scopes[scopeId].variables) {
                walkVariable(stackFrameId, scopeId, null, variable);
            }
        }
    }

    return previousValues;
}


export default function (bundle: Bundle) {
    bundle.defer(function (app: App) {
        addAutoRecordingBehaviour(app, {
            sliceName: analysisSlice.name,
            actionNames: analysisRecordableActions,
            actions: analysisSlice.actions,
            onResetDisabled: true,
        });
    });
}
