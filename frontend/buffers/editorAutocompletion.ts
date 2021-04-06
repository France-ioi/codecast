import * as ace from 'brace';

const pythonForbiddenBlocks = {
    'dicts': {
        'dicts_create_with': ['dict_brackets'],
        'dict_get_literal': ['dict_brackets'],
        'dict_set_literal': ['dict_brackets'],
        'dict_keys': ['dict_brackets']
    },
    'logic': {
        'controls_if': ['if', 'else', 'elif'],
        'controls_if_else': ['if', 'else', 'elif'],
        'logic_negate': ['not'],
        'logic_operation': ['and', 'or']
    },
    'loops': {
        'controls_repeat': ['for'],
        'controls_repeat_ext': ['for'],
        'controls_for': ['for'],
        'controls_forEach': ['for'],
        'controls_whileUntil': ['while'],
        'controls_untilWhile': ['while'],
        'controls_infiniteloop': ['while']
    },
    'lists': {
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
        'lists_append': ['list', 'set', 'list_brackets', '__getitem__', '__setitem__']
    },
    'maths': {
        'math_number': ['math_number']
    },
    'functions': {
        'procedures_defnoreturn': ['def', 'lambda'],
        'procedures_defreturn': ['def', 'lambda']
    },
    'variables': {
        'variables_set': ['var_assign']
    }
};

export const pythonForbiddenLists = function (includeBlocks) {
    // Check for forbidden keywords in code
    const forbidden = ['for', 'while', 'if', 'else', 'elif', 'not', 'and', 'or', 'list', 'set', 'list_brackets', 'dict_brackets', '__getitem__', '__setitem__', 'var_assign', 'def', 'lambda', 'break', 'continue', 'setattr', 'map', 'split'];
    const allowed = [];

    //TODO: use include blocks
    return {forbidden: allowed, allowed: forbidden};

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

    if (includeBlocks && includeBlocks.standardBlocks) {
        if (includeBlocks.standardBlocks.includeAll || includeBlocks.standardBlocks.includeAllPython) {
            // Everything is allowed
            removeForbidden(forbidden.slice());
            return {forbidden: forbidden, allowed: allowed};
        }

        if (includeBlocks.standardBlocks.wholeCategories) {
            for (let c = 0; c < includeBlocks.standardBlocks.wholeCategories.length; c++) {
                let categoryName = includeBlocks.standardBlocks.wholeCategories[c];
                if (pythonForbiddenBlocks[categoryName]) {
                    for (let blockName of Object.keys(pythonForbiddenBlocks[categoryName])) {
                        removeForbidden(pythonForbiddenBlocks[categoryName][blockName]);
                    }
                }
            }
        }
        if (includeBlocks.standardBlocks.singleBlocks) {
            for (let b = 0; b < includeBlocks.standardBlocks.singleBlocks.length; b++) {
                let blockName = includeBlocks.standardBlocks.singleBlocks[b];
                for (let categoryName in pythonForbiddenBlocks) {
                    if (pythonForbiddenBlocks[categoryName][blockName]) {
                        removeForbidden(pythonForbiddenBlocks[categoryName][blockName]);
                    }
                }
            }
        }
    }

    if (includeBlocks && includeBlocks.variables && includeBlocks.variables.length) {
        removeForbidden(['var_assign']);
    }

    return {forbidden: forbidden, allowed: allowed};
}

function hideHiddenWords(list) {
    const hiddenWords = ['__getitem__', '__setitem__'];
    for (let i = 0; i < hiddenWords.length; i++) {
        const word = hiddenWords[i];
        const wIdx = list.indexOf(word);
        if (wIdx > -1) {
            list.splice(wIdx, 1);
        }
    }
}

function getSnippet(proto) {
    let parenthesisOpenIndex = proto.indexOf("(");
    if (proto.charAt(parenthesisOpenIndex + 1) == ')') {
        return proto;
    } else {
        let ret = proto.substring(0, parenthesisOpenIndex + 1);
        let commaIndex = parenthesisOpenIndex;
        let snippetIndex = 1;
        while (proto.indexOf(',', commaIndex + 1) != -1) {
            let newCommaIndex = proto.indexOf(',', commaIndex + 1);
            // we want to keep the space.
            if (proto.charAt(commaIndex + 1) == ' ') {
                commaIndex += 1;
                ret += ' ';
            }
            ret += "${" + snippetIndex + ':';
            ret += proto.substring(commaIndex + 1, newCommaIndex);
            ret += "},";

            commaIndex = newCommaIndex;
            snippetIndex += 1;
        }

        // the last one is with the closing parenthesis.
        let parenthesisCloseIndex = proto.indexOf(')');
        if (proto.charAt(commaIndex + 1) == ' ') {
            commaIndex += 1;
            ret += ' ';
        }
        ret += "${" + snippetIndex + ':';
        ret += proto.substring(commaIndex + 1, parenthesisCloseIndex);
        ret += "})";

        return ret;
    }
}

