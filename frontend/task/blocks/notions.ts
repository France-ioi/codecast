import {QuickalgoTaskIncludeBlocks} from '../task_types';
import {Block} from './block_types';

export type NotionArborescence = {[category: string]: string[]};

export const defaultNotions: NotionArborescence = {
    'dicts': [
        'dicts_create_with',
        'dict_get_literal',
        'dict_set_literal',
        'dict_keys',
    ],
    'logic': [
        'controls_if',
        'controls_if_else',
        'logic_negate',
        'logic_operation',
    ],
    'loops': [
        'controls_repeat',
        'controls_repeat_ext',
        'controls_for',
        'controls_forEach',
        'controls_whileUntil',
        'controls_untilWhile',
        'controls_infiniteloop',
        'controls_break_continue',
    ],
    'lists': [
        'lists_create_with_empty',
        'lists_create_with',
        'lists_repeat',
        'lists_length',
        'lists_isEmpty',
        'lists_indexOf',
        'lists_getIndex',
        'lists_setIndex',
        'lists_getSublist',
        'lists_sort',
        'lists_split',
        'lists_append',
        'lists_map_split',
    ],
    'math': [
        'math_number',
    ],
    'functions': [
        'procedures_defnoreturn',
        'procedures_defreturn',
        'setattr',
        'lambda',
    ],
    'texts': [
        'text_length',
    ],
    'variables': [
        'variables_set',
    ],
};

export class NotionsBag {
    private arborescence: NotionArborescence;

    constructor(notions: NotionArborescence = {}) {
        this.arborescence = notions;
    }

    public getArborescence() {
        return this.arborescence;
    }

    public addCategory(category: string, notions: string[] = []) {
        if (!(category in this.arborescence)) {
            this.arborescence[category] = [];
        }

        this.arborescence[category] = [
            ...this.arborescence[category],
            ...notions,
        ];
    }

    public addNotion(category: string, notion: string) {
        this.addCategory(category);
        if (-1 === this.arborescence[category].indexOf(notion)) {
            this.arborescence[category].push(notion);
        }
    }

    public getNotionsList() {
        return Object.values(this.arborescence).reduce((cur, next) => [...cur, ...next], []);
    }

    public hasNotion(notion: string) {
        return -1 !== this.getNotionsList().indexOf(notion);
    }

    public getNotionsByCategory(category: string) {
        return category in this.arborescence ? this.arborescence[category] : [];
    }
}

export function getNotionsBagFromIncludeBlocks(includeBlocks: QuickalgoTaskIncludeBlocks = null, allNotions: NotionArborescence): NotionsBag {
    if (!includeBlocks) {
        return new NotionsBag();
    }

    let notionsBag = new NotionsBag();

    if (includeBlocks && includeBlocks.standardBlocks) {
        if (includeBlocks.standardBlocks.includeAll || includeBlocks.standardBlocks.includeAllPython) {
            // Everything is allowed

            return new NotionsBag(allNotions);
        }

        if (includeBlocks.standardBlocks.wholeCategories) {
            for (let c = 0; c < includeBlocks.standardBlocks.wholeCategories.length; c++) {
                let categoryName = includeBlocks.standardBlocks.wholeCategories[c];
                if (categoryName in allNotions) {
                    notionsBag.addCategory(categoryName, allNotions[categoryName]);
                }
            }
        }
        if (includeBlocks.standardBlocks.singleBlocks) {
            for (let b = 0; b < includeBlocks.standardBlocks.singleBlocks.length; b++) {
                let blockName = includeBlocks.standardBlocks.singleBlocks[b];
                for (let categoryName in allNotions) {
                    if (-1 !== allNotions[categoryName].indexOf(blockName)) {
                        notionsBag.addNotion(categoryName, blockName);
                    }
                }
            }
        }
    }

    if (includeBlocks && includeBlocks.variables && includeBlocks.variables.length) {
        notionsBag.addNotion('variables', 'variables_set');
    }

    if (includeBlocks && includeBlocks.procedures && (includeBlocks.procedures.ret || includeBlocks.procedures.noret)) {
        notionsBag.addNotion('functions', 'procedures_defnoreturn');
        notionsBag.addNotion('functions', 'procedures_defreturn');
    }

    return notionsBag;
}

export function generateAvailableBlocksFromNotions(notionsBag: NotionsBag, availableBlocks: {[notion: string]: Block[]}) {
    const userAvailableBlocks = [];

    for (let [category, notions] of Object.entries(notionsBag.getArborescence())) {
        for (let notion of notions) {
            if (notion in availableBlocks) {
                for (let block of availableBlocks[notion]) {
                    userAvailableBlocks.push({
                        ...block,
                        category,
                    });
                }
            }
        }
    }

    return userAvailableBlocks;
}
