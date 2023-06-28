import React from "react";
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {TestsPaneList} from './TestsPaneList';
import {Dropdown} from 'react-bootstrap';
import {
    submissionChangeCurrentSubmissionId,
    submissionChangePaneOpen,
} from './submission_slice';
import {getMessage} from '../lang';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {capitalizeFirstLetter} from '../common/utils';
import {isServerSubmission, TaskSubmission, TaskSubmissionEvaluateOn, TaskSubmissionServer} from './submission';
import {DateTime} from 'luxon';
import {faClock} from '@fortawesome/free-solid-svg-icons';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';

export function TestsPane() {
    const submissionResults = useAppSelector(state => state.submission.taskSubmissions);
    const dispatch = useDispatch();
    const currentSubmission = useAppSelector(state => null !== state.submission.currentSubmissionId ? submissionResults[state.submission.currentSubmissionId] : null);
    const serverSubmissionResults = submissionResults.filter(submission => TaskSubmissionEvaluateOn.Server === submission.type);

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

    const closePane = () => {
        dispatch(submissionChangePaneOpen(false));
    };

    const setCurrentSubmission = (submission: TaskSubmission|null, e = null) => {
        if (null === submission) {
            e.preventDefault();
            e.stopPropagation();
            dispatch(submissionChangeCurrentSubmissionId(null));
        } else {
            const submissionIndex = submissionResults.findIndex(otherSubmission => otherSubmission === submission);
            dispatch(submissionChangeCurrentSubmissionId(submissionIndex));
        }
    };

    return (
        <div className="submission-results">
            <div className="submission-results__header">
                <div className="submission-results__title">{getMessage(currentSubmission ? 'SUBMISSION_RESULTS_TITLE' : 'SUBMISSION_RESULTS_TESTS_TITLE')}</div>
                <div className="submission-results__close" onClick={closePane}>
                </div>
            </div>
            {serverSubmissionResults.length > 0 && <div className="submission-results__selector">
                <Dropdown>
                    <Dropdown.Toggle>
                        {null !== currentSubmission && isServerSubmission(currentSubmission) ? <div className="submission-toggle">
                            {getSubmissionLabel(currentSubmission)}
                            <div className="submission-results__close submission-toggle__close" onClick={(e) => setCurrentSubmission(null, e)}>
                            </div>
                        </div> : getMessage('SELECT')}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {serverSubmissionResults.map((submission, submissionIndex) =>
                            <Dropdown.Item key={submissionIndex} onClick={() => setCurrentSubmission(submission)}>
                                <span>{getSubmissionLabel(submission as TaskSubmissionServer)}</span>
                            </Dropdown.Item>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>}
            {null !== currentSubmission && <div className="submission-results__submission">
                {currentSubmission.evaluated ?
                    <TestsPaneList
                        submission={currentSubmission}
                    />
                    :
                    (currentSubmission.crashed ? <div className="submission-results__submission-crashed">
                            {getMessage('SUBMISSION_RESULTS_CRASHED')}
                        </div>
                    : <div className="submission-results__submission-loader">
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-2"/>
                        {getMessage('SUBMISSION_RESULTS_EVALUATING')}
                    </div>)
                }
            </div>}
            {null === currentSubmission && <div className="submission-results__submission">
                <TestsPaneList
                />
            </div>}
        </div>
    )
}
