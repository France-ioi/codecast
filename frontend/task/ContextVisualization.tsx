import React, {useEffect} from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {useAppSelector} from "../hooks";
import {useResizeDetector} from "react-resize-detector";

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();
    const currentTask = useAppSelector(state => state.task.currentTask);
    const {width, height, ref} = useResizeDetector();
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);

    useEffect(() => {
        quickAlgoLibraries.resetDisplay();
    }, []);

    useEffect(() => {
        const context = quickAlgoLibraries.getContext();
        if (context) {
            context.updateScale();
        }
    }, [width, height]);

    return (
        <div className="task-visualisation" ref={ref} style={{fontSize: `${zoomLevel}rem`}}>
            {currentTask && currentTask.gridInfos && currentTask.gridInfos.images &&
                currentTask.gridInfos.images.map((module, key) =>
                    <img key={key} src={module.default} style={{display: 'none'}}/>
                )
            }
            {Visualization ? <Visualization/> : <div id="grid"/>}
        </div>
    );
}
