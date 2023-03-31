import React, {useEffect, useState} from "react";
import {StepperControls} from "../stepper/views/StepperControls";
import {stepperClearError} from "../stepper/actionTypes";
import {useDispatch} from "react-redux";
import {Button, Icon, Switch} from "@blueprintjs/core";
import {LayoutMobileMode, LayoutType} from "./layout/layout";
import {ActionTypes} from "./layout/actionTypes";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCogs, faFileAlt, faPencilAlt, faPlay, faSpinner} from "@fortawesome/free-solid-svg-icons";
import {useAppSelector} from "../hooks";
import {toHtml} from "../utils/sanitize";
import {TaskTestsSubmissionResultOverview} from "../submission/TaskTestsSubmissionResultOverview";
import {getMessage} from "../lang";
import {DraggableDialog} from "../common/DraggableDialog";
import {submissionChangeExecutionMode} from "../submission/submission_slice";
import {SubmissionControls} from "../submission/SubmissionControls";
import {
    submissionGradeAnswerServer,
    TaskSubmissionEvaluateOn
} from '../submission/submission';
import { Dropdown } from "react-bootstrap";
import {capitalizeFirstLetter, nl2br} from '../common/utils';
import {StepperStatus} from '../stepper';
import {SubmissionTestResultDiff} from '../submission/SubmissionTestResultDiff';

export function ControlsAndErrors() {
    const stepperError = useAppSelector(state => state.stepper.error);
    const layoutType = useAppSelector(state => state.layout.type);
    const {showStepper} = useAppSelector(state => state.options);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const executionMode = useAppSelector(state => state.submission.executionMode);
    const lastSubmission = useAppSelector(state => 0 < state.submission.taskSubmissions.length ? state.submission.taskSubmissions[state.submission.taskSubmissions.length - 1] : null);
    const stepperStatus = useAppSelector(state => state.stepper.status);
    const isEvaluating = lastSubmission && !lastSubmission.evaluated;

    let layoutMobileMode = useAppSelector(state => state.layout.mobileMode);
    if (LayoutMobileMode.Instructions === layoutMobileMode && !currentTask) {
        layoutMobileMode = LayoutMobileMode.Editor;
    }

    let hasError = !!stepperError;
    const hasModes = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);

    const [errorDialogOpen, setErrorDialogOpen] = useState(false);

    useEffect(() => {
        if (!hasError) {
            setErrorDialogOpen(false);
        }
    }, [hasError]);

    let error = null;
    let errorClosable = true;
    if (hasError) {
        if ('task-tests-submission-results-overview' === stepperError.type) {
            error = <TaskTestsSubmissionResultOverview {...stepperError.props}/>;
        } else if ('task-submission-test-result-diff' === stepperError.type) {
            error = <SubmissionTestResultDiff {...stepperError.props}/>;
        } else if ('compilation' === stepperError.type) {
            const stepperErrorHtml = toHtml(stepperError.content);
            error = <div dangerouslySetInnerHTML={stepperErrorHtml} className="compilation"/>;
        } else {
            const stepperErrorHtml = toHtml(nl2br(stepperError));
            error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
        }
    // } else if (blocksUsage && blocksUsage.error) {
    //     hasError = true;
    //     errorClosable = false;
    //     error = <div>{blocksUsage.error}</div>;
    }

    const dispatch = useDispatch();

    const onClearError = () => {
        dispatch(stepperClearError());
    };

    const onMaximizeError = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setErrorDialogOpen(true);
    }

    const selectMode = (mobileMode: LayoutMobileMode) => {
        dispatch({type: ActionTypes.LayoutMobileModeChanged, payload: {mobileMode}});
    };

    const changeExecutionMode = (newMode) => {
        dispatch(submissionChangeExecutionMode(newMode));
    };

    const submitSubmission = () => {
        dispatch(submissionGradeAnswerServer());
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
                    {TaskSubmissionEvaluateOn.Client === executionMode && <StepperControls enabled={true}/>}
                    {TaskSubmissionEvaluateOn.Server === executionMode && <SubmissionControls/>}

                    {!hasModes && <div className="execution-controls">
                        <div className="execution-controls-dropdown">
                            <FontAwesomeIcon icon={faCogs} className="mr-2"/>

                            <Dropdown>
                                <Dropdown.Toggle>
                                    {capitalizeFirstLetter(getMessage(TaskSubmissionEvaluateOn.Client === executionMode ? 'SUBMISSION_EXECUTE_ON_CLIENT' : 'SUBMISSION_EXECUTE_ON_SERVER').s)}
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Item key="client" onClick={() => changeExecutionMode(TaskSubmissionEvaluateOn.Client)}>{capitalizeFirstLetter(getMessage('SUBMISSION_EXECUTE_ON_CLIENT').s)}</Dropdown.Item>
                                    <Dropdown.Item key="server" onClick={() => changeExecutionMode(TaskSubmissionEvaluateOn.Server)}>{capitalizeFirstLetter(getMessage('SUBMISSION_EXECUTE_ON_SERVER').s)}</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                        <div>
                            <Button
                                className="quickalgo-button"
                                disabled={isEvaluating || StepperStatus.Clear !== stepperStatus}
                                icon={isEvaluating ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : null}
                                onClick={submitSubmission}
                            >
                                {getMessage('SUBMISSION_EXECUTE_SUBMIT')}
                            </Button>
                        </div>
                    </div>}
                </div>}
            </div>}

            {hasError && <div className={`error-message ${errorClosable ? 'is-closable' : ''}`} onClick={onClearError}>
                {errorClosable && <button type="button" className="close-button" onClick={onClearError}>
                    <Icon icon="cross"/>
                </button>}
                <button type="button" className="maximize-button hidden-mobile" onClick={onMaximizeError}>
                    <Icon icon="maximize"/>
                </button>
                <div className="error-message-wrapper">
                    <Icon icon="notifications" className="bell-icon"/>
                    <div className="message">
                        {error}
                    </div>
                </div>
            </div>}

            {hasError && errorDialogOpen && <DraggableDialog
                rndProps={{}}
                icon='error'
                title={getMessage('ERROR')}
                onClose={() => setErrorDialogOpen(false)}
            >
                <div className='bp3-dialog-body'>
                    <div className="error-message-wrapper">
                        <div className="message">
                            {error}
                        </div>
                    </div>
                </div>
            </DraggableDialog>}
        </div>
    );
}
