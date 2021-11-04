import * as React from 'react';
import {PythonVariableValue} from "./PythonVariableValue";
import {SkulptScope} from "../analysis";

interface PythonFunctionHeaderProps {
    func: SkulptScope,
    openedPaths: {
        [key: string]: boolean
    },
    scopeIndex: number
}

export const PythonFunctionHeader = (props: PythonFunctionHeaderProps): JSX.Element => {
    const argCount = props.func.args.length;

    const args = props.func.args.map((name) => {
        const argument = {
            ...props.func.variables[name],
            path: null
        };

        if (argument.cur && argument.cur.hasOwnProperty('_uuid')) {
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
                        const loadedReferences = {};

                        return (
                            <span key={index}>
                                <PythonVariableValue
                                    cur={argument.cur}
                                    old={argument.old}
                                    visited={{}}
                                    defaultopened={false}
                                    path={argument.path}
                                    loadedReferences={loadedReferences}
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
