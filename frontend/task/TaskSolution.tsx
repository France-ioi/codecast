import React, {useEffect, useState} from "react";
import {useAppSelector} from "../hooks";
import {formatTaskInstructions} from './utils';
import {
    convertHtmlInstructionsToReact,
    getTaskSolution,
} from './instructions/instructions';

export function TaskSolution() {
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const taskLevel = useAppSelector(state => state.task.currentLevel);
    const taskVariant = useAppSelector(state => state.options.taskVariant);
    const contextId = useAppSelector(state => state.task.contextId);
    const [solutionsHtml, setSolutionsHtml] = useState(null);
    const platform = useAppSelector(state => state.options.platform);
    const solutionHtml = useAppSelector(getTaskSolution);

    useEffect(() => {
        let instructionsJQuery = formatTaskInstructions(solutionHtml, platform, taskLevel, taskVariant);
        setSolutionsHtml(instructionsJQuery.html());

        setTimeout(() => {
            if (window.instructionsPostProcessing?.length) {
                for (let postProcessingCallback of window.instructionsPostProcessing) {
                    postProcessingCallback();
                }
            }
        });
    }, [contextId]);

    if (!solutionsHtml) {
        return null;
    }

    return (
        <div className={`task-mission`} style={{fontSize: `${zoomLevel}rem`}}>
            <div>{convertHtmlInstructionsToReact(solutionsHtml, platform)}</div>
        </div>
    );
}

TaskSolution.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
