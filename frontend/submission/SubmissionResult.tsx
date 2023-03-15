import React from "react";
import {SubmissionOutput, SubmissionSubtaskNormalized, SubmissionTestNormalized} from './task_platform';
import {Alert, Intent} from '@blueprintjs/core';
import {getMessage} from '../lang';
import {useAppSelector} from '../hooks';
import {SubmissionResultSubTask} from './SubmissionResultSubTask';
import {SubmissionResultTest} from './SubmissionResultTest';

export interface SubmissionResultProps {
    submission: SubmissionOutput,
}

export function SubmissionResult(props: SubmissionResultProps) {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const submission = props.submission;
    const testsOrdered = [...submission.tests];

    const getTestRank = (a: SubmissionTestNormalized) => {
        const correspondingTest = currentTask.tests.find(test => test.id === a.testId);

        return correspondingTest ? correspondingTest.rank : 0;
    }
    testsOrdered.sort((a, b) => getTestRank(a) - getTestRank(b));

    const subTasksOrdered = [...submission.subTasks];

    const getSubTaskRank = (a: SubmissionSubtaskNormalized) => {
        const correspondingSubtask = currentTask.subTasks.find(subTask => subTask.id === a.subtaskId);

        return correspondingSubtask ? correspondingSubtask.rank : 0;
    }
    subTasksOrdered.sort((a, b) => getSubTaskRank(a) - getSubTaskRank(b));

    return (
        <div className="submission-result">
            {'UserTest' === submission.mode && <div>
                <Alert intent={Intent.WARNING}>{getMessage('SUBMISSION_USER_TEST_WARNING')}</Alert>
            </div>}
            {!submission.evaluated && <div>
                {getMessage('SUBMISSION_RESULTS_EVALUATING')}
            </div>}

            {submission.evaluated && <React.Fragment>
                {submission.compilationError && <div>
                    {submission.compilationMessage && <div>
                        <strong>{getMessage('SUBMISSION_ERROR_COMPILATION')}</strong><br />
                        <pre>{submission.compilationMessage}</pre>
                    </div>}
                    {!submission.compilationMessage && <div>
                        <strong>{getMessage('SUBMISSION_ERROR_EXECUTION')}</strong><br />
                        <pre>{submission.errorMessage}</pre>
                    </div>}
                </div>}

                {!submission.compilationError && submission.tests.length === 0 && <div>
                    {getMessage('SUBMISSION_NO_TESTS')}
                </div>}

                {!submission.compilationError && submission.tests.length > 0 && <React.Fragment>
                    {0 < submission.compilationMessage.length && <div>
                        <span>{getMessage('SUBMISSION_COMPILATION_OUTPUT')}</span><br />
                        <pre>{submission.compilationMessage}</pre>
                    </div>}
                    {subTasksOrdered.length > 0 && <div>
                        {subTasksOrdered.map((subTask, subTaskIndex) =>
                            <SubmissionResultSubTask
                                key={subTaskIndex}
                                submission={submission}
                                subTaskResult={subTask}
                            />
                        )}
                    </div>}
                    {subTasksOrdered.length === 0 && <React.Fragment>
                        {testsOrdered.map((test, testIndex) =>
                            <SubmissionResultTest
                                key={testIndex}
                                index={testIndex}
                                testResult={test}
                            />
                        )}
                    </React.Fragment>}
                </React.Fragment>}
            </React.Fragment>}
        </div>
    )
}
