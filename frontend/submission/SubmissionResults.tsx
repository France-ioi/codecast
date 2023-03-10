import React, {useState} from "react";
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {SubmissionResult} from './SubmissionResult';
import {Dropdown} from 'react-bootstrap';
import {SubmissionOutput} from './task_platform';
import {submissionChangePaneOpen} from './submission_slice';
import {getMessage} from '../lang';

export function SubmissionResults() {
    const submissionResults = useAppSelector(state => state.submission.serverSubmissionsResults);
    const dispatch = useDispatch();
    const platform = useAppSelector(state => state.options.platform)
    const [currentSubmission, setCurrentSubmission] = useState<SubmissionOutput>(null);

    const getSubmissionLabel = (submissionResult: SubmissionOutput) => {
        return "Soumission en " + getMessage('PLATFORM_' + platform.toLocaleUpperCase()).s;
    };

    const closePane = () => {
        dispatch(submissionChangePaneOpen(false));
    }

    console.log('submission results', submissionResults);

    return (
        <div className="submission-results">
            <div className="submission-results__header">
                <div className="submission-results__title">Résultat des tests</div>
                <div className="submission-results__close" onClick={closePane}>
                </div>
            </div>
            <div className="submission-results__selector">
                <Dropdown>
                    <Dropdown.Toggle>
                        {null !== currentSubmission ? getSubmissionLabel(currentSubmission) : 'Choisir'}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {submissionResults.map((submission) =>
                            <Dropdown.Item key={submission.id} onClick={() => setCurrentSubmission(submission)}>
                                <span>{getSubmissionLabel(submission)}</span>
                            </Dropdown.Item>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            {null !== currentSubmission && <div className="submission-results__submission">
                <SubmissionResult
                    submission={currentSubmission}
                />
            </div>}
        </div>
    )
}
