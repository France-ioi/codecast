import React from "react";
import {Alert, Intent} from '@blueprintjs/core';
import {getMessage} from '../lang';
import {useAppSelector} from '../hooks';
import {TestsPaneListSubTask} from './TestsPaneListSubTask';
import {TestsPaneListTest} from './TestsPaneListTest';
import {isServerSubmission, TaskSubmission, TaskSubmissionServer} from './submission';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useDispatch} from 'react-redux';
import {submissionChangeDisplayedError, SubmissionErrorType} from './submission_slice';
import {platformsList} from '../stepper/platforms';
import {faExclamationTriangle} from '@fortawesome/free-solid-svg-icons/faExclamationTriangle';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';

export interface SubmissionResultProps {
    submission?: TaskSubmission,
}

export function TestsPaneList(props: SubmissionResultProps) {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const testsOrdered = useAppSelector(state => state.task.taskTests);
    const submission = props.submission;
    const subTasksOrdered = currentTask.subTasks ? [...currentTask.subTasks] : [];
    subTasksOrdered.sort((a, b) => a.rank - b.rank);
    const submissionDisplayedError = useAppSelector(state => state.submission.submissionDisplayedError);

    const dispatch = useDispatch();
    const showSubmissionError = (type: SubmissionErrorType) => {
        dispatch(submissionChangeDisplayedError(type));
    };

    const createCompilationStatusBlock = (submissionErrorType: SubmissionErrorType, text: string, color: string) => {
        return <div
            className={`submission-result-compilation-status ${submissionErrorType === submissionDisplayedError ? 'is-active' : ''}`}
            onClick={() => showSubmissionError(submissionErrorType)}
        >
            <div className="submission-result-icon-container" style={{backgroundColor: color}}>
                <FontAwesomeIcon icon={faExclamationTriangle}/>
            </div>
            <strong>{text}</strong>
        </div>;
    };

    let compilationResult = null;
    if (submission && submission.result && submission.result.compilationError) {
        compilationResult = createCompilationStatusBlock(SubmissionErrorType.CompilationError, getMessage('SUBMISSION_ERROR_COMPILATION'), 'red');
    } else if (submission && submission.result && submission.result.compilationMessage) {
        compilationResult = createCompilationStatusBlock(SubmissionErrorType.CompilationWarning, getMessage('SUBMISSION_WARNING_COMPILATION'), 'orange');
    } else if (submission && submission.result && submission.result.errorMessage) {
        compilationResult = createCompilationStatusBlock(SubmissionErrorType.ExecutionError, getMessage('SUBMISSION_ERROR_EXECUTION'), 'black');
    } else if (submission && submission.platform in platformsList && platformsList[submission.platform].needsCompilation) {
        compilationResult = <div
            className={`submission-result-compilation-status is-ok`}
        >
            <div className="submission-result-icon-container" style={{backgroundColor: '#9acc68'}}>
                <FontAwesomeIcon icon={faCheck}/>
            </div>
            <strong>{getMessage('SUBMISSION_NO_ERROR')}</strong><br />
        </div>;
    }

    return (
        <div className="submission-result">
            {submission && isServerSubmission(submission) && 'UserTest' === submission.result.mode && <div>
                <Alert intent={Intent.WARNING}>{getMessage('SUBMISSION_USER_TEST_WARNING')}</Alert>
            </div>}
            {submission && !submission.evaluated && <div>
                {getMessage('SUBMISSION_RESULTS_EVALUATING')}
            </div>}

            <React.Fragment>
                {compilationResult}

                {submission && (!isServerSubmission(submission) || !submission.result.compilationError) && submission.result.tests.length === 0 && <div>
                    {getMessage('SUBMISSION_NO_TESTS')}
                </div>}

                <React.Fragment>
                    {subTasksOrdered.length > 0 && <div className="submission-result-subtasks">
                        {subTasksOrdered.map((subTask, subTaskIndex) =>
                            <TestsPaneListSubTask
                                key={subTaskIndex}
                                subTask={subTask}
                                submission={submission as TaskSubmissionServer}
                            />
                        )}
                    </div>}
                    {subTasksOrdered.length === 0 && <React.Fragment>
                        {testsOrdered.map((test, testIndex) =>
                            <TestsPaneListTest
                                key={testIndex}
                                index={testIndex}
                                test={test}
                                submission={submission}
                            />
                        )}
                    </React.Fragment>}
                </React.Fragment>
            </React.Fragment>
        </div>
    )
}