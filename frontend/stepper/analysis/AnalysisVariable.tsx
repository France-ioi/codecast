import * as React from 'react';
import {AnalysisVariableValue} from "./AnalysisVariableValue";
import {AnalysisVariable as AnalysisVariableType, CodecastAnalysisVariable} from "../analysis";

interface AnalysisVariableProps {
    path?: string,
    variable: CodecastAnalysisVariable,
    visited: any,
    loadedReferences: any,
    scopeIndex: number,
    openedPaths: {
        [key: string]: boolean
    }
}

export const AnalysisVariable = (props: AnalysisVariableProps): JSX.Element => {
    const variable = props.variable;

    let classes = 'variable-container';
    // if (variable.value instanceof Sk.builtin.object) {
    //     if (variable.value.hasOwnProperty('$d') || variable.value instanceof Sk.builtin.dict) {
    //         classes += ' vardecl-object';
    //     }
    // }

    let path = null;
    if (props.path) {
        path = props.path;
    } else if (variable.name) {
        path = variable.name;
    }

    return (
        <span className={classes}>
            <span>
                <span className="variable-name">{variable.name}</span>
            </span>
            {' = '}
            <span className="vardecl-value">
                <span className="value">
                    <AnalysisVariableValue
                        cur={variable.value}
                        old={variable.previousValue}
                        visited={props.visited}
                        path={path}
                        loadedReferences={props.loadedReferences}
                        openedPaths={props.openedPaths}
                        scopeIndex={props.scopeIndex}
                    />
                </span>
            </span>
        </span>
    )
}
