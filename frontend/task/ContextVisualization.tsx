import React, {useEffect} from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {useAppSelector} from "../hooks";
import {useResizeDetector} from "react-resize-detector";

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskLoaded = useAppSelector(state => state.task.loaded);
    const {width, height, ref} = useResizeDetector();

    useEffect(() => {
        quickAlgoLibraries.resetDisplay();
    }, [taskLoaded]);

    useEffect(() => {
        const context = quickAlgoLibraries.getContext();
        if (context) {
            context.updateScale();
        }
    }, [width, height]);

    return (
        <div className="task-visualisation" ref={ref}>
            {currentTask && currentTask.gridInfos && currentTask.gridInfos.images &&
                currentTask.gridInfos.images.map((module, key) =>
                    <img key={key} src={module.default} style={{display: 'none'}}/>
                )
            }
            {Visualization ? <Visualization/> : <div id="grid"/>}
        </div>
    );
}
