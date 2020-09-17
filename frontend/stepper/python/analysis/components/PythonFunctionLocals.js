import * as React from 'react';
import PythonVariable from "./PythonVariable";
import PythonFunctionHeader from "./PythonFunctionHeader";
import PythonVariableValue from "./PythonVariableValue";

const PythonFunctionLocals = (props) => {
    return (
        <div className="scope-function-blocks">
            <ul className={!props.func.name ? 'global-scope' : null}>
                {props.func.variables.entrySeq().map(([name, value]) => (
                    (
                        value.cur !== undefined &&
                        !(value.cur instanceof Sk.builtin.module) &&
                        !(value.cur instanceof Sk.builtin.func)
                    ) ?
                        <li key={name}>
                            <PythonVariable
                                name={name}
                                value={value}
                                visited={{}}
                                openedPaths={props.openedPaths}
                                scopeIndex={props.scopeIndex}
                            />
                        </li>
                    : null
                ))}
            </ul>
        </div>
    );
};

export default PythonFunctionLocals;
