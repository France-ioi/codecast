import React, {useEffect, useState} from "react";
import {StepperControls} from "../stepper/views/StepperControls";
import {stepperClearError} from "../stepper/actionTypes";
import {useDispatch} from "react-redux";
import {Button, Icon} from "@blueprintjs/core";
import {ActionTypes} from "./layout/actionTypes";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCogs, faFileAlt, faPencilAlt, faPlay, faSpinner} from "@fortawesome/free-solid-svg-icons";
import {useAppSelector} from "../hooks";
import {toHtml} from "../utils/sanitize";
import {TaskTestsSubmissionResultOverview} from "../submission/TaskTestsSubmissionResultOverview";
import {getMessage} from "../lang";
import {DraggableDialog} from "../common/DraggableDialog";
import {
    submissionChangeExecutionMode,
    submissionCloseCurrentSubmission,
    SubmissionExecutionScope
} from "../submission/submission_slice";
import {SubmissionControls} from "../submission/SubmissionControls";
import {Dropdown} from "react-bootstrap";
import {capitalizeFirstLetter, nl2br} from '../common/utils';
import {doesPlatformHaveClientRunner, StepperStatus} from '../stepper';
import {isServerTask, isTestPublic} from './task_types';
import {LibraryTestResult} from './libs/library_test_result';
import {getStepperControlsSelector} from '../stepper/selectors';
import {selectTaskTests} from '../submission/submission_selectors';
import {TaskSubmissionEvaluateOn} from '../submission/submission_types';
import {callPlatformValidate, submissionCancel} from '../submission/submission_actions';
import {LayoutMobileMode, LayoutType} from './layout/layout_types';
import {selectCancellableSubmissionIndex} from '../submission/submission';
import {selectActiveBufferPlatform} from '../buffers/buffer_selectors';

export function ControlsAndErrors() {
    const stepperError = useAppSelector(state => state.stepper.error);
    const layoutType = useAppSelector(state => state.layout.type);
    const {showStepper} = useAppSelector(state => state.options);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const taskTests = useAppSelector(selectTaskTests);
    const executionMode = useAppSelector(state => state.submission.executionMode);
    const stepperStatus = useAppSelector(state => state.stepper.status);
    const cancellableSubmissionIndex = useAppSelector(selectCancellableSubmissionIndex);
    const cancellableSubmission = useAppSelector(state => null !== cancellableSubmissionIndex ? state.submission.taskSubmissions[cancellableSubmissionIndex] : null);
    const platform = useAppSelector(selectActiveBufferPlatform);
    const clientExecutionRunning = useAppSelector(state => getStepperControlsSelector({state, enabled: true})).canRestart;

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
        if (stepperError instanceof LibraryTestResult) {
            if (!stepperError.type) {
                const stepperErrorHtml = toHtml(nl2br(stepperError.message));
                error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
            } else if ('task-tests-submission-results-overview' === stepperError.type) {
                error = <TaskTestsSubmissionResultOverview {...stepperError.props}/>;
            } else if (stepperError.message) {
                const stepperErrorHtml = toHtml(nl2br(stepperError.message));
                error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
            } else {
                // We only show the result of an execution
                hasError = false;
            }
        } else {
            const stepperErrorHtml = toHtml(nl2br(stepperError));
            error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
        }
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
        dispatch(callPlatformValidate());
    };

    const cancelEvaluation = () => {
        dispatch(submissionCancel(cancellableSubmissionIndex));
    };

    const currentTestPublic = null !== currentTestId && isTestPublic(taskTests[currentTestId]);
    const platformHasClientRunner = doesPlatformHaveClientRunner(platform);
    const clientControlsEnabled = (!currentTask || currentTestPublic) && platformHasClientRunner;
    const serverTask = null !== currentTask && isServerTask(currentTask);

    return (
        <div className="controls-and-errors cursor-main-zone" data-cursor-zone="controls-and-errors">
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
                    {((TaskSubmissionEvaluateOn.Client === executionMode && platformHasClientRunner && clientExecutionRunning) || !serverTask) && <div className="stepper-controls-container-flex"><StepperControls enabled={clientControlsEnabled}/></div>}

                    {(!hasModes || LayoutMobileMode.Player === layoutMobileMode) && serverTask && !clientExecutionRunning && <div className="execution-controls">
                        {platformHasClientRunner && <div className="execution-controls-dropdown">
                            <Dropdown>
                                <Dropdown.Toggle>
                                    <FontAwesomeIcon icon={faCogs} className="mr-2"/>
                                    {capitalizeFirstLetter(getMessage(TaskSubmissionEvaluateOn.Client === executionMode ? 'SUBMISSION_EXECUTE_ON_CLIENT' : 'SUBMISSION_EXECUTE_ON_SERVER').s)}
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Item key="client" onClick={() => changeExecutionMode(TaskSubmissionEvaluateOn.Client)}>{capitalizeFirstLetter(getMessage('SUBMISSION_EXECUTE_ON_CLIENT').s)}</Dropdown.Item>
                                    <Dropdown.Item key="server" onClick={() => changeExecutionMode(TaskSubmissionEvaluateOn.Server)}>{capitalizeFirstLetter(getMessage('SUBMISSION_EXECUTE_ON_SERVER').s)}</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>}
                        {(!platformHasClientRunner || TaskSubmissionEvaluateOn.Server === executionMode) && <div className={`submission-server-controls ${!platformHasClientRunner ? 'no-padding' : ''}`}>
                            <SubmissionControls/>
                        </div>}
                        {platformHasClientRunner && TaskSubmissionEvaluateOn.Client === executionMode && <div>
                            <StepperControls
                                enabled={clientControlsEnabled}
                                startButtonsOnly
                            />
                        </div>}
                        <div className="execution-controls-submit">
                            <Button
                                className="quickalgo-button is-medium"
                                disabled={null !== cancellableSubmission || StepperStatus.Clear !== stepperStatus}
                                icon={null !== cancellableSubmission && SubmissionExecutionScope.Submit === cancellableSubmission?.scope ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : null}
                                onClick={submitSubmission}
                            >
                                {getMessage('SUBMISSION_EXECUTE_SUBMIT')}
                            </Button>
                        </div>
                    </div>}
                </div>}
            </div>}

            {hasError && null === cancellableSubmission && <div className={`error-message ${errorClosable ? 'is-closable' : ''}`} onClick={onClearError}>
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

            {null !== cancellableSubmission && <div className={`error-message submission-pending`}>
                <div className="error-message-wrapper">
                    <div className="message">
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-2"/>
                        {getMessage(SubmissionExecutionScope.MyTests === cancellableSubmission?.scope ? 'SUBMISSION_EVALUATING_USER_TESTS' : 'SUBMISSION_EVALUATING_SUBMIT')}
                    </div>
                    <Icon icon="stop" className="bell-icon stop-icon" onClick={cancelEvaluation}/>
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
