import {Task, TaskTest} from '../task/task_slice';
import {TaskLevelName} from '../task/platform/platform_slice';
import {TaskTestServer} from './task_platform';

export function extractTestsFromTask(task: Task, level: TaskLevelName): TaskTest[] {
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
                name: test.name,
            };
        });
    }

    return [];
}
