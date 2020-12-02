import React from "react";
import {StepperView} from "../stepper/views/StepperView";
import {RecorderControls} from "./RecorderControls";
import {connect} from "react-redux";
import {AppStore} from "../store";

export class RecordScreen extends React.PureComponent {
    render () {
        return (
            <div>
                <RecorderControls />
                <StepperView />
            </div>
        );
    }
}
