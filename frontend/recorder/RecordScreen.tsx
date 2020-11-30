import React from "react";
import {StepperView} from "../stepper/views/StepperView";
import {RecorderControls} from "./RecorderControls";

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
