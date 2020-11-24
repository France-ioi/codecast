import * as React from 'react';
import {Map} from 'immutable';
import PythonVariableValue from "./PythonVariableValue";
import {SkulptVariable} from "../analysis";

interface PythonVariableProps {
    value: SkulptVariable,
    path: string,
    name: string,
    visited: any,
    loadedReferences: any,
    scopeIndex: number,
    openedPaths: Map<string, boolean>
}

const PythonVariable = (props: PythonVariableProps): JSX.Element => {
    let classes = 'variable-container';
    if (props.value.cur instanceof Sk.builtin.object) {
        if (props.value.cur.hasOwnProperty('$d') || props.value.cur instanceof Sk.builtin.dict) {
            classes += ' vardecl-object';
        }
    }

    let path = null;
    if (props.hasOwnProperty('path')) {
        path = props.path;
    } else if (props.name) {
        path = props.name;
    }

    return (
        <span className={classes}>
            <span>
                <span className="variable-name">{props.name}</span>
            </span>
            {' = '}
            <span className="vardecl-value">
                <span className="value">
                    <PythonVariableValue
                        cur={props.value.cur}
                        old={props.value.old}
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

export default PythonVariable;
