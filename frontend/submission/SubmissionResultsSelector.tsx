import React, {useState} from "react";
import {useAppSelector} from "../hooks";
import {Dropdown} from 'react-bootstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {DateTime} from 'luxon';
import {TaskSubmission, TaskSubmissionEvaluateOn, TaskSubmissionServer} from './submission_types';
import {getMessage} from '../lang';
import {
    submissionChangeCurrentSubmissionId, submissionCloseCurrentSubmission,
    SubmissionExecutionScope
} from './submission_slice';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faClock, faSpinner} from '@fortawesome/free-solid-svg-icons';
import {capitalizeFirstLetter} from '../common/utils';
import {useDispatch} from 'react-redux';

export interface SubmissionResultsSelectorProps {
}

export function SubmissionResultsSelector(props: SubmissionResultsSelectorProps) {
    const submissionResults = useAppSelector(state => state.submission.taskSubmissions);
    const dispatch = useDispatch();

    const setCurrentSubmission = (submission: TaskSubmission|null, e = null) => {
        if (null === submission) {
            e.preventDefault();
            e.stopPropagation();
            setDropdownOpen(false);
            dispatch(submissionCloseCurrentSubmission());
        } else {
            const submissionIndex = submissionResults.findIndex(otherSubmission => otherSubmission === submission);
            dispatch(submissionChangeCurrentSubmissionId({submissionId: submissionIndex}));
        }
    };

    const serverSubmissionResults = submissionResults.filter(submission => TaskSubmissionEvaluateOn.Server === submission.type && SubmissionExecutionScope.MyTests !== submission.scope && !submission.cancelled);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const getSubmissionLabel = (submissionResult: TaskSubmissionServer) => {
        const dateTime = DateTime.fromISO(submissionResult.date);

        return <div className="submission-label">
            {submissionResult.evaluated ?
                <div className={`submission-label-icon ${1 <= submissionResult.result.score ? 'submission-label-icon-success' : ''}`} style={{'--progression': `${Math.floor(submissionResult.result.score / 100 * 360)}deg`} as React.CSSProperties}>
                    <div className="submission-label-score">
                        {submissionResult.result.score}
                    </div>
                </div>
                :
                (submissionResult.crashed ? <div className="submission-label-icon submission-label-icon-crash">
                    <div className="submission-label-score">
                        <FontAwesomeIcon icon={faTimes}/>
                    </div>
                </div>
                    : <div className="submission-label-loader">
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>
                    </div>)
            }
            <div className="submission-label-name">
                <p>{getMessage('SUBMISSION_RESULTS_LABEL').format({platform: capitalizeFirstLetter(submissionResult.platform)})}</p>
                <p className="submission-label-date">
                    <FontAwesomeIcon icon={faClock}/>
                    <span className="ml-1">{dateTime.toLocaleString(DateTime.DATETIME_SHORT)}</span>
                </p>
            </div>
        </div>
    };

    return (
        <div className="submission-results__selector">
            <Dropdown
                onToggle={(nextShow) => setDropdownOpen(nextShow)}
                show={dropdownOpen}
            >
                <Dropdown.Toggle>
                    <FontAwesomeIcon icon={faClock}/>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    {0 === serverSubmissionResults.length && <div className="no-recent-submission">
                        {getMessage('BUFFER_TAB_NO_PAST_SUBMISSION')}
                    </div>}
                    {serverSubmissionResults.map((submission, submissionIndex) =>
                        <Dropdown.Item key={submissionIndex} onClick={() => setCurrentSubmission(submission)}>
                            <span>{getSubmissionLabel(submission as TaskSubmissionServer)}</span>
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    )
}
