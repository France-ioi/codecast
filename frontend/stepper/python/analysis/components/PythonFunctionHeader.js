import * as React from 'react';
import PythonVariableValue from "./PythonVariableValue";

const PythonFunctionHeader = (props) => {
    const argCount = props.func.args.length;

    const args = props.func.args.map((name) => {
        return props.func.variables.get(name);
    });

    return (
        <div className="scope-function-title">
            <span>
              {props.func.name ? (props.func.name + ' (') : null}
                <span>
                    {args.map(function(value, index) {
                        return (
                            <span key={index}>
                                <PythonVariableValue cur={value.cur} old={value.old} visited={{}} />
                                {(index + 1) < argCount ? ', ' : null}
                            </span>
                        );
                    })}
                </span>{props.func.name ? ')' : null}
            </span>
        </div>
    );
};

export default PythonFunctionHeader;
