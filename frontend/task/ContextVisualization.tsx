import React, {useEffect} from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {useAppSelector} from "../hooks";

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();

    const currentTask = useAppSelector(state => state.task.currentTask);

    useEffect(() => {
        quickAlgoLibraries.resetDisplay();
    }, []);

    return (
        <div className="task-visualisation">
            {currentTask && currentTask.gridInfos && currentTask.gridInfos.images &&
                currentTask.gridInfos.images.map((module, key) =>
                    <img key={key} src={module.default} style={{display: 'none'}}/>
                )
            }
            <div id="grid"/>
            {Visualization && <Visualization/>}
        </div>
    );
}
