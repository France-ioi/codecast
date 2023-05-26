import {Task, TaskTest} from '../task/task_slice';
import {TaskLevelName} from '../task/platform/platform_slice';
import {TaskTestServer} from './task_platform';
import {getMessage} from '../lang';

export function extractTestsFromTask(task: Task, level: TaskLevelName): TaskTest[] {
    const tests = getTestsFromTask(task, level);
    nameTaskTests(tests, task);

    return tests;
}

function getTestsFromTask(task: Task, level: TaskLevelName): TaskTest[] {
    if (task.data) {
        return task.data[level].map((data, testId) => ({
            data: data,
            contextState: null,
            id: String(testId),
        }));
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

        return testsOrdered.map(test => {
            return {
                ...test,
                data: {
                    input: test.input,
                    output: test.output,
                },
                contextState: null,
                groupType: test.groupType,
            };
        });
    }

    return [];
}

function nameTaskTests(taskTests: TaskTest[], task: Task): void {
    for (let index = 0; index < taskTests.length; index++) {
        const test = taskTests[index];
        const subTask = null !== test.subtaskId && task.subTasks && task.subTasks.length ? task.subTasks.find(subTask => subTask.id === test.subtaskId) : null;
        const parts = [];
        if (subTask) {
            parts.push(subTask.name);
        }

        let testName = test.name ?? test.data.testName;
        if (!testName) {
            let testNumber;
            if (null !== subTask) {
                testNumber = taskTests.filter(otherTest => otherTest.subtaskId === subTask.id).findIndex(otherTest => otherTest.id === test.id);
            } else  {
                testNumber = index;
            }

            testName = getMessage('SUBMISSION_TEST_NUMBER').format({testNumber: testNumber + 1});
        }

        parts.push(testName);

        const totalTestName = parts.join(' - ');

        taskTests[index] = {
            ...taskTests[index],
            name: totalTestName,
        };
    }
}

