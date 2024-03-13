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
import {
    selectActiveBufferPendingSubmissionIndex,
    selectErrorHighlightFromSubmission
} from '../../submission/submission';
import {platformsList} from '../../stepper/platforms';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {LayoutMobileMode, LayoutType} from './layout_types';
import {BufferEditorTabs} from '../../buffers/BufferEditorTabs';
import {faBell} from '@fortawesome/free-solid-svg-icons/faBell';
import {getMessage} from '../../lang';
import {bufferDuplicateSourceBuffer} from '../../buffers/buffer_actions';
import {selectActiveBufferPlatform} from '../../buffers/buffer_selectors';
import {
    DragDropContext,
    DraggableStateSnapshot,
    DraggingStyle,
    DragUpdate,
    DropResult,
    NotDraggingStyle,
} from "react-beautiful-dnd";
import {tbConf} from '../../buffers/html/html_editor_config';
import {
    visualEditorElementCreate,
    visualEditorElementDelete,
    visualEditorElementMove
} from '../../buffers/buffers_slice';
import {CodecastPlatform} from '../../stepper/codecast_platform';
import {HTMLEditorBlockToolbox} from '../../buffers/html/HTMLEditorBlockToolbox';

export interface LayoutEditorProps {
    style?: any,
}

export function LayoutEditor(props: LayoutEditorProps) {
    const options = useAppSelector(state => state.options);
    const platform = useAppSelector(selectActiveBufferPlatform);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const blocksCollapsed = useAppSelector(state => state.task.blocksPanelCollapsed);
    const sourceMode = platformsList[platform].aceSourceMode;
    const preventInput = useAppSelector(state => getPlayerState(state).isPlaying);
    const layoutType = useAppSelector(state => state.layout.type);
    const layoutMobileMode = useAppSelector(state => state.layout.mobileMode);
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);
    const activeBufferPendingSubmissionIndex = useAppSelector(selectActiveBufferPendingSubmissionIndex);
    const isMobile = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);
    const editorTabsEnabled = options.tabsEnabled;

    const dispatch = useDispatch();

    const collapseBlocks = () => {
        dispatch(taskSetBlocksPanelCollapsed({collapsed: !blocksCollapsed, manual: true}));
    };

    const duplicateCurrentSource = () => {
        dispatch(bufferDuplicateSourceBuffer());
    };

    const context = quickAlgoLibraries.getContext(null, 'main');
    const allBlocks = useAppSelector(state => context ? getContextBlocksDataSelector({state, context}) : []);
    const blocks = allBlocks.filter(block => false !== block.showInBlocks);

    const errorHighlight = useAppSelector(selectErrorHighlightFromSubmission);
    const editorProps = {
        errorHighlight,
    };

    const readOnly = (isMobile && LayoutMobileMode.Editor !== layoutMobileMode) || null !== activeBufferPendingSubmissionIndex;

    const displayBlocks = !!(
        context
        && blocks.length
        && platformsList[platform].displayBlocks
        && 'tralalere' !== options.app
        && (!isMobile || LayoutMobileMode.Editor === layoutMobileMode)
        && !readOnly
    );

    const onDragEnd = (result: DropResult) => {
        if (result.source && result.destination) {
            if (result.destination.droppableId === 'toolbox-dropzone' && result.source.droppableId !== 'toolbox-dropzone') {
                dispatch(visualEditorElementDelete({buffer: activeBufferName, elementId: result}))
            } else if (result.source.droppableId !== 'toolbox-dropzone' && result.source.index !== result.destination.index) {
                dispatch(visualEditorElementMove({buffer: activeBufferName, elementId: result}))
            } else if (result.source.droppableId === 'toolbox-dropzone' && result.destination.droppableId !== 'toolbox-dropzone') {
                dispatch(visualEditorElementCreate({buffer: activeBufferName, elementId: result}))
            }
        }
    }

    //TODO Insert animated cursor to show user precisely where their tag will be dropped
    const onDragUpdate = (update: DragUpdate) => {
    }

    // refreshPreview();

    return (
        <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
            <div className="layout-editor cursor-main-zone" data-cursor-zone="layout-editor" style={props.style}>
                {editorTabsEnabled && <BufferEditorTabs/>}

                {null !== activeBufferPendingSubmissionIndex && <div className="layout-editor-read-only">
                    <div className="layout-editor-read-only-icon">
                        <FontAwesomeIcon icon={faBell}/>
                    </div>
                    <span className="ml-2">{getMessage('BUFFER_TAB_NOT_EDITABLE')}</span>
                    {editorTabsEnabled && <a onClick={duplicateCurrentSource} className="layout-editor-read-only-link ml-1">{getMessage('COPY')}</a>}
                </div>}

                {null !== activeBufferName && <div className="layout-editor-section">
                    {currentTask && displayBlocks && !readOnly &&
                        <AvailableBlocks collapsed={blocksCollapsed}/>
                    }
                    {CodecastPlatform.Html === platform && context && !readOnly &&
                        <HTMLEditorBlockToolbox
                            categories={tbConf}
                            allowModeSwitch={true}
                        />
                    }
                    <div className="task-layout-editor-container">
                        {currentTask && displayBlocks && <div className="task-available-blocks-collapser" style={{cursor: 'pointer'}} onClick={collapseBlocks}>
                            <FontAwesomeIcon icon={blocksCollapsed ? faChevronRight : faChevronLeft}/>
                        </div>}
                        <BufferEditor
                            platform={platform}
                            bufferName={activeBufferName}
                            readOnly={readOnly}
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
                </div>}
            </div>
        </DragDropContext>
    );
}

LayoutEditor.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width, height},
    }
}
