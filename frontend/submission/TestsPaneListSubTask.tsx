import React, {useState} from "react";
import {useAppSelector} from "../hooks";
import {Collapse} from 'react-bootstrap';
import {
    TaskSubtaskNormalized
} from './task_platform';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCaretUp} from '@fortawesome/free-solid-svg-icons/faCaretUp';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';
import {ErrorCodeData, TestsPaneListTest, testErrorCodeData} from './TestsPaneListTest';
import { TaskSubmissionServer} from './submission';
import {selectTaskTests} from './submission_selectors';

export interface SubmissionResultSubTaskProps {
    submission: TaskSubmissionServer,
    subTask: TaskSubtaskNormalized,
}

export function TestsPaneListSubTask(props: SubmissionResultSubTaskProps) {
    const taskTests = useAppSelector(selectTaskTests);
    const subTask = props.subTask;
    const subTaskResult = props.submission && props.submission.result.subTasks ? props.submission.result.subTasks.find(submissionSubTask => submissionSubTask.subtaskId === subTask.id) : null;
    const [open, setOpen] = useState(false);

    const testsOrdered = [...taskTests.filter(test => test.subtaskId === subTask.id)];

    let scoreClass = '';
    if (subTaskResult && subTaskResult.score >= subTask.pointsMax) {
        scoreClass = 'is-success';
    } else if (subTaskResult && subTaskResult.score > 0) {
        scoreClass = 'is-partial';
    }

    let testsByIconValues: {errorCodeData: ErrorCodeData, count: number}[];
    if (props.submission) {
        const testsByIcon: {[key: number]: number} = {};
        for (let test of testsOrdered) {
            const testResult = props.submission.result.tests.find(submissionTest => submissionTest.testId === test.id);
            if (testResult) {
                if (!(testResult.errorCode in testsByIcon)) {
                    testsByIcon[testResult.errorCode] = 0;
                }
                testsByIcon[testResult.errorCode]++;
            } else {
                console.error('Test result not found', test, props.submission.result.tests);
            }
        }

        testsByIconValues = Object.entries(testsByIcon).map(([errorCode, count]) => {
            const errorCodeData = testErrorCodeData[errorCode];

            return {
                errorCodeData,
                count,
            };
        });
        testsByIconValues.sort((a, b) => a.count - b.count);
    }

    return (
        <div className={`submission-result-subtask ${open ? 'is-open' : ''}`}>
            <div className="submission-result-subtask-header" onClick={() => setOpen(!open)}>
                {subTaskResult && subTaskResult.success ?
                    <span className="glyphicon glyphicon-ok image_succeed_subtask"></span>
                    : <span className="glyphicon glyphicon-remove image_failure_subtask"></span>
                }
                {subTaskResult && <div className={`subtask-header-score ${scoreClass}`}>
                    {subTaskResult.score} / {subTask.pointsMax}
                </div>}
                <div className="subtask-header-name">{subTask.name}</div>
                {!open && subTaskResult && <div className="subtask-header-summary">
                    {testsByIconValues.map((testsByIconValue, testIndex) =>
                        <div className="subtask-header-summary-badge" key={testIndex} style={{background: testsByIconValue.errorCodeData.colorLight}}>
                            <div className="subtask-header-summary-badge-icon" style={{background: testsByIconValue.errorCodeData.color}}>
                                <FontAwesomeIcon icon={testsByIconValue.errorCodeData.icon}/>
                            </div>
                            <span className="subtask-header-summary-badge-content">{testsByIconValue.count}</span>
                        </div>
                    )}
                </div>}
                <div className="subtask-header-caret">
                    <FontAwesomeIcon icon={open ? faCaretUp : faCaretDown}/>
                </div>
            </div>
            <Collapse in={open}>
                <div>
                    {testsOrdered.map((test, testIndex) =>
                        <TestsPaneListTest
                            key={testIndex}
                            index={testIndex}
                            test={test}
                            submission={props.submission}
                        />
                    )}
                </div>
            </Collapse>
        </div>
    )
}
