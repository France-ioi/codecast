import {Task, TaskTest, TaskTestServer} from '../task/task_types';
import {getMessage} from '../lang';
import {extractVariantSpecific} from '../task/utils';
import {TaskLevelName} from '../task/platform/platform_slice';

export function extractTestsFromTask(task: Task, variant: number = null): TaskTest[] {
    const tests = getTestsFromTask(task, variant);
    nameTaskTests(tests, task);

    return tests;
}

function getTestsFromTask(task: Task, taskVariant: number = null): TaskTest[] {
    if (task.data) {
        let tests = [];
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

        return testsOrdered.map(mapServerTestToTaskTest);
    }

    return [];
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

