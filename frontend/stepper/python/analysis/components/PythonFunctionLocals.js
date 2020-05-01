import * as React from 'react';
import PythonVariable from "./PythonVariable";

const PythonFunctionLocals = (props) => {
    return (
        <div className="scope-function-blocks">
            <ul className={!props.func.name ? 'global-scope' : null}>
                {props.func.variables.entrySeq().map(([name, value]) => (
                    value.cur !== undefined ?
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
