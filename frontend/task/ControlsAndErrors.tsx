import React from "react";
import {StepperControls} from "../stepper/views/StepperControls";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {connect} from "react-redux";
import {Icon} from "@blueprintjs/core";

interface ControlsAndErrorsProps {
    dispatch: Function,
    error: string,
    diagnostics: any,
}

function mapStateToProps() {
    return {};
}

class _ControlsAndErrors extends React.PureComponent<ControlsAndErrorsProps> {
    render() {
        const {error, diagnostics} = this.props;
        const hasError = !!(error || diagnostics);

        return (
            <div className="controls-and-errors">
                <StepperControls enabled={true} newControls={true}/>
                {hasError && <div className="error-message" onClick={this._onClearDiagnostics}>
                  <button type="button" className="close-button" onClick={this._onClearDiagnostics}>
                    <Icon icon="cross"/>
                  </button>
                  <div className="message-wrapper">
                    <Icon icon="notifications" className="bell-icon"/>
                    <div className="message">
                        {diagnostics && <div dangerouslySetInnerHTML={diagnostics}/>}
                        {error && <div>{error}</div>}
                    </div>
                  </div>
                </div>}
            </div>
        );
    }

    _onClearDiagnostics = () => {
        this.props.dispatch({type: StepperActionTypes.CompileClearDiagnostics});
    };
}

export const ControlsAndErrors = connect(mapStateToProps)(_ControlsAndErrors);
