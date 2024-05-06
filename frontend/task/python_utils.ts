/*
pythonCount: returns number of Blockly blocks corresponding to some Python code.

Patterns are stored in pythonCountPatterns, tried in the order of the list;
block: false means a pattern doesn't count towards the block number if matched.

Codecast note: this module comes from https://github.com/France-ioi/bebras-modules/blob/master/pemFioi/pythonCount-1.0.js
*/

import {getAvailableModules} from "./utils";
import {getMessage, getMessageChoices} from "../lang";
import {getContextBlocksDataSelector} from "./blocks/blocks";
import {AppStore} from "../store";
import {QuickAlgoLibrary} from "./libs/quickalgo_library";
import {getNotionsBagFromIncludeBlocks, NotionArborescence} from './blocks/notions';
import {BlocksUsage, QuickalgoTaskIncludeBlocks} from './task_types';
import {BlockType} from './blocks/block_types';
import {pythonBlocksList, pythonNotionsToBlocks} from './blocks/python_blocks';
import {Document, TextDocument} from '../buffers/buffer_types';
import {documentToString} from '../buffers/document';

const pythonCountPatterns = [
    // Comments
    {pattern: /^#[^\n\r]+/, block: false},

    // Special syntax
    {pattern: /^from\s+\w+\s+import\s+[^\n\r]/, block: false}, // from robot import *
    {pattern: /^import\s+[^\n\r]+/, block: false}, // import x, y, z
    {pattern: /^for\s+\w+\s+in\s+range/, block: false}, // for i in range(5): is only one block; it's a bit tricky
    {pattern: /^def\s[^:]+:/, block: true}, // for i in range(5): is only one block; it's a bit tricky

    {pattern: /^\d+\.\d*/, block: true},
    {pattern: /^\w+/, block: true},

    // Strings
    {pattern: /^'''(?:[^\\']|\\.|'[^']|'[^'])*'''/, block: true},
    {pattern: /^'(?:[^\\']|\\.)*'/, block: true},
    {pattern: /^"""(?:[^\\"]|\\.|"[^"]|""[^"])*"""/, block: true},
    {pattern: /^"(?:[^\\"]|\\.)*"/, block: true},

    // Operators
    {pattern: /^[+*\/%=!<>&|^~]+/, block: true},

    // Separators
    {pattern: /^[\s\(\),:]+/, block: false}
];

function pythonCount(text) {
    if (null === text) {
        return 0;
    }

    let remainingText = text;
    let nbBlocks = 0;
    while (remainingText != '') {
        let found = false;
        for (let i = 0; i < pythonCountPatterns.length; i++) {
            let patternInfo = pythonCountPatterns[i];
            let match = patternInfo.pattern.exec(remainingText);
            if (match) {
                if (patternInfo.block) {
                    nbBlocks += 1;
                }
                remainingText = remainingText.substring(match[0].length);
                found = true;
                break;
            }
        }
        if (!found) {
            remainingText = remainingText.substring(1);
        }
    }
    return nbBlocks;
}

export const pythonForbiddenLists = function (includeBlocks: QuickalgoTaskIncludeBlocks, notionsList: NotionArborescence) {
    // Check for forbidden keywords in code
    const forbidden = [...pythonBlocksList];
    const allowed = [];

    if (!includeBlocks) {
        return {forbidden: forbidden, allowed: allowed};
    }

    const forced = includeBlocks.pythonForceForbidden ? includeBlocks.pythonForceForbidden : [];
    for (let k = 0; k < forced.length; k++) {
        if (-1 === forbidden.indexOf(forced[k])) {
            forbidden.push(forced[k]);
        }
    }

    const removeForbidden = function (kwList) {
        for (let k = 0; k < kwList.length; k++) {
            if (-1 !== forced.indexOf(kwList[k])) {
                continue;
            }
            let idx = forbidden.indexOf(kwList[k]);
            if (idx >= 0) {
                forbidden.splice(idx, 1);
                allowed.push(kwList[k]);
            }
        }
    };

    const pfa = includeBlocks.pythonForceAllowed ? includeBlocks.pythonForceAllowed : [];
    removeForbidden(pfa);
    for (let k = 0; k < pfa.length; k++) {
        if (-1 === allowed.indexOf(pfa[k])) {
            allowed.push(pfa[k]);
        }
    }

    const notionsBag = getNotionsBagFromIncludeBlocks(includeBlocks, notionsList);
    for (let notion of notionsBag.getNotionsList()) {
        removeForbidden(pythonNotionsToBlocks[notion]);
    }

    if (includeBlocks && includeBlocks.variables && includeBlocks.variables.length) {
        removeForbidden(['var_assign']);
    }

    if (includeBlocks && includeBlocks.procedures && (includeBlocks.procedures.ret || includeBlocks.procedures.noret)) {
        removeForbidden(['def']);
    }

    return {forbidden: forbidden, allowed: allowed};
}

