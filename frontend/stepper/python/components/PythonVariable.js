import * as React from 'react';
import PythonVariableValue from "./PythonVariableValue";

const PythonVariable = (props) => {
    return (
        <div className="vardecl">
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
