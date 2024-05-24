import {LayoutDirectiveContext} from '../../task/layout/LayoutDirective';
import {CodecastAnalysisStackFrame, CodecastAnalysisVariable} from './analysis';
import {DirectiveVariableName} from './directives/utils';
import AbstractVariableFetcher from './abstract_variable_fetcher';

export default class DefaultVariableFetcher extends AbstractVariableFetcher {
    getNumber(expr, options) {
        return expr;
    }
    getList(expr, defaultValue) {
        return expr;
    }
    stringifyVariableName(name) {
        return name;
    }
    getVariable(context: LayoutDirectiveContext, name: DirectiveVariableName, elemCount?: number): CodecastAnalysisVariable {
        // Check in the last (the current) and the first (which is the global) scopes.

        const variableName = Array.isArray(name) ? name[1] : name;
        const analysis = context.analysis;
        const nbScopes = analysis.stackFrames.length;
        let variable: CodecastAnalysisVariable = null;
        if (nbScopes) {
            variable = this.getVariableInScope(analysis.stackFrames[nbScopes - 1], variableName);
        }
        if (!variable && nbScopes > 1) {
            variable = this.getVariableInScope(analysis.stackFrames[0], variableName);
        }

        return variable;
    }
    getVariables(context: LayoutDirectiveContext, names: DirectiveVariableName[]): {name: DirectiveVariableName, value: CodecastAnalysisVariable}[] {
        return names.map((name) => {
            return {
                name,
                value: this.getVariable(context, name)
            }
        });
    }
    /**
     * Gets a variable by name in a scope.
     */
    getVariableInScope(stackFrame: CodecastAnalysisStackFrame, name: string): CodecastAnalysisVariable {
        let variable = stackFrame.variables.find(variable => name === variable.name);

        return variable ? variable : null;
    }
}
