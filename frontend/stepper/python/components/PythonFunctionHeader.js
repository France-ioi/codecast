import * as React from 'react';
import classnames from "classnames";
import PythonVariableValue from "./PythonVariableValue";

const PythonFunctionHeader = (props) => {
    const argCount = props.func.args.length;

    const args = props.func.args.map((name) => {
        return props.func.variables.get(name);
    });

    return (
        <div className={classnames(["scope-function-title"])}>
            <span>
              {props.func.name}(
                <span>
                    {args.map(function(value, index) {
                        return (
                            <span key={index}>
                                <PythonVariableValue cur={value.cur} old={value.old} />
                                {(index + 1) < argCount ? ', ' : null}
                            </span>
                        );
                    })}
                </span>)
            </span>
        </div>
    );
};

export default PythonFunctionHeader;
