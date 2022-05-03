import * as React from 'react';
import {AnalysisFunctionView} from "./AnalysisFunctionView";
import {Button, ButtonGroup} from "@blueprintjs/core";
import {AnalysisSnapshot, CodecastAnalysisSnapshot, convertAnalysisDAPToCodecastFormat} from "./index";
import {useEffect, useState} from "react";

interface AnalysisStackViewProps {
    height: number,
    analysis: AnalysisSnapshot,
    lastAnalysis: AnalysisSnapshot,
    showStackControls?: boolean,
}

export const AnalysisStackView = (props: AnalysisStackViewProps): JSX.Element => {
    const firstVisible = 0;
    const tailCount = 0;

    console.log('python analysis', props.analysis, props.lastAnalysis);

    const [expandedAnalysis, setExpandedAnalysis] = useState<CodecastAnalysisSnapshot>(null);

    useEffect(() => {
        const codecastFormatAnalysis = convertAnalysisDAPToCodecastFormat(props.analysis, props.lastAnalysis);
        console.log('codecast analysis', codecastFormatAnalysis);
        setExpandedAnalysis(codecastFormatAnalysis);
    }, [props.analysis]);

    if (!expandedAnalysis) {
        return null;
    }

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
            {expandedAnalysis.stackFrames.slice().reverse().map((analysisStackFrame, index) => (
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
