import * as React from 'react';
import {AnalysisVariable} from "./AnalysisVariable";
import {CodecastAnalysisStackFrame} from "./index";

interface AnalysisFunctionLocalsProps {
    stackFrame: CodecastAnalysisStackFrame,
}

export const AnalysisFunctionLocals = (props: AnalysisFunctionLocalsProps): JSX.Element => {
    const variables = props.stackFrame.variables;

    console.log('variables', variables);

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
            <ul className={!props.stackFrame.name ? 'global-scope' : null}>
                {variablesTemplate}
            </ul>
        </div>
    );
};
