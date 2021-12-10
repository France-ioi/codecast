import React from "react";
import {Block} from "./blocks/blocks";

export interface AvailableBlockProps {
    block: Block,
}

export function AvailableBlock(props: AvailableBlockProps) {
    const {block} = props;

    return (
        <div className="task-available-block">
            {block.code}
        </div>
    );
}
