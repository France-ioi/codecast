import {Task, TaskState, TaskTest} from '../task/task_slice';
import {TaskLevelName} from '../task/platform/platform_slice';
import {TaskTestServer} from './task_platform';
import {getMessage} from '../lang';
import {AppStore} from '../store';

export function extractTestsFromTask(task: Task): TaskTest[] {
    const tests = getTestsFromTask(task);
    nameTaskTests(tests, task);

    return tests;
}

function getTestsFromTask(task: Task): TaskTest[] {
    if (task.data) {
        let tests = [];
        let testId = 0;
        for (let [level, levelTests] of Object.entries<any>(task.data)) {
            for (let data of levelTests) {
                tests.push({
                    data,
                    level,
                    contextState: null,
                    id: String(testId),
                });
                testId++;
            }
        }

        return tests;
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
        };
    }
}

export function selectTaskTests(state: AppStore) {
    return selectTaskTestsInTaskStore(state.task);
}

export function selectTaskTestsInTaskStore(state: TaskState) {
    if (null === state.currentLevel) {
        return state.taskTests;
    }

    return state.taskTests.filter(test => {
        return state.currentLevel === test.level;
    });
}
