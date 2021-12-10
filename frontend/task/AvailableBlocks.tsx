import React, {useEffect} from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {Block, getContextBlocksDataSelector} from "./blocks/blocks";
import {useAppSelector} from "../hooks";
import {AvailableBlock} from "./AvailableBlock";
import {AvailableBlockCategory} from "./AvailableBlockCategory";

export function AvailableBlocks() {
    const context = quickAlgoLibraries.getContext(null, 'main');
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const blocks = useAppSelector(state => context ? getContextBlocksDataSelector(state, context) : []);

    console.log('bim', context && context.infos && context.infos.includeBlocks, currentLevel);
    useEffect(() => {
        console.log('test change');
    }, [context && context.infos && context.infos.includeBlocks])

    console.log('here display');
    if (!context) {
        return null;
    }

    const groupsCategory = !!(context.infos && context.infos.includeBlocks && context.infos.includeBlocks.groupByCategory);

    if (!blocks.length) {
        return null;
    }
    console.log('available blocks', blocks, context);

    const blocksByCategory: {[name: string]: Block[]} = {};
    for (let block of blocks) {
        if (!(block.category in blocksByCategory)) {
            blocksByCategory[block.category] = [];
        }
        blocksByCategory[block.category].push(block);
    }

    return (
        <div className="task-available-blocks-container">
            <div className="task-available-blocks-header">
                <h2 className="title">Blocs disponibles</h2>
                <p className="subtitle">Cliquez pour insérer</p>
            </div>

            {groupsCategory ?
                <div className="task-available-categories">
                    {Object.entries(blocksByCategory).map(([category, blocks]) =>
                        <AvailableBlockCategory blocks={blocks} name={category}/>
                    )}
                </div>
            :
                <div className="task-available-blocks">
                    {blocks.map(block =>
                        <AvailableBlock key={block.name} block={block}/>
                    )}
                </div>
            }

        </div>
    );
}
