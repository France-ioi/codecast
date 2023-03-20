import {Task, TaskTest} from '../task/task_slice';
import {TaskLevelName} from '../task/platform/platform_slice';
import {SubmissionTestNormalized, TaskTestServer} from './task_platform';

export function extractTestsFromTask(task: Task, level: TaskLevelName): TaskTest[] {
    if (task.data) {
        return task.data[level].map(data => ({
            data: data,
            contextState: null,
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
