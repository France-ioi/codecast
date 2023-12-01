import React from "react";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {DateTime} from 'luxon';
import {TaskSubmissionServer} from './submission_types';
import {getMessage} from '../lang';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faClock, faSpinner} from '@fortawesome/free-solid-svg-icons';
import {capitalizeFirstLetter} from '../common/utils';

export interface SubmissionResultLabelProps {
    submission: TaskSubmissionServer,
}

export function SubmissionResultLabel(props: SubmissionResultLabelProps) {
    const submission = props.submission;
    const dateTime = DateTime.fromISO(submission.date);

    return (
        <div className="submission-label">
            {submission.evaluated ?
                <div className={`submission-label-icon ${1 <= submission.result.score ? 'submission-label-icon-success' : ''}`} style={{'--progression': `${Math.floor(submission.result.score / 100 * 360)}deg`} as React.CSSProperties}>
                    <div className="submission-label-score">
                        {submission.result.score}
                    </div>
                </div>
                :
                (submission.crashed ? <div className="submission-label-icon submission-label-icon-crash">
                    <div className="submission-label-score">
                        <FontAwesomeIcon icon={faTimes}/>
                    </div>
                </div>
                    : <div className="submission-label-loader">
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>
                    </div>)
            }
            <div className="submission-label-name">
                <p>{getMessage('SUBMISSION_RESULTS_LABEL').format({platform: capitalizeFirstLetter(submission.platform)})}</p>
                <p className="submission-label-date">
                    <FontAwesomeIcon icon={faClock}/>
                    <span className="ml-1">{dateTime.toLocaleString(DateTime.DATETIME_SHORT)}</span>
                </p>
            </div>
        </div>
    );
}
