import {AppStore} from "../../store";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {selectAnswer} from "../../task/selectors";
import {getContextBlocksDataSelector} from "../../task/blocks/blocks";
import {delay} from "../api";
import {getMessage, getMessageChoices} from "../../lang";
import {put} from "typed-redux-saga";
import {QuickAlgoLibrary} from "../../task/libs/quickalgo_library";
import {taskIncreaseContextId} from "../../task/task_slice";
import log from 'loglevel';
import {appSelect} from '../../hooks';
import {hasBlockPlatform} from '../platforms';
import {App, Codecast} from '../../app_types';
import {quickAlgoLibraries} from '../../task/libs/quick_algo_libraries_model';
import {LayoutType} from '../../task/layout/layout_types';
import {Document, BlockDocument} from '../../buffers/buffer_types';

let originalFireNow;
let originalSetBackgroundPathVertical_;

export function* loadBlocklyHelperSaga(context: QuickAlgoLibrary) {
    if (!context) {
        return;
    }
    if (context && context.blocklyHelper && !context.blocklyHelper.fake) {
        context.blocklyHelper.unloadLevel();
    }

    log.getLogger('blockly_runner').debug('[stepper/js] load blockly helper', context.infos.includeBlocks, context.infos.includeBlocks.groupByCategory);
    const state = yield* appSelect();
    const options = state.options;
    const language = options.language.split('-')[0];
    const languageTranslations = require('../../lang/blockly_' + language + '.js');
    const isMobile = yield* appSelect(state => LayoutType.MobileVertical === state.layout.type || LayoutType.MobileHorizontal === state.layout.type);
    if (context.infos && context.infos.includeBlocks) {
        if (isMobile) {
            if (undefined === context.infos.includeBlocks.originalGroupByCategory) {
                context.infos.includeBlocks.originalGroupByCategory = !!context.infos.includeBlocks.groupByCategory;
            }
            context.infos.includeBlocks.groupByCategory = true;
        } else if (undefined !== context.infos.includeBlocks.originalGroupByCategory) {
            context.infos.includeBlocks.groupByCategory = !!context.infos.includeBlocks.originalGroupByCategory;
        }
    }
    log.getLogger('blockly_runner').debug('group by category', context.infos.includeBlocks.groupByCategory);

    window.goog.provide('Blockly.Msg.' + language);
    window.Blockly.Msg = {...window.Blockly.Msg, ...languageTranslations.Msg};

    window.Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
    window.Blockly.JavaScript.addReservedWords('highlightBlock');

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
            updateControlsDisplay: () => {},
            onResize: () => {},
            displayKeypad: function(initialValue, position, callbackModify, callbackFinished, options) {
                if (window.displayHelper) {
                    window.displayHelper.showKeypad(initialValue, position, callbackModify, callbackFinished, options);
                }
            },
        };
    }

    context.blocklyHelper = createBlocklyHelper(context);
    context.onChange = () => {};

    // There is a setTimeout delay in Blockly lib between blockly program loading and Blockly firing events.
    // We overload this function to catch the Blockly firing event instant so that we know when the program
    // is successfully reloaded and that the events won't trigger an editor content update which would trigger
    // a stepper.exit
    if ('main' === state.environment) {
        window.Blockly.Events.fireNow_ = () => {
            originalFireNow();
            context.blocklyHelper.reloading = false;
        };
    }

    const groupsCategory = !!(context && context.infos && context.infos.includeBlocks && context.infos.includeBlocks.groupByCategory);
    if (groupsCategory && 'tralalere' === options.app) {
        overrideBlocklyFlyoutForCategories(isMobile);
    } else if (originalSetBackgroundPathVertical_) {
        window.Blockly.Flyout.prototype.setBackgroundPathVertical_ = originalSetBackgroundPathVertical_;
    }

    yield* put(taskIncreaseContextId());
}

