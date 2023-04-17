import {Notion, QuickalgoTaskIncludeBlocks} from '../task_slice';

export const defaultNotions = {
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
    'variables': [
        'variables_set',
    ],
};

export function getCategoryNotions(): {[notion: string]: string} {
    const categoryNotions = {};
    for (let [category, notions] of Object.entries(defaultNotions)) {
        for (let notion of notions) {
            categoryNotions[notion] = category;
        }
    }

    return categoryNotions;
}

export function getDefaultNotionsList(): string[] {
    let notions = [];
    for (let [category, values] of Object.entries(defaultNotions)) {
        notions = [
            ...notions,
            ...values,
        ];
    }

    return notions;
}

export function getNotionsFromIncludeBlocks(includeBlocks: QuickalgoTaskIncludeBlocks = null): Notion[] {
    let notions = [];
    if (!includeBlocks) {
        return [];
    }

    const allNotions = getDefaultNotionsList(); // Add custom notions

    if (includeBlocks && includeBlocks.standardBlocks) {
        if (includeBlocks.standardBlocks.includeAll || includeBlocks.standardBlocks.includeAllPython) {
            // Everything is allowed

            return allNotions;
        }

        if (includeBlocks.standardBlocks.wholeCategories) {
            for (let c = 0; c < includeBlocks.standardBlocks.wholeCategories.length; c++) {
                let categoryName = includeBlocks.standardBlocks.wholeCategories[c];
                if (categoryName in allNotions) {
                    for (let notion of allNotions[categoryName]) {
                        notions.push(notion);
                    }
                }
            }
        }
        if (includeBlocks.standardBlocks.singleBlocks) {
            for (let b = 0; b < includeBlocks.standardBlocks.singleBlocks.length; b++) {
                let blockName = includeBlocks.standardBlocks.singleBlocks[b];
                for (let categoryName in allNotions) {
                    if (-1 !== allNotions[categoryName].indexOf(blockName)) {
                        notions.push(blockName);
                    }
                }
            }
        }
    }

    if (includeBlocks && includeBlocks.variables && includeBlocks.variables.length) {
        notions.push('variables_set');
    }

    if (includeBlocks && includeBlocks.procedures && (includeBlocks.procedures.ret || includeBlocks.procedures.noret)) {
        notions.push('procedures_defnoreturn');
        notions.push('procedures_defreturn');
    }

    return [...new Set(notions)];
}
