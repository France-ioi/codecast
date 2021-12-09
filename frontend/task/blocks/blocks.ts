import {CodecastPlatform} from "../../store";
import {getPythonSpecificBlocks} from "../python_utils";

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

export const getContextBlocksData = function (context, platform: CodecastPlatform) {
    const definedFunctions = [];
    const argumentsByBlock = {};
    const handlers = [];
    const constants = [];
    let availableBlocks = [];

    if (context.infos && context.infos.includeBlocks && context.infos.includeBlocks.generatedBlocks) {
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
        for (let generatorName in context.infos.includeBlocks.generatedBlocks) {
            let blockList = context.infos.includeBlocks.generatedBlocks[generatorName];
            if (!blockList.length) {
                continue;
            }

            if (!argumentsByBlock[generatorName]) {
                argumentsByBlock[generatorName] = {};
            }
            for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
                let blockName = blockList[iBlock];
                let code = context.strings.code[blockName];
                if (typeof (code) == "undefined") {
                    code = blockName;
                }
                let nbsArgs = blocksInfos[blockName] ? (blocksInfos[blockName].nbsArgs ? blocksInfos[blockName].nbsArgs : []) : [];
                let type = blocksInfos[blockName] ? blocksInfos[blockName].type : 'actions';

                if (type == 'actions') {
                    // this._hasActions = true;
                }

                argumentsByBlock[generatorName][blockName] = nbsArgs;
                handlers.push({code, generatorName, blockName, nbsArgs, type});
                availableBlocks.push({
                    generatorName,
                    name: blockName,
                    type: BlockType.Function,
                    category: type,
                    params: nbsArgs,
                    code: code + '()',
                });

                if (-1 === definedFunctions.indexOf(code)) {
                    definedFunctions.push(code);
                }
            }

            if (context.customConstants && context.customConstants[generatorName]) {
                let constList = context.customConstants[generatorName];
                for (let iConst = 0; iConst < constList.length; iConst++) {
                    let name = constList[iConst].name;
                    if (context.strings.constant && context.strings.constant[name]) {
                        name = context.strings.constant[name];
                    }
                    constants.push({name, generatorName, value: constList[iConst].value});
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
       const pythonSpecificBlocks = getPythonSpecificBlocks(context);
       availableBlocks = [...availableBlocks, ...pythonSpecificBlocks];
    }

    return {
        definedFunctions,
        argumentsByBlock,
        handlers,
        constants,
        availableBlocks,
    };
}