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
                    <span>
                        <PythonVariableValue value={props.value} />
                    </span>
                    <span className="value-previous">
                        <PythonVariableValue value={null} />
                    </span>
                </span>
            </span>
        </div>
    );
};

export default PythonVariable;
