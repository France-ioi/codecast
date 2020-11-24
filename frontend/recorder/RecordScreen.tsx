import React from "react";

export class RecordScreen extends React.PureComponent {
    render () {
        return (
            <div>
                <deps.RecorderControls/>
                <deps.StepperView/>
            </div>
        );
    }
}
