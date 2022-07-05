import * as React from 'react';
import {AnalysisFunctionHeader} from "./AnalysisFunctionHeader";
import {AnalysisFunctionLocals} from "./AnalysisFunctionLocals";
import {CodecastAnalysisStackFrame} from "./analysis";

interface AnalysisFunctionViewProps {
    stackFrame: CodecastAnalysisStackFrame,
}

export const AnalysisFunctionView = (props: AnalysisFunctionViewProps): JSX.Element => {
    return (
        <div className="stack-frame stack-frame-focused">
            <AnalysisFunctionHeader
                stackFrame={props.stackFrame}
            />
            <AnalysisFunctionLocals
                stackFrame={props.stackFrame}
            />
        </div>
    );
};
