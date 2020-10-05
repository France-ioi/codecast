import * as React from 'react';
import PythonVariableValue from "./PythonVariableValue";

const PythonFunctionHeader = (props) => {
    const argCount = props.func.args.length;

    const args = props.func.args.map((name) => {
        const argument = {
            ...props.func.variables.get(name),
            path: null
        };

        if (argument.cur.hasOwnProperty('_uuid')) {
            argument.path = '#' + name;
        }

        return argument;
    });

    return (
        <div className="scope-function-title">
            <span>
              {props.func.name ? (
                  <span>
                      <span className="function-name">{props.func.name}</span>
                      {'('}
                  </span>
              ) : null}
                <span>
                    {args.map(function(argument, index) {
                        return (
                            <span key={index}>
                                <PythonVariableValue
                                    cur={argument.cur}
                                    old={argument.old}
                                    visited={{}}
                                    defaultopened={false}
                                    path={argument.path}
                                    openedPaths={props.openedPaths}
                                    scopeIndex={props.scopeIndex}
                                />
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
