import * as React from 'react';
import {AnalysisVariableValue} from "./AnalysisVariableValue";
import {CodecastAnalysisVariable} from "./index";

interface AnalysisVariableProps {
    path?: string,
    variable: CodecastAnalysisVariable,
    stackFrameId: number,
}

export const AnalysisVariable = (props: AnalysisVariableProps): JSX.Element => {
    const variable = props.variable;

    let classes = 'variable-container';
    // if (variable.value instanceof Sk.builtin.object) {
    //     if (variable.value.hasOwnProperty('$d') || variable.value instanceof Sk.builtin.dict) {
    //         classes += ' vardecl-object';
    //     }
    // }

    let path = props.path;

    return (
        <span className={classes}>
            <span>
                <span className="variable-name">{variable.name}</span>
            </span>
            {' = '}
            <span className="vardecl-value">
                <span className="value">
                    <AnalysisVariableValue
                        variable={variable}
                        path={path}
                        stackFrameId={props.stackFrameId}
                    />
                </span>
            </span>
        </span>
    )
}
