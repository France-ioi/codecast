import React, {useEffect} from "react";
import {Block} from "./blocks";
import {useDrag} from "react-dnd";
import {getEmptyImage} from "react-dnd-html5-backend";

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

    return (
        <div className="task-available-block" ref={drag}>
            <div className="task-available-block-name">
                {block.caption}
            </div>

            {block.description && <div className="task-available-block-description">
                {block.description}
            </div>}
        </div>
    )
}
