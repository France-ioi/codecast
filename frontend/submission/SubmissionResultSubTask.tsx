import React, {useState} from "react";
import {useAppSelector} from "../hooks";
import {Collapse} from 'react-bootstrap';
import {SubmissionOutput, SubmissionSubtaskNormalized, SubmissionTestNormalized} from './task_platform';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCaretUp} from '@fortawesome/free-solid-svg-icons/faCaretUp';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';
import {ErrorCodeData, SubmissionResultTest, testErrorCodeData} from './SubmissionResultTest';

export interface SubmissionResultSubTaskProps {
    submission: SubmissionOutput,
    subTaskResult: SubmissionSubtaskNormalized,
}

export function SubmissionResultSubTask(props: SubmissionResultSubTaskProps) {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const subTaskResult = props.subTaskResult;
    const subTask = currentTask.subTasks.find(subTask => subTask.id === subTaskResult.subtaskId);
    const [open, setOpen] = useState(false);

    const getTestRank = (a: SubmissionTestNormalized) => {
        const correspondingTest = currentTask.tests.find(test => test.id === a.testId);

        return correspondingTest ? correspondingTest.rank : 0;
    };

    const testsOrdered = [...props.submission.tests.filter(test => test.submissionSubtaskId === subTaskResult.id)];
    testsOrdered.sort((a, b) => getTestRank(a) - getTestRank(b));

    let scoreClass = '';
    if (subTaskResult.score >= subTask.pointsMax) {
        scoreClass = 'is-success';
    } else if (subTaskResult.score > 0) {
        scoreClass = 'is-partial';
    }

    const testsByIcon: {[key: number]: number} = {};
    for (let test of testsOrdered) {
        if (!(test.errorCode in testsByIcon)) {
            testsByIcon[test.errorCode] = 0;
        }
        testsByIcon[test.errorCode]++;
    }
    const testsByIconValues: {errorCodeData: ErrorCodeData, count: number}[] = Object.entries(testsByIcon).map(([errorCode, count]) => {
        const errorCodeData = testErrorCodeData[errorCode];

        return {
            errorCodeData,
            count,
        };
    });
    testsByIconValues.sort((a, b) => a.count - b.count);

    console.log(testsByIconValues);

    return (
        <div className={`submission-result-subtask ${open ? 'is-open' : ''}`}>
            <div className="submission-result-subtask-header" onClick={() => setOpen(!open)}>
                {subTaskResult.success ?
                    <span className="glyphicon glyphicon-ok image_succeed_subtask"></span>
                    : <span className="glyphicon glyphicon-remove image_failure_subtask"></span>
                }
                <div className={`subtask-header-score ${scoreClass}`}>
                    {subTaskResult.score} / {subTask.pointsMax}
                </div>
                <div className="subtask-header-name">{subTask.name}</div>
                {!open && <div className="subtask-header-summary">
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
                        <SubmissionResultTest
                            key={testIndex}
                            index={testIndex}
                            testResult={test}
                        />
                    )}
                </div>
            </Collapse>
        </div>
    )
}
