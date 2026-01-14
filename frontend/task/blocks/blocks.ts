import {AppStore} from "../../store";
import {Bundle} from "../../linker";
import {delay, put, takeLatest} from "typed-redux-saga";
import {BlocksUsage} from "../task_types";
import {taskSetBlocksUsage} from "../task_slice";
import {checkCompilingCode, getBlocksUsage} from "../utils";
import {selectAnswer} from "../selectors";
import {QuickAlgoCustomClass, QuickAlgoLibrary, QuickalgoLibraryBlock} from "../libs/quickalgo_library";
import {memoize} from 'proxy-memoize';
import {appSelect} from '../../hooks';
import {hasBlockPlatform, platformsList} from '../../stepper/platforms';
import {getNotionsBagFromIncludeBlocks} from './notions';
import {CodecastPlatform} from '../../stepper/codecast_platform';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {Block, BlockType} from './block_types';
import {selectActiveBufferPlatform} from '../../buffers/buffer_selectors';

export interface DraggableBlockItem {
    block: Block,
}

interface BlockInfo {
    nbArgs: number,
    type: string,
    yieldsValue: string,
    params: any[],
    nbsArgs: any[],
    hidden?: boolean,
    blocklyJson?: object,
    blocklyXml?: string,
    blocklyInit?: Function,
}

export const CONSTRUCTOR_NAME = '__constructor';

export function generateBlockInfo(block: QuickalgoLibraryBlock, typeName: string): BlockInfo {
    const blockInfo: BlockInfo = {
        nbArgs: 0, // handled below
        type: typeName,
        yieldsValue: block.yieldsValue,
        params: block.params ?? [],
        nbsArgs: [],
    };
    if (block.anyArgs) {
        // Allows to specify the function can accept any number of arguments
        blockInfo.nbsArgs.push(Infinity);
    }
    let variants = block.variants ? block.variants : (block.params ? [block.params] : []);
    if (variants.length) {
        for (let i = 0; i < variants.length; i++) {
            blockInfo.nbsArgs.push(variants[i].length);
        }
    }
    if (block.hidden) {
        blockInfo.hidden = true;
    }
    if (block.blocklyJson) {
        blockInfo.blocklyJson = block.blocklyJson;
    }
    if (block.blocklyXml) {
        blockInfo.blocklyXml = block.blocklyXml;
    }
    if (block.blocklyInit) {
        blockInfo.blocklyInit = block.blocklyInit;
    }

    return blockInfo;
}

function convertQuickalgoLibraryToCodecastBlock(block: QuickalgoLibraryBlock, category: string, generatorName: string, contextStrings): Block {
    let code = contextStrings.code[`${generatorName}.${block.name}`] ?? contextStrings.code[block.name];
    if ('undefined' === typeof code) {
        code = block.name;
    }

    const paramsCount = [];
    if (block.anyArgs) {
        // Allows to specify the function can accept any number of arguments
        paramsCount.push(Infinity);
    }
    let variants = block.variants ? block.variants : (block.params ? [block.params] : []);
    if (variants.length) {
        for (let i = 0; i < variants.length; i++) {
            paramsCount.push(variants[i].length);
        }
    }

    return {
        generatorName,
        name: block.name,
        type: BlockType.Function,
        category: category ?? 'actions',
        paramsCount,
        params: block.params ?? [],
        caption: code,
        code,
        showInBlocks: !block?.hidden,
        ...(block?.codeGenerators ? {codeGenerators: block.codeGenerators} : {}),
        ...(block?.yieldsValue ? {yieldsValue: block.yieldsValue} : {}),
        ...(block?.blocklyJson ? {blocklyJson: block.blocklyJson} : {}),
        ...(block?.blocklyXml ? {blocklyXml: block.blocklyXml} : {}),
        ...(block?.blocklyInit ? {blocklyInit: block.blocklyInit} : {}),
    };
}

