import * as React from 'react';
import {AnalysisFunctionHeader} from "./AnalysisFunctionHeader";
import {AnalysisFunctionLocals} from "./AnalysisFunctionLocals";
import {CodecastAnalysisStackFrame} from "../analysis";

interface AnalysisFunctionViewProps {
    stackFrame: CodecastAnalysisStackFrame,
    openedPaths: {
        [key: string]: boolean
    },
    loadedReferences: any
}

export const AnalysisFunctionView = (props: AnalysisFunctionViewProps): JSX.Element => {
    return (
        <div className="stack-frame stack-frame-focused">
            <AnalysisFunctionHeader
                stackFrame={props.stackFrame}
                scopeIndex={props.stackFrame.id}
                openedPaths={props.openedPaths}
            />
            <AnalysisFunctionLocals
                stackFrame={props.stackFrame}
                loadedReferences={props.loadedReferences}
                openedPaths={props.openedPaths}
            />
        </div>
    );
};