export function createBlocklyHelper(context: QuickAlgoLibrary) {
    const blocklyHelper = window.getBlocklyHelper(context.infos.maxInstructions, context);
    log.getLogger('blockly_runner').debug('[blockly.editor] load blockly helper', context, blocklyHelper);
    // Override this function to keep handling the display, and avoiding a call to un-highlight the current block
    // during loadPrograms at the start of the program execution
    blocklyHelper.onChangeResetDisplay = () => {
    };
    // Override this function to add x="0" y="0" so that cleanBlockAttributes works correctly by detecting x is not null
    blocklyHelper.getEmptyContent = function() {
        if (this.scratchMode) {
            return '<xml><block type="robot_start" deletable="false" movable="false" x="10" y="20"></block></xml>';
        } else {
            return '<xml><block type="robot_start" deletable="false" movable="false" x="0" y="0"></block></xml>';
        }
    };
    // Override this function to change parameters
    blocklyHelper.getOrigin = function() {
        // Get x/y origin
        if (this.includeBlocks.groupByCategory && typeof this.options.scrollbars != 'undefined' && !this.options.scrollbars) {
            return this.scratchMode ? {x: 340, y: 20} : {x: 105, y: 2};
        }
        return this.scratchMode ? {x: 20, y: 20} : {x: 20, y: 2};
    };

    if (context.infos.multithread) {
        // Make generation of all blocks
        blocklyHelper.startingBlock = false;
    }

    if (!originalFireNow) {
        originalFireNow = window.Blockly.Events.fireNow_;
    }

    log.getLogger('blockly_runner').debug('[blockly.editor] load context into blockly editor');
    blocklyHelper.loadContext(context);
    blocklyHelper.setIncludeBlocks(context.infos.includeBlocks);

    return blocklyHelper;
}

export const overrideBlocklyFlyoutForCategories = (isMobile: boolean) => {
    // Override function from Blockly for two reasons:
    // 1. Control width and height of Blockly flyout
    // 2. Add border radiuses at top-left and bottom-left
    if (!originalSetBackgroundPathVertical_) {
        originalSetBackgroundPathVertical_ = window.Blockly.Flyout.prototype.setBackgroundPathVertical_;
    }

    window.Blockly.Flyout.prototype.setBackgroundPathVertical_ = function(width, height) {
        const toolboxWidth = this.targetWorkspace_ && this.targetWorkspace_.toolbox_ ? this.targetWorkspace_.toolbox_.getWidth() : 0;
        let atRight = this.toolboxPosition_ == window.Blockly.TOOLBOX_AT_RIGHT;
        let computedHeight = isMobile ? window.innerHeight - 120 : Math.min(window.innerHeight - 90, Math.max(400, height));
        let computedWidth = isMobile ? window.innerWidth - toolboxWidth - 2*this.CORNER_RADIUS + 4 : Math.max(300, width);
        log.getLogger('blockly_runner').debug('background draw', {isMobile, toolboxWidth, width, computedWidth, windowWidth: window.innerWidth, workspace: this.targetWorkspace_});
        // Decide whether to start on the left or right.
        let path = ['M ' + (atRight ? this.width_ - this.CORNER_RADIUS : this.CORNER_RADIUS) + ',0'];
        // Top.
        path.push('h', String(computedWidth - this.CORNER_RADIUS));
        // Rounded corner top-right
        path.push('a', this.CORNER_RADIUS, this.CORNER_RADIUS, "0", "0",
            atRight ? "0" : "1",
            atRight ? -this.CORNER_RADIUS : this.CORNER_RADIUS,
            this.CORNER_RADIUS);
        // Side closest to workspace.
        path.push('v', String(Math.max(0, computedHeight - this.CORNER_RADIUS * 2)));
        // Rounded corner bottom-right
        path.push('a', this.CORNER_RADIUS, this.CORNER_RADIUS, "0", "0",
            atRight ? "0" : "1",
            atRight ? this.CORNER_RADIUS : -this.CORNER_RADIUS,
            this.CORNER_RADIUS);
        // Bottom.
        path.push('h', String(-(computedWidth - this.CORNER_RADIUS)));
        // Rounded corner bottom-left
        path.push('a', this.CORNER_RADIUS, this.CORNER_RADIUS, "0", "0",
            atRight ? "0" : "1",
            atRight ? this.CORNER_RADIUS : -this.CORNER_RADIUS,
            String(-this.CORNER_RADIUS));
        path.push('v', String(-Math.max(0, computedHeight - this.CORNER_RADIUS * 2)));
        // Rounded corner top-left
        path.push('a', this.CORNER_RADIUS, this.CORNER_RADIUS, "0", "0",
            atRight ? "0" : "1",
            atRight ? -this.CORNER_RADIUS : this.CORNER_RADIUS,
            String(-this.CORNER_RADIUS));
        path.push('z');
        this.svgBackground_.setAttribute('d', path.join(' '));
    };
};

