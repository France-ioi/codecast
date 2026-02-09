import React from "react";
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {TestsPaneList} from './TestsPaneList';
import {
    submissionChangePaneOpen,
    submissionCloseCurrentSubmission,
} from './submission_slice';
import {getMessage} from '../lang';
import {faSpinner, faTimes} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {SubmissionResultLabel} from './SubmissionResultLabel';
import {isServerSubmission} from './submission';

export interface TestsPaneProps {
    open: boolean,
}

export function TestsPane(props: TestsPaneProps) {
    const submissionResults = useAppSelector(state => state.submission.taskSubmissions);
    const dispatch = useDispatch();
    const currentSubmission = useAppSelector(state => null !== state.submission.currentSubmissionId ? submissionResults[state.submission.currentSubmissionId] : null);

    const closePane = () => {
        dispatch(submissionChangePaneOpen(false));
    };

    const cancelSubmission = () => {
        dispatch(submissionCloseCurrentSubmission({}));
    };

    return (
        <div className="submission-results" style={{display: props.open ? 'flex' : 'none'}}>
            <div className="submission-results__header">
                <div className="submission-results__title">{getMessage(currentSubmission ? 'SUBMISSION_RESULTS_TITLE' : 'SUBMISSION_RESULTS_TESTS_TITLE')}</div>
                <div className="submission-results__close" onClick={closePane}>
                </div>
            </div>

            {currentSubmission && isServerSubmission(currentSubmission) && <div className="submission-results__label-container">
                <SubmissionResultLabel submission={currentSubmission}/>
                <div className="submission-close" onClick={cancelSubmission}>
                    <FontAwesomeIcon icon={faTimes}/>
                </div>
            </div>}

            <div className="submission-results__submission">
                <div style={{display: !currentSubmission || currentSubmission.evaluated ? 'block' : 'none'}}>
                    <TestsPaneList
                        submission={currentSubmission}
                    />
                </div>

                {(currentSubmission && !currentSubmission.evaluated) && (
                    currentSubmission.crashed ? <div className="submission-results__submission-crashed">
                        {getMessage('SUBMISSION_RESULTS_CRASHED')}
                    </div>
                        : <div className="submission-results__submission-loader">
                            <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-2"/>
                            {getMessage('SUBMISSION_RESULTS_EVALUATING')}
                        </div>
                )}
            </div>
        </div>
    )
}
