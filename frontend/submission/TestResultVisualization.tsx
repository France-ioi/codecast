import React from "react";
import {TaskSubmissionServerTestResult} from './submission_types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {testErrorCodeData} from './TestsPaneListTest';
import {getTestResultMessage} from './tests';

export interface TestResultVisualizationProps {
    testResult: TaskSubmissionServerTestResult,
}

export function TestResultVisualization(props: TestResultVisualizationProps) {
    const testResult = props.testResult;
    const errorCodeData = testErrorCodeData[testResult.errorCode];
    const icon = errorCodeData.icon;
    const message = getTestResultMessage(testResult);

    return (
        <div className="test-result-visualization task-visualization-not-public">
            <div className="submission-result-icon-container" style={{backgroundColor: errorCodeData.color}}>
                <FontAwesomeIcon icon={icon}/>
            </div>

            <div className="test-result-visualization-text">
                {message}
            </div>
        </div>
    )
}
