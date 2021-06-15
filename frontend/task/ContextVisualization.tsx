import React, {useEffect} from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();

    useEffect(() => {
        quickAlgoLibraries.resetDisplay();
    }, []);

    return (
        <div className="task-visualisation">
            {/*<div id="grid"/>*/}
            <Visualization/>
        </div>
    );
}
