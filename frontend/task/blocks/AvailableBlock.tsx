import React, {useEffect} from "react";
import {useDrag} from "react-dnd";
import {getEmptyImage} from "react-dnd-html5-backend";
import {useDispatch} from "react-redux";
import {toHtml} from "../../utils/sanitize";
import {Block} from './block_types';
import {bufferInsertBlock} from '../../buffers/buffers_slice';

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
    }), [block])

    useEffect(() => {
        dragPreview(getEmptyImage(), {captureDraggingState: true});
    }, []);

    useEffect(() => {
        props.onDragging(isDragging);
    }, [isDragging]);

    const dispatch = useDispatch();

    const insertBlock = () => {
        dispatch(bufferInsertBlock({buffer: 'source', block}));
    };

    return (
        <div className="task-available-block" ref={drag} onClick={insertBlock}>
            <div className="task-available-block-name">
                {block.caption}
            </div>

            {block.description && <div className="task-available-block-description" dangerouslySetInnerHTML={toHtml(block.description)}/>}
        </div>
    )
}
