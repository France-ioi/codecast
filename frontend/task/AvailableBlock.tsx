import React from "react";
import {Block} from "./blocks/blocks";

export interface AvailableBlockProps {
    block: Block,
}

export function AvailableBlock(props: AvailableBlockProps) {
    const {block} = props;

    return (
        <div className="task-available-block">
            <div className="task-available-block-name">
                {block.caption}
            </div>

            {block.description && <div className="task-available-block-description">
                {block.description}
            </div>}
        </div>
    );
}
