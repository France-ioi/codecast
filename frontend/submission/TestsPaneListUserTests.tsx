import React, {useState} from "react";
import {useAppSelector} from "../hooks";
import {Collapse} from 'react-bootstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCaretUp} from '@fortawesome/free-solid-svg-icons/faCaretUp';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';
import {ErrorCodeData, TestsPaneListTest, testErrorCodeData} from './TestsPaneListTest';
import {selectTaskTests} from './submission_selectors';
import {TaskSubmissionServer} from './submission_types';
import {getMessage} from '../lang';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {submissionChangeCurrentSubmissionId} from './submission_slice';
import {submissionCreateTest} from './submission_actions';
import {useDispatch} from 'react-redux';
import {TaskTestGroupType} from '../task/task_types';

export interface SubmissionResultSubTaskProps {
    submission: TaskSubmissionServer,
}

export function TestsPaneListUserTests(props: SubmissionResultSubTaskProps) {
    const taskTests = useAppSelector(selectTaskTests);
    // const subTask = props.subTask;
    // const subTaskResult = props.submission && props.submission.result.subTasks ? props.submission.result.subTasks.find(submissionSubTask => submissionSubTask.subtaskId === subTask.id) : null;
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();

    const testsOrdered = [...taskTests.filter(test => TaskTestGroupType.User === test.groupType)];

    const testsByIcon: {[key: number]: number} = {};
    let testsByIconValues: {errorCodeData: ErrorCodeData, count: number}[];
    if (props.submission) {
        for (let test of testsOrdered) {
            const testResult = props.submission.result.tests.find(submissionTest => submissionTest.testId === test.id);
            if (testResult) {
                if (!(testResult.errorCode in testsByIcon)) {
                    testsByIcon[testResult.errorCode] = 0;
                }
                testsByIcon[testResult.errorCode]++;
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

    const createNewTest = () => {
        if (props.submission) {
            dispatch(submissionChangeCurrentSubmissionId(null));
        }
        dispatch(submissionCreateTest());
    };

    // let scoreClass = '';
    // if (subTaskResult && subTaskResult.score >= subTask.pointsMax && (0 < subTask.pointsMax || testsByIcon[SubmissionTestErrorCode.NoError] === testsOrdered.length)) {
    //     scoreClass = 'is-success';
    // } else if (subTaskResult && subTaskResult.score > 0) {
    //     scoreClass = 'is-partial';
    // }

    return (
        <div className={`submission-result-subtask ${open ? 'is-open' : ''}`}>
            <div className="submission-result-subtask-header" onClick={() => setOpen(!open)}>
                {/*{subTaskResult && subTaskResult.success ?*/}
                {/*    <span className="glyphicon glyphicon-ok image_succeed_subtask"></span>*/}
                {/*    : <span className="glyphicon glyphicon-remove image_failure_subtask"></span>*/}
                {/*}*/}
                <div className="subtask-header-name">{getMessage('SUBMISSION_OWN_TESTS_LABEL')}</div>
                {!open && testsByIconValues && <div className="subtask-header-summary">
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
                    <div className={`submission-result-test submission-result-create-test`} onClick={createNewTest}>
                        <div className="submission-result-test-icon">
                            <FontAwesomeIcon icon={faPlus}/>
                        </div>
                        <span className="submission-result-test-title">
                            {getMessage('SUBMISSION_CREATE_TEST')}
                        </span>
                    </div>
                </div>
            </Collapse>
        </div>
    )
}
