import React from "react";
import {BufferEditor} from "../../buffers/BufferEditor";
import {getPlayerState} from "../../player/selectors";
import {useAppSelector} from "../../hooks";
import {AvailableBlocks} from "../blocks/AvailableBlocks";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {quickAlgoLibraries} from "../libs/quickalgo_libraries";
import {getContextBlocksDataSelector} from "../blocks/blocks";
import {taskSetBlocksPanelCollapsed} from "../task_slice";
import {useDispatch} from "react-redux";
import {BlocksUsage} from "../blocks/BlocksUsage";
import {CodecastPlatform} from "../../store";

export interface LayoutEditorProps {
    style?: any,
}

export function LayoutEditor(props: LayoutEditorProps) {
    const options = useAppSelector(state => state.options);
    const platform = options.platform;
    const currentTask = useAppSelector(state => state.task.currentTask);
    const blocksCollapsed = useAppSelector(state => state.task.blocksPanelCollapsed);
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

    const dispatch = useDispatch();

    const collapseBlocks = () => {
        dispatch(taskSetBlocksPanelCollapsed(!blocksCollapsed));
    };

    const context = quickAlgoLibraries.getContext(null, 'main');
    const allBlocks = useAppSelector(state => context ? getContextBlocksDataSelector(state, context) : []);
    const blocks = allBlocks.filter(block => false !== block.showInBlocks);
    const displayBlocks = !!(context && blocks.length && CodecastPlatform.Python === platform && 'tralalere' !== options.app);

    return (
        <div className="layout-editor" style={props.style}>
            {currentTask && displayBlocks && <AvailableBlocks collapsed={blocksCollapsed}/>}
            <div className="task-layout-editor-container">
                {currentTask && displayBlocks && <div className="task-available-blocks-collapser" style={{cursor: 'pointer'}} onClick={collapseBlocks}>
                    <FontAwesomeIcon icon={blocksCollapsed ? faChevronRight : faChevronLeft}/>
                </div>}
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
            {'tralalere' !== options.app && <BlocksUsage/>}
        </div>
    );
}

LayoutEditor.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width, height},
    }
}