// For a specific context and a platform
export const getContextBlocksDataSelector = memoize(({state, context}: {state: AppStore, context: QuickAlgoLibrary}): Block[] => {
    if (!context) {
        return [];
    }

    const contextIncludeBlocks = state.task.contextIncludeBlocks;
    const contextStrings = state.task.contextStrings;
    const platform = selectActiveBufferPlatform(state);

    let availableBlocks: Block[] = [];

    if (contextIncludeBlocks && contextIncludeBlocks.generatedBlocks) {
        // Flatten customBlocks information for easy access
        const blocksInfos: {[blockName: string]: {block: QuickalgoLibraryBlock, category: string}} = {};
        for (let generatorName in context.customBlocks) {
            for (let category in context.customBlocks[generatorName]) {
                let blockList = context.customBlocks[generatorName][category];
                for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
                    let block = blockList[iBlock];
                    blocksInfos[block.name] = {block, category};
                }
            }
        }

        // TODO: Handle class constants

        console.log('custom features', context.features);

        if (context.features) {
            for (let [featureName, featureData] of Object.entries(context.features)) {
                if (!contextIncludeBlocks.generatedBlocks[featureData.generatorName]?.includes(featureName)) {
                    continue;
                }

                for (let block of (featureData.blocks ?? [])) {
                    const newBlock = convertQuickalgoLibraryToCodecastBlock(block, featureData.category, featureData.generatorName, contextStrings);
                    availableBlocks.push(newBlock);
                }
                for (let [className, classInfo] of Object.entries(featureData.classMethods ?? {})) {
                    for (let classInstance of classInfo.instances) {
                        for (let [method, block] of Object.entries(classInfo.methods)) {
                            const totalBlockName = `${className}.${method}`;
                            const instanceBlockName = `${classInstance}.${method}`;
                            block.name = totalBlockName;
                            const newBlock = convertQuickalgoLibraryToCodecastBlock(block, featureData.category, featureData.generatorName, contextStrings);
                            newBlock.type = BlockType.ClassFunction;
                            newBlock.caption = instanceBlockName + '()';
                            newBlock.methodName = method;
                            newBlock.className = className;
                            newBlock.classInstance = classInstance;
                            availableBlocks.push(newBlock);
                        }
                    }
                }
            }
        } else {
            // Generate functions used in the task
            for (let generatorName in contextIncludeBlocks.generatedBlocks) {
                let blockList = contextIncludeBlocks.generatedBlocks[generatorName];
                if (!blockList.length) {
                    continue;
                }

                for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
                    let blockName = blockList[iBlock];
                    const {block, category} = blocksInfos[blockName];
                    const newBlock = convertQuickalgoLibraryToCodecastBlock(block, category, generatorName, contextStrings);
                    availableBlocks.push(newBlock);
                }

                if (context.customConstants && context.customConstants[generatorName]) {
                    let constList = context.customConstants[generatorName];
                    for (let iConst = 0; iConst < constList.length; iConst++) {
                        let name = constList[iConst].name;
                        // if (contextStrings.constant && contextStrings.constant[name]) {
                        //     name = contextStrings.constant[name];
                        // }
                        availableBlocks.push({
                            generatorName,
                            name,
                            caption: name,
                            code: name,
                            category: 'constants',
                            type: BlockType.Constant,
                            value: constList[iConst].value,
                        });
                    }
                }
            }
        }
    }

    if (platformsList[platform].getSpecificBlocks) {
        const notionsBag = getNotionsBagFromIncludeBlocks(contextIncludeBlocks, context.getNotionsList());
        const specificBlocks = platformsList[platform].getSpecificBlocks(notionsBag, contextIncludeBlocks);
        availableBlocks = [...availableBlocks, ...specificBlocks];
    }

    availableBlocks.forEach((block => {
        if (contextStrings.description && `${block.generatorName}.${block.name}` in contextStrings.description) {
            block.description = contextStrings.description[`${block.generatorName}.${block.name}`];
        } else if (contextStrings.description && block.name in contextStrings.description) {
            block.description = contextStrings.description[block.name];
        }

        if (BlockType.Function !== block.type && BlockType.ClassFunction !== block.type) {
            return;
        }

        if (context.docGenerator) {
            let blockDesc = context.docGenerator.blockDescription(block.name);
            let funcProto = blockDesc.substring(blockDesc.indexOf('<code>') + 6, blockDesc.indexOf('</code>'));
            let blockHelp = blockDesc.substring(blockDesc.indexOf('</code>') + 7);
            while (blockHelp.startsWith('<br>') || (blockHelp.startsWith('<code>') && context.infos.hideVariantsInDocumentation)) {
                if (blockHelp.startsWith('<br>')) {
                    blockHelp = blockHelp.slice('<br>'.length);
                }
                if (blockHelp.startsWith('<code>') && context.infos.hideVariantsInDocumentation) {
                    blockHelp = blockHelp.substring(blockHelp.indexOf('</code>') + 7);
                }
            }

            block.caption = funcProto;
            block.description = blockHelp;
            block.snippet = getSnippet(block, platform);
        } else {
            if (block.description) {
                block.description = block.description.replace(/@/g, block.code);
            }

            let blockDesc = '';
            let blockName = block.name;
            let funcCode = block.caption;
            blockDesc = block.description;
            if (!blockDesc) {
                if (!hasBlockPlatform(platform) && !block.caption) {
                    block.caption = funcCode + '()';
                }
                if (BlockType.ClassFunction === block.type && 'init' === block.methodName) {
                    block.caption = `${block.classInstance} = ${block.className}()`;
                }
            } else if (blockDesc.indexOf('</code>') < 0) {
                let funcProtoEnd = blockDesc.indexOf(')') + 1;
                if (funcProtoEnd > 0) {
                    block.caption = blockDesc.substring(0, funcProtoEnd);
                    block.description = blockDesc.substring(funcProtoEnd + 1);
                } else {
                    if (!block.caption) {
                        block.caption = blockName + '()';
                    }
                    block.description = blockDesc;
                }
            }

            if (block.caption && block.caption.trim().substring(0, 1) === '%') {
                block.caption = block.caption.substring(block.caption.indexOf('%') + 1).trim();
            }
            block.snippet = block.snippet ? block.snippet : getSnippet(block, platform);
        }

        if (block.description && block.description.trim().substring(0, 1) === ':') {
            block.description = block.description.substring(block.description.indexOf(':') + 1).trim();
        }
    }));

    return availableBlocks;
});

