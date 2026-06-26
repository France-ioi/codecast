import {AppStore} from "../../store";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {selectAnswer} from "../../task/selectors";
import {getContextBlocksDataSelector} from "../../task/blocks/blocks";
import {put} from "typed-redux-saga";
import {QuickAlgoLibrary} from "../../task/libs/quickalgo_library";
import {taskIncreaseContextId} from "../../task/task_slice";
import log from 'loglevel';
import {appSelect} from '../../hooks';
import {hasBlockPlatform} from '../platforms';
import {App, Codecast} from '../../app_types';
import {quickAlgoLibraries} from '../../task/libs/quick_algo_libraries_model';
import {LayoutType} from '../../task/layout/layout_types';
import {BlockDocument, Document} from '../../buffers/buffer_types';
import {BlocklyHelper} from './blockly_helper';
import {getMessage, getMessageChoices} from '../../lang/messages';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';
import {javascriptGenerator} from 'blockly/javascript';
import {selectActiveBufferPlatform} from '../../buffers/buffer_selectors';
import {CodecastPlatform} from '../codecast_platform';

// TODO Blockly: don't expose Blockly to all window. Check after FioiBlockly has been migrated
window.Blockly = Blockly;

export function selectGroupByCategory(state: AppStore) {
    const isMobile = LayoutType.MobileVertical === state.layout.type || LayoutType.MobileHorizontal === state.layout.type;

    if (isMobile) {
        return true;
    }

    return !!state.task.contextIncludeBlocks?.groupByCategory;
}

export function* loadBlocklyHelperSaga(context: QuickAlgoLibrary) {
    if (!context) {
        return;
    }
    if (context && context.blocklyHelper && !context.blocklyHelper.fake) {
        context.blocklyHelper.unloadLevel();
    }

    const state = yield* appSelect();
    const options = state.options;
    const contextIncludeBlocks = state.task.contextIncludeBlocks;

    log.getLogger('blockly_runner').debug('[stepper/js] load blockly helper', context.infos.includeBlocks, contextIncludeBlocks);

    const groupByCategory = selectGroupByCategory(state);

    const language = options.language.split('-')[0];

    const availableLanguages = import.meta.glob('../../lang/blockly_*.ts', {
        eager: true,
        import: 'default',
    });
    const path = `../../lang/blockly_${language}.ts`;
    const languageTranslations: any = availableLanguages[path];
    const isMobile = yield* appSelect(state => LayoutType.MobileVertical === state.layout.type || LayoutType.MobileHorizontal === state.layout.type);

    for (const key in languageTranslations.Msg) {
        Blockly.Msg[key] = languageTranslations.Msg[key];
    }

    javascriptGenerator.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
    javascriptGenerator.addReservedWords('highlightBlock');

    if (!window.quickAlgoInterface) {
        window.quickAlgoInterface = {
            displayCapacity: () => {},
            onEditorChange: () => {}, // will be overriden in BlocklyEditor
            resetTestScores: () => {},
            displayError: (e) => {
                if (e) {
                    console.error(e);
                }
            },
            setPlayPause: () => {},
            onResize: () => {},
            displayKeypad: function(initialValue, position, callbackModify, callbackFinished, options) {
                if (window.displayHelper) {
                    window.displayHelper.showKeypad(initialValue, position, callbackModify, callbackFinished, options);
                }
            },
        };
    }

    context.blocklyHelper = createBlocklyHelper(context, state);
    context.onChange = () => {};

    yield* put(taskIncreaseContextId());
}

export function createBlocklyHelper(context: QuickAlgoLibrary, state: AppStore) {
    const platform = selectActiveBufferPlatform(state)
    const blocklyHelper = new BlocklyHelper(context.infos.maxInstructions, context, platform === CodecastPlatform.Scratch);
    log.getLogger('blockly_runner').debug('[blockly.editor] load blockly helper', context, blocklyHelper);

    if (context.infos.multithread) {
        // Make generation of all blocks
        blocklyHelper.startingBlock = false;
    }

    const availableBlocks = getContextBlocksDataSelector({state, context});

    log.getLogger('blockly_runner').debug('[blockly.editor] load context into blockly editor');
    blocklyHelper.loadContext(context);
    blocklyHelper.groupByCategory = selectGroupByCategory(state);
    blocklyHelper.setAvailableBlocks(availableBlocks);
    blocklyHelper.setIncludeBlocks(state.task.contextIncludeBlocks);
    if (context.infos.definitions) {
        blocklyHelper.addDefinitions(context.infos.definitions);
    }
    if (context.infos.simpleGenerators) {
        blocklyHelper.addSimpleGenerators(context.infos.simpleGenerators);
    }

    return blocklyHelper;
}

