import React from "react";
import {StackView} from "../../stepper/views/c/StackView";
import {useAppSelector} from "../../hooks";
import {getMessage} from "../../lang";
import {AnalysisStackView} from "../../stepper/analysis/AnalysisStackView";

import {CodecastPlatform} from '../../stepper/codecast_platform';

export function LayoutStackView() {
    const currentStepperState = useAppSelector(state => state.stepper ? state.stepper.currentStepperState : null);

    const analysis = currentStepperState ? currentStepperState.codecastAnalysis : null;
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const remoteExecution = useAppSelector(state => state.options.remoteExecution);

    let stackView;
    if (currentStepperState) {
        if (currentStepperState.platform === CodecastPlatform.Cpp && !remoteExecution) {
            // TODO: convert this to use AnalysisStackView like Python and Blockly
            stackView = <StackView/>
        } else {
            stackView = <AnalysisStackView analysis={analysis}/>
        }
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
