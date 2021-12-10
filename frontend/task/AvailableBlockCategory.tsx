import React, {useState} from "react";
import {Block} from "./blocks/blocks";
import {Collapse} from "react-bootstrap";
import {AvailableBlock} from "./AvailableBlock";
import {getMessage} from "../lang";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCaretUp} from "@fortawesome/free-solid-svg-icons/faCaretUp";
import {faCaretDown} from "@fortawesome/free-solid-svg-icons/faCaretDown";

export interface AvailableBlockCategoryProps {
    blocks: Block[],
    name: string,
}

export function AvailableBlockCategory(props: AvailableBlockCategoryProps) {
    const {name, blocks} = props;

    const [open, setOpen] = useState(false);

    return (
        <div className="block-category">
            <div className="block-category-header" onClick={() => setOpen(!open)}>
                <div className="block-category-name">{getMessage('TASK_BLOCK_CATEGORY_' + name.toLocaleUpperCase())}</div>
                <div className="block-category-caret">
                    <FontAwesomeIcon icon={open ? faCaretUp : faCaretDown}/>
                </div>
            </div>
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
