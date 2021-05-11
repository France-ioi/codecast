import React from "react";

export class TaskInstructions extends React.PureComponent {
    render() {
        return (
            <div className="task-mission">
                <h1>Votre mission</h1>

                <p>Programmez le robot ci-dessous pour qu&#39;il atteigne l&#39;étoile, en sautant de plateforme en plateforme.</p>
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
