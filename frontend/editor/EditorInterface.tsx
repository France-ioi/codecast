import React from "react";
import {TrimEditorControls} from "./TrimEditorControls";
import {useAppSelector} from "../hooks";

export function EditorInterface() {
    const windowWidth = useAppSelector(state => state.windowWidth);

    return (
        <div>
            <TrimEditorControls width={windowWidth} />
        </div>
    );
}
