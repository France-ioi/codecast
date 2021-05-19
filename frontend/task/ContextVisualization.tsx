import React from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";

export class ContextVisualization extends React.PureComponent {
    componentDidMount() {
        quickAlgoLibraries.reset();
    }

    render() {
        const Visualization = quickAlgoLibraries.getVisualization();

        return (
            <div className="task-visualisation">
                {/*<div id="grid"/>*/}
                <Visualization/>
            </div>
        );
    }

    static computeDimensions(width: number, height: number) {
        return {
            taken: {width, height},
            minimum: {width: 200, height: 200},
        }
    }
}
