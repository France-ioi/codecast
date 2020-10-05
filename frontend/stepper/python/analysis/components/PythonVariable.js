import * as React from 'react';
import PythonVariableValue from "./PythonVariableValue";
import PythonFunctionHeader from "./PythonFunctionHeader";

const PythonVariable = (props) => {
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
                        name={props.name}
                        cur={props.value.cur}
                        old={props.value.old}
                        visited={props.visited}
                        path={path}
                        openedPaths={props.openedPaths}
                        scopeIndex={props.scopeIndex}
                    />
                </span>
            </span>
        </span>
    )
}

export default PythonVariable;
