import * as React from 'react';
import PythonVariable from "./PythonVariable";

const PythonFunctionLocals = (props) => {
    return (
        <div className="scope-function-blocks">
            <ul>
                {props.func.variables.entrySeq().map(([name, value]) => (
                    value !== undefined ?
                        <li key={name}>
                            <PythonVariable name={name} value={value} />
                        </li>
                    : null
                ))}
            </ul>
        </div>
    );
};

export default PythonFunctionLocals;
