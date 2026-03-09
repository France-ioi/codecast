import React from 'react';
import {useAppSelector} from '../hooks';
import {isServerTask} from './task_types';
import {selectTaskTests} from '../submission/submission_selectors';

export function TaskExamples() {
    const task = useAppSelector(state => state.task.currentTask);
    if (!isServerTask(task)) {
        return null;
    }

    const taskTests = useAppSelector(selectTaskTests);
    const examples = taskTests.filter(test => test.data?.input);

    return (
        <div style={{marginTop: 30}}>
            {examples.map((test, i) =>
                <div key={i}>
                    {examples.length > 1 && <h4>Exemple {i+1}</h4>}

                    <div className="code-block input">
                        <div className="code-header">Entrée</div>
                        <pre className="task-example-io task-example-input">{test.data.input}</pre>
                    </div>
                    <div className="code-block output">
                        <div className="code-header">Sortie</div>
                        <pre className="task-example-io task-example-output">{test.data.output}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}
