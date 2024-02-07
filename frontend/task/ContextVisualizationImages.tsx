import React from "react";
import {useAppSelector} from "../hooks";

export function ContextVisualizationImages() {
    const levelGridInfos = useAppSelector(state => state.task.levelGridInfos);

    return (
        <div className="context-visualization-images">
            {(!!levelGridInfos?.images) &&
                levelGridInfos.images.map((element, key) =>
                    <img id={element.id} key={key} src={element.path.default}/>
                )
            }
        </div>
    );
}
