import * as React from 'react';
import {AnalysisVariableValue} from "./AnalysisVariableValue";
import {CodecastAnalysisVariable} from "./index";

interface AnalysisVariableProps {
    variable: CodecastAnalysisVariable,
    stackFrameId: number,
}

export const AnalysisVariable = (props: AnalysisVariableProps): JSX.Element => {
    const variable = props.variable;

    return (
        <span className="variable-container">
            <span>
                <span className="variable-name">{variable.name}</span>
            </span>
            {' = '}
            <span className="vardecl-value">
                <span className="value">
                    <AnalysisVariableValue
                        variable={variable}
                        stackFrameId={props.stackFrameId}
                    />
                </span>
            </span>
        </span>
    )
}
