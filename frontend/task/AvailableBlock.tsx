import React from "react";
import {Block, DraggableBlockItem} from "./blocks/blocks";
import {useDrag} from "react-dnd";

export interface AvailableBlockProps {
    block: Block,
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
