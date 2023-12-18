import React from "react";
import {useAppSelector} from "../../hooks";
import {getMessage} from "../../lang";
import {AnalysisStackView} from "../../stepper/analysis/AnalysisStackView";
import {TaskSubmissionEvaluateOn} from '../../submission/submission_types';

export function LayoutStackView() {
    const currentStepperState = useAppSelector(state => state.stepper ? state.stepper.currentStepperState : null);

    const analysis = currentStepperState ? currentStepperState.codecastAnalysis : null;
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);

    let stackView;
    if (currentStepperState) {
        stackView = <AnalysisStackView analysis={analysis}/>
    } else {
        stackView = <div className="stack-view">
            <p>{getMessage('PROGRAM_STOPPED')}</p>
        </div>;
    }

    return (
        <div style={{fontSize: `${zoomLevel}rem`}}>
            {stackView}
        </div>
    );
}

LayoutStackView.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
