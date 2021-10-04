import React, {useEffect} from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {useAppSelector} from "../hooks";
import {useResizeDetector} from "react-resize-detector";
import {TaskTestsSelector} from "./TaskTestsSelector";
import {taskLevels} from "./task_slice";

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const taskLoaded = useAppSelector(state => state.task.loaded);
    const {width, height, ref} = useResizeDetector();

    useEffect(() => {
        quickAlgoLibraries.redrawDisplay();
    }, [taskLoaded]);

    useEffect(() => {
        const context = quickAlgoLibraries.getContext(null, false);
        if (context) {
            context.updateScale();
        }
    }, [width, height]);

    let testsSelectorEnabled = false;
    if (currentTask) {
        const levelData = currentTask.data[taskLevels[currentLevel]];
        testsSelectorEnabled = 0 < levelData.length;
    }

    return (
        <div className="context-visualization">
            <div className="task-visualisation" ref={ref}>
                {currentTask && currentTask.gridInfos && currentTask.gridInfos.images &&
                currentTask.gridInfos.images.map((module, key) =>
                    <img key={key} src={module.default} style={{display: 'none'}}/>
                )
                }
                {Visualization ? <Visualization/> : <div id="grid"/>}
            </div>

            {testsSelectorEnabled && <TaskTestsSelector/>}
        </div>
    );
}
