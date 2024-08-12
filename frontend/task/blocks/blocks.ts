import {AppStore} from "../../store";
import {Bundle} from "../../linker";
import {delay, put, takeLatest} from "typed-redux-saga";
import {BlocksUsage} from "../task_types";
import {taskSetBlocksUsage} from "../task_slice";
import {checkCompilingCode, getBlocksUsage} from "../utils";
import {selectAnswer} from "../selectors";
import {QuickAlgoLibrary, QuickalgoLibraryBlock} from "../libs/quickalgo_library";
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

function getSnippet(block: Block, platform: CodecastPlatform) {
    const proto = block.caption;
    let parenthesisOpenIndex = proto.indexOf("(");
    let finalCharacter = -1 !== [CodecastPlatform.C, CodecastPlatform.Cpp].indexOf(platform) && BlockType.Function === block.type && block.category !== 'sensors' ? ';' : '';
    if (proto.charAt(parenthesisOpenIndex + 1) == ')') {
        return proto + finalCharacter;
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

        return ret + finalCharacter;
    }
}

interface BlockInfo {
    nbArgs: number,
    type: string,
    yieldsValue: string|boolean,
    params: any[],
    nbsArgs: any[],
}

export function generateBlockInfo(block: QuickalgoLibraryBlock, typeName: string): BlockInfo {
    const blockInfo = {
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

    return blockInfo;
}

function getBlockFromBlockInfo(generatorName: string, blockName: string, blockInfo: BlockInfo|undefined, contextStrings): Block {
    let code = contextStrings.code[blockName];
    if ('undefined' === typeof code) {
        code = blockName;
    }
    let nbsArgs = blockInfo ? (blockInfo.nbsArgs ? blockInfo.nbsArgs : []) : [];
    let params = blockInfo ? blockInfo.params : [];
    let type = blockInfo ? blockInfo.type : 'actions';
    let returnType = blockInfo ? blockInfo.yieldsValue : null;

    return {
        generatorName,
        name: blockName,
        type: BlockType.Function,
        category: type,
        paramsCount: nbsArgs,
        params,
        caption: code,
        code,
        returnType,
    }
}

export const getContextBlocksDataSelector = memoize(({state, context}: {state: AppStore, context: QuickAlgoLibrary}): Block[] => {
    const contextIncludeBlocks = state.task.contextIncludeBlocks;
    const contextStrings = state.task.contextStrings;
    const platform = selectActiveBufferPlatform(state);

    let availableBlocks: Block[] = [];

    if (contextIncludeBlocks && contextIncludeBlocks.generatedBlocks) {
        // Flatten customBlocks information for easy access
        const blocksInfos = {};
        for (let generatorName in context.customBlocks) {
            for (let typeName in context.customBlocks[generatorName]) {
                let blockList = context.customBlocks[generatorName][typeName];
                for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
                    let block = blockList[iBlock];
                    blocksInfos[block.name] = generateBlockInfo(block, typeName);
                }
            }
        }

        for (let generatorName in context.customClasses) {
            for (let typeName in context.customClasses[generatorName]) {
                for (let className in context.customClasses[generatorName][typeName]) {
                    let classRepresentation = context.customClasses[generatorName][typeName][className];
                    for (let iBlock = 0; iBlock < classRepresentation.length; iBlock++) {
                        let block = classRepresentation[iBlock];
                        blocksInfos[className + '.' + block.name] = generateBlockInfo(block, typeName);
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
                if ('string' === typeof blockName) {
                    const newBlock = getBlockFromBlockInfo(generatorName, blockName, blocksInfos[blockName], contextStrings);
                    availableBlocks.push(newBlock);
                } else {
                    const {className, classInstances, methods} = blockName;
                    for (let classInstance of classInstances) {
                        for (let method of methods) {
                            const totalBlockName = `${className}.${method}`;
                            const instanceBlockName = `${classInstance}.${method}`;
                            const newBlock = getBlockFromBlockInfo(generatorName, instanceBlockName, blocksInfos[totalBlockName], contextStrings);
                            newBlock.type = BlockType.ClassFunction;
                            newBlock.methodName = method;
                            newBlock.className = className;
                            newBlock.classInstance = classInstance;
                            availableBlocks.push(newBlock);
                        }
                    }
                }
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

    if (platformsList[platform].getSpecificBlocks) {
        const notionsBag = getNotionsBagFromIncludeBlocks(contextIncludeBlocks, context.getNotionsList());
        const specificBlocks = platformsList[platform].getSpecificBlocks(notionsBag, contextIncludeBlocks);
        availableBlocks = [...availableBlocks, ...specificBlocks];
    }

    availableBlocks.forEach((block => {
        if (contextStrings.description && block.name in contextStrings.description) {
            block.description = contextStrings.description[block.name];
        }

        if (BlockType.Function !== block.type) {
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
                if (!hasBlockPlatform(platform)) {
                    block.caption = funcCode + '()';
                }
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

            if (block.caption && block.caption.trim().substring(0, 1) === '%') {
                block.caption = block.caption.substring(block.caption.indexOf('%') + 1).trim();
            }
            block.snippet = block.snippet ? block.snippet : getSnippet(block, platform);
        }

        if (block.description && block.description.trim().substring(0, 1) === ':') {
            block.description = block.description.substring(block.description.indexOf(':') + 1).trim();
        }
    }));

    console.log({availableBlocks})

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