function* checkSourceSaga() {
    const state = yield* appSelect();
    const answer = selectAnswer(state);
    const context = quickAlgoLibraries.getContext(null, 'main');
    const currentTask = state.task.currentTask;
    if (!context || !currentTask) {
        yield* put(taskSetBlocksUsage(null));
        return;
    }

    let blocksUsage: BlocksUsage = {};
    try {
        checkCompilingCode(answer, state, ['empty']);
    } catch (e) {
        blocksUsage.error = e.toString();
    }

    const currentUsage = getBlocksUsage(answer, state);
    if (currentUsage) {
        const maxInstructions = context.infos.maxInstructions ? context.infos.maxInstructions : Infinity;

        blocksUsage = {
            ...blocksUsage,
            blocksCurrent: currentUsage.blocksCurrent,
            blocksLimit: maxInstructions,
            limitations: currentUsage.limitations.filter(limitation => 'uses' === limitation.type),
        };
    }

    yield* put(taskSetBlocksUsage(blocksUsage));
}

function getSnippet(block: Block, platform: CodecastPlatform) {
    const proto = block.caption;
    let parenthesisOpenIndex = proto.indexOf("(");
    let finalCharacter = -1 !== [CodecastPlatform.C, CodecastPlatform.Cpp].indexOf(platform) && BlockType.Function === block.type && block.category !== 'sensors' ? ';' : '';

    let snippetIndex = 1;
    let ret = proto.substring(0, parenthesisOpenIndex + 1);

    if (proto.charAt(parenthesisOpenIndex + 1) == ')') {
        return ret + ")" + finalCharacter;
    } else {
        let commaIndex = parenthesisOpenIndex;
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

        return ret + finalCharacter;
    }
}


function* selectorChangeSaga<T>(selector: (state: AppStore) => T, isEqual: (previousState: T, nextState: T) => boolean, waitDelay: number, saga) {
    let previous = yield* appSelect(selector);
    yield* takeLatest('*', function*() {
        // Wait delay, if we receive a new action during the delay, this one will be canceled
        // It creates a natural debouncing
        yield* delay(waitDelay);
        const next = yield* appSelect(selector);
        if (!isEqual(previous, next)) {
            previous = next;
            yield* saga();
        }
    });
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        if ('main' !== (yield* appSelect(state => state.environment))) {
            return;
        }

        // Debounce 500ms before checking if it's a different answer
        yield* selectorChangeSaga((state: AppStore) => {
            return {
                answer: selectAnswer(state),
                level: state.task.currentLevel,
                task: state.task.currentTask,
            };
        }, (previousState, nextState) => {
            return JSON.stringify(previousState.answer) === JSON.stringify(nextState.answer)
                && previousState.level === nextState.level
                && previousState.task === nextState.task;
        }, 500, checkSourceSaga);
    });
}
