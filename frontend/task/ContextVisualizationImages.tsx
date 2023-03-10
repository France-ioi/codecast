import React from "react";
import {useAppSelector} from "../hooks";

export function ContextVisualizationImages() {
    const currentTask = useAppSelector(state => state.task.currentTask);

    return (
        <div className="context-visualization-images">
            {currentTask && currentTask.gridInfos && currentTask.gridInfos.images &&
                currentTask.gridInfos.images.map((element, key) =>
                    <img id={element.id} key={key} src={element.path.default}/>
                )
            }
        </div>
    );
}
