import React from "react";

export class TaskInstructions extends React.PureComponent {
    render() {
        return (
            <div className="task-mission">
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

    static computeDimensions(width: number, height: number) {
        return {
            taken: {width, height},
            minimum: {width: 200, height: 100},
        }
    }
}
