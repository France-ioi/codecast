import React, {useState} from "react";
import {quickAlgoLibraries} from "../libs/quickalgo_librairies";
import {Block, getContextBlocksDataSelector} from "./blocks";
import {useAppSelector} from "../../hooks";
import {AvailableBlock} from "./AvailableBlock";
import {AvailableBlockCategory} from "./AvailableBlockCategory";

export function AvailableBlocks() {
    const context = quickAlgoLibraries.getContext(null, 'main');
    const allBlocks = useAppSelector(state => context ? getContextBlocksDataSelector(state, context) : []);
    const blocks = allBlocks.filter(block => false !== block.showInBlocks);
    const [isDragging, setDragging] = useState(false);

    if (!context) {
        return null;
    }

    const groupsCategory = !!(context.infos && context.infos.includeBlocks && context.infos.includeBlocks.groupByCategory);
    if (!blocks.length) {
        return null;
    }

    const blocksByCategory: {[name: string]: Block[]} = {};
    for (let block of blocks) {
        if (!(block.category in blocksByCategory)) {
            blocksByCategory[block.category] = [];
        }
        blocksByCategory[block.category].push(block);
    }

    const onDragging = (dragging) => {
        console.log('dragging', dragging);
        setDragging(dragging);
    };

    return (
        <div className={`task-available-blocks-container ${isDragging ? 'is-dragging' : ''}`}>
            <div className="task-available-blocks-header">
                <h2 className="title">Blocs disponibles</h2>
                <p className="subtitle">Cliquez pour insérer</p>
            </div>

            {groupsCategory ?
                <div className="task-available-categories">
                    {Object.entries(blocksByCategory).map(([category, blocks]) =>
                        <AvailableBlockCategory blocks={blocks} name={category} key={category} onDragging={onDragging}/>
                    )}
                </div>
            :
                <div className="task-available-blocks">
                    {blocks.map(block =>
                        <AvailableBlock key={block.name} block={block} onDragging={onDragging}/>
                    )}
                </div>
            }
        </div>
    );
}
