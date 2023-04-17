import {Block, BlockType} from '../task/blocks/blocks';

export function getArchetypeSpecificBlocks() {
    const availableBlocks: Block[] = [];

    availableBlocks.push({
        name: 'called by',
        type: BlockType.Token,
        category: 'smart_contracts',
        caption: 'called by',
        code: 'called by ',
    });

    availableBlocks.push({
        name: 'require',
        type: BlockType.Token,
        category: 'smart_contracts',
        caption: 'require',
        snippet: 'require {\n\t${1:required}\n}',
    });

    return availableBlocks;
}
