import React from "react";
import {PythonStackView} from "../../stepper/python/analysis/components/PythonStackView";
import {StackView} from "../../stepper/views/c/StackView";
import {useAppSelector} from "../../hooks";
import {CodecastPlatform} from "../../store";
import {getMessage} from "../../lang";
import {AnalysisStackView} from "../../stepper/analysis/AnalysisStackView";

export function LayoutStackView() {
    const currentStepperState = useAppSelector(state => state.stepper ? state.stepper.currentStepperState : null);

    const props = {
        analysis: currentStepperState ? currentStepperState.analysis : null,
        lastAnalysis: currentStepperState ? currentStepperState.lastAnalysis : null,
    }

    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);

    let stackView;
    if (currentStepperState && currentStepperState.platform === CodecastPlatform.Python) {
        stackView = <AnalysisStackView analysis={props.analysis} lastAnalysis={props.lastAnalysis} height={null}/>
    } else if (currentStepperState && currentStepperState.platform === CodecastPlatform.Unix) {
        stackView = <StackView/>
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
