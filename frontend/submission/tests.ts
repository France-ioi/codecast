import {Task, TaskTest} from '../task/task_slice';
import {TaskLevelName} from '../task/platform/platform_slice';

export function extractTestsFromTask(task: Task, level: TaskLevelName): TaskTest[] {
    if (task.data) {
        return task.data[level].map(data => ({
            data: data,
            contextState: null,
        }));
    }
    if (task.tests) {
        // Sort tests by subtasks
        return task.tests.map(test => {
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
