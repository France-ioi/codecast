import React from "react";
import {BufferEditor} from "../../buffers/BufferEditor";
import {getPlayerState} from "../../player/selectors";
import {useAppSelector} from "../../hooks";
import {AvailableBlocks} from "../blocks/AvailableBlocks";
import {CodecastPlatform} from "../../store";
import {BlocklyEditor} from "../../stepper/js/BlocklyEditor";

export function LayoutEditor() {
    const platform = useAppSelector(state => state.options.platform);
    const currentTask = useAppSelector(state => state.task.currentTask);
    let sourceMode;
    switch (platform) {
        case CodecastPlatform.Arduino:
            sourceMode = 'arduino';
            break;
        case CodecastPlatform.Python:
            sourceMode = 'python';
            break;
        default:
            sourceMode = 'c_cpp';
            break;
    }

    const player = useAppSelector(state => getPlayerState(state));
    const preventInput = player.isPlaying;

    return (
        <div className="layout-editor">
            {currentTask && CodecastPlatform.Blockly !== platform && <AvailableBlocks/>}
            <BufferEditor
                platform={platform}
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
