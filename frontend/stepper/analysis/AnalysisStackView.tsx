import * as React from 'react';
import {AnalysisFunctionView} from "./AnalysisFunctionView";
import {Button, ButtonGroup} from "@blueprintjs/core";
import {CodecastAnalysisSnapshot} from "./analysis";

interface AnalysisStackViewProps {
    height?: number,
    analysis: CodecastAnalysisSnapshot,
    showStackControls?: boolean,
}

export const AnalysisStackView = (props: AnalysisStackViewProps): JSX.Element => {
    const firstVisible = 0;
    const tailCount = 0;

    return (
        <div className="stack-view" style={{maxHeight: props.height}}>
            {props.showStackControls &&
                <div className="stack-controls">
                    <ButtonGroup>
                        <Button minimal small title="navigate up the stack" icon='arrow-up'/>
                        <Button minimal small title="navigate down the stack" icon='arrow-down'/>
                    </ButtonGroup>
                </div>
            }
            {firstVisible > 0 &&
            <div key='tail' className="scope-ellipsis">
                {'… +'}{firstVisible}
            </div>
            }
            {props.analysis.stackFrames.slice().map((analysisStackFrame, index) => (
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
