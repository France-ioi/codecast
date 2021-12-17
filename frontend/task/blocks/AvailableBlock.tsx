import React, {useEffect} from "react";
import {Block, BlockType} from "./blocks";
import {useDrag} from "react-dnd";
import {getEmptyImage} from "react-dnd-html5-backend";
import {useDispatch} from "react-redux";
import {ActionTypes as BufferActionTypes} from '../../buffers/actionTypes';

export interface AvailableBlockProps {
    block: Block,
    onDragging: (dragging: boolean) => void,
}

export function AvailableBlock(props: AvailableBlockProps) {
    const {block} = props;

    const [{isDragging}, drag, dragPreview] = useDrag(() => ({
        type: 'block',
        item: {
            block,
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }))

    useEffect(() => {
        dragPreview(getEmptyImage(), {captureDraggingState: true});
    }, []);

    useEffect(() => {
        props.onDragging(isDragging);
    }, [isDragging]);

    const dispatch = useDispatch();

    const insertBlock = () => {
        dispatch({type: BufferActionTypes.BufferInsert, payload: {buffer: 'source', text: block.code, withoutNewLine: BlockType.Token === block.type}});
    }

    return (
        <div className="task-available-block" ref={drag} onClick={insertBlock}>
            <div className="task-available-block-name">
                {block.caption}
            </div>

            {block.description && <div className="task-available-block-description">
                {block.description}
            </div>}
        </div>
    )
}