export const checkBlocklyCode = function (answer: Document, context: QuickAlgoLibrary, state: AppStore, disabledValidations: string[] = []) {
    log.getLogger('blockly_runner').debug('check blockly code', answer, context.strings.code);

    const blockly = (answer as unknown as BlockDocument)?.content?.blockly;
    if (!blockly) {
        return;
    }

    let blocks;
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

const getBlockCount = function (block, context: QuickAlgoLibrary) {
    // How many "blocks" a specific block counts towards the total

    // Block counts extra
    if (context.blocklyHelper?.blockCounts && typeof context.blocklyHelper.blockCounts[block.type] == 'number') {
        return context.blocklyHelper.blockCounts[block.type];
    }

    if (block.type == 'robot_start') {
        // Program start block
        return 0;
    }

    if (context.blocklyHelper?.scratchMode) {
        // Don't count insertion markers (shadows when moving a block)
        if (block.isInsertionMarker_) {
            return 0;
        }
        // Don't count placeholders
        if (block.type.substring(0, 12) == 'placeholder_') {
            return 0;
        }
        // Counting is tricky because some blocks in Scratch don't count in Blockly
        if (block.parentBlock_) {
            // There's a parent (container) block
            if ((block.type == 'math_number' && block.parentBlock_.type == 'control_repeat') ||
                (block.type == 'data_variablemenu' &&
                    (block.parentBlock_.type == 'data_variable' ||
                        block.parentBlock_.type == 'data_setvariableto' ||
                        block.parentBlock_.type == 'data_changevariableby'))) {
                return 0;
            }
        } else {
            if (block.type == 'data_variablemenu') {
                return 0;
            }
        }
        if (block.type == 'data_itemoflist' || block.type == 'data_replaceitemoflist') {
            // Count one extra for these ones
            return 2;
        }
    }

    return 1;
}

export const getBlocklyBlocksUsage = function (answer: Document, context: QuickAlgoLibrary, state: AppStore) {
    // We cannot evaluate blocks as long as the answer has not been loaded into Blockly
    // Thus we wait that context.blocklyHelper.programs is filled (by BlocklyEditor)
    const blockly = (answer as unknown as BlockDocument)?.content?.blockly;
    if (!blockly || !context.blocklyHelper?.programs?.length) {
        return {
            blocksCurrent: 0,
            limitations: [],
        };
    }

    log.getLogger('blockly_runner').debug('blocks usage', answer);

    let blocks;
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

export function blocklyCount(blocks: any[], context: QuickAlgoLibrary): number {
    let blocksUsed = 0;
    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];
        // When a block is being moved in Scratch, the block is duplicated
        // We don't want to count this block twice, so we don't count the block that
        // has the same id as this insertion marker
        if (window.Blockly.insertionMarker_ && block.id === window.Blockly.insertionMarker_.id) {
            continue;
        }
        blocksUsed += getBlockCount(block, context);
    }

    return blocksUsed;
}

const getBlocksFromXml = function (state: AppStore, context: QuickAlgoLibrary, xmlText: string) {
    const xml = window.Blockly.Xml.textToDom(xmlText);

    const blocklyHelper = createBlocklyHelper(context);
    const language = state.options.language.split('-')[0];
    blocklyHelper.load(language, false, 1, {});

    if (!window.Blockly.mainWorkspace) {
        window.Blockly.mainWorkspace = blocklyHelper.workspace;
    }

    window.Blockly.Xml.domToWorkspace(xml, blocklyHelper.workspace);

    return blocklyHelper.workspace.getAllBlocks();
};

export const blocklyFindLimited = (blocks, limitedUses, context) => {
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

export async function getBlocklyCodeFromXml(document: BlockDocument, lang: string, state: AppStore) {
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
        blocklyHelper.load(language, context.display, 1, {});
    }
    if (0 === blocklyHelper.programs.length) {
        blocklyHelper.programs.push({});
    }
    blocklyHelper.programs[0].blockly = blocklyXmlCode;
    log.getLogger('blockly_runner').debug('xml code', blocklyXmlCode);

    blocklyHelper.reloading = true;
    blocklyHelper.loadPrograms();
    // Wait that program is loaded (Blockly fires some event including an onChange event
    if ('main' === state.environment) {
        await delay(0);
    }
    blocklyHelper.reloading = false;

    return blocklyHelper.getCode(lang, null, false, true);
}

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.onInit(async function(stepperState: StepperState, state: AppStore, environment: string) {
            const answer = selectAnswer(state);
            if (hasBlockPlatform(answer.platform)) {
                const document = answer.document as BlockDocument;
                const context = quickAlgoLibraries.getContext(null, state.environment);
                const blocklyHelper = context.blocklyHelper;

                blocklyHelper.programs[0].blocklyJS = await getBlocklyCodeFromXml(document, 'javascript', state);

                let fullCode = blocklyHelper.getBlocklyLibCode(blocklyHelper.generators)
                    + blocklyHelper.programs[0].blocklyJS
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
