import {Block, BlockType} from '../task/blocks/block_types';
import {getMessage} from '../lang/messages';
import {getLocalIdentifiers} from './editor_local_identifiers';

export const addAutocompletion = function (blocks: Block[], strings: any) {
    let langTools = window.ace.acequire("ace/ext/language_tools");

    // This array will contain all functions for which we must add autocompletion
    let completions = [];

    let keywordi18n = getMessage('KEYWORD').s;

    for (let block of blocks) {
        if (false === block.showInBlocks) {
            continue;
        }

        switch (block.type) {
            case BlockType.Function:
            case BlockType.ClassFunction:
                completions.push({
                    caption: block.caption,
                    snippet: block.snippet,
                    type: "snippet",
                    docHTML: "<b>" + block.caption + "</b>" + (block.description ? "<hr/>" + block.description : ""),
                });
                break;
            case BlockType.Constant:
            case BlockType.ClassConstant:
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
        identifierRegexps: [/[a-zA-Z_0-9.$@\-\u00A2-\uFFFF]/],
        getCompletions: function (editor, session, pos, prefix, callback) {
            const validCompletions = completions.filter(completion => {
                if (!completion.name && !completion.caption) {
                    return false;
                }

                return (completion.name || completion.caption).substring(0, prefix.length).trim().toLocaleLowerCase() === prefix.trim().toLocaleLowerCase();
            });
            callback(null, validCompletions);
        }
    };

    // Names already provided by the blocks above, so that we never propose them twice.
    // Captions of functions look like "avancer()", we only keep the identifier part.
    const blockNames = new Set<string>();
    for (let block of blocks) {
        for (let candidate of [block.name, block.methodName, block.caption, block.code]) {
            const name = (candidate || '').trim().split('(')[0].trim();
            if ('' !== name) {
                blockNames.add(name);
            }
        }
    }
    for (let completion of completions) {
        const name = (completion.name || completion.caption || '').trim().split('(')[0].trim();
        if ('' !== name) {
            blockNames.add(name);
        }
    }

    // Complete with the variables and functions the user has defined in the document itself
    let localIdentifiersCompleter = {
        getCompletions: function (editor, session, pos, prefix, callback) {
            const aceMode = (session.getMode()?.$id || '').replace('ace/mode/', '');
            const identifiers = getLocalIdentifiers(session.getValue(), aceMode, pos.row);

            callback(null, identifiers
                .filter(identifier => !blockNames.has(identifier.name))
                .map(identifier => {
                    if (!identifier.isFunction) {
                        return {
                            name: identifier.name,
                            value: identifier.name,
                            meta: getMessage('MY_VARIABLE').s,
                        };
                    }

                    // Same shape as the function blocks: the parameters become tab stops
                    const params = identifier.params ?? [];
                    const snippetParams = params.map((param, index) => '${' + (index + 1) + ':' + param + '}');

                    return {
                        caption: `${identifier.name}(${params.join(', ')})`,
                        snippet: `${identifier.name}(${snippetParams.join(', ')})`,
                        type: 'snippet',
                        meta: getMessage('MY_FUNCTION').s,
                    };
                })
            );
        },
    };

    // we set the completer to only what we want instead of all the noisy default stuff
    if (langTools) {
        langTools.setCompleters([completer, localIdentifiersCompleter]);
    }
};
