import React from "react";
import {useAppSelector} from "../hooks";

export function TaskInstructions() {
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);

    return (
        <div className="task-mission" style={{fontSize: `${zoomLevel}rem`}}>
            <h1>Votre mission</h1>

            <p>
                    Programmez le robot pour qu'il pousse les caisses sur les cases marquées.
                </p>
                <p>
                    Pour pousser une caisse, mettez d'abord le robot face à la caisse, il avancera en la poussant.
                </p>
                <p>
                    <strong>Attention :</strong> vous ne pouvez utiliser qu'une fois l'instruction "pousser la caisse".
                </p>
        </div>
    );
}

TaskInstructions.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
