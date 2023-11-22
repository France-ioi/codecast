import * as React from 'react';
import {AnalysisFunctionHeader} from "./AnalysisFunctionHeader";
import {AnalysisFunctionLocals} from "./AnalysisFunctionLocals";
import {CodecastAnalysisStackFrame} from "./analysis";

interface AnalysisFunctionViewProps {
    stackFrame: CodecastAnalysisStackFrame,
}

const FILTERED_NAMES = [
    '<module>',
];

export const AnalysisFunctionView = (props: AnalysisFunctionViewProps): JSX.Element => {
    const stackFrameName = props.stackFrame.name && -1 === FILTERED_NAMES.indexOf(props.stackFrame.name) ? props.stackFrame.name.replace(/\(\)/g, '') : null;

    return (
        <div className="stack-frame stack-frame-focused">
            <AnalysisFunctionHeader
                stackFrame={props.stackFrame}
                stackFrameName={stackFrameName}
            />
            <AnalysisFunctionLocals
                stackFrame={props.stackFrame}
                stackFrameName={stackFrameName}
            />
        </div>
    );
};
