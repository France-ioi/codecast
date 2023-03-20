import React from "react";
import {SubmissionOutput, SubmissionSubtaskNormalized, SubmissionTestNormalized} from './task_platform';
import {Alert, Intent} from '@blueprintjs/core';
import {getMessage} from '../lang';
import {useAppSelector} from '../hooks';
import {TestsPaneListSubTask} from './TestsPaneListSubTask';
import {TestsPaneListTest} from './TestsPaneListTest';

export interface SubmissionResultProps {
    submission?: SubmissionOutput,
}

export function TestsPaneList(props: SubmissionResultProps) {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const submission = props.submission;
    const testsOrdered = [...currentTask.tests];
    const subTasksOrdered = currentTask.subTasks ? [...currentTask.subTasks] : [];
    subTasksOrdered.sort((a, b) => a.rank - b.rank);

    return (
        <div className="submission-result">
            {submission && 'UserTest' === submission.mode && <div>
                <Alert intent={Intent.WARNING}>{getMessage('SUBMISSION_USER_TEST_WARNING')}</Alert>
            </div>}
            {submission && !submission.evaluated && <div>
                {getMessage('SUBMISSION_RESULTS_EVALUATING')}
            </div>}

            <React.Fragment>
                {submission && submission.compilationError && <div>
                    {submission.compilationMessage && <div>
                        <strong>{getMessage('SUBMISSION_ERROR_COMPILATION')}</strong><br />
                        <pre>{submission.compilationMessage}</pre>
                    </div>}
                    {!submission.compilationMessage && <div>
                        <strong>{getMessage('SUBMISSION_ERROR_EXECUTION')}</strong><br />
                        <pre>{submission.errorMessage}</pre>
                    </div>}
                </div>}

                {submission && !submission.compilationError && submission.tests.length === 0 && <div>
                    {getMessage('SUBMISSION_NO_TESTS')}
                </div>}

                {(!submission || (!submission.compilationError && submission.tests.length > 0)) && <React.Fragment>
                    {submission && 0 < submission.compilationMessage.length && <div>
                        <span>{getMessage('SUBMISSION_COMPILATION_OUTPUT')}</span><br />
                        <pre>{submission.compilationMessage}</pre>
                    </div>}
                    {subTasksOrdered.length > 0 && <div>
                        {subTasksOrdered.map((subTask, subTaskIndex) =>
                            <TestsPaneListSubTask
                                key={subTaskIndex}
                                subTask={subTask}
                                submission={submission}
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
                </React.Fragment>}
            </React.Fragment>
        </div>
    )
}
