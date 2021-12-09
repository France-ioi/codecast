import React from "react";
import {BufferEditor} from "../../buffers/BufferEditor";
import {getPlayerState} from "../../player/selectors";
import {useAppSelector} from "../../hooks";
import {AvailableBlocks} from "../AvailableBlocks";

export function LayoutEditor() {
    const {platform} = useAppSelector(state => state.options);
    let mode;
    switch (platform) {
        case 'arduino':
            mode = 'arduino';
            break;
        case 'python':
            mode = 'python';
            break;
        default:
            mode = 'c_cpp';
            break;
    }

    const sourceMode = mode;
    const player = useAppSelector(state => getPlayerState(state));
    const preventInput = player.isPlaying;

    return (
        <div className="layout-editor">
            <AvailableBlocks/>
            <BufferEditor
                buffer="source"
                readOnly={false}
                shield={preventInput}
                mode={sourceMode}
                theme="textmate"
                requiredWidth="100%"
                requiredHeight="100%"
                hasAutocompletion
            />
        </div>
    );
}

LayoutEditor.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width, height},
    }
}
