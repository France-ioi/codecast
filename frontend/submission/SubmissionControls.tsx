import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlay, faSpinner} from "@fortawesome/free-solid-svg-icons";
import {Button} from "@blueprintjs/core";
import {useDispatch} from "react-redux";
import {submissionChangeExecutionScope, SubmissionExecutionScope} from "./submission_slice";
import {useAppSelector} from "../hooks";
import {getMessage} from "../lang";
import {submissionTriggerPlatformValidate} from "./submission";

export function SubmissionControls() {
    const executionScope = useAppSelector(state => state.submission.executionScope);
    const lastSubmission = useAppSelector(state => 0 < state.submission.taskSubmissions.length ? state.submission.taskSubmissions[state.submission.taskSubmissions.length - 1] : null);
    const isEvaluating = lastSubmission && !lastSubmission.evaluated;
    const dispatch = useDispatch();

    const changeExecutionScope = (newExecutionScope: SubmissionExecutionScope) => {
        dispatch(submissionChangeExecutionScope(newExecutionScope));
    }

    const submit = () => {
        dispatch(submissionTriggerPlatformValidate());
    };

    return (
        <div className="submission-controls">
            <div className="button-switch">
                <div
                    className={`button-switch-option ${SubmissionExecutionScope.ThisTest === executionScope ? 'is-active' : ''}`}
                    onClick={() => changeExecutionScope(SubmissionExecutionScope.ThisTest)}
                >
                    {getMessage('SUBMISSION_EXECUTE_THIS_TEST')}
                </div>
                {/*<div*/}
                {/*    className={`button-switch-option ${SubmissionServerExecuteOn.MyTests === executionScope ? 'is-active' : ''}`}*/}
                {/*    onClick={() => changeExecutionScope(SubmissionServerExecuteOn.MyTests)}*/}
                {/*>*/}
                {/*    {getMessage('SUBMISSION_EXECUTE_MY_TESTS')}*/}
                {/*</div>*/}
                <div
                    className={`button-switch-option ${SubmissionExecutionScope.Submit === executionScope ? 'is-active' : ''}`}
                    onClick={() => changeExecutionScope(SubmissionExecutionScope.Submit)}
                >
                    {getMessage('SUBMISSION_EXECUTE_SUBMIT')}
                </div>
            </div>
            <div>
                <Button
                    className="is-big"
                    onClick={submit}
                    disabled={isEvaluating}
                    icon={isEvaluating ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : <FontAwesomeIcon icon={faPlay}/>}
                />
            </div>
        </div>
    )
}
