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
import {CodecastPlatform, platformsList} from '../../stepper/platforms';
import {selectErrorHighlightFromSubmission} from '../../submission/submission';

export interface LayoutEditorProps {
    style?: any,
}

export function LayoutEditor(props: LayoutEditorProps) {
    const options = useAppSelector(state => state.options);
    const platform = options.platform;
    const currentTask = useAppSelector(state => state.task.currentTask);
    const blocksCollapsed = useAppSelector(state => state.task.blocksPanelCollapsed);
    const sourceMode = platformsList[platform].aceSourceMode;
    const player = useAppSelector(state => getPlayerState(state));
    const preventInput = player.isPlaying;

    const dispatch = useDispatch();

    const collapseBlocks = () => {
        dispatch(taskSetBlocksPanelCollapsed({collapsed: !blocksCollapsed, manual: true}));
    };

    const context = quickAlgoLibraries.getContext(null, 'main');
    const allBlocks = useAppSelector(state => context ? getContextBlocksDataSelector({state, context}) : []);
    const blocks = allBlocks.filter(block => false !== block.showInBlocks);
    const displayBlocks = !!(context && blocks.length && platformsList[platform].displayBlocks && 'tralalere' !== options.app);

    const errorHighlight = useAppSelector(selectErrorHighlightFromSubmission);
    const editorProps = {
        errorHighlight,
    };

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
                    requiredWidth="100%"
                    requiredHeight="100%"
                    hasAutocompletion
                    dragEnabled
                    editorProps={editorProps}
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