function removeFromPatterns(code, patterns) {
    // Remove matching patterns from code
    for (let i = 0; i < patterns.length; i++) {
        while (patterns[i].exec(code)) {
            code = code.replace(patterns[i], '');
        }
    }
    return code;
}

export const pythonForbidden = function (code, includeBlocks: QuickalgoTaskIncludeBlocks, notionsList: NotionArborescence) {
    let forbidden = pythonForbiddenLists(includeBlocks, notionsList).forbidden;

    if (includeBlocks && includeBlocks.procedures && includeBlocks.procedures.disableArgs) {
        forbidden.push('def_args');
    }

    // Remove comments and strings before scanning
    let removePatterns = [
        /#[^\n\r]+/
    ];

    code = removeFromPatterns(code, removePatterns);

    let stringPatterns = [
        /'''(?:[^\\']|\\.|'[^']|'[^'])*'''/,
        /'(?:[^\\']|\\.)*'/,
        /"""(?:[^\\"]|\\.|"[^"]|""[^"])*"""/,
        /"(?:[^\\"]|\\.)*"/
    ];

    let code2 = removeFromPatterns(code, stringPatterns);
    if (-1 !== forbidden.indexOf('strings') && code != code2) {
        return 'chaînes de caractères';
    }

    code = code2;

    // exec and eval are forbidden anyway
    if (/(^|\W)exec\((\W|$)/.exec(code)) {
        return 'exec';
    }
    if (/(^|\W)eval\((\W|$)/.exec(code)) {
        return 'eval';
    }

    if (forbidden.length <= 0) {
        return false;
    }

    // Scan for each forbidden keyword
    for (let i = 0; i < forbidden.length; i++) {
        if (forbidden[i] == 'list_brackets') {
            // Special pattern for lists
            const re = /[\[\]]/;
            if (re.exec(code)) {
                // Forbidden keyword found
                return 'crochets [ ]'; // TODO :: i18n ?
            }
        } else if (forbidden[i] == 'dict_brackets') {
            // Special pattern for lists
            const re = /[\{\}]/;
            if (re.exec(code)) {
                // Forbidden keyword found
                return 'accolades { }'; // TODO :: i18n ?
            }
        } else if (forbidden[i] == 'var_assign') {
            // Special pattern for lists
            const re = /[^=!<>]=[^=!<>]/;
            if (re.exec(code)) {
                // Forbidden keyword found
                return '= (assignation de variable)'; // TODO :: i18n ?
            }
        } else if (forbidden[i] == 'def_args') {
            const re = /def\s*\w+\([^\s]+\)/;
            if (re.exec(code)) {
                // Forbidden keyword found
                return 'fonction avec arguments'; // TODO :: i18n ?
            }
        } else if (forbidden[i] != 'strings') {
            const re = new RegExp('(^|\\W)' + forbidden[i] + '(\\W|$)');
            if (re.exec(code)) {
                // Forbidden keyword found
                return forbidden[i];
            }
        }
    }

    // No forbidden keyword found
    return false;
}

export const pythonFindLimited = function (code, limitedUses, blockToCode) {
    if (!code || !limitedUses) {
        return [];
    }

    let limitedPointers = {};
    let usesCount = {};
    for (let i = 0; i < limitedUses.length; i++) {
        let curLimit = limitedUses[i];
        let pythonKeys = [];
        for (let b = 0; b < curLimit.blocks.length; b++) {
            let blockName = curLimit.blocks[b];
            if (blockToCode[blockName]) {
                if (pythonKeys.indexOf(blockToCode[blockName]) >= 0) {
                    continue;
                }
                pythonKeys.push(blockToCode[blockName]);
            }

            let targetKeys = pythonNotionsToBlocks[blockName];
            if (!targetKeys) {
                continue;
            }
            for (let j = 0; j < targetKeys.length; j++) {
                let pyKey = pythonNotionsToBlocks[blockName][j];
                if (pythonKeys.indexOf(pyKey) >= 0) {
                    continue;
                }
                pythonKeys.push(pyKey);
            }
        }

        for (let j = 0; j < pythonKeys.length; j++) {
            let pyKey = pythonKeys[j];
            if (!limitedPointers[pyKey]) {
                limitedPointers[pyKey] = [];
            }
            limitedPointers[pyKey].push(i);
        }
    }

    const limitations = [];
    for (let pyKey in limitedPointers) {
        // Keys to ignore
        if (pyKey == 'else') {
            continue;
        }
        // Special keys
        let re;
        if (pyKey == 'list_brackets') {
            re = /[\[\]]/g;
        } else if (pyKey == 'dict_brackets') {
            re = /[\{\}]/g;
        } else if (pyKey == 'math_number') {
            re = /\W\d+(\.\d*)?/g;
        } else {
            // Check for assign statements
            re = new RegExp('=\\W*' + pyKey + '([^(]|$)');
            if (re.exec(code)) {
                limitations.push({type: 'assign', name: pyKey});
            }

            re = new RegExp('(^|\\W)' + pyKey + '(\\W|$)', 'g');
        }

        let count = (code.match(re) || []).length;
        for (let i = 0; i < limitedPointers[pyKey].length; i++) {
            let pointer = limitedPointers[pyKey][i];
            if (!usesCount[pointer]) {
                usesCount[pointer] = 0;
            }
            usesCount[pointer] += count;
            // TODO :: i18n ?
            let name;
            if (pyKey == 'list_brackets') {
                name = 'crochets [ ]';
            } else if (pyKey == 'dict_brackets') {
                name = 'accolades { }';
            } else if (pyKey == 'math_number') {
                name = 'nombres';
            } else {
                name = pyKey;
            }

            limitations.push({type: 'uses', name, current: usesCount[pointer], limit: limitedUses[pointer].nbUses});
        }
    }

    return limitations;
}

export const getPythonBlocksUsage = function (document: Document, context: QuickAlgoLibrary): BlocksUsage {
    const code = documentToString(document as unknown as TextDocument);
    const limitations = (context.infos.limitedUses ? pythonFindLimited(code, context.infos.limitedUses, context.strings.code) : []) as {type: string, name: string, current: number, limit: number}[];

    return {
        blocksCurrent: pythonCount(code),
        limitations,
    };
};

export const checkPythonCode = function (document: Document, context: QuickAlgoLibrary, state: AppStore, disabledValidations: string[] = []) {
    const code = documentToString(document as unknown as TextDocument);
    const includeBlocks = context.infos.includeBlocks;
    const forbidden = pythonForbidden(code, includeBlocks, context.getNotionsList());
    const maxInstructions = context.infos.maxInstructions ? context.infos.maxInstructions : Infinity;

    if (forbidden) {
        throw getMessage('CODE_CONSTRAINTS_FORBIDDEN_KEYWORD').format({keyword: forbidden});
    }

    const totalCount = pythonCount(code);
    if (-1 === disabledValidations.indexOf('blocks_limit') && maxInstructions && totalCount > maxInstructions) {
        throw getMessageChoices('TASK_BLOCKS_OVER_LIMIT', totalCount - maxInstructions).format({
            limit: maxInstructions,
            overLimit: totalCount - maxInstructions,
        });
    }

    const limitations = context.infos.limitedUses ? pythonFindLimited(code, context.infos.limitedUses, context.strings.code) : [];
    for (let limitation of limitations) {
        if (limitation.type == 'uses' && limitation.current > limitation.limit) {
            throw getMessage('CODE_CONSTRAINTS_LIMITED_USES').format({keyword: limitation.name});
        } else if (limitation.type == 'assign') {
            throw getMessage('CODE_CONSTRAINTS_LIMITED_ASSIGN').format({keyword: limitation.name});
        }
    }

    if (-1 === disabledValidations.indexOf('empty') && pythonCount(code) <= 0) {
        throw getMessage('CODE_CONSTRAINTS_EMPTY_PROGRAM');
    }

    const availableModules = getAvailableModules(context);
    for (let availableModule of availableModules) {
        if ('printer' === availableModule) {
            // Printer lib is optional
            continue;
        }
        let match = (new RegExp('from\\s+' + availableModule + '\\s+import\\s+\\*')).exec(code);
        if (null === match) {
            throw getMessage('PROGRAM_MISSING_LIB').format({line: `<code>from ${availableModule} import *</code>`});
        }
    }

    // Check for functions used as values
    let re = /def\W+([^(]+)\(/g;
    const availableBlocks = getContextBlocksDataSelector({state, context});
    const definedFunctions = [...new Set(availableBlocks.filter(block => BlockType.Function === block.type).map(block => block.code))];
    let match;
    while (match = re.exec(code)) {
        definedFunctions.push(match[1]);
    }

    if (!context.infos.multithread) {
        let codeWithoutTextsBetweenQuotes = code.replace(/"[^"]+"/g, '').replace(/'[^']+'/g, '');
        for (let j = 0; j < definedFunctions.length; j++) {
            re = new RegExp('\\W' + definedFunctions[j] + '([^A-Za-z0-9_( ]| +[^ (]|$)');
            if (re.exec(codeWithoutTextsBetweenQuotes)) {
                throw getMessage('CODE_CONSTRAINTS_FUNCTIONS_WITHOUT_PARENTHESIS').format({funcName: definedFunctions[j]});
            }
        }
    }
}
