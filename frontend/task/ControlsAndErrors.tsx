import React from "react";
import {StepperControls} from "../stepper/views/StepperControls";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {connect} from "react-redux";
import {Icon} from "@blueprintjs/core";
import {AppStore} from "../store";
import {LayoutMobileMode, LayoutType} from "./layout/layout";
import {ActionTypes} from "./layout/actionTypes";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFileAlt, faPencilAlt, faPlay} from "@fortawesome/free-solid-svg-icons";

interface ControlsAndErrorsStateToProps {
    error: string,
    diagnostics: any,
    layoutType: LayoutType,
    layoutMobileMode: LayoutMobileMode,
    getMessage: Function,
    showStepper: boolean,
    currentTask: any,
}

interface ControlsAndErrorsProps extends ControlsAndErrorsStateToProps {
    dispatch: Function,
}

function mapStateToProps(state: AppStore): ControlsAndErrorsStateToProps {
    const diagnostics = state.compile.diagnosticsHtml;
    const currentStepperState = state.stepper.currentStepperState;
    const error = currentStepperState && currentStepperState.error;
    const layoutType = state.layout.type;
    const getMessage = state.getMessage;
    const {showStepper} = state.options;
    const currentTask = state.task.currentTask;
    let layoutMobileMode = state.layout.mobileMode;
    if (LayoutMobileMode.Instructions === layoutMobileMode && !currentTask) {
        layoutMobileMode = LayoutMobileMode.Editor;
    }

    return {
        error,
        diagnostics,
        layoutType,
        layoutMobileMode,
        getMessage,
        showStepper,
        currentTask,
    };
}

class _ControlsAndErrors extends React.PureComponent<ControlsAndErrorsProps> {
    render() {
        const {error, diagnostics, getMessage, layoutType, layoutMobileMode, showStepper, currentTask} = this.props;
        const hasError = !!(error || diagnostics);
        const hasModes = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);

        return (
            <div className="controls-and-errors">
                {(showStepper || hasModes) && <div className="mode-selector">
                    {hasModes &&
                        <React.Fragment>
                            {currentTask && <div
                                className={`mode ${LayoutMobileMode.Instructions === layoutMobileMode ? 'is-active' : ''}`}
                                onClick={() => this.selectMode(LayoutMobileMode.Instructions)}
                            >
                                <FontAwesomeIcon icon={faFileAlt}/>
                                {LayoutMobileMode.Instructions === layoutMobileMode &&
                                    <span className="label">{getMessage('TASK_DESCRIPTION')}</span>
                                }
                            </div>}
                            <div
                                className={`mode ${LayoutMobileMode.Editor === layoutMobileMode ? 'is-active' : ''}`}
                                onClick={() => this.selectMode(LayoutMobileMode.Editor)}
                            >
                                <FontAwesomeIcon icon={faPencilAlt}/>
                                {LayoutMobileMode.Editor === layoutMobileMode &&
                                    <span className="label">{getMessage('TASK_EDITOR')}</span>
                                }
                            </div>
                            {LayoutMobileMode.Player !== layoutMobileMode &&
                                <div
                                    className={`mode`}
                                    onClick={() => this.selectMode(LayoutMobileMode.Player)}
                                >
                                    <FontAwesomeIcon icon={faPlay}/>
                                </div>
                            }
                        </React.Fragment>
                    }

                    {(!hasModes || LayoutMobileMode.Player === layoutMobileMode) && showStepper && <div className="stepper-controls-container">
                        <StepperControls enabled={true} newControls={true}/>
                    </div>}
                </div>}

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

    selectMode = (mobileMode: LayoutMobileMode) => {
        this.props.dispatch({type: ActionTypes.LayoutMobileModeChanged, payload: {mobileMode}});
    };
}

export const ControlsAndErrors = connect(mapStateToProps)(_ControlsAndErrors);