export const getFunctionsInfo = function (functionName, strings, ignoreDoc = false) {
    let blockDesc = '', funcProto = '', blockHelp = '';
    const docGenerator = false;
    // TODO: When we'll start working on blockly processing lib, we'll need to integrate its custom doc generator
    // For now, we'll leave it commented

    // const docGenerator = createDocGenerator(null, strings);
    // if (!ignoreDoc && docGenerator) {
    //     blockDesc = docGenerator.blockDescription(functionName);
    //     funcProto = blockDesc.substring(blockDesc.indexOf('<code>') + 6, blockDesc.indexOf('</code>'));
    //     blockHelp = blockDesc.substring(blockDesc.indexOf('</code>') + 7);
    // } else {
        let blockName = functionName;
        let funcCode = (!ignoreDoc && strings.code[blockName]) || blockName;
        blockDesc = (!ignoreDoc && strings.description[blockName]);
        if (blockDesc) {
            blockDesc = blockDesc.replace(/@/g, funcCode);
        }
        if (!blockDesc) {
            funcProto = funcCode + '()';
            blockDesc = '<code>' + funcProto + '</code>';
        } else if (blockDesc.indexOf('</code>') < 0) {
            let funcProtoEnd = blockDesc.indexOf(')') + 1;
            if (funcProtoEnd > 0) {
                funcProto = blockDesc.substring(0, funcProtoEnd);
                blockHelp = blockDesc.substring(funcProtoEnd);
                blockDesc = '<code>' + funcProto + '</code>' + blockHelp;
            } else {
                console.error("Description for block '" + blockName + "' needs to be of the format 'function() : description', auto-generated one used instead could be wrong.");
                funcProto = blockName + '()';
                blockDesc = '<code>' + funcProto + '</code> : ' + blockHelp;
            }
        }
    // }
    
    return {
        desc: blockDesc,
        proto: funcProto,
        help: blockHelp
    };
};

export const addAutocompletion = function (getMessage, includeBlocks, customConstants, strings) {
    let langTools = ace.acequire("ace/ext/language_tools");

    // This array will contain all functions for which we must add autocompletion
    let completions = [];

    // we add completion on functions
    if (includeBlocks) {
        if (includeBlocks.generatedBlocks) {
            for (let categoryIndex of Object.keys(includeBlocks.generatedBlocks)) {
                for (let funIndex of Object.keys(includeBlocks.generatedBlocks[categoryIndex])) {
                    let fun = includeBlocks.generatedBlocks[categoryIndex][funIndex];
                    let funInfos = getFunctionsInfo(fun, strings, false);
                    let funProto = funInfos.proto;
                    let funHelp = funInfos.help;
                    let funSnippet = getSnippet(funProto);
                    completions.push({
                        caption: funProto,
                        snippet: funSnippet,
                        type: "snippet",
                        docHTML: "<b>" + funProto + "</b><hr></hr>" + funHelp
                    });
                }

                if (customConstants && customConstants[categoryIndex]) {
                    let constList = customConstants[categoryIndex];
                    for (let iConst = 0; iConst < constList.length; iConst++) {
                        let name = constList[iConst].name;
                        if (strings.constant && strings.constant[name]) {
                            name = strings.constant[name];
                        }
                        completions.push({
                            name: name,
                            value: name,
                            meta: getMessage('CONSTANT').s,
                        });
                    }
                }
            }
        }

        if (includeBlocks.pythonAdditionalFunctions) {
            for (let i = 0; i < includeBlocks.pythonAdditionalFunctions.length; i++) {
                let func = includeBlocks.pythonAdditionalFunctions[i];
                completions.push({
                    caption: func + '()',
                    snippet: getSnippet(func),
                    type: "snippet",
                    docHTML: "<b>" + func + "()</b><hr></hr>"
                });
            }
        }
    }

    // Adding allowed consts (for, while...)
    let allowedConsts = pythonForbiddenLists(includeBlocks).allowed;
    hideHiddenWords(allowedConsts);

    // This blocks are blocks which are not special but must be added
    let toAdd = ["True", "False"];
    for (let toAddId = 0; toAddId < toAdd.length; toAddId++) {
        allowedConsts.push(toAdd[toAddId]);
    }

    let keywordi18n = getMessage('KEYWORD').s;

    // if we want to modify the result of certain keys
    let specialSnippets = {
        // list_brackets and dict_brackets are not working
        list_brackets:
            {
                name: "[]",
                value: "[]",
                meta: keywordi18n
            },
        dict_brackets: {
            name: "{}",
            value: "{}",
            meta: keywordi18n
        },
        var_assign: {
            caption: "x =",
            snippet: "x = $1",
            type: "snippet",
            meta: getMessage('VARIABLE').s,
        },
        if: {
            caption: "if",
            snippet: "if ${1:condition}:\n\t${2:pass}",
            type: "snippet",
            meta: keywordi18n
        },
        while: {
            caption: "while",
            snippet: "while ${1:condition}:\n\t${2:pass}",
            type: "snippet",
            meta: keywordi18n
        },
        elif: {
            caption: "elif",
            snippet: "elif ${1:condition}:\n\t${2:pass}",
            type: "snippet",
            meta: keywordi18n
        }
    };

    for (let constId = 0; constId < allowedConsts.length; constId++) {

        if (specialSnippets.hasOwnProperty(allowedConsts[constId])) {
            // special constant, need to create snippet
            completions.push(specialSnippets[allowedConsts[constId]]);
        } else {
            // basic constant (just printed)
            completions.push({
                name: allowedConsts[constId],
                value: allowedConsts[constId],
                meta: keywordi18n
            })
        }
    }

    // creating the completer
    let completer = {
        getCompletions: function (editor, session, pos, prefix, callback) {
            callback(null, completions);
        }
    };

    // we set the completer to only what we want instead of all the noisy default stuff
    if (langTools) {
        langTools.setCompleters([completer]);
    }
};
