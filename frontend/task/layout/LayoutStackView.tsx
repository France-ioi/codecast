import React from "react";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {StepperState} from "../../stepper";
import {PythonStackView} from "../../stepper/python/analysis/components/PythonStackView";
import {StackView} from "../../stepper/views/c/StackView";

function mapStateToProps(state: AppStore) {
    return {
        currentStepperState: state.stepper ? state.stepper.currentStepperState : null,
    };
}

interface LayoutStackViewProps {
    currentStepperState: StepperState,
}

export class _LayoutStackView extends React.PureComponent<LayoutStackViewProps> {
    render() {
        const props = {
            analysis: this.props.currentStepperState ? this.props.currentStepperState.analysis : null,
        }

        if (this.props.currentStepperState && this.props.currentStepperState.platform === 'python') {
            return (<PythonStackView analysis={props.analysis} height={null}/>);
        } else {
            return (<StackView/>)
        }
    }

    static computeDimensions(width: number, height: number) {
        return {
            taken: {width, height},
            minimum: {width: 200, height: 100},
        }
    }
}

export const LayoutStackView = connect(mapStateToProps)(_LayoutStackView);
