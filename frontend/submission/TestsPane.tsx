import React, {useState} from "react";
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {TestsPaneList} from './TestsPaneList';
import {Dropdown} from 'react-bootstrap';
import {ServerSubmission} from './task_platform';
import {submissionChangeCurrentSubmissionId, submissionChangePaneOpen} from './submission_slice';
import {getMessage} from '../lang';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {capitalizeFirstLetter} from '../common/utils';

export function TestsPane() {
    const submissionResults = useAppSelector(state => state.submission.serverSubmissions);
    const dispatch = useDispatch();
    const platform = useAppSelector(state => state.options.platform)
    const currentSubmission = useAppSelector(state => null !== state.submission.currentSubmissionId ? submissionResults[state.submission.currentSubmissionId] : null);

    const getSubmissionLabel = (submissionResult: ServerSubmission) => {
        return <div className="submission-label">
            {submissionResult.evaluated ?
                <div className="submission-label-icon" style={{'--progression': `${Math.floor(submissionResult.result.score / 100 * 360)}deg`} as React.CSSProperties}>
                    <div className="submission-label-score">
                        {submissionResult.result.score}
                    </div>
                </div>
                :
                <div className="submission-label-loader">
                    <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>
                </div>
            }
            <div className="submission-label-name">
                {getMessage('SUBMISSION_RESULTS_LABEL').format({platform: capitalizeFirstLetter(platform)})}
            </div>
        </div>
    };

    const closePane = () => {
        dispatch(submissionChangePaneOpen(false));
    };

    const setCurrentSubmission = (submissionIndex: number) => {
        dispatch(submissionChangeCurrentSubmissionId(submissionIndex));
    };

    return (
        <div className="submission-results">
            <div className="submission-results__header">
                <div className="submission-results__title">{getMessage('SUBMISSION_RESULTS_TITLE')}</div>
                <div className="submission-results__close" onClick={closePane}>
                </div>
            </div>
            <div className="submission-results__selector">
                <Dropdown>
                    <Dropdown.Toggle>
                        {null !== currentSubmission ? getSubmissionLabel(currentSubmission) : getMessage('SELECT')}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {submissionResults.map((submission, submissionIndex) =>
                            <Dropdown.Item key={submissionIndex} onClick={() => setCurrentSubmission(submissionIndex)}>
                                <span>{getSubmissionLabel(submission)}</span>
                            </Dropdown.Item>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            {null !== currentSubmission && <div className="submission-results__submission">
                {currentSubmission.evaluated ?
                    <TestsPaneList
                        submission={currentSubmission.result}
                    />
                    :
                    <div className="submission-results__submission-loader">
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-2"/>
                        {getMessage('SUBMISSION_RESULTS_EVALUATING')}
                    </div>
                }
            </div>}
            {null === currentSubmission && <div className="submission-results__submission">
                <TestsPaneList
                />
            </div>}
        </div>
    )
}