export const checkBlocklyCode = function (answer: Document, context: QuickAlgoLibrary, state: AppStore, disabledValidations: string[] = []) {
    log.getLogger('blockly_runner').debug('check blockly code', answer, context.strings.code);

    const blockly = (answer as unknown as BlockDocument)?.content?.blockly;
    if (!blockly) {
        return;
    }

    let blocks: Blockly.BlockSvg[];
    try {
        // This method can fail if Blockly is not loaded in the DOM. In this case it's ok we don't make the check
        blocks = getBlocksFromXml(state, context, blockly);
    } catch (e) {
        console.error(e);
        return;
    }

    const maxInstructions = context.infos.maxInstructions ? context.infos.maxInstructions : Infinity;
    const totalCount = blocklyCount(blocks, context);

    if (-1 === disabledValidations.indexOf('blocks_limit') && maxInstructions && totalCount > maxInstructions) {
        throw getMessageChoices('TASK_BLOCKS_OVER_LIMIT', totalCount - maxInstructions).format({
            limit: maxInstructions,
            overLimit: totalCount - maxInstructions,
        });
    }

    const limitations = context.infos.limitedUses ? blocklyFindLimited(blocks, context.infos.limitedUses, context) : [];
    for (let limitation of limitations) {
        if (limitation.type == 'uses' && limitation.current > limitation.limit) {
            throw getMessage('CODE_CONSTRAINTS_LIMITED_USES').format({keyword: limitation.name});
        } else if (limitation.type == 'assign') {
            throw getMessage('CODE_CONSTRAINTS_LIMITED_ASSIGN').format({keyword: limitation.name});
        }
    }

    if (-1 === disabledValidations.indexOf('empty') && totalCount <= 0) {
        throw getMessage('CODE_CONSTRAINTS_EMPTY_PROGRAM_BLOCKS');
    }
}

const getBlockCount = function (block: Blockly.BlockSvg, context: QuickAlgoLibrary) {
    // How many "blocks" a specific block counts towards the total

    // Block counts extra
    if (context.blocklyHelper?.blockCounts && typeof context.blocklyHelper.blockCounts[block.type] == 'number') {
        return context.blocklyHelper.blockCounts[block.type];
    }

    if (block.type == 'robot_start') {
        // Program start block
        return 0;
    }

    return 1;
}

export const getBlocklyBlocksUsage = function (answer: Document, context: QuickAlgoLibrary, state: AppStore) {
    // We cannot evaluate blocks as long as the answer has not been loaded into Blockly
    // Thus we wait that the Blockly workspace has been created (by BlocklyEditor)
    const blockly = (answer as unknown as BlockDocument)?.content?.blockly;
    if (!blockly || !context.blocklyHelper?.workspace) {
        return {
            blocksCurrent: 0,
            limitations: [],
        };
    }

    log.getLogger('blockly_runner').debug('blocks usage', answer);

    let blocks: Blockly.BlockSvg[];
    try {
        // This method can fail if Blockly is not loaded in the DOM. In this case it's ok we don't make the check
        blocks = getBlocksFromXml(state, context, blockly);
    } catch (e) {
        console.error(e);
        return {
            blocksCurrent: 0,
            limitations: [],
        };
    }

    const blocksUsed = blocklyCount(blocks, context);
    const limitations = (context.infos.limitedUses ? blocklyFindLimited(blocks, context.infos.limitedUses, context) : []) as {type: string, name: string, current: number, limit: number}[];

    log.getLogger('blockly_runner').debug('limitations', limitations);

    return {
        blocksCurrent: blocksUsed,
        limitations,
    };
};

