import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlay, faSpinner} from "@fortawesome/free-solid-svg-icons";
import {Button} from "@blueprintjs/core";
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {getMessage} from "../lang";
import {selectTaskTests} from './submission_selectors';

import {TaskTestGroupType} from '../task/task_types';
import {submissionExecuteMyTests} from './submission_actions';

export function SubmissionControls() {
    const lastSubmission = useAppSelector(state => 0 < state.submission.taskSubmissions.length ? state.submission.taskSubmissions[state.submission.taskSubmissions.length - 1] : null);
    const isEvaluating = lastSubmission && !lastSubmission.evaluated && !lastSubmission.crashed;
    const dispatch = useDispatch();
    const hasOwnTests = useAppSelector(state => 0 < selectTaskTests(state).filter(test => TaskTestGroupType.User === test.groupType).length);

    const executeOnMyTests = () => {
        dispatch(submissionExecuteMyTests());
    };

    return (
        <div className="submission-controls">
            {/*<Button*/}
            {/*    className="quickalgo-button"*/}
            {/*    onClick={submit}*/}
            {/*    icon={isEvaluating ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : <FontAwesomeIcon icon={faPlay}/>}*/}
            {/*>*/}
            {/*    {getMessage('SUBMISSION_EXECUTE_THIS_TEST')}*/}
            {/*</Button>*/}

            {hasOwnTests &&
                <Button
                    className="quickalgo-button"
                    onClick={executeOnMyTests}
                    icon={isEvaluating ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : <FontAwesomeIcon icon={faPlay}/>}
                >
                    {getMessage('SUBMISSION_EXECUTE_MY_TESTS')}
                </Button>
            }
        </div>
    )
}
