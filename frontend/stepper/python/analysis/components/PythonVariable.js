import * as React from 'react';
import PythonVariableValue from "./PythonVariableValue";

const PythonVariable = (props) => {
    let classes = 'vardecl';
    if (props.value.cur instanceof Sk.builtin.object) {
        if (props.value.cur.hasOwnProperty('$d') || props.value.cur instanceof Sk.builtin.dict) {
            classes += ' vardecl-object';
        }
    }

    return (
        <div className={classes}>
            <span>
                <span className="vardecl-name">{props.name}</span>
            </span>
            {' = '}
            <span className="vardecl-value">
                <span className="value">
                    <PythonVariableValue cur={props.value.cur} old={props.value.old} />
                </span>
            </span>
        </div>
    );
};

export default PythonVariable;
