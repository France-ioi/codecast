import React from "react";
import {useAppSelector} from "../hooks";
import {toHtml} from "../utils/sanitize";

export function TaskInstructions() {
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const taskLevel = useAppSelector(state => state.task.currentLevel);
    const taskInstructionsHtml = useAppSelector(state => state.options.taskInstructions);

    let taskInstructions = taskInstructionsHtml ? (<div dangerouslySetInnerHTML={toHtml(taskInstructionsHtml)}/>) : (
        <React.Fragment>
            <p>
                Programmez le robot pour qu'il pousse les caisses sur les cases marquées.
            </p>
            <p>
                Pour pousser une caisse, mettez d'abord le robot face à la caisse, il avancera en la poussant.
            </p>
            <p>
                <strong>Attention :</strong> vous ne pouvez utiliser qu'une fois l'instruction "pousser la caisse".
            </p>
        </React.Fragment>
    );

    return (
        <div className={`task-mission level-${taskLevel}`} style={{fontSize: `${zoomLevel}rem`}}>
            <h1>Votre mission</h1>

            {taskInstructions}
        </div>
    );
}

TaskInstructions.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
