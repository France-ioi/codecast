import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlay, faSpinner} from "@fortawesome/free-solid-svg-icons";
import {Button} from "@blueprintjs/core";
import {useDispatch} from "react-redux";
import {submissionChangeServerExecuteOn, SubmissionServerExecuteOn} from "./submission_slice";
import {useAppSelector} from "../hooks";
import {getMessage} from "../lang";
import {submissionTriggerPlatformValidate} from "./submission";

export function SubmissionControls() {
    const serverExecuteOn = useAppSelector(state => state.submission.serverExecuteOn);
    const lastSubmission = useAppSelector(state => 0 < state.submission.serverSubmissions.length ? state.submission.serverSubmissions[state.submission.serverSubmissions.length - 1] : null);
    const isEvaluating = lastSubmission && !lastSubmission.evaluated;
    const dispatch = useDispatch();

    const changeExecuteOn = (newExecuteOn) => {
        dispatch(submissionChangeServerExecuteOn(newExecuteOn));
    }

    const submit = () => {
        dispatch(submissionTriggerPlatformValidate());
    };

    return (
        <div className="submission-controls">
            <div className="button-switch">
                <div
                    className={`button-switch-option ${SubmissionServerExecuteOn.ThisTest === serverExecuteOn ? 'is-active' : ''}`}
                    onClick={() => changeExecuteOn(SubmissionServerExecuteOn.ThisTest)}
                >
                    {getMessage('SUBMISSION_EXECUTE_THIS_TEST')}
                </div>
                {/*<div*/}
                {/*    className={`button-switch-option ${SubmissionServerExecuteOn.MyTests === serverExecuteOn ? 'is-active' : ''}`}*/}
                {/*    onClick={() => changeExecuteOn(SubmissionServerExecuteOn.MyTests)}*/}
                {/*>*/}
                {/*    {getMessage('SUBMISSION_EXECUTE_MY_TESTS')}*/}
                {/*</div>*/}
                <div
                    className={`button-switch-option ${SubmissionServerExecuteOn.Submit === serverExecuteOn ? 'is-active' : ''}`}
                    onClick={() => changeExecuteOn(SubmissionServerExecuteOn.Submit)}
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
