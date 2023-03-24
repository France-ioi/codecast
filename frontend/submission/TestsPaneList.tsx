import React from "react";
import {Alert, Intent} from '@blueprintjs/core';
import {getMessage} from '../lang';
import {useAppSelector} from '../hooks';
import {TestsPaneListSubTask} from './TestsPaneListSubTask';
import {TestsPaneListTest} from './TestsPaneListTest';
import {isServerSubmission, TaskSubmission, TaskSubmissionServer} from './submission';

export interface SubmissionResultProps {
    submission?: TaskSubmission,
}

export function TestsPaneList(props: SubmissionResultProps) {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const submission = props.submission;
    const testsOrdered = [...currentTask.tests];
    const subTasksOrdered = currentTask.subTasks ? [...currentTask.subTasks] : [];
    subTasksOrdered.sort((a, b) => a.rank - b.rank);

    return (
        <div className="submission-result">
            {submission&& isServerSubmission(submission) && 'UserTest' === submission.result.mode && <div>
                <Alert intent={Intent.WARNING}>{getMessage('SUBMISSION_USER_TEST_WARNING')}</Alert>
            </div>}
            {submission && !submission.evaluated && <div>
                {getMessage('SUBMISSION_RESULTS_EVALUATING')}
            </div>}

            <React.Fragment>
                {submission && isServerSubmission(submission) && submission.result.compilationError && <div>
                    {submission.result.compilationMessage && <div>
                        <strong>{getMessage('SUBMISSION_ERROR_COMPILATION')}</strong><br />
                        <pre>{submission.result.compilationMessage}</pre>
                    </div>}
                    {!submission.result.compilationMessage && <div>
                        <strong>{getMessage('SUBMISSION_ERROR_EXECUTION')}</strong><br />
                        <pre>{submission.result.errorMessage}</pre>
                    </div>}
                </div>}

                {submission && (!isServerSubmission(submission) || !submission.result.compilationError) && submission.result.tests.length === 0 && <div>
                    {getMessage('SUBMISSION_NO_TESTS')}
                </div>}

                <React.Fragment>
                    {submission && isServerSubmission(submission) && 0 < submission.result.compilationMessage.length && <div>
                        <span>{getMessage('SUBMISSION_COMPILATION_OUTPUT')}</span><br />
                        <pre>{submission.result.compilationMessage}</pre>
                    </div>}
                    {subTasksOrdered.length > 0 && <div>
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
