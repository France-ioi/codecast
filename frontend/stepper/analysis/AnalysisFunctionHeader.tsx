import * as React from 'react';
import {CodecastAnalysisStackFrame, CodecastAnalysisVariable} from "./analysis";
import {AnalysisVariable} from "./AnalysisVariable";

interface AnalysisFunctionHeaderProps {
    stackFrame: CodecastAnalysisStackFrame,
    stackFrameName?: string,
}

export const AnalysisFunctionHeader = (props: AnalysisFunctionHeaderProps): JSX.Element => {
    const {stackFrameName} = props;
    const stackFrameNameHasParenthesis = !!(!stackFrameName || -1 !== stackFrameName.indexOf('('));

    const args: CodecastAnalysisVariable[] = props.stackFrame.args && props.stackFrame.args.length ? props.stackFrame.args.map((element) => {
        if ('object' === typeof element && element.value) {
            return {
                name: null,
                value: element.value,
                variablesReference: 0,
                path: "#args",
            }
        }

        const variable = props.stackFrame.variables.find(variable => element === variable.name);

        return {
            ...variable,
            path: variable.path + "#args",
        };
    }) : [];

    return (
        <div className="scope-function-title">
            <span>
                {stackFrameName && <span className="function-name">{stackFrameName}</span>}
                {!stackFrameNameHasParenthesis && '('}
                <span>
                    {args.map(function(argument, index) {
                        return (
                            <span key={index}>
                                <AnalysisVariable
                                    variable={argument}
                                    stackFrameId={props.stackFrame.id}
                                    onlyValue={true}
                                />
                                {(index + 1) < props.stackFrame.args.length ? ', ' : null}
                            </span>
                        );
                    })}
                </span>{!stackFrameNameHasParenthesis && ')'}
            </span>
        </div>
    );
};
