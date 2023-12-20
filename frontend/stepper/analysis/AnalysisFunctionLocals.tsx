import * as React from 'react';
import {AnalysisVariable} from "./AnalysisVariable";
import {CodecastAnalysisStackFrame} from "./analysis";

interface AnalysisFunctionLocalsProps {
    stackFrame: CodecastAnalysisStackFrame,
    stackFrameName?: string,
}

export const AnalysisFunctionLocals = (props: AnalysisFunctionLocalsProps): JSX.Element => {
    const {stackFrameName} = props;
    const variables = props.stackFrame.variables;

    const variablesTemplate = variables.map((variable) => {
        const {name, value, type} = variable;
        if (value !== undefined && 'module' !== type && 'function' !== type) {
            return (
                <li key={name}>
                    <AnalysisVariable
                        variable={variable}
                        stackFrameId={props.stackFrame.id}
                    />
                </li>
            );
        }

        return null;
    });

    return (
        <div className="scope-function-blocks">
            <ul className={!stackFrameName ? 'global-scope' : null}>
                {variablesTemplate}
            </ul>
        </div>
    );
};
