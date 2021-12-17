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

export const addAutocompletion = function (blocks: Block[], strings: any) {
    let langTools = ace.acequire("ace/ext/language_tools");

    // This array will contain all functions for which we must add autocompletion
    let completions = [];

    let keywordi18n = getMessage('KEYWORD').s;

    for (let block of blocks) {
        switch (block.type) {
            case BlockType.Function:
                let funSnippet = getSnippet(block.caption);
                completions.push({
                    caption: block.caption,
                    snippet: funSnippet,
                    type: "snippet",
                    docHTML: "<b>" + block.caption + "</b>" + (block.description ? "<hr/>" + block.description : ""),
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
                    caption: block.caption,
                    snippet: block.snippet ? block.snippet : block.code,
                    type: "snippet",
                    meta: block.captionMeta ? block.captionMeta : keywordi18n,
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
