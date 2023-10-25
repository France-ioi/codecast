import React, {useState} from "react";
import {useAppSelector} from "../hooks";
import {Dropdown} from 'react-bootstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {TaskSubmission, TaskSubmissionEvaluateOn, TaskSubmissionServer} from './submission_types';
import {getMessage} from '../lang';
import {
    submissionChangeCurrentSubmissionId, submissionCloseCurrentSubmission,
    SubmissionExecutionScope
} from './submission_slice';
import {faClock} from '@fortawesome/free-solid-svg-icons';
import {useDispatch} from 'react-redux';
import {SubmissionResultLabel} from './SubmissionResultLabel';

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
                            <SubmissionResultLabel submission={submission as TaskSubmissionServer}/>
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}
