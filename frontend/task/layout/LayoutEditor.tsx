import React from "react";
import {BufferEditor} from "../../buffers/BufferEditor";
import {getPlayerState} from "../../player/selectors";
import {useAppSelector} from "../../hooks";
import {AvailableBlocks} from "../blocks/AvailableBlocks";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {getContextBlocksDataSelector} from "../blocks/blocks";
import {taskSetBlocksPanelCollapsed} from "../task_slice";
import {useDispatch} from "react-redux";
import {BlocksUsage} from "../blocks/BlocksUsage";
import {selectErrorHighlightFromSubmission} from '../../submission/submission';
import {platformsList} from '../../stepper/platforms';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {LayoutMobileMode, LayoutType} from './layout_types';

export interface LayoutEditorProps {
    style?: any,
}

export function LayoutEditor(props: LayoutEditorProps) {
    const options = useAppSelector(state => state.options);
    const platform = options.platform;
    const currentTask = useAppSelector(state => state.task.currentTask);
    const blocksCollapsed = useAppSelector(state => state.task.blocksPanelCollapsed);
    const sourceMode = platformsList[platform].aceSourceMode;
    const preventInput = useAppSelector(state => getPlayerState(state).isPlaying);
    const layoutType = useAppSelector(state => state.layout.type);
    const layoutMobileMode = useAppSelector(state => state.layout.mobileMode);
    const isMobile = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);

    const dispatch = useDispatch();

    const collapseBlocks = () => {
        dispatch(taskSetBlocksPanelCollapsed({collapsed: !blocksCollapsed, manual: true}));
    };

    const context = quickAlgoLibraries.getContext(null, 'main');
    const allBlocks = useAppSelector(state => context ? getContextBlocksDataSelector({state, context}) : []);
    const blocks = allBlocks.filter(block => false !== block.showInBlocks);
    const displayBlocks = !!(
        context
        && blocks.length
        && platformsList[platform].displayBlocks
        && 'tralalere' !== options.app
        && (!isMobile || LayoutMobileMode.Editor === layoutMobileMode)
    );

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
                    readOnly={isMobile && LayoutMobileMode.Editor !== layoutMobileMode}
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
