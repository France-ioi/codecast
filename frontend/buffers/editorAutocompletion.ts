import * as ace from 'brace';
import {getMessage} from "../lang";
import {Block, BlockType} from "../task/blocks/blocks";

const hiddenWords = ['__getitem__', '__setitem__'];

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

export const addAutocompletion = function (blocks: Block[], strings: any) {
    let langTools = ace.acequire("ace/ext/language_tools");

    // This array will contain all functions for which we must add autocompletion
    let completions = [];

    let keywordi18n = getMessage('KEYWORD').s;

    for (let block of blocks) {
        switch (block.type) {
            case BlockType.Function:
                let fun = block.name;
                let funInfos = getFunctionsInfo(fun, strings, false);
                let funProto = funInfos.proto;
                let funHelp = funInfos.help;
                let funSnippet = getSnippet(funProto);
                completions.push({
                    caption: funProto,
                    snippet: funSnippet,
                    type: "snippet",
                    docHTML: "<b>" + funProto + "</b><hr/>" + funHelp,
                });
                break;
            case BlockType.Constant:
                let name = block.name;
                if (strings.constant && strings.constant[name]) {
                    name = strings.constant[name];
                }
                completions.push({
                    name: name,
                    value: name,
                    meta: getMessage('CONSTANT').s,
                });
                break;
            case BlockType.Token:
                if (-1 !== hiddenWords.indexOf(block.name)) {
                    continue;
                }
                completions.push({
                    caption: block.name,
                    snippet: block.code,
                    type: "snippet",
                    meta: keywordi18n,
                });
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
