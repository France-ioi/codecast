import {AppStore} from "../../store";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {App, Codecast} from "../../index";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_libraries";
import {selectAnswer} from "../../task/selectors";
import {getContextBlocksDataSelector} from "../../task/blocks/blocks";
import {TaskLevelName} from "../../task/platform/platform_slice";
import {delay} from "../api";
import {getMessage, getMessageChoices} from "../../lang";
import {put} from "typed-redux-saga";
import {QuickAlgoLibrary} from "../../task/libs/quickalgo_library";
import {LayoutType} from "../../task/layout/layout";
import {taskIncreaseContextId} from "../../task/task_slice";
import log from 'loglevel';
import {appSelect} from '../../hooks';
import {CodecastPlatform} from '../platforms';

let originalFireNow;
let originalSetBackgroundPathVertical_;

export function* loadBlocklyHelperSaga(context: QuickAlgoLibrary, currentLevel: TaskLevelName) {
    let blocklyHelper;

    if (context && context.blocklyHelper) {
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

    log.getLogger('blockly_runner').debug('[blockly.editor] load blockly helper', context);
    blocklyHelper = window.getBlocklyHelper(context.infos.maxInstructions, context);
    // Override this function to keep handling the display, and avoiding a call to un-highlight the current block
    // during loadPrograms at the start of the program execution
    blocklyHelper.onChangeResetDisplay = () => {
    };
    // Override this function to add x="0" y="0" so that cleanBlockAttributes works correctly by detecting x is not null
    blocklyHelper.getEmptyContent = function() {
        if (this.startingBlock) {
            if(this.scratchMode) {
                return '<xml><block type="robot_start" deletable="false" movable="false" x="10" y="20"></block></xml>';
            } else {
                return '<xml><block type="robot_start" deletable="false" movable="false" x="0" y="0"></block></xml>';
            }
        }
        else {
            return '<xml></xml>';
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

    context.blocklyHelper = blocklyHelper;
    context.onChange = () => {};

    if (!originalFireNow) {
        originalFireNow = window.Blockly.Events.fireNow_;
    }

    // There is a setTimeout delay in Blockly lib between blockly program loading and Blockly firing events.
    // We overload this function to catch the Blockly firing event instant so that we know when the program
    // is successfully reloaded and that the events won't trigger an editor content update which would trigger
    // a stepper.exit
    if ('main' === state.environment) {
        window.Blockly.Events.fireNow_ = () => {
            originalFireNow();
            blocklyHelper.reloading = false;
        };
    }

    log.getLogger('blockly_runner').debug('[blockly.editor] load context into blockly editor');
    blocklyHelper.loadContext(context);
    blocklyHelper.setIncludeBlocks(context.infos.includeBlocks);

    const groupsCategory = !!(context && context.infos && context.infos.includeBlocks && context.infos.includeBlocks.groupByCategory);
    if (groupsCategory && 'tralalere' === options.app) {
        overrideBlocklyFlyoutForCategories(isMobile);
    } else if (originalSetBackgroundPathVertical_) {
        window.Blockly.Flyout.prototype.setBackgroundPathVertical_ = originalSetBackgroundPathVertical_;
    }

    yield* put(taskIncreaseContextId());
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

export const checkBlocklyCode = function (answer, context: QuickAlgoLibrary, state: AppStore, disabledValidations: string[] = []) {
    log.getLogger('blockly_runner').debug('check blockly code', answer, context.strings.code);

    if (!answer || !answer.blockly) {
        return;
    }

    const blocks = getBlocksFromXml(answer.blockly);

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
        throw getMessage('CODE_CONSTRAINTS_EMPTY_PROGRAM');
    }
}

export const hasBlockPlatform = (platform: CodecastPlatform) => {
    return CodecastPlatform.Blockly === platform || CodecastPlatform.Scratch === platform;
};

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

export const getBlocklyBlocksUsage = function (answer, context: QuickAlgoLibrary) {
    if (!answer || !answer.blockly) {
        return {
            blocksCurrent: 0,
            limitations: [],
        };
    }

    log.getLogger('blockly_runner').debug('blocks usage', answer);

    const blocks = getBlocksFromXml(answer.blockly);
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

const getBlocksFromXml = function (xmlText) {
    const xml = window.Blockly.Xml.textToDom(xmlText)
    const tmpOptions = new window.Blockly.Options({});
    const tmpWorkspace = new window.Blockly.Workspace(tmpOptions);
    window.Blockly.Xml.domToWorkspace(xml, tmpWorkspace);

    return tmpWorkspace.getAllBlocks();
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

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.onInit(async function(stepperState: StepperState, state: AppStore, environment: string) {
            const {platform} = state.options;
            const answer = selectAnswer(state);
            const context = quickAlgoLibraries.getContext(null, environment);
            const language = state.options.language.split('-')[0];

            if (hasBlockPlatform(platform)) {
                log.getLogger('blockly_runner').debug('init stepper js', environment);
                context.onError = (diagnostics) => {
                    log.getLogger('blockly_runner').debug('context error', diagnostics);
                    // channel.put({
                    //     type: CompileActionTypes.StepperInterrupting,
                    // });
                    // channel.put(stepperExecutionError(diagnostics));
                };

                const blocksData = getContextBlocksDataSelector({state, context});

                const blocklyHelper = context.blocklyHelper;
                log.getLogger('blockly_runner').debug('blockly helper', blocklyHelper);
                log.getLogger('blockly_runner').debug('display', context.display);
                const blocklyXmlCode = answer.blockly;
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
                if ('main' === environment) {
                    await delay(0);
                }
                blocklyHelper.reloading = false;

                blocklyHelper.programs[0].blocklyJS = blocklyHelper.getCode("javascript", null, false, true);

                let fullCode = blocklyHelper.getBlocklyLibCode(blocklyHelper.generators)
                    + blocklyHelper.programs[0].blocklyJS
                    + "highlightBlock(undefined);\n"
                    + "program_end();"

                log.getLogger('blockly_runner').debug('full code', fullCode);

                const blocklyInterpreter = Codecast.runner;
                blocklyInterpreter.initCodes([fullCode], blocksData);
            }
        });
    })
};
