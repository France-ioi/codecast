import * as React from 'react';
import {AnalysisVariableValue} from "./AnalysisVariableValue";
import {CodecastAnalysisStackFrame} from "../analysis";

interface AnalysisFunctionHeaderProps {
    stackFrame: CodecastAnalysisStackFrame,
    openedPaths: {
        [key: string]: boolean
    },
    scopeIndex: number
}

export const AnalysisFunctionHeader = (props: AnalysisFunctionHeaderProps): JSX.Element => {
    // const argCount = props.stackFrame.args.length;
    //
    // const args = props.stackFrame.args.map((name) => {
    //     const argument = {
    //         ...props.stackFrame.variables[name],
    //         path: null
    //     };
    //
    //     if (argument.cur && argument.cur.hasOwnProperty('_uuid')) {
    //         argument.path = '#' + name;
    //     }
    //
    //     return argument;
    // });

    return (
        <div className="scope-function-title">
            <span>
              {props.stackFrame.name ? (
                  <span>
                      <span className="function-name">{props.stackFrame.name}</span>
                      {'('}
                  </span>
              ) : null}
                <span>
                    {/*{args.map(function(argument, index) {*/}
                    {/*    const loadedReferences = {};*/}

                    {/*    return (*/}
                    {/*        <span key={index}>*/}
                    {/*            <AnalysisVariableValue*/}
                    {/*                cur={argument.cur}*/}
                    {/*                old={argument.old}*/}
                    {/*                visited={{}}*/}
                    {/*                defaultopened={false}*/}
                    {/*                path={argument.path}*/}
                    {/*                loadedReferences={loadedReferences}*/}
                    {/*                openedPaths={props.openedPaths}*/}
                    {/*                scopeIndex={props.scopeIndex}*/}
                    {/*            />*/}
                    {/*            {(index + 1) < argCount ? ', ' : null}*/}
                    {/*        </span>*/}
                    {/*    );*/}
                    {/*})}*/}
                </span>{props.stackFrame.name ? ')' : null}
            </span>
        </div>
    );
};
