import React, {useState} from "react";
import {Block} from "./blocks/blocks";
import {Collapse} from "react-bootstrap";
import {AvailableBlock} from "./AvailableBlock";

export interface AvailableBlockCategoryProps {
    blocks: Block[],
    name: string,
}

export function AvailableBlockCategory(props: AvailableBlockCategoryProps) {
    const {name, blocks} = props;

    const [open, setOpen] = useState(false);

    return (
        <div className="task-available-block-category">
            <div>{name}</div>
            <Collapse in={open}>
                <div>
                    {blocks.map((block, index) =>
                        <AvailableBlock block={block} key={index}/>
                    )}
                </div>
            </Collapse>
        </div>
    );
}
