import React from "react";
import {useAppSelector} from "../hooks";

export function TaskInstructions() {
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);

    return (
        <div className="task-mission" style={{fontSize: `${zoomLevel}rem`}}>
            <h1>Votre mission</h1>

            <p>Programmez le robot ci-dessous pour qu&#39;il atteigne l&#39;étoile, en sautant de plateforme en plateforme.</p>
        </div>
    );
}

TaskInstructions.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
