import React from "react";
import {StepperControls} from "../stepper/views/StepperControls";
import {stepperClearError} from "../stepper/actionTypes";
import {useDispatch} from "react-redux";
import {Icon} from "@blueprintjs/core";
import {LayoutMobileMode, LayoutType} from "./layout/layout";
import {ActionTypes} from "./layout/actionTypes";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFileAlt, faPencilAlt, faPlay} from "@fortawesome/free-solid-svg-icons";
import {useAppSelector} from "../hooks";
import {toHtml} from "../utils/sanitize";
import {TaskTestsSubmissionResultOverview} from "./TaskTestsSubmissionResultOverview";

export function ControlsAndErrors() {
    const stepperError = useAppSelector(state => state.stepper.error);
    const layoutType = useAppSelector(state => state.layout.type);
    const getMessage = useAppSelector(state => state.getMessage);
    const {showStepper} = useAppSelector(state => state.options);
    const currentTask = useAppSelector(state => state.task.currentTask);

    let layoutMobileMode = useAppSelector(state => state.layout.mobileMode);
    if (LayoutMobileMode.Instructions === layoutMobileMode && !currentTask) {
        layoutMobileMode = LayoutMobileMode.Editor;
    }

    const hasError = !!stepperError;
    const hasModes = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);

    let error = null;
    if (hasError) {
        console.log({stepperError})
        if ('task-tests-submission-results-overview' === stepperError.type) {
            error = <TaskTestsSubmissionResultOverview {...stepperError.props}/>;
        } else if ('compilation' === stepperError.type) {
            const stepperErrorHtml = toHtml(stepperError.content);
            error = <div dangerouslySetInnerHTML={stepperErrorHtml} className="compilation"/>;
        } else {
            const stepperErrorHtml = toHtml(stepperError);
            error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
        }
    }

    const dispatch = useDispatch();

    const onClearError = () => {
        dispatch(stepperClearError());
    };

    const selectMode = (mobileMode: LayoutMobileMode) => {
        dispatch({type: ActionTypes.LayoutMobileModeChanged, payload: {mobileMode}});
    };

    return (
        <div className="controls-and-errors">
            {(showStepper || hasModes) && <div className="mode-selector">
                {hasModes &&
                    <React.Fragment>
                        {currentTask && <div
                            className={`mode ${LayoutMobileMode.Instructions === layoutMobileMode ? 'is-active' : ''}`}
                            onClick={() => selectMode(LayoutMobileMode.Instructions)}
                        >
                            <FontAwesomeIcon icon={faFileAlt}/>
                            {LayoutMobileMode.Instructions === layoutMobileMode &&
                                <span className="label">{getMessage('TASK_DESCRIPTION')}</span>
                            }
                        </div>}
                        <div
                            className={`mode ${LayoutMobileMode.Editor === layoutMobileMode ? 'is-active' : ''}`}
                            onClick={() => selectMode(LayoutMobileMode.Editor)}
                        >
                            <FontAwesomeIcon icon={faPencilAlt}/>
                            {LayoutMobileMode.Editor === layoutMobileMode &&
                                <span className="label">{getMessage('TASK_EDITOR')}</span>
                            }
                        </div>
                        {LayoutMobileMode.Player !== layoutMobileMode &&
                            <div
                                className={`mode`}
                                onClick={() => selectMode(LayoutMobileMode.Player)}
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

            {hasError && <div className="error-message" onClick={onClearError}>
              <button type="button" className="close-button" onClick={onClearError}>
                <Icon icon="cross"/>
              </button>
              <div className="message-wrapper">
                <Icon icon="notifications" className="bell-icon"/>
                <div className="message">
                    {error}
                </div>
              </div>
            </div>}
        </div>
    );
}
