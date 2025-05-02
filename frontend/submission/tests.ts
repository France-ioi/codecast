import {Task, TaskTest, TaskTestServer} from '../task/task_types';
import {getMessage} from '../lang';
import {extractVariantSpecific} from '../task/utils';
import {TaskLevelName} from '../task/platform/platform_slice';
import {SubmissionTestErrorCode, TaskSubmissionServerTestResult, TaskSubmissionTestResult} from './submission_types';
import {testErrorCodeData} from './TestsPaneListTest';

export function extractTestsFromTask(task: Task, variant: number = null): TaskTest[] {
    const tests = getTestsFromTask(task, variant);
    nameTaskTests(tests, task);

    return tests;
}

function getTestsFromTask(task: Task, taskVariant: number = null): TaskTest[] {
    let tests = [];

    if (task.data) {
        let testId = 0;
        for (let [level, levelTests] of Object.entries<any>(task.data)) {
            const realLevelTests = null !== taskVariant && undefined !== taskVariant ? extractVariantSpecific(levelTests, taskVariant, level as TaskLevelName) : levelTests;

            for (let data of realLevelTests) {
                tests.push({
                    data,
                    level,
                    contextState: null,
                    id: String(testId),
                });
                testId++;
            }
        }
    }

    if (task.tests) {
        // Sort tests by subtasks
        const rankWeight = 10000;
        const getTestRank = (test: TaskTestServer) => {
            const correspondingSubTask = task.subTasks.find(subTask => subTask.id === test.subtaskId);

            return undefined !== correspondingSubTask ? correspondingSubTask.rank * rankWeight + test.rank : rankWeight * 100 * test.rank;
        };

        const testsOrdered = [...task.tests.filter(a => a.active)];
        testsOrdered.sort((a, b) => getTestRank(a) - getTestRank(b));

        tests = [
            ...tests,
            ...testsOrdered.map(mapServerTestToTaskTest),
        ];
    }

    return tests;
}

export function mapServerTestToTaskTest(test: TaskTestServer) {
    return {
        ...test,
        data: {
            input: test.input,
            output: test.output,
        },
        contextState: null,
        groupType: test.groupType,
    };
}

function nameTaskTests(taskTests: TaskTest[], task: Task): void {
    for (let index = 0; index < taskTests.length; index++) {
        const test = taskTests[index];
        const subTask = null !== test.subtaskId && task.subTasks && task.subTasks.length ? task.subTasks.find(subTask => subTask.id === test.subtaskId) ?? null : null;
        const parts = [];
        if (subTask) {
            parts.push(subTask.name);
        }

        let testName = test.name ?? test.data.testName;
        if (!testName) {
            let testNumber;
            if (null !== subTask) {
                testNumber = taskTests.filter(otherTest => otherTest.subtaskId === subTask.id).findIndex(otherTest => otherTest.id === test.id);
            } else if (test.level) {
                testNumber = taskTests.filter(otherTest => otherTest.level === test.level).findIndex(otherTest => otherTest.id === test.id);
            } else {
                testNumber = index;
            }

            testName = getMessage('SUBMISSION_TEST_NUMBER').format({testNumber: testNumber + 1});
        }

        parts.push(testName);

        const totalTestName = parts.join(' - ');

        taskTests[index] = {
            ...taskTests[index],
            name: totalTestName,
            shortName: testName,
        };
    }
}

export function getTestResultMessage(testResult: TaskSubmissionTestResult) {
    const errorCodeData = testResult ? testErrorCodeData[testResult.errorCode] : null;
    const hasRelativeScore = testResult && testResult.score > 0 && testResult.score < 1;
    let message = errorCodeData.message;
    const time = Math.floor((testResult as TaskSubmissionServerTestResult).timeMs / 10) / 100;
    if (hasRelativeScore) {
        message = getMessage('SUBMISSION_RESULT_PARTIAL').format({score: Math.round(testResult.score * 100), time});
    } else if (SubmissionTestErrorCode.NoError === testResult.errorCode) {
        message = getMessage('SUBMISSION_RESULT_VALIDATED').format({time});
    } else if (SubmissionTestErrorCode.WrongAnswer === testResult.errorCode) {
        message = getMessage('SUBMISSION_RESULT_INCORRECT').format({time});
    } else if (message) {
        message = getMessage(message);
    }

    return message;
}
