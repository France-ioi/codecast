import React from "react";
import {PythonStackView} from "../../stepper/python/analysis/components/PythonStackView";
import {StackView} from "../../stepper/views/c/StackView";
import {useAppSelector} from "../../hooks";
import {CodecastPlatform} from "../../store";

export function LayoutStackView() {
    const currentStepperState = useAppSelector(state => state.stepper ? state.stepper.currentStepperState : null);

    const props = {
        analysis: currentStepperState ? currentStepperState.analysis : null,
    }

    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);

    let stackView = null;
    if (currentStepperState && currentStepperState.platform === CodecastPlatform.Python) {
        stackView = <PythonStackView analysis={props.analysis} height={null}/>
    } else if (currentStepperState && currentStepperState.platform === CodecastPlatform.Unix) {
        stackView = <StackView/>
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
