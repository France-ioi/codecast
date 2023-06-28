import React, {useState} from "react";
import {getContextBlocksDataSelector} from "./blocks";
import {useAppSelector} from "../../hooks";
import {AvailableBlock} from "./AvailableBlock";
import {AvailableBlockCategory} from "./AvailableBlockCategory";
import {getMessage} from "../../lang";
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {Block, BlockType} from './block_types';

export interface AvailableBlocksProps {
    collapsed: boolean,
}

export function AvailableBlocks(props: AvailableBlocksProps) {
    const context = quickAlgoLibraries.getContext(null, 'main');
    const allBlocks = useAppSelector(state => context ? getContextBlocksDataSelector({state, context}) : []);
    const showDirectives = useAppSelector(state => state.options.showDirectives);
    const blocks = allBlocks.filter(block => false !== block.showInBlocks);
    const [isDragging, setDragging] = useState(false);

    if (!context) {
        return null;
    }

    const groupsCategory = !!(context.infos && context.infos.includeBlocks && context.infos.includeBlocks.groupByCategory);
    if (!blocks.length) {
        return null;
    }

    let directives = [];

    const blocksByCategory: {[name: string]: Block[]} = {};
    const normalBlocks = [];
    for (let block of blocks) {
        if (BlockType.Directive === block.type) {
            directives.push(block);
            continue;
        }

        if (!(block.category in blocksByCategory)) {
            blocksByCategory[block.category] = [];
        }
        blocksByCategory[block.category].push(block);
        normalBlocks.push(block);
    }

    const onDragging = (dragging) => {
        setDragging(dragging);
    };

    return (
        <div className={`task-available-blocks-container ${isDragging ? 'is-dragging' : ''} ${props.collapsed ? 'is-collapsed' : ''}`}>
            <div className="task-available-blocks-header">
                <h2 className="title">{getMessage('TASK_BLOCKS_TITLE')}</h2>
                <p className="subtitle">{getMessage('TASK_BLOCKS_SUBTITLE')}</p>
            </div>

            {groupsCategory ?
                <div className="task-available-categories">
                    {Object.entries(blocksByCategory).map(([category, blocks]) =>
                        <AvailableBlockCategory blocks={blocks} name={category} key={category} onDragging={onDragging}/>
                    )}
                </div>
                :
                <div className="task-available-blocks">
                    {normalBlocks.map(block =>
                        <AvailableBlock key={block.name} block={block} onDragging={onDragging}/>
                    )}
                </div>
            }

            {showDirectives && <div className="task-available-directives">
                <div className="task-available-categories">
                    <AvailableBlockCategory blocks={directives} name={"Directives"} onDragging={onDragging}/>
                </div>
            </div>}
        </div>
    );
}
