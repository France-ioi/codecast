import React, {useEffect} from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {useAppSelector} from "../hooks";

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);


    useEffect(() => {
        quickAlgoLibraries.resetDisplay();
    }, []);

    return (
        <div className="task-visualisation" style={{fontSize: `${zoomLevel}rem`}}>
            {/*<div id="grid"/>*/}
            <Visualization/>
        </div>
    );
}
