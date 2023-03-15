import React from "react";
import {useAppSelector} from "../hooks";
import {SubmissionTestErrorCode, SubmissionTestNormalized, TaskTestGroupType} from './task_platform';
import {createStoreHook} from 'react-redux';
import {getMessage} from '../lang';
import Task from '../task';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faExclamationTriangle} from '@fortawesome/free-solid-svg-icons/faExclamationTriangle';
import {faHourglassHalf} from '@fortawesome/free-solid-svg-icons/faHourglassHalf';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

export interface SubmissionResultTestProps {
    index: number,
    testResult: SubmissionTestNormalized,
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

export function SubmissionResultTest(props: SubmissionResultTestProps) {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const testResult = props.testResult;
    const test = currentTask.tests.find(test => test.id === testResult.testId);

    const testName = TaskTestGroupType.Evaluation === test.groupType
        ? getMessage('SUBMISSION_TEST_NUMBER').format({testNumber: props.index + 1})
        : test.name;

    const hasRelativeScore = testResult.score > 0 && testResult.score < 100;

    const errorCodeData = testErrorCodeData[testResult.errorCode];

    let message = errorCodeData.message;
    if (hasRelativeScore) {
        message = `réussi à ${testResult.score}% en ${Math.floor(testResult.timeMs/10)/100}s`;
    } else if (SubmissionTestErrorCode.NoError === testResult.errorCode) {
        message = "validé";
    } else if (SubmissionTestErrorCode.WrongAnswer === testResult.errorCode) {
        message = "résultat incorrect en " + (Math.floor(testResult.timeMs/10)/100) + 's';
    } else if (message) {
        message = getMessage(message);
    }

    return (
        <div className="submission-result-test">
            <div className="submission-result-icon-container" style={{backgroundColor: errorCodeData.color}}>
                <FontAwesomeIcon icon={errorCodeData.icon}/>
            </div>
            <span className="submission-result-test-title">{testName}</span>
            <span className="submission-result-test-result">{message}</span>
        </div>
    )
}
