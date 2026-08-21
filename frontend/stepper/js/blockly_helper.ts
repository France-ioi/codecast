// Code extracted from https://github.com/France-ioi/bebras-modules/blob/master/pemFioi/quickAlgo/blockly_interface.js

import {addExtraBlocks} from './extra_blocks';
import {Block, BlockType} from '../../task/blocks/block_types';
import {QuickAlgoLibrary} from '../../task/libs/quickalgo_library';
import * as Blockly from 'blockly/core';
import {BlocklyOptions} from 'blockly/core';
import {JavascriptGenerator, javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {PythonGenerator, pythonGenerator, Order as PythonOrder} from 'blockly/python';
import {registerFieldAngle} from '@blockly/field-angle';
import {registerFieldColour, installAllBlocks as installColourBlocks} from '@blockly/field-colour';
import {
    ContinuousToolbox,
    ContinuousFlyout,
    ContinuousMetrics,
    ContinuousCategory,
    RecyclableBlockFlyoutInflater,
} from '@blockly/continuous-toolbox';
import {BlocklyColours, HexColor} from './blockly_types';
import {addTableBlocks} from './blocks/tables';
import {addMathBlocks} from './blocks/math';
import {addTextBlocks} from './blocks/text';
import {addDictBlocks} from './blocks/dicts';
import {addListBlocks, setMaxListSize} from './blocks/lists';
import {addInputBlocks} from './blocks/inputs';
import {addLogicBlocks} from './blocks/logic';
import {addLoopBlocks} from './blocks/loops';
import {addProcedureBlocks} from './blocks/procedures';
import {getToolboxXml as buildToolboxXml, registerProceduresFlyout, registerVariablesFlyout} from './blockly_toolbox';
import {registerFieldNumberKeypad} from './fields/field_number';
import {MaxWidthContinuousFlyout, MaxWidthVerticalFlyout} from './blockly_flyout';

registerFieldAngle();
registerFieldColour();
registerFieldNumberKeypad();

installColourBlocks({
    javascript: javascriptGenerator,
    python: pythonGenerator,
});

// Force thickness to always be 15
const scrollbarThickness = 15;
Blockly.Scrollbar.scrollbarThickness = scrollbarThickness;

// `registerContinuousToolbox()` globally overrides two Blockly defaults (the
// toolbox category and the "block" flyout inflater) in addition to registering
// the named ContinuousToolbox/Flyout/Metrics entries. Capture Blockly's defaults
// now, before the plugin can override them, so we can restore them when switching
// back to a non-Scratch (regular Blockly) workspace.
const continuousRegType = Blockly.registry.Type;
const continuousCategoryName = Blockly.ToolboxCategory.registrationName;
const defaultToolboxCategory = Blockly.registry.getClass(continuousRegType.TOOLBOX_ITEM, continuousCategoryName);
const defaultBlockFlyoutInflater = Blockly.registry.getClass(continuousRegType.FLYOUT_INFLATER, 'block');

let continuousToolboxRegistered = false;

function enableContinuousToolbox() {
    if (!continuousToolboxRegistered) {
        continuousToolboxRegistered = true;

        Blockly.registry.register(
            Blockly.registry.Type.METRICS_MANAGER,
            'ContinuousMetrics',
            ContinuousMetrics,
            true,
        );

        Blockly.registry.register(
            Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
            'ContinuousFlyout',
            ContinuousFlyout,
            true,
        );

        Blockly.registry.register(
            Blockly.registry.Type.TOOLBOX,
            'ContinuousToolbox',
            ContinuousToolbox,
            true,
        );
    }

    Blockly.registry.register(continuousRegType.TOOLBOX_ITEM, continuousCategoryName, ContinuousCategory, true);
    Blockly.registry.register(continuousRegType.FLYOUT_INFLATER, 'block', RecyclableBlockFlyoutInflater, true);
}

// The whole contents of the continuous flyout, all categories at once. Only the
// plugin typings make it private: it is a plain method of the toolbox, and the
// public way in (`refreshSelection`) is debounced, so it wouldn't be immediate.
function getInitialFlyoutContents(toolbox: ContinuousToolbox) {
    return (toolbox as unknown as {
        getInitialFlyoutContents: () => Blockly.utils.toolbox.FlyoutItemInfoArray,
    }).getInitialFlyoutContents();
}

// Restore the global defaults the plugin clobbered, so a regular Blockly toolbox
// renders normally again. Must run before re-injecting the workspace.
function disableContinuousToolbox() {
    Blockly.registry.register(continuousRegType.TOOLBOX_ITEM, continuousCategoryName, defaultToolboxCategory, true);
    Blockly.registry.register(continuousRegType.FLYOUT_INFLATER, 'block', defaultBlockFlyoutInflater, true);
}

// Override it so addNextBlocks always defaults to true,
// regardless of whether the caller (duplicate, copy, etc.) asked for it
// so that when the user copies block, it copies the block and the next blocks
const originalToCopyData = Blockly.BlockSvg.prototype.toCopyData;
Blockly.BlockSvg.prototype.toCopyData = function() {
    return originalToCopyData.call(this, true);
};

const codeGenerators: Record<string, JavascriptGenerator | PythonGenerator> = {
    javascript: javascriptGenerator,
    python: pythonGenerator,
};

function getCodeGeneratorForLanguage(language: string) {
    if (!(language in codeGenerators)) {
        throw new Error(`There does not exist a generator for this language: ${language}.`);
    }

    return codeGenerators[language];
}

const transcribedBlocks = {
    'lists_create_with_empty': ['lists_create_empty'],
};

// Allowed blocks that make another block allowed as well
const blocklyAllowedSiblings = {
    'controls_repeat_ext_noShadow': ['controls_repeat_ext'],
    'controls_whileUntil': ['controls_untilWhile'],
    'controls_untilWhile': ['controls_whileUntil'],
    'controls_if_else': ['controls_if'],
    'lists_create_with_empty': ['lists_create_with']
};

let blocklyClipboardSaved;
let blocklyUserScale;

const blocklyCategoriesColors: Record<string, number|HexColor> = {
    actuator: 212,
    sensors: 95,
    internet: 200,
    display: 300,
    input: 50,
    inputs: 50,
    lists: 353,
    logic: 298,
    math: 176,
    loops: 200,
    texts: 312,
    dicts: 52,
    tables: 212,
    variables: 330,
    functions: 290,
    _default: 65,
};

const scratchCategoriesColors: Record<string, number|HexColor> = {
    actions: '#4C97FF',
    sensors: '#5CB1D6',
    control: '#FFAB19',
    lists: '#ff8c1a',
    operator: '#59C059',
    event: '#ffbf00',
    tables: '#ff8c1a',
    variables: '#ff8c1a',
    functions: '#ff6680',
}

// Records, while `blocksToCommentedCode` runs, which block generated which piece
// of Python code. `sortedBlocksList` is a flat log of the traversal: [id, 1] when
// entering a block, [id, -1] when leaving it. Null when we're not tracking.
let sortedBlocksList: [string, number][] = null;
let codeOfBlock: {[blockId: string]: string} = {};

// Block generators we already wrapped, so we never wrap one twice.
type BlockCodeGenerator = PythonGenerator['forBlock'][string];
const trackedBlockGenerators = new WeakSet<BlockCodeGenerator>();

let pythonGeneratorAdapted = false;

/**
 * Makes the Python generator record the code each block produces, so that
 * `blocksToCommentedCode` can map the generated lines back to their blocks.
 */
export function adaptPythonGenerator() {
    if (pythonGeneratorAdapted) {
        return;
    }
    pythonGeneratorAdapted = true;

    const blockToCodeUnaltered = pythonGenerator.blockToCode.bind(pythonGenerator);

    pythonGenerator.blockToCode = function(block: Blockly.Block, opt_thisOnly?: boolean) {
        // Wrap the generator the first time we meet a block of this type: block
        // generators are registered progressively (library blocks, simple
        // generators, …), so we can't wrap them all upfront.
        if (block) {
            const func = pythonGenerator.forBlock[block.type];
            if ('function' === typeof func && !trackedBlockGenerators.has(func)) {
                const trackedFunc = function(this: Blockly.Block, currentBlock: Blockly.Block, generator: PythonGenerator) {
                    if (!currentBlock || null === sortedBlocksList) {
                        return func.call(this, currentBlock, generator);
                    }

                    sortedBlocksList.push([currentBlock.id, 1]);
                    const code = func.call(this, currentBlock, generator);
                    if ('string' === typeof code) {
                        codeOfBlock[currentBlock.id] = code;
                    } else if (code) {
                        // Value blocks return a [code, order] tuple.
                        codeOfBlock[currentBlock.id] = String(code[0]);
                    } else {
                        codeOfBlock[currentBlock.id] = '';
                    }
                    sortedBlocksList.push([currentBlock.id, -1]);

                    return code;
                };

                trackedBlockGenerators.add(trackedFunc);
                pythonGenerator.forBlock[block.type] = trackedFunc;
            }
        }

        return blockToCodeUnaltered(block, opt_thisOnly);
    };
}

export interface BlocklyProgram {
    blockly: string;
    blocklyJS: string;
    blocklyPython: string;
    javascript: string;
}

export class BlocklyHelper {
    private subTask: any;
    public scratchMode: boolean;
    private maxBlocks: number;
    private language: string;
    public languages: string[];
    private definitions: Partial<Record<'javascript'|'python', {label: string, code: string}[]>>;
    private simpleGenerators: {[generatorName: string]: {label: string, code: string, category: string, type: number, nbParams: number}[]};
    private codeId: number;
    public workspace: Blockly.WorkspaceSvg;
    private options: any;
    private initialScale: number;
    private divId: string;
    public startingBlock: boolean;
    private startingExampleIds: any[];
    private mediaUrl: string;
    private unloaded: boolean;
    private display: boolean;
    private readOnly: boolean;
    private reportValues: boolean;
    private quickAlgoInterface: any;
    private highlightedBlocks: any[];
    private includeBlocks: any;
    private availableBlocks: Block[];
    private mainContext: QuickAlgoLibrary;
    private placeholderBlocks: boolean;
    private strings: any;
    public groupByCategory: boolean;
    private allBlocksAllowed: any;
    public limitedPointers: any;
    public blockCounts: any;
    private prevWidth: number;
    private availableBlocksInfo: Record<string, Record<string, Record<string, Block>>> = {};
    public fake: boolean;

    constructor(maxBlocks: number, subTask: QuickAlgoLibrary, scratchMode: boolean) {
        this.subTask = subTask;
        this.scratchMode = scratchMode;
        this.maxBlocks = maxBlocks;
        this.language = (typeof Blockly.Blocks['control_if'] !== 'undefined') ? 'scratch' : 'blockly';
        this.languages = [];
        this.definitions = {};
        this.simpleGenerators = {};
        this.codeId = 0; // Currently edited node code
        this.workspace = null;
        this.options = {};
        this.initialScale = 1;
        this.divId = 'blocklyDiv';
        this.startingBlock = true;
        this.startingExampleIds = [];
        this.mediaUrl = (
            (window.location.protocol == 'file:' && window.modulesPath)
                ? window.modulesPath + '/img/blockly/'
                : (window.location.protocol == 'https:' ? 'https:' : 'http:') + "//static4.castor-informatique.fr/contestAssets/blockly/"
        );
        this.unloaded = false;
        this.display = false;
        this.readOnly = false;
        this.reportValues = true;
        this.quickAlgoInterface = window.quickAlgoInterface;

        this.highlightedBlocks = [];

        this.includeBlocks = {
            generatedBlocks: {},
            standardBlocks: {
                includeAll: true,
                wholeCategories: [],
                singleBlocks: []
            }
        };

        this.groupByCategory = true;

        this.allBlocksAllowed = [];
        this.blockCounts = {};
    }

    loadContext(mainContext) {
        this.mainContext = mainContext;
        // this.createGeneratorsAndBlocks();
    }

    load(locale, display, nbTestCases, options) {
        this.unloaded = false;

        this.includeBlocks.standardBlocks.singleBlocks = this.transcribeBlocks(this.includeBlocks.standardBlocks.singleBlocks || []);

        if (options == undefined) options = {};
        if (options.divId) this.divId = options.divId;

        this.strings = window.languageStrings;
        if (options.startingBlockName) {
            this.strings.startingBlockName = options.startingBlockName;
        }

        setMaxListSize(options.maxListSize);
        this.placeholderBlocks = options.placeholderBlocks;

        this.options = options;

        const defaultColors = this.getDefaultColours();
        addExtraBlocks(this.strings, defaultColors, !this.mainContext.infos || !this.mainContext.infos.showIfMutator, this.scratchMode);
        addInputBlocks(defaultColors);
        addTableBlocks(defaultColors);
        addMathBlocks(defaultColors);
        addTextBlocks(defaultColors);
        addDictBlocks(defaultColors);
        addListBlocks(defaultColors);
        addLogicBlocks(defaultColors);
        addLoopBlocks();
        addProcedureBlocks(defaultColors);
        this.createSimpleGeneratorsAndBlocks();

        this.display = display;

        if (display) {
            // this.loadHtml(nbTestCases);
            const xmlString = this.getToolboxXml();

            const themeCategoryStyles = {};
            const colours = defaultColors;
            const categoryToBlocklyMapping = {variables: 'variable', loops: 'loop', texts: 'text', functions: 'procedure'};
            for (let category in colours.categories) {
                themeCategoryStyles[category + '_blocks'] = {
                    colourPrimary: colours.categories[category],
                };
                if (categoryToBlocklyMapping[category]) {
                    themeCategoryStyles[categoryToBlocklyMapping[category] + '_blocks'] = {
                        colourPrimary: colours.categories[category],
                    };
                }
            }

            console.log({themeCategoryStyles, scratch: this.scratchMode})

            // The continuous toolbox is a Scratch-only feature. Toggle the global
            // registry overrides before injecting so a regular Blockly workspace
            // gets the normal toolbox/flyout back when switching out of Scratch.
            if (this.scratchMode) {
                enableContinuousToolbox();
            } else {
                disableContinuousToolbox();
            }

            let wsConfig: BlocklyOptions = {
                toolbox: "<xml>" + xmlString + "</xml>",
                // Both flyouts are ours only to keep them within a maximum width and to
                // tighten the gap between blocks; see blockly_flyout.ts.
                plugins: this.scratchMode && this.groupByCategory ? {
                    toolbox: ContinuousToolbox,
                    flyoutsVerticalToolbox: MaxWidthContinuousFlyout,
                    metricsManager: ContinuousMetrics,
                } : {
                    flyoutsVerticalToolbox: MaxWidthVerticalFlyout,
                },
                comments: true,
                sounds: false,
                trashcan: true,
                media: this.mediaUrl,
                scrollbars: true,
                zoom: {startScale: 1},
                renderer: this.scratchMode ? 'zelos' : 'thrasos',
                theme: Blockly.Theme.defineTheme('custom_theme', {
                    name: 'custom_theme',
                    base: Blockly.Themes.Classic,
                    blockStyles: themeCategoryStyles,
                    fontStyle: {
                        weight: this.scratchMode ? 'normal' : undefined,
                    },
                }),
            };

            if (typeof options.scrollbars != 'undefined') {
                wsConfig.scrollbars = !!options.scrollbars;
            }
            // IE <= 10 needs scrollbars
            if (navigator.userAgent.indexOf("MSIE") > -1) {
                wsConfig.scrollbars = true;
            }

            wsConfig.readOnly = !!options.readOnly || this.readOnly;
            if (options.zoom) {
                wsConfig.zoom.controls = !!options.zoom.controls;
                wsConfig.zoom.wheel = !!options.zoom.wheel;
                wsConfig.zoom.startScale = options.zoom.scale ? options.zoom.scale : 1;
            }
            if (this.scratchMode) {
                wsConfig.zoom.startScale = wsConfig.zoom.startScale * 0.75;
            }
            this.initialScale = wsConfig.zoom.startScale;
            if (wsConfig.zoom.controls && blocklyUserScale) {
                wsConfig.zoom.startScale *= blocklyUserScale;
            }
            if (options.disable !== undefined) {
                wsConfig.disable = options.disable;
            }

            // Inject Blockly
            this.workspace = Blockly.inject(this.divId, wsConfig);

            // Replaces Blockly's own VARIABLE and PROCEDURE categories, and the
            // "create variable" button, with ours. Must happen before the
            // toolbox is opened.
            registerVariablesFlyout(this.workspace);
            registerProceduresFlyout(this.workspace);

            // The continuous toolbox (Scratch mode) doesn't open a category at a
            // time: it builds the contents of all of them at once, as soon as it
            // is initialized, which `Blockly.inject` just did — with Blockly's
            // own category callbacks, since ours weren't registered yet. Build
            // them again so that they use ours. A regular toolbox builds a
            // category when it is opened, so it has nothing to rebuild here.
            const toolbox = this.workspace.getToolbox();
            if (toolbox instanceof ContinuousToolbox) {
                toolbox.getFlyout().show(getInitialFlyoutContents(toolbox));
            }

            let toolboxNode = window.jQuery('#toolboxXml');
            if (toolboxNode.length != 0) {
                toolboxNode.html(xmlString);
            }

            // Restore clipboard if allowed
            if (blocklyClipboardSaved) {
                if (this.checkBlocksAreAllowed(blocklyClipboardSaved, false)) {
                    Blockly.clipboard.setLastCopiedData(blocklyClipboardSaved);
                } else {
                    Blockly.clipboard.setLastCopiedData(null);
                }
                Blockly.clipboard.setLastCopiedWorkspace(this.workspace);
            }

            window.jQuery(".blocklyToolboxDiv").css("background-color", "rgba(168, 168, 168, 0.5)");
            this.workspace.addChangeListener(this.onChange.bind(this));
            this.onChange();
        } else {
            let tmpOptions = new Blockly.Options({});
            this.workspace = new Blockly.Workspace(tmpOptions) as Blockly.WorkspaceSvg;
        }

        this.languages = [];
        for (let iCode = this.mainContext.nbCodes - 1; iCode >= 0; iCode--) {
            this.languages[iCode] = "blockly";
            this.setCodeId(iCode);
        }
    }

    unloadLevel() {
        this.unloaded = true; // Prevents from saving programs after unload

        try {
            // Need to hide the WidgetDiv before disposing of the workspace
            Blockly.WidgetDiv.hide();
        } catch (e) {
        }

        // Save clipboard
        if (this.display && Blockly.clipboard.getLastCopiedData()) {
            blocklyClipboardSaved = Blockly.clipboard.getLastCopiedData();
        }

        let ws = this.workspace;
        if (ws != null) {
            Blockly.Events.disable();
            try {
                ws.dispose();
            } catch (e) {
            } finally {
                Blockly.Events.enable();
            }
        }
    }

    onChange(event: Blockly.Events.Abstract = null) {
        const isBlockEvent = null === event ? true : [
            Blockly.Events.BLOCK_DRAG,
            Blockly.Events.BLOCK_MOVE,
            Blockly.Events.BLOCK_CREATE,
            Blockly.Events.BLOCK_CHANGE,
        ].includes(event?.type as any);

        if (isBlockEvent) {
            if (this.subTask) {
                this.subTask.onChange();
            }
            if (this.mainContext.onChange) {
                this.mainContext.onChange();
            }
        }
    }

    setIncludeBlocks(includeBlocks) {
        this.includeBlocks = JSON.parse(JSON.stringify(includeBlocks));
    }

    addDefinitions(definitions: Record<'javascript'|'python', {label: string, code: string}[]>) {
        for (let language in definitions) {
            this.definitions[language] = definitions[language];
        }
    }

    addSimpleGenerators(generators: {[generatorName: string]: {label: string, code: string, category: string, type: number, nbParams: number}[]}) {
        this.simpleGenerators = generators;
    }

    setAvailableBlocks(availableBlocks: Block[]) {
        this.availableBlocks = availableBlocks;
        this.createGeneratorsAndBlocksForAvailableBlocks();
    }

    getEmptyContent() {
        return '<xml><block type="robot_start" deletable="false" movable="false" x="0" y="0"></block></xml>';
    }

    getDefaultContent() {
        let xml = this.options.startingExample && this.options.startingExample[this.language];
        if (xml) {
            this.getStartingExampleIds(xml);
            return xml;
        }
        return this.getEmptyContent();
    }

    checkRobotStart() {
        if (!this.startingBlock || !this.workspace) {
            return;
        }
        let blocks = this.workspace.getTopBlocks(true);
        for (let b = 0; b < blocks.length; b++) {
            if (blocks[b].type == 'robot_start') {
                return;
            }
        }

        let xml = Blockly.utils.xml.textToDom(this.getEmptyContent())
        Blockly.Xml.domToWorkspace(xml, this.workspace);
    }

    getOrigin() {
        // Get x/y origin
        if (this.groupByCategory && typeof this.options.scrollbars != 'undefined' && !this.options.scrollbars) {
            return {x: 105, y: 10};
        }
        return {x: 20, y: 10};
    }

    setCodeId(newCodeId: number) {
        this.codeId = newCodeId;
    }

    // Build and return the program corresponding to the current workspace.
    saveProgram(): BlocklyProgram {
        if (this.unloaded) {
            console.error('saveProgram called after unload');
            return null;
        }

        // Save zoom
        if (this.display && this.workspace.scale) {
            blocklyUserScale = this.workspace.scale / this.initialScale;
        }

        this.checkRobotStart();

        const program: BlocklyProgram = {
            blockly: null,
            blocklyJS: "",
            blocklyPython: "",
            javascript: window.jQuery("#program").val() as string,
        };

        if (this.workspace != null) {
            let xml = Blockly.Xml.workspaceToDom(this.workspace);

            this.cleanBlockAttributes(xml);

            // The additional variable contain all additional things that we can save, for example quickpi sensors,
            // subject title when edition is enabled...
            let additional = {};

            if (this.quickAlgoInterface && this.quickAlgoInterface.saveAdditional)
                this.quickAlgoInterface.saveAdditional(additional);

            let additionalNode = document.createElement("additional");
            additionalNode.innerText = JSON.stringify(additional);
            xml.appendChild(additionalNode);

            program.blockly = Blockly.Xml.domToText(xml);
            program.blocklyJS = this.getCode("javascript");
            program.blocklyPython = this.getCode("python");
        }

        return program;
    }

    // Load the given program into the current workspace.
    loadProgram(program: BlocklyProgram) {
        if (this.workspace !== null) {
            let xml = Blockly.utils.xml.textToDom(program.blockly);

            // No undo after reload: disable all events and clear workspace while reloading
            Blockly.Events.disable();
            this.workspace.clear();
            this.cleanBlockAttributes(xml, this.getOrigin());

            try {
                Blockly.Xml.domToWorkspace(xml, this.workspace);
            } finally {
                // Wait that blocks are loaded (Blockyl fires events with setTimeout...)
                setTimeout(() => {
                    Blockly.Events.enable();
                }, 0);
            }

            let additionalXML = xml.getElementsByTagName("additional");
            if (additionalXML.length > 0) {
                try {
                    let additional = JSON.parse(additionalXML[0].innerHTML);
                    // load additional from quickAlgoInterface
                    if (this.quickAlgoInterface.loadAdditional) {
                        this.quickAlgoInterface.loadAdditional(additional);
                    }
                } catch (e) {
                }
            }
        }
        window.jQuery("#program").val(program.javascript);
    }

    // Used by some Quickalgo libraries
    updateSize(force) {
        let panelWidth = 500;
        if (this.languages[this.codeId] == "blockly") {
            panelWidth = window.jQuery("#blocklyDiv").width() - 10;
        } else {
            panelWidth = window.jQuery("#program").width() + 20;
        }
        if (force || panelWidth != this.prevWidth) {
            if (this.languages[this.codeId] == "blockly") {
                Blockly.svgResize(this.workspace);
            }
        }
        this.prevWidth = panelWidth;
    }

    addBlocksAllowed(blocks) {
        for (let i = 0; i < blocks.length; i++) {
            let name = blocks[i];
            if (window.arrayContains(this.allBlocksAllowed, name)) {
                continue;
            }
            this.allBlocksAllowed.push(name);
            if (blocklyAllowedSiblings[name]) {
                this.addBlocksAllowed(blocklyAllowedSiblings[name]);
            }
        }
    }

    getBlocksAllowed() {
        return this.transcribeBlocks(this.allBlocksAllowed);
    }

    checkConstraints(workspace) {
        // Check we satisfy constraints
        return this.getRemainingCapacity(workspace) >= 0 && !this.findLimited(workspace);
    }

    normalizeType(type) {
        // Clean up type
        let res = type;
        if (res.substr(res.length - 9) == '_noShadow') {
            res = res.substr(0, res.length - 9);
        }
        return res;
    }

    makeLimitedUsesPointers() {
        // Make the list of pointers for each block to the limitedUses it
        // appears in
        if (this.limitedPointers && this.limitedPointers.limitedUses === this.mainContext.infos.limitedUses) {
            return;
        }
        this.limitedPointers = {
            // Keep in memory the limitedUses these limitedPointers were made for
            limitedUses: this.mainContext.infos.limitedUses
        };
        for (let i = 0; i < this.mainContext.infos.limitedUses.length; i++) {
            let curLimit = this.mainContext.infos.limitedUses[i];
            let blocks = curLimit.blocks;

            for (let j = 0; j < blocks.length; j++) {
                let block = blocks[j];
                if (!this.limitedPointers[block]) {
                    this.limitedPointers[block] = [];
                }
                this.limitedPointers[block].push(i);
            }
        }
    }

    findLimited(workspace) {
        // Check we don't use blocks with limited uses too much
        // Returns false if there's none, else the name of the first block
        // found which is over the limit
        if (!this.mainContext.infos || !this.mainContext.infos.limitedUses) {
            return false;
        }
        this.makeLimitedUsesPointers();

        let workspaceBlocks = workspace.getAllBlocks();
        let usesCount = {};

        for (let i = 0; i < workspaceBlocks.length; i++) {
            let blockType = workspaceBlocks[i].type;
            blockType = this.normalizeType(blockType);
            if (!this.limitedPointers[blockType]) {
                continue;
            }
            for (let j = 0; j < this.limitedPointers[blockType].length; j++) {
                // Each pointer is a position in the limitedUses array that
                // this block appears in
                let pointer = this.limitedPointers[blockType][j];
                if (!usesCount[pointer]) {
                    usesCount[pointer] = 0;
                }
                usesCount[pointer]++;

                // Exceeded the number of uses
                let limits = this.mainContext.infos.limitedUses[pointer];
                if (usesCount[pointer] > limits.nbUses) {
                    return limits.blocks;
                }
            }
        }

        // All blocks are under the use limit
        return false;
    }

    getRemainingCapacity(workspace: Blockly.WorkspaceSvg) {
        // Get the number of blocks allowed
        if (!this.maxBlocks) {
            return Infinity;
        }

        let allBlocks = workspace.getAllBlocks();
        let usedBlocks = allBlocks.filter(block => !block.type.startsWith('placeholder_'));
        let remaining = this.maxBlocks + 1 - usedBlocks.length;

        for (let i = 0; i < allBlocks.length; i++) {
            let block = allBlocks[i];
            if (typeof this.blockCounts[block.type] != 'undefined') {
                remaining -= this.blockCounts[block.type] - 1;
            }
        }
        return remaining;
    }

    isEmpty(workspace: Blockly.WorkspaceSvg) {
        // Check if workspace is empty
        if (!workspace) {
            workspace = this.workspace;
        }
        let blocks = workspace.getAllBlocks();
        if (blocks.length == 1) {
            return blocks[0].type == 'robot_start';
        } else {
            return blocks.length == 0;
        }
    }

    getCode(language: 'javascript'|'python', codeWorkspace: Blockly.Workspace = undefined, noReportValue: boolean = false, noConstraintCheck: boolean = false) {
        if (codeWorkspace == undefined) {
            codeWorkspace = this.workspace;
        }
        if (!this.checkConstraints(codeWorkspace) && !noConstraintCheck) {
            // Safeguard: avoid generating code when we use too many blocks
            return 'throw "' + this.strings.tooManyBlocks + '";';
        }

        const codeGenerator = getCodeGeneratorForLanguage(language);

        let blocks = codeWorkspace.getTopBlocks(true);
        codeGenerator.init(codeWorkspace);

        let oldReportValues = this.reportValues;
        if (noReportValue) {
            this.reportValues = false;
        }
        // The loop generators are module-level, so they can't read the flag off us.
        // setReportLoopIterations(this.reportValues);

        // Put other blocks than robot_start first so that they execute before the main loop
        let blockPriority = function (a) {
            return a.type === 'robot_start' ? -1 : 1;
        };
        blocks.sort(function (a, b) {
            return blockPriority(b) - blockPriority(a);
        });

        let code = [];
        let comments = [];
        for (let b = 0; b < blocks.length; b++) {
            let block = blocks[b];
            let blockCode = codeGenerator.blockToCode(block);
            if (window.arrayContains(["procedures_defnoreturn", "procedures_defreturn"], block.type)) {
                // For function blocks, the code is stored in languageObj.definitions_
            } else {
                if (block.type == "robot_start" || !this.startingBlock) {
                    comments.push(blockCode);
                }
            }
        }

        // @ts-ignore
        for (let def in codeGenerator.definitions_) {
            // @ts-ignore
            code.push(codeGenerator.definitions_[def]);
        }

        let codeString = code.join("\n");
        codeString += "\n";
        codeString += comments.join("\n");

        this.reportValues = oldReportValues;
        // setReportLoopIterations(this.reportValues);

        return codeString;
    }

    completeBlockHandler(block: Block, objectName: string, context: QuickAlgoLibrary): void {
        if (typeof block.handler == "undefined") {
            block.handler = context[objectName][block.name];
        }

        if (typeof block.handler == "undefined") {
            block.handler = (function (oName, bName) {
                return function () {
                    console.error("Error: No handler given. No function context." + oName + "." + bName + "() found!");
                }
            })(objectName, block.name);
        }
    }

    completeBlockJson(block: Block, objectName: string, categoryName: string, context: QuickAlgoLibrary): void {
        // Needs context object solely for the language strings. Maybe change that …

        if (typeof block.blocklyJson == "undefined") {
            block.blocklyJson = {};
        }

        // Set block name
        if (typeof block.blocklyJson.type == "undefined") {
            block.blocklyJson.type = block.name;
        }

        // Add connectors (top-bottom or left)
        if (typeof block.blocklyJson.output == "undefined" &&
            typeof block.blocklyJson.previousStatement == "undefined" &&
            typeof block.blocklyJson.nextStatement == "undefined" &&
            !(block.noConnectors)) {

            if (block.yieldsValue) {
                block.blocklyJson.output = null;
                if (this.scratchMode) {
                    if ('bool' === block.yieldsValue) {
                        block.blocklyJson.output = 'Boolean';
                    }

                    if (typeof block.blocklyJson.colour == "undefined") {
                        block.blocklyJson.colour = scratchCategoriesColors['sensors'];
                    }
                }
            } else {
                block.blocklyJson.previousStatement = null;
                block.blocklyJson.nextStatement = null;

                if (this.scratchMode && typeof block.blocklyJson.colour == "undefined") {
                    block.blocklyJson.colour = scratchCategoriesColors['actions'];
                }
            }
        }

        // Add parameters
        if (typeof block.blocklyJson.args0 == "undefined" &&
            typeof block.params != "undefined" &&
            block.params.length > 0) {
            block.blocklyJson.args0 = [];
            for (let iParam = 0; iParam < block.params.length; iParam++) {
                let param: any = {
                    type: "input_value",
                    name: "PARAM_" + iParam
                }

                if (block.params[iParam] != null) {
                    param.check = block.params[iParam]; // Should be a string!
                }
                block.blocklyJson.args0.push(param);
            }
        }

        // Add message string
        if (typeof block.blocklyJson.message0 == "undefined") {
            block.blocklyJson.message0 = context.strings.label[objectName + '.' + block.name] ? context.strings.label[objectName + '.' + block.name] : context.strings.label[block.name];
            // TODO: Load default colours + custom styles
            if (typeof block.blocklyJson.message0 == "undefined") {
                block.blocklyJson.message0 = "<translation missing: " + block.name + ">";
            }

            // append all missing params to the message string
            if (typeof block.blocklyJson.args0 != "undefined") {
                let alreadyInserted = (block.blocklyJson.message0.match(/%/g) || []).length;
                for (let iArgs0 = alreadyInserted; iArgs0 < block.blocklyJson.args0.length; iArgs0++) {
                    if (block.blocklyJson.args0[iArgs0].type == "input_value"
                        || block.blocklyJson.args0[iArgs0].type == "field_number"
                        || block.blocklyJson.args0[iArgs0].type == "field_angle"
                        || block.blocklyJson.args0[iArgs0].type == "field_colour"
                        || block.blocklyJson.args0[iArgs0].type == "field_dropdown"
                        || block.blocklyJson.args0[iArgs0].type == "field_input") {
                        block.blocklyJson.message0 += " %" + (iArgs0 + 1);
                    }
                }
            }
        }

        // Tooltip & HelpUrl should always exist, so lets just add empty ones in case they don't exist
        if (typeof block.blocklyJson.tooltip == "undefined") {
            block.blocklyJson.tooltip = "";
        }
        if (typeof block.blocklyJson.helpUrl == "undefined") {
            block.blocklyJson.helpUrl = "";
        }

        if (typeof block.blocklyJson.colour == "undefined") {
            let colours = this.getDefaultColours();
            block.blocklyJson.colour = 210; // default: blue
            if ("blocks" in colours && block.name in colours.blocks) {
                block.blocklyJson.colour = colours.blocks[block.name];
            } else if ("categories" in colours) {
                if (categoryName in colours.categories) {
                    block.blocklyJson.colour = colours.categories[categoryName];
                } else if ("_default" in colours.categories) {
                    block.blocklyJson.colour = colours.categories["_default"];
                }
            }
        }
    }

    completeBlockXml(block: Block) {
        if (typeof block.blocklyXml == "undefined" || block.blocklyXml == "") {
            block.blocklyXml = "<block type='" + block.name + "'></block>";
        }
        if (!block.name.includes('_noShadow')) {
            block.blocklyXml = block.blocklyXml.replace(/<block type='([\w_\-]+)_noShadow'>/g, (match, blockType) => {
                return `<block type='${blockType}'>`;
            });
        }
    }

    completeCodeGenerators(blockInfo: Block) {
        if (typeof blockInfo.codeGenerators == "undefined") {
            blockInfo.codeGenerators = {};
        } else {
            // Convert codeGenerators["Python"] to codeGenerators["python"]
            for (let [key, value] of Object.entries(blockInfo.codeGenerators)) {
                delete blockInfo.codeGenerators[key];
                blockInfo.codeGenerators[key.toLocaleLowerCase()] = value;
            }
        }

        let that = this;

        // for closure:
        let args0 = blockInfo.blocklyJson.args0;
        let code = this.mainContext.strings.code[blockInfo.name];
        if (!code) {
            code = blockInfo.name;
        }

        let output = blockInfo.blocklyJson.output;
        let blockParams = blockInfo.params;

        for (let [language, codeGenerator] of Object.entries(codeGenerators)) {
            // Prevent the function name to be used as a variable
            codeGenerator.addReservedWords(code);

            if (typeof blockInfo.codeGenerators[language] == "undefined") {
                function setCodeGeneratorForLanguage(language) {
                    blockInfo.codeGenerators[language] = function (block) {
                        let params = "";

                        /* There are three kinds of input: value_input, statement_input and dummy_input,
                           We should definitely consider value_input here and not consider dummy_input here.

                           I don't know how statement_input is handled best, so I'll ignore it first -- Robert
                         */
                        let iParam = 0;
                        for (let iArgs0 in args0) {
                            if (args0[iArgs0].type == "input_value") {
                                if (iParam) {
                                    params += ", ";
                                }

                                if (blockParams && blockParams[iArgs0] == 'Statement') {
                                    params += "function () {\n  " + codeGenerator.statementToCode(block, 'PARAM_' + iParam) + "}";
                                } else {
                                    params += codeGenerator.valueToCode(block, 'PARAM_' + iParam, 0);
                                }
                                iParam += 1;
                            }
                            if (args0[iArgs0].type == "field_number"
                                || args0[iArgs0].type == "field_angle"
                                || args0[iArgs0].type == "field_dropdown"
                                || args0[iArgs0].type == "field_input") {
                                if (iParam) {
                                    params += ", ";
                                }
                                let fieldValue = block.getFieldValue('PARAM_' + iParam);
                                if (blockParams && blockParams[iArgs0] == 'Number') {
                                    params += parseInt(fieldValue);
                                } else {
                                    params += JSON.stringify(fieldValue);
                                }
                                iParam += 1;
                            }
                            if (args0[iArgs0].type == "field_colour") {
                                if (iParam) {
                                    params += ", ";
                                }
                                params += '"' + block.getFieldValue('PARAM_' + iParam) + '"';
                                iParam += 1;
                            }
                        }

                        let callCode = code + '(' + params + ')';
                        let reportedCode;
                        // Add reportValue to show the value in step-by-step mode
                        // if (that.mainContext.blocklyHelper.reportValues) {
                        reportedCode = "reportBlockValue('" + block.id + "', " + callCode + ")";
                        // } else {
                        //     reportedCode = callCode;
                        // }

                        if (typeof output == "undefined") {
                            return callCode + ";\n";
                        } else {
                            return [reportedCode, JavascriptOrder.NONE];
                        }
                    }
                }
                setCodeGeneratorForLanguage(language);
            }
        }
    }

    applyCodeGenerators(block: Block) {
        for (let language in block.codeGenerators) {
            const generator = getCodeGeneratorForLanguage(language);

            // @ts-ignore
            generator.forBlock[block.name] = block.codeGenerators[language];
        }
    }

    createBlock(block: Block) {
        if (typeof block.fullBlock != "undefined") {
            Blockly.Blocks[block.name] = block.fullBlock;
        } else if (typeof block.blocklyInit == "undefined") {
            let blocklyjson = block.blocklyJson;
            Blockly.Blocks[block.name] = {
                init: function () {
                    this.jsonInit(blocklyjson);
                },
            };
        } else if (typeof block.blocklyInit == "function") {
            const scratchMode = this.scratchMode;
            Blockly.Blocks[block.name] = {
                init: function () {
                    block.blocklyInit().call(this);
                    if (!this.previousStatement && scratchMode) {
                        this.hat = 'cap';
                    }
                },
            };
        } else {
            console.error(block.name + ".blocklyInit is defined but not a function");
        }
    }

    createSimpleGenerator(label, code, type, nbParams) {
        let jsDefinitions = this.definitions['javascript'] ? this.definitions['javascript'] : [];
        let pyDefinitions = this.definitions['python'] ? this.definitions['python'] : [];

        // Prevent the function name to be used as a variable
        javascriptGenerator.addReservedWords(code);
        pythonGenerator.addReservedWords(code);

        javascriptGenerator.forBlock[label] = function (block) {
            for (let iDef = 0; iDef < jsDefinitions.length; iDef++) {
                let def = jsDefinitions[iDef];
                // @ts-ignore
                javascriptGenerator.definitions_[def.label] = def.code;
            }
            let params = "";
            for (let iParam = 0; iParam < nbParams; iParam++) {
                if (iParam != 0) {
                    params += ", ";
                }
                params += javascriptGenerator.valueToCode(block, 'NAME_' + (iParam + 1), JavascriptOrder.ATOMIC);
            }
            if (type == 0) {
                return code + "(" + params + ");\n";
            } else if (type == 1) {
                return [code + "(" + params + ")", JavascriptOrder.NONE];
            }

            return null;
        };
        pythonGenerator.forBlock[label] = function (block) {
            for (let iDef = 0; iDef < pyDefinitions.length; iDef++) {
                let def = pyDefinitions[iDef];
                // @ts-ignore
                pythonGenerator.definitions_[def.label] = def.code;
            }
            let params = "";
            for (let iParam = 0; iParam < nbParams; iParam++) {
                if (iParam != 0) {
                    params += ", ";
                }
                params += pythonGenerator.valueToCode(block, 'NAME_' + (iParam + 1), PythonOrder.ATOMIC);
            }
            if (type == 0) {
                return code + "(" + params + ")\n";
            } else if (type == 1) {
                return [code + "(" + params + ")", PythonOrder.NONE];
            }

            return null;
        };
    }

    createSimpleBlock(label, code, type, nbParams) {
        Blockly.Blocks[label] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(code);
                if (type == 0) {
                    this.setPreviousStatement(true);
                    this.setNextStatement(true);
                }
                if (type == 1) {
                    this.setOutput(true);
                }
                this.setInputsInline(true);
                for (let iParam = 0; iParam < nbParams; iParam++) {
                    this.appendValueInput("NAME_" + (iParam + 1)).setCheck(null);
                }
                this.setColour(210);
                this.setTooltip('');
                this.setHelpUrl('');
            }
        };
    }

    createSimpleGeneratorsAndBlocks() {
        for (let genName in this.simpleGenerators) {
            for (let iGen = 0; iGen < this.simpleGenerators[genName].length; iGen++) {
                let generator = this.simpleGenerators[genName][iGen];
                let label, code;
                if (genName == '.') {
                    label = generator.label + "__";
                    code = generator.code;
                } else {
                    label = genName + "_" + generator.label + "__";
                    code = genName + "." + generator.code;
                }
                this.createSimpleGenerator(label, code, generator.type, generator.nbParams);
                this.createSimpleBlock(label, generator.label, generator.type, generator.nbParams);
            }
        }
    }

    applyBlockOptions(block: Block) {
        if (typeof block.countAs != 'undefined') {
            this.blockCounts[block.name] = block.countAs;
        }
    }

    createGeneratorsAndBlocksForAvailableBlocks() {
        for (let block of this.availableBlocks.filter(block => block.type === BlockType.Function)) {
            const {generatorName, category, name} = block;

            this.availableBlocksInfo[generatorName] ??= {};
            this.availableBlocksInfo[generatorName][category] ??= {};
            this.availableBlocksInfo[generatorName][category][name] = {
                ...block,
            };

            const blockInfo = this.availableBlocksInfo[generatorName][category][name];

            /* TODO: Allow library writers to provide their own JS/Python code instead of just a handler */
            this.completeBlockHandler(blockInfo, generatorName, this.mainContext);
            this.completeBlockJson(blockInfo, generatorName, category, this.mainContext); /* category.category is category name */
            this.completeBlockXml(blockInfo);
            this.completeCodeGenerators(blockInfo);
            this.applyCodeGenerators(blockInfo);
            this.createBlock(blockInfo);
            this.applyBlockOptions(blockInfo);
        }
    }


    getDefaultColours(): BlocklyColours {
        Blockly.utils.colour.setHsvSaturation(0.65);
        Blockly.utils.colour.setHsvValue(0.80);

        let colours = {
            categories: (this.scratchMode ? {
                ...blocklyCategoriesColors,
                ...scratchCategoriesColors,
            } : blocklyCategoriesColors),
            blocks: {}
        };

        if (typeof this.mainContext.provideBlocklyColours == "function") {
            let providedColours = this.mainContext.provideBlocklyColours();

            for (let group in providedColours) {
                if (!(group in colours)) {
                    colours[group] = {};
                }
                for (let name in providedColours[group]) {
                    // Make it backward-compatible: new category name is "functions"
                    colours[group]['procedures' === name ? 'functions' : name] = providedColours[group][name];
                }
            }
        }

        // Contexts cannot override "main" Scratch color categories
        if (this.scratchMode) {
            colours.categories = {
                ...colours.categories,
                ...scratchCategoriesColors,
            };
        }

        return colours;
    }

    getToolboxXml() {
        // Initialize allBlocksAllowed
        this.allBlocksAllowed = [];

        return buildToolboxXml({
            scratchMode: this.scratchMode,
            groupByCategory: this.groupByCategory,
            placeholderBlocks: this.placeholderBlocks,
            showIfMutator: !!this.mainContext?.showIfMutator,
            strings: this.strings,
            colours: this.getDefaultColours(),
            includeBlocks: this.includeBlocks,
            availableBlocks: this.availableBlocks,
            availableBlocksInfo: this.availableBlocksInfo,
            simpleGenerators: this.simpleGenerators,
            transcribeBlocks: (blockList: string[]) => this.transcribeBlocks(blockList),
            addBlocksAllowed: (blocks: string[]) => this.addBlocksAllowed(blocks),
        });
    }

    transcribeBlocks(blockList: string[]) {
        const finalTranscribedBlocks = [];
        for (let blockName of blockList) {
            if (transcribedBlocks[blockName]) {
                for (let transcribedBlock of transcribedBlocks[blockName]) {
                    finalTranscribedBlocks.push(transcribedBlock);
                }
            } else {
                finalTranscribedBlocks.push(blockName);
            }
        }

        return finalTranscribedBlocks;
    }

    checkBlocksAreAllowed(copyData, silent) {
        if (this.includeBlocks && this.includeBlocks.standardBlocks && this.includeBlocks.standardBlocks.includeAll) {
            return true;
        }
        let allowed = this.getBlocksAllowed();
        let notAllowed = [];
        let that = this;

        function checkBlockState(blockState) {
            if (!blockState) {
                return;
            }
            let blockName = that.normalizeType(blockState.type);
            if (!window.arrayContains(allowed, blockName)) {
                notAllowed.push(blockName);
            }
            if (blockState.inputs) {
                for (let inputName in blockState.inputs) {
                    let input = blockState.inputs[inputName];
                    checkBlockState(input.block);
                    checkBlockState(input.shadow);
                }
            }
            if (blockState.next) {
                checkBlockState(blockState.next.block);
                checkBlockState(blockState.next.shadow);
            }
        }

        checkBlockState(copyData ? copyData.blockState : null);

        if (!silent && notAllowed.length > 0) {
            console.error('Error: tried to load programs with unallowed blocks ' + notAllowed.join(', '));
        }
        return !(notAllowed.length);
    }

    cleanBlockAttributes(xml, origin = null) {
        // Clean up block attributes
        if (!origin) {
            origin = {x: 0, y: 0};
        }
        let blockList = xml.getElementsByTagName('block');
        let minX = Infinity, minY = Infinity;
        for (let i = 0; i < blockList.length; i++) {
            let block = blockList[i];
            let blockId = block.getAttribute('id');

            // Clean up read-only attributes
            if (block.getAttribute('type') != 'robot_start' && this.startingExampleIds.indexOf(blockId) == -1) {
                block.removeAttribute('deletable');
                block.removeAttribute('movable');
                block.removeAttribute('editable');
            }

            // Clean up IDs which contain now forbidden characters
            if (blockId && (blockId.indexOf('%') != -1 || blockId.indexOf('$') != -1 || blockId.indexOf('^') != -1)) {
                block.setAttribute('id', Blockly.utils.idGenerator.getNextUniqueId());
            }

            // Get minimum x and y
            let x = block.getAttribute('x');
            if (x !== null) {
                minX = Math.min(minX, parseInt(x));
            }
            let y = block.getAttribute('y');
            if (y !== null) {
                minY = Math.min(minY, parseInt(y));
            }
        }

        // Move blocks to start at x=0, y=0
        for (let i = 0; i < blockList.length; i++) {
            let block = blockList[i];
            let x = block.getAttribute('x');
            if (x !== null) {
                block.setAttribute('x', parseInt(x) - minX + origin.x);
            }
            let y = block.getAttribute('y');
            if (y !== null) {
                block.setAttribute('y', parseInt(y) - minY + origin.y);
            }
        }
    }

    getStartingExampleIds(xml) {
        this.startingExampleIds = [];
        let blockList = Blockly.utils.xml.textToDom(xml).getElementsByTagName('block');
        for (let i = 0; i < blockList.length; i++) {
            let block = blockList[i];
            let blockId = block.getAttribute('id');
            if (!blockId) {
                if (block.getAttribute('type') != 'robot_start' &&
                    (block.getAttribute('deletable') == 'false' ||
                        block.getAttribute('movable') == 'false' ||
                        block.getAttribute('editable') == 'false')) {
                    console.warn('Warning: starting block of type \'' + block.getAttribute('type') + '\' with read-only attributes has no id, these attributes will be removed.');
                }
                continue;
            }
            this.startingExampleIds.push(blockId);
        }
    }
}
