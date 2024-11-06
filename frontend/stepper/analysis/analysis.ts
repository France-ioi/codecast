import {DebugProtocol} from 'vscode-debugprotocol';
import {addAutoRecordingBehaviour} from "../../recorder/record";
import {Bundle} from "../../linker";
import {analysisTogglePath} from "./analysis_slice";
import {App} from '../../app_types';
import log from 'loglevel';

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
    args?: (string|{value: string})[],
}
export interface AnalysisScope extends DebugProtocol.Scope {
    variables: (AnalysisVariable | string)[], // It can be a variablesReference to avoid cycles
    variableDetails?: {[reference:string]: AnalysisVariable},
}
export interface AnalysisVariable extends DebugProtocol.Variable {
    variables?: (AnalysisVariable | string)[], // It can be a variablesReference to avoid cycles
    alreadyVisited?: boolean,
    loaded?: boolean,
    collapsed?: boolean,
    withCurlyBraces?: boolean,
}

// Codecast format for visual display
export interface CodecastAnalysisSnapshot {
    stackFrames?: CodecastAnalysisStackFrame[],
}

export interface CodecastAnalysisStackFrame extends DebugProtocol.StackFrame {
    variables: CodecastAnalysisVariable[],
    directives?: any[],
    args?: (string|{value: string})[],
}

export interface CodecastAnalysisVariable {
    name: string,
    value: string,
    path: string,
    address?: string,
    variables?: CodecastAnalysisVariable[]|null,
    loaded?: boolean,
    previousValue?: string,
    type?: string,
    displayType?: boolean,
    variablesReference: number,
    alreadyVisited?: boolean,
    collapsed?: boolean,
    withCurlyBraces?: boolean,
}

export interface AnalysisConversionOptions {
    displayType?: boolean,
}

export const convertAnalysisDAPToCodecastFormat = (analysis: AnalysisSnapshot, lastAnalysis: AnalysisSnapshot, options: AnalysisConversionOptions = {}): CodecastAnalysisSnapshot => {
    let codecastAnalysis: CodecastAnalysisSnapshot = {
        ...analysis,
        stackFrames: [],
    };

    const previousValues = fetchPreviousValuesFromLastAnalysis(lastAnalysis);

    for (let stackFrameId = 0; stackFrameId < analysis.stackFrames.length; stackFrameId++) {
        let stackFrame = analysis.stackFrames[stackFrameId];
        let codecastStackFrame: CodecastAnalysisStackFrame = {
            id: stackFrame.id,
            name: stackFrame.name,
            directives: stackFrame.directives,
            line: stackFrame.line,
            column: stackFrame.column - 1,
            source: stackFrame.source,
            args: stackFrame.args,
            variables: [],
        };

        for (let scopeId = 0; scopeId < stackFrame.scopes.length; scopeId++) {
            let variableDetails: {[reference: string]: AnalysisVariable} = stackFrame.scopes[scopeId].variableDetails;
            for (let variable of stackFrame.scopes[scopeId].variables) {
                if (typeof variable === 'string') {
                    variable = variableDetails[variable];
                }

                const codecastVariable = convertVariableDAPToCodecastFormat(stackFrameId, scopeId, null, variable, previousValues, variableDetails, options.displayType);
                if (null !== codecastVariable) {
                    codecastStackFrame.variables.push(codecastVariable);
                }
            }

            // Keep only the first scope for now (local variables), maybe we'll need to change that later
            break;
        }

        codecastAnalysis.stackFrames.push(codecastStackFrame);
    }

    return codecastAnalysis;
}

export const convertVariableDAPToCodecastFormat = (stackFrameId: number, scopeId: number, path: string, variable: AnalysisVariable, previousValues, variableDetails: {[reference: string]: AnalysisVariable}, displayType?: boolean): CodecastAnalysisVariable|null => {
    log.getLogger('analysis').debug('Convert variable', {stackFrameId, scopeId, variable, previousValues});
    if (variable.presentationHint) {
        return null;
    }

    const newPath = null !== path ? path + '.' + variable.name : variable.name;
    let previousValueHash = `${stackFrameId}.${scopeId}.${newPath}`;
    let previousValue = previousValueHash in previousValues ? previousValues[previousValueHash] : null;

    let variables = null;
    if (Array.isArray(variable.variables)) {
        const innerVariables = [];
        for (let innerVariable of variable.variables) {
            if (typeof innerVariable === 'string') {
                innerVariable = variableDetails[innerVariable];
            }

            const result = convertVariableDAPToCodecastFormat(stackFrameId, scopeId, newPath, innerVariable, previousValues, variableDetails);
            if (result) {
                innerVariables.push(result);
            }
        }

        variables = innerVariables;
    }

    return {
        ...variable,
        variables,
        previousValue,
        path: newPath,
        displayType,
    } as CodecastAnalysisVariable;
}

const fetchPreviousValuesFromLastAnalysis = (lastAnalysis: AnalysisSnapshot) => {
    const previousValues: {[hash: string]: string} = {};

    const walkVariable = (stackFrameId: number, scopeId: number, path: string, variable: string|AnalysisVariable, variableDetails: {[reference: string]: AnalysisVariable}) => {
        if (typeof variable === 'string') {
            variable = variableDetails[variable];
        }

        const newPath = null !== path ? path + '.' + variable.name : variable.name;
        const hash = `${stackFrameId}.${scopeId}.${newPath}`;
        previousValues[hash] = variable.value;

        if (variable.variables) {
            for (let innerVariable of variable.variables) {
                walkVariable(stackFrameId, scopeId, newPath, innerVariable, variableDetails);
            }
        }
    }

    for (let stackFrameId = 0; stackFrameId < lastAnalysis.stackFrames.length; stackFrameId++) {
        let stackFrame = lastAnalysis.stackFrames[stackFrameId];
        for (let scopeId = 0; scopeId < stackFrame.scopes.length; scopeId++) {
            let variableDetails: {[reference: string]: DebugProtocol.Variable} = stackFrame.scopes[scopeId].variableDetails;
            for (let variable of stackFrame.scopes[scopeId].variables) {
                walkVariable(stackFrameId, scopeId, null, variable, variableDetails);
            }
        }
    }

    return previousValues;
}


export default function (bundle: Bundle) {
    bundle.defer(function (app: App) {
        if ('main' !== app.environment) {
            return;
        }

        addAutoRecordingBehaviour(app, {
            actions: [
                analysisTogglePath,
            ],
            onResetDisabled: true,
        });
    });
}
