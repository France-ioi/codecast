import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlay} from "@fortawesome/free-solid-svg-icons";
import {Button} from "@blueprintjs/core";
import {useDispatch} from "react-redux";
import {submissionChangeServerExecuteOn, SubmissionServerExecuteOn} from "./submission_slice";
import {useAppSelector} from "../hooks";
import {getMessage} from "../lang";
import {submissionTriggerPlatformValidate} from "./submission";

export function SubmissionControls() {
    const serverExecuteOn = useAppSelector(state => state.submission.serverExecuteOn);
    const dispatch = useDispatch();

    const changeExecuteOn = (newExecuteOn) => {
        dispatch(submissionChangeServerExecuteOn(newExecuteOn));
    }

    const submit = () => {
        console.log('submit');
        dispatch(submissionTriggerPlatformValidate());
    }

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
                    icon={<FontAwesomeIcon icon={faPlay}/>}
                />
            </div>
        </div>
    )
}
