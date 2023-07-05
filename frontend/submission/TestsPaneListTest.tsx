import React from "react";
import {getMessage} from '../lang';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faExclamationTriangle} from '@fortawesome/free-solid-svg-icons/faExclamationTriangle';
import {faHourglassHalf} from '@fortawesome/free-solid-svg-icons/faHourglassHalf';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {isServerSubmission} from './submission';
import {updateCurrentTestId} from '../task/task_slice';
import {useDispatch} from 'react-redux';
import {useAppSelector} from '../hooks';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {selectTaskTests} from './submission_selectors';
import {TaskTest, TaskTestGroupType} from '../task/task_types';
import {SubmissionTestErrorCode, TaskSubmission, TaskSubmissionServerTestResult} from './submission_types';
import {submissionRemoveTest} from './submission_actions';
import {call} from 'typed-redux-saga';
import {askConfirmation} from '../alert';

export interface SubmissionResultTestProps {
    index: number,
    test: TaskTest,
    submission?: TaskSubmission,
}

export interface ErrorCodeData {
    icon: IconDefinition,
    color: string,
    colorLight: string,
    message?: string
}

export const testErrorCodeData: {[property in SubmissionTestErrorCode]: ErrorCodeData} = {
    [SubmissionTestErrorCode.OtherError]: {
        icon: faExclamationTriangle,
        color: 'black',
        colorLight: '#cfd0d4',
        message: 'SUBMISSION_RESULT_CRASH',
    },
    [SubmissionTestErrorCode.NoError]: {
        icon: faCheck,
        color: '#9acc68',
        colorLight: '#dfeada',
    },
    [SubmissionTestErrorCode.WrongAnswer]: {
        icon: faTimes,
        color: '#ff0f2c',
        colorLight: '#f3c1cb',
    },
    [SubmissionTestErrorCode.AbortError]: {
        icon: faExclamationTriangle,
        color: 'black',
        colorLight: '#cfd0d4',
        message: 'SUBMISSION_RESULT_ABORT',
    },
    [SubmissionTestErrorCode.BusError]: {
        icon: faExclamationTriangle,
        color: 'black',
        colorLight: '#cfd0d4',
        message: 'SUBMISSION_RESULT_BUSERROR',
    },
    [SubmissionTestErrorCode.FloatingPointException]: {
        icon: faExclamationTriangle,
        color: 'black',
        colorLight: '#cfd0d4',
        message: 'SUBMISSION_RESULT_FLOATING',
    },
    [SubmissionTestErrorCode.SegFault]: {
        icon: faExclamationTriangle,
        color: 'black',
        colorLight: '#cfd0d4',
        message: 'SUBMISSION_RESULT_MEMORY',
    },
    [SubmissionTestErrorCode.TimeLimitExceeded]: {
        icon: faHourglassHalf,
        color: '#f5a523',
        colorLight: '#f1e2cc',
        message: 'SUBMISSION_RESULT_TIMEOUT',
    },
}

export function TestsPaneListTest(props: SubmissionResultTestProps) {
    const test = props.test;
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const testResult = props.submission ? props.submission.result.tests.find(otherTest => otherTest.testId === test.id) : null;
    const testIndex = useAppSelector(state => selectTaskTests(state).findIndex(otherTest => otherTest.id === test.id));

    const hasRelativeScore = testResult && testResult.score > 0 && testResult.score < 1;
    const submissionDisplayError = useAppSelector(state => state.submission.submissionDisplayedError);

    const errorCodeData = testResult? testErrorCodeData[testResult.errorCode] : null;

    let message;
    if (testResult && isServerSubmission(props.submission)) {
        message = errorCodeData.message;
        const time = Math.floor((testResult as TaskSubmissionServerTestResult).timeMs/10)/100;
        if (hasRelativeScore) {
            message = getMessage('SUBMISSION_RESULT_PARTIAL').format({score: testResult.score, time});
        } else if (SubmissionTestErrorCode.NoError === testResult.errorCode) {
            message = getMessage('SUBMISSION_RESULT_VALIDATED').format({time});
        } else if (SubmissionTestErrorCode.WrongAnswer === testResult.errorCode) {
            message = getMessage('SUBMISSION_RESULT_INCORRECT').format({time});
        } else if (message) {
            message = getMessage(message);
        }
    }

    const deleteTest = (e) => {
        askConfirmation({
            text: getMessage('SUBMISSION_REMOVE_TEST_CONFIRM'),
            confirmText: getMessage('CONFIRM'),
            cancelText: getMessage('CANCEL'),
        }).then((confirmed) => {
            if (confirmed) {
                dispatch(submissionRemoveTest(testIndex));
            }
        });

        e.stopPropagation();
    };

    const dispatch = useDispatch();

    const selectTest = () => {
        dispatch(updateCurrentTestId({testId: testIndex}));
    };

    return (
        <div className={`submission-result-test ${testIndex === currentTestId && !submissionDisplayError ? 'is-active' : ''}`} onClick={selectTest}>
            {testResult && errorCodeData && <div className="submission-result-icon-container" style={{backgroundColor: errorCodeData.color}}>
                <FontAwesomeIcon icon={errorCodeData.icon}/>
            </div>}
            <span className="submission-result-test-title">{test.name}</span>
            {testResult && <span className="submission-result-test-result">{message}</span>}
            {TaskTestGroupType.User === test.groupType && !props.submission && <span className="submission-result-test-delete" onClick={deleteTest}>
                <FontAwesomeIcon icon={faTrash}/>
            </span>}
        </div>
    )
}
