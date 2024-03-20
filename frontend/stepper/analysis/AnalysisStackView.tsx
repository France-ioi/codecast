import * as React from 'react';
import {AnalysisFunctionView} from "./AnalysisFunctionView";
import {CodecastAnalysisSnapshot} from "./analysis";

interface AnalysisStackViewProps {
    height?: number,
    analysis: CodecastAnalysisSnapshot,
}

export const AnalysisStackView = (props: AnalysisStackViewProps): JSX.Element => {
    const firstVisible = 0;
    const tailCount = 0;

    return (
        <div className="stack-view" style={{maxHeight: props.height}}>
            {firstVisible > 0 &&
                <div key='tail' className="scope-ellipsis">
                    {'… +'}{firstVisible}
                </div>
            }
            {props.analysis.stackFrames.slice().reverse().map((analysisStackFrame, index) => (
                <AnalysisFunctionView
                    key={index}
                    stackFrame={analysisStackFrame}
                />
            ))}
            {tailCount > 0 &&
            <div key='tail' className="scope-ellipsis">
                {'… +'}{tailCount}
            </div>}
        </div>
    );
};
