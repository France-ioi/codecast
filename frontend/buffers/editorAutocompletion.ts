import * as ace from 'brace';
import {getMessage} from "../lang";
import {Block, BlockType} from "../task/blocks/blocks";

const hiddenWords = ['__getitem__', '__setitem__'];

export const addAutocompletion = function (blocks: Block[], strings: any) {
    let langTools = ace.acequire("ace/ext/language_tools");

    // This array will contain all functions for which we must add autocompletion
    let completions = [];

    let keywordi18n = getMessage('KEYWORD').s;

    for (let block of blocks) {
        switch (block.type) {
            case BlockType.Function:
                completions.push({
                    caption: block.caption,
                    snippet: block.snippet,
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
