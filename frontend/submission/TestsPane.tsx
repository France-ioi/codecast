import React from "react";
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {TestsPaneList} from './TestsPaneList';
import {Dropdown} from 'react-bootstrap';
import {submissionChangeCurrentSubmissionId, submissionChangePaneOpen} from './submission_slice';
import {getMessage} from '../lang';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {capitalizeFirstLetter} from '../common/utils';
import {isServerSubmission, TaskSubmissionEvaluateOn, TaskSubmissionServer} from './submission';

export function TestsPane() {
    const submissionResults = useAppSelector(state => state.submission.taskSubmissions);
    const dispatch = useDispatch();
    const platform = useAppSelector(state => state.options.platform)
    const currentSubmission = useAppSelector(state => null !== state.submission.currentSubmissionId ? submissionResults[state.submission.currentSubmissionId] : null);

    const getSubmissionLabel = (submissionResult: TaskSubmissionServer) => {
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
                <div className="submission-results__title">{getMessage(currentSubmission ? 'SUBMISSION_RESULTS_TITLE' : 'SUBMISSION_RESULTS_TESTS_TITLE')}</div>
                <div className="submission-results__close" onClick={closePane}>
                </div>
            </div>
            {submissionResults.length > 0 && <div className="submission-results__selector">
                <Dropdown>
                    <Dropdown.Toggle>
                        {null !== currentSubmission && isServerSubmission(currentSubmission) ? getSubmissionLabel(currentSubmission) : getMessage('SELECT')}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {submissionResults.filter(submission => TaskSubmissionEvaluateOn.Server === submission.type).map((submission, submissionIndex) =>
                            <Dropdown.Item key={submissionIndex} onClick={() => setCurrentSubmission(submissionIndex)}>
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
