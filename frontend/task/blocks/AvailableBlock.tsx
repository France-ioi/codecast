import React, {useCallback, useEffect, useRef} from "react";
import {useDrag} from "react-dnd";
import {getEmptyImage} from "react-dnd-html5-backend";
import {useDispatch} from "react-redux";
import {toHtml} from "../../utils/sanitize";
import {Block} from './block_types';
import {bufferInsertBlock} from '../../buffers/buffers_slice';
import {useAppSelector} from '../../hooks';
import {ContextMenu, ContextMenuContentProps, Menu, MenuItem, mergeRefs} from '@blueprintjs/core';
import {findDocumentationConcept} from '../documentation/doc';
import {getMessage} from '../../lang/messages';

export interface AvailableBlockProps {
    block: Block,
    onDragging: (dragging: boolean) => void,
}

export function AvailableBlock(props: AvailableBlockProps) {
    const {block} = props;
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);

    const [{isDragging}, drag, dragPreview] = useDrag(() => ({
        type: 'block',
        item: {
            block,
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [block])

    const dragRef = useRef<HTMLButtonElement>(null);
    drag(dragRef);

    useEffect(() => {
        dragPreview(getEmptyImage(), {captureDraggingState: true});
    }, []);

    useEffect(() => {
        props.onDragging(isDragging);
    }, [isDragging]);

    const dispatch = useDispatch();

    const insertBlock = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        dispatch(bufferInsertBlock({buffer: activeBufferName, block}));

        // Take back focus from the editor if the block snippet does not contain variables
        const isKeyboard = e.detail === 0;
        if (!block?.snippet?.includes('${') && isKeyboard) {
            setTimeout(() => {
                dragRef.current?.focus();
            });
        }
    }, [activeBufferName, block]);

    const renderContextMenu = useCallback(({isOpen}: ContextMenuContentProps) => {
        if (!isOpen) {
            return undefined;
        }

        // Looked up when the menu opens, as the documentation can change in the meantime
        const concept = findDocumentationConcept(block.documentationConcept);

        return (
            <Menu>
                <MenuItem
                    text={getMessage('TASK_DOCUMENTATION_BLOCK_HELP')}
                    disabled={!concept}
                    onClick={() => window.conceptViewer.showConcept(concept.id)}
                />
            </Menu>
        );
    }, [block]);

    return (
        <ContextMenu content={renderContextMenu} popoverProps={{popoverClassName: 'task-available-block-context-menu'}}>
            {(contextMenuProps) => <>
                <button
                    className={`task-available-block ${contextMenuProps.className}`}
                    ref={mergeRefs(dragRef, contextMenuProps.ref)}
                    onClick={insertBlock}
                    onContextMenu={contextMenuProps.onContextMenu}
                >
                    <div className="task-available-block-name">
                        {block.caption}
                    </div>

                    {block.description && <div className="task-available-block-description" dangerouslySetInnerHTML={toHtml(block.description)}/>}
                </button>

                {contextMenuProps.popover}
            </>}
        </ContextMenu>
    );
}
