import {NotionsBag} from './notions';
import {QuickalgoTaskIncludeBlocks} from '../task_types';
import {Block, BlockType} from './block_types';
import {getMessage} from '../../lang';
import {analysisDirectiveViewDict} from '../../stepper/views';

export const pythonNotionsToBlocks = {
    'dicts_create_with': ['dict_brackets'],
    'dict_get_literal': ['dict_brackets'],
    'dict_set_literal': ['dict_brackets'],
    'dict_keys': ['dict_brackets'],
    'controls_if': ['if'],
    'controls_if_else': ['if', 'else', 'elif'],
    'logic_negate': ['not'],
    'logic_operation': ['and', 'or'],
    'controls_repeat': ['for'],
    'controls_repeat_ext': ['for'],
    'controls_for': ['for'],
    'controls_forEach': ['for'],
    'controls_whileUntil': ['while'],
    'controls_untilWhile': ['while'],
    'controls_infiniteloop': ['while'],
    'controls_break_continue': ['break', 'continue'],
    'lists_create_with_empty': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_create_with': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_repeat': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_length': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_isEmpty': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_indexOf': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_getIndex': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_setIndex': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_getSublist': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_sort': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_split': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_append': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__'],
    'lists_map_split': ['map', 'split'],
    'math_number': ['math_number'],
    'procedures_defnoreturn': ['def'],
    'procedures_defreturn': ['def'],
    'setattr' : ['setattr'],
    'lambda' : ['lambda'],
    'variables_set': ['var_assign'],
};

export const pythonBlocksList = ['for', 'while', 'if', 'else', 'elif', 'not', 'and', 'or', 'list', 'set', 'list_brackets', 'dict_brackets', '__getitem__', '__setitem__', 'var_assign', 'def', 'lambda', 'break', 'continue', 'setattr', 'map', 'split'];

const hiddenWords = ['__getitem__', '__setitem__', 'list', 'set'];

export function getPythonSpecificBlocks(notionsBag: NotionsBag, contextIncludeBlocks?: QuickalgoTaskIncludeBlocks): Block[] {
    const availableBlocks: Block[] = [];

    let specialSnippets = {
        variables: {
            caption: "x =",
            snippet: "x = $1",
            captionMeta: getMessage('VARIABLE').s,
            showInBlocks: false,
        },
        if: {
            caption: "if",
            snippet: "if ${1:condition}:\n\t${2:pass}",
        },
        while: {
            caption: "while",
            snippet: "while ${1:condition}:\n\t${2:pass}",
        },
        elif: {
            caption: "elif",
            snippet: "elif ${1:condition}:\n\t${2:pass}",
        },
        for: {
            caption: "for",
            snippet: "for loop in range(${1:iteration}):\n\t${2:pass}",
        },
    };

    if (contextIncludeBlocks && contextIncludeBlocks.pythonAdditionalFunctions) {
        for (let i = 0; i < contextIncludeBlocks.pythonAdditionalFunctions.length; i++) {
            let func = contextIncludeBlocks.pythonAdditionalFunctions[i];
            availableBlocks.push({
                name: func,
                caption: func,
                type: BlockType.Function,
                code: func + '()',
            });
        }
    }

    if (contextIncludeBlocks) {
        let allowedTokens = [];
        const tokenCategories = {};
        for (let [category, notions] of Object.entries(notionsBag.getArborescence())) {
            for (let notion of notions) {
                const tokens = pythonNotionsToBlocks[notion];
                for (let token of tokens) {
                    if (-1 !== pythonBlocksList.indexOf(token)) {
                        tokenCategories[token] = category;
                        allowedTokens.push(token);
                    }
                }
            }
        }

        allowedTokens = [...new Set(allowedTokens)];

        const bracketsWords = { list_brackets: 'crochets [ ]+[]', dict_brackets: 'accolades { }+{}', var_assign: 'variables+x =' };
        for (let bracketsCode in bracketsWords) {
            const bracketsIdx = allowedTokens.indexOf(bracketsCode);
            if (bracketsIdx !== -1) {
                allowedTokens[bracketsIdx] = bracketsWords[bracketsCode];
            }
        }

        for (let token of allowedTokens) {
            let tokenParts = token.split('+');
            let name = tokenParts.length > 1 ? tokenParts[0] : token;
            let code = tokenParts.length > 1 ? tokenParts[1] : token;

            availableBlocks.push({
                name,
                type: BlockType.Token,
                caption: name in specialSnippets ? specialSnippets[name].caption : code,
                captionMeta: name in specialSnippets && specialSnippets[name].captionMeta ? specialSnippets[name].captionMeta : null,
                snippet: name in specialSnippets ? specialSnippets[name].snippet : code,
                code,
                category: tokenCategories[token],
                showInBlocks: (name in specialSnippets && false === specialSnippets[name].showInBlocks) || -1 !== Object.values(bracketsWords).indexOf(token) || -1 !== hiddenWords.indexOf(name) ? false : undefined,
            });
        }

        let toAdd = ['True', 'False'];
        for (let name of toAdd) {
            availableBlocks.push({
                name,
                type: BlockType.Constant,
                caption: name,
                code: name,
                showInBlocks: false,
            });
        }
    }

    for (let [directive, directiveData] of Object.entries(analysisDirectiveViewDict)) {
        availableBlocks.push({
            name: directive,
            type: BlockType.Directive,
            caption: directive,
            code: directiveData.snippet,
        });
    }

    return availableBlocks;
}
