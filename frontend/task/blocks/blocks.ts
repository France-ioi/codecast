import {AppStore, AppStoreReplay} from "../../store";
import {getPythonSpecificBlocks} from "../python_utils";
import {quickAlgoLibraries, QuickAlgoLibrary} from "../libs/quickalgo_librairies";
import {getCSpecificBlocks} from "../../stepper/views/c/utils";
import {Bundle} from "../../linker";
import {call, debounce, delay, put, select, takeEvery, takeLatest} from "typed-redux-saga";
import {DocumentationActionTypes, DocumentationLoadAction} from "../documentation/doc";
import {ActionTypes as BufferActionTypes} from "../../buffers/actionTypes";
import {StepperStatus} from "../../stepper";
import {ActionTypes, ActionTypes as StepperActionTypes} from "../../stepper/actionTypes";
import {BlocksUsage, taskClearSubmission, taskSetBlocksUsage} from "../task_slice";
import {useAppSelector} from "../../hooks";
import {getBufferModel} from "../../buffers/selectors";
import {checkCompilingCode, getBlocksUsage} from "../utils";

export enum BlockType {
    Function = 'function',
    Constant = 'constant',
    Token = 'token',
    Directive = 'directive',
}

export interface DraggableBlockItem {
    block: Block,
}

export interface Block {
    name: string,
    type: BlockType,
    description?: string // displayed on the blocks list and in autocomplete
    code?: string, // code that will inserted by Codecast
    snippet?: string, // code that will be inserted by Ace editor
    caption?: string, // how the block will be displayed on the interface
    captionMeta?: string, // optional category that will appear in autocomplete
    category?: string,
    generatorName?: string,
    value?: string, // for constant
    params?: any, // for function
    showInBlocks?: boolean,
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

export const getContextBlocksDataSelector = function (state: AppStoreReplay, context: QuickAlgoLibrary): Block[] {
    const contextIncludeBlocks = state.task.contextIncludeBlocks;
    const contextStrings = state.task.contextStrings;
    const platform = state.options.platform;

    let availableBlocks: Block[] = [];

    if (contextIncludeBlocks && contextIncludeBlocks.generatedBlocks) {
        // Flatten customBlocks information for easy access
        const blocksInfos = {};
        for (let generatorName in context.customBlocks) {
            for (let typeName in context.customBlocks[generatorName]) {
                let blockList = context.customBlocks[generatorName][typeName];
                for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
                    let blockInfo = blockList[iBlock];
                    blocksInfos[blockInfo.name] = {
                        nbArgs: 0, // handled below
                        type: typeName
                    };
                    blocksInfos[blockInfo.name].nbsArgs = [];
                    if (blockInfo.anyArgs) {
                        // Allows to specify the function can accept any number of arguments
                        blocksInfos[blockInfo.name].nbsArgs.push(Infinity);
                    }
                    let variants = blockInfo.variants ? blockInfo.variants : (blockInfo.params ? [blockInfo.params] : []);
                    if (variants.length) {
                        for (let i = 0; i < variants.length; i++) {
                            blocksInfos[blockInfo.name].nbsArgs.push(variants[i].length);
                        }
                    }
                }
            }
        }

        // Generate functions used in the task
        for (let generatorName in contextIncludeBlocks.generatedBlocks) {
            let blockList = contextIncludeBlocks.generatedBlocks[generatorName];
            if (!blockList.length) {
                continue;
            }

            for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
                let blockName = blockList[iBlock];
                let code = contextStrings.code[blockName];
                if (typeof (code) == "undefined") {
                    code = blockName;
                }
                let nbsArgs = blocksInfos[blockName] ? (blocksInfos[blockName].nbsArgs ? blocksInfos[blockName].nbsArgs : []) : [];
                let type = blocksInfos[blockName] ? blocksInfos[blockName].type : 'actions';

                if (type == 'actions') {
                    // this._hasActions = true;
                }

                availableBlocks.push({
                    generatorName,
                    name: blockName,
                    type: BlockType.Function,
                    category: type,
                    params: nbsArgs,
                    caption: code,
                    code: code,
                });
            }

            if (context.customConstants && context.customConstants[generatorName]) {
                let constList = context.customConstants[generatorName];
                for (let iConst = 0; iConst < constList.length; iConst++) {
                    let name = constList[iConst].name;
                    if (contextStrings.constant && contextStrings.constant[name]) {
                        name = contextStrings.constant[name];
                    }
                    availableBlocks.push({
                        generatorName,
                        name,
                        caption: name,
                        type: BlockType.Constant,
                        value: constList[iConst].value,
                    });
                }
            }
        }
    }

    if ('python' === platform) {
       const pythonSpecificBlocks = getPythonSpecificBlocks(contextIncludeBlocks);
       availableBlocks = [...availableBlocks, ...pythonSpecificBlocks];
    } else if ('unix' === platform) {
        const cSpecificBlocks = getCSpecificBlocks(contextIncludeBlocks);
        availableBlocks = [...availableBlocks, ...cSpecificBlocks];
    }

    availableBlocks.forEach((block => {
        if (contextStrings.description && block.name in contextStrings.description) {
            block.description = contextStrings.description[block.name];
        }

        if (BlockType.Function === block.type) {
            if (block.description) {
                block.description = block.description.replace(/@/g, block.code);
            }

            let blockDesc = '';
            let blockName = block.name;
            let funcCode = block.caption;
            blockDesc = block.description;
            if (!blockDesc) {
                block.caption = funcCode + '()';
            } else if (blockDesc.indexOf('</code>') < 0) {
                let funcProtoEnd = blockDesc.indexOf(')') + 1;
                if (funcProtoEnd > 0) {
                    block.caption = blockDesc.substring(0, funcProtoEnd);
                    block.description = blockDesc.substring(funcProtoEnd + 1);
                } else {
                    console.error("Description for block '" + blockName + "' needs to be of the format 'function() : description', auto-generated one used instead could be wrong.");
                    block.caption = blockName + '()';
                }
            }

            block.snippet = getSnippet(block.caption);
        }
    }))

    return availableBlocks;
}

function* checkSourceSaga() {
    const state: AppStore = yield* select();
    const sourceModel = getBufferModel(state, 'source');
    const currentSource = sourceModel ? sourceModel.document.toString() : null;
    const context = quickAlgoLibraries.getContext(null, 'main');
    const currentTask = state.task.currentTask;
    if (!context || !currentTask) {
        yield* put(taskSetBlocksUsage(null));
        return;
    }

    try {
        checkCompilingCode(currentSource.trim(), state.options.platform, state, false);

        const currentUsage = getBlocksUsage(currentSource.trim(), state.options.platform);
        const maxInstructions = context.infos.maxInstructions ? context.infos.maxInstructions : Infinity;

        const blocksUsage: BlocksUsage = {
            blocksCurrent: currentUsage.blocksCurrent,
            blocksLimit: maxInstructions,
            limitations: currentUsage.limitations.filter(limitation => 'uses' === limitation.type),
        };

        yield* put(taskSetBlocksUsage(blocksUsage));
    } catch (e) {
        yield* put(taskSetBlocksUsage({error: e.toString()}));
    }
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield* debounce(500, BufferActionTypes.BufferEdit, checkSourceSaga);
        yield* debounce(500, BufferActionTypes.BufferReset, checkSourceSaga);

        yield* takeEvery(BufferActionTypes.BufferInit, function* (action) {
            // @ts-ignore
            const {buffer} = action;
            if ('source' === buffer) {
                yield* call(checkSourceSaga);
            }
        });
    });
}
