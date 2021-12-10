import {AppStore, AppStoreReplay, CodecastPlatform} from "../../store";
import {getPythonSpecificBlocks} from "../python_utils";
import {QuickAlgoLibrary} from "../libs/quickalgo_librairies";

export enum BlockType {
    Function = 'function',
    Constant = 'constant',
    Token = 'token',
}

export interface Block {
    name: string,
    type: BlockType,
    code?: string,
    category: string,
    generatorName?: string,
    value?: string, // for constant
    params?: any, // for function
}

export const getContextBlocksDataSelector = function (state: AppStoreReplay, context: QuickAlgoLibrary): Block[] {
    const contextIncludeBlocks = state.task.contextIncludeBlocks;
    const contextStrings = state.task.contextStrings;
    const platform = state.options.platform;

    let availableBlocks = [];

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
                    code,
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
    }

    return availableBlocks;
}