export function blocklyCount(blocks: Blockly.BlockSvg[], context: QuickAlgoLibrary): number {
    let blocksUsed = 0;
    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];
        blocksUsed += getBlockCount(block, context);
    }

    return blocksUsed;
}

const getBlocksFromXml = function (state: AppStore, context: QuickAlgoLibrary, xmlText: string): Blockly.BlockSvg[] {
    const xml = Blockly.utils.xml.textToDom(xmlText);

    const blocklyHelper = createBlocklyHelper(context, state);
    const language = state.options.language.split('-')[0];
    blocklyHelper.load(language, false, 1, {});

    Blockly.Xml.domToWorkspace(xml, blocklyHelper.workspace);

    return blocklyHelper.workspace.getAllBlocks();
};

export const blocklyFindLimited = (blocks: Blockly.BlockSvg[], limitedUses, context: QuickAlgoLibrary) => {
    if (!blocks || !limitedUses) {
        return [];
    }

    context.blocklyHelper.makeLimitedUsesPointers();

    const usesCount = {};
    const limitations = [];
    for (let i = 0; i < blocks.length; i++) {
        let blockType = blocks[i].type;
        blockType = context.blocklyHelper.normalizeType(blockType);
        if (!context.blocklyHelper.limitedPointers[blockType]) {
            continue;
        }
        for (let j = 0; j < context.blocklyHelper.limitedPointers[blockType].length; j++) {
            // Each pointer is a position in the limitedUses array that
            // this block appears in
            var pointer = context.blocklyHelper.limitedPointers[blockType][j];
            if (!usesCount[pointer]) {
                usesCount[pointer] = 0;
            }
            usesCount[pointer]++;

            // Exceeded the number of uses
            const limits = limitedUses[pointer];
            if (usesCount[pointer] === limits.nbUses + 1) {
                for (let limitBlock of limits.blocks) {
                    const blockName = limitBlock in context.strings.code ? context.strings.code[limitBlock] : limitBlock;
                    limitations.push({type: 'uses', name: blockName, current: usesCount[pointer], limit: limitedUses[pointer].nbUses});
                }
            }
        }
    }

    return limitations;
}

export async function getBlocklyCodeFromXml(document: BlockDocument, lang: 'javascript'|'python', state: AppStore) {
    const language = state.options.language.split('-')[0];
    const context = quickAlgoLibraries.getContext(null, state.environment);

    log.getLogger('blockly_runner').debug('init stepper js', state.environment);
    context.onError = (diagnostics) => {
        log.getLogger('blockly_runner').debug('context error', diagnostics);
        // channel.put({
        //     type: CompileActionTypes.StepperInterrupting,
        // });
        // channel.put(stepperExecutionError(diagnostics));
    };

    const blocklyHelper = context.blocklyHelper;
    log.getLogger('blockly_runner').debug('blockly helper', blocklyHelper);
    log.getLogger('blockly_runner').debug('display', context.display);
    const blocklyXmlCode = document.content.blockly;
    if (!blocklyHelper.workspace) {
        // Load without display
        blocklyHelper.load(language, false, 1, {});
    }
    log.getLogger('blockly_runner').debug('xml code', blocklyXmlCode);

    blocklyHelper.loadProgram({blockly: blocklyXmlCode, blocklyJS: "", blocklyPython: "", javascript: ""});

    return blocklyHelper.getCode(lang, null, true, true);
}

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.onInit(async function(stepperState: StepperState, state: AppStore, environment: string) {
            const answer = selectAnswer(state);
            if (hasBlockPlatform(answer.platform)) {
                const document = answer.document as BlockDocument;
                const context = quickAlgoLibraries.getContext(null, state.environment);

                const xmlCode = await getBlocklyCodeFromXml(document, 'javascript' as const, state);

                let fullCode = xmlCode
                    + "highlightBlock(undefined);\n"
                    + "program_end();"

                log.getLogger('blockly_runner').debug('full code', fullCode);

                const blocksData = getContextBlocksDataSelector({state, context});

                const blocklyInterpreter = Codecast.runner;
                blocklyInterpreter.initCodes([fullCode], blocksData);
            }
        });
    })
};
