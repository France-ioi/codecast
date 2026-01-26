// Code extracted from https://github.com/France-ioi/bebras-modules/blob/master/pemFioi/quickAlgo/blockly_interface.js

import {addExtraBlocks} from './extra_blocks';
import {getStandardBlocklyBlocks} from './standard_blockly_blocks';
import {getStandardScratchBlocks} from './standard_scratch_blocks';
import {Block, BlockType} from '../../task/blocks/block_types';
import {QuickAlgoLibrary} from '../../task/libs/quickalgo_library';

let blocklySets = {
    allDefault: {
        wholeCategories: ["input", "logic", "loops", "math", "texts", "lists", "dicts", "tables", "variables", "functions"]
    },
    allJls: {
        wholeCategories: ["input", "logic", "loops", "math", "texts", "lists", "dicts", "tables", "variables", "functions"],
        excludedBlocks: ['text_eval', 'text_print', 'text_print_noend']
    }
};


// Blockly to Scratch translations
let blocklyToScratch = {
    singleBlocks: {
        'controls_if': ['control_if'],
        'controls_if_else': ['control_if_else'],
        'controls_infiniteloop': ['control_forever'],
        'controls_repeat': ['control_repeat'],
        'controls_repeat_ext': ['control_repeat'],
        'controls_whileUntil': ['control_repeat_until'],
        'controls_untilWhile': ['control_repeat_until'],
        'lists_repeat': ['data_listrepeat'],
        'lists_create_with_empty': [], // Scratch logic is not to initialize
        'lists_getIndex': ['data_itemoflist'],
        'lists_setIndex': ['data_replaceitemoflist'],
        'logic_negate': ['operator_not'],
        'logic_boolean': [],
        'logic_compare': ['operator_equals', 'operator_gt', 'operator_gte', 'operator_lt', 'operator_lte', 'operator_not'],
        'logic_operation': ['operator_and', 'operator_or'],
        'text': [],
        'text_append': [],
        'text_join': ['operator_join'],
        'math_arithmetic': ['operator_add', 'operator_subtract', 'operator_multiply', 'operator_divide', 'operator_dividefloor'],
        'math_change': ['data_changevariableby'],
        'math_number': ['math_number'],
        'variables_get': ['data_variable'],
        'variables_set': ['data_setvariableto']
    },
    wholeCategories: {
        'loops': 'control',
        'logic': 'operator',
        'math': 'operator'
    }
};

// Allowed blocks that make another block allowed as well
let blocklyAllowedSiblings = {
    'controls_repeat_ext_noShadow': ['controls_repeat_ext'],
    'controls_whileUntil': ['controls_untilWhile'],
    'controls_untilWhile': ['controls_whileUntil'],
    'controls_if_else': ['controls_if'],
    'lists_create_with_empty': ['lists_create_with']
};

let blocklyClipboardSaved;

function addInSet(l, val) {
    // Add val to list l if not already present
    if(l.indexOf(val) == -1) {
        l.push(val);
    }
}

export class BlocklyHelper {
    private subTask: any;
    public scratchMode: boolean;
    private maxBlocks: number;
    public programs: any[];
    private language: string;
    public languages: string[];
    private definitions: any;
    private simpleGenerators: any;
    private codeId: number;
    public workspace: any;
    private options: any;
    private initialScale: number;
    private divId: string;
    private trashInToolbox: boolean;
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
    private allBlocksAllowed: any;
    private limitedPointers: any;
    public blockCounts: any;
    private dragJustTerminated: boolean;
    private prevWidth: number;
    private availableBlocksInfo: Record<string, Record<string, Record<string, Block>>> = {};
    public reloading: boolean;
    public fake: boolean;

    constructor(maxBlocks, subTask) {
        this.subTask = subTask;
        this.scratchMode = (typeof window.Blockly.Blocks['control_if'] !== 'undefined');
        this.maxBlocks = maxBlocks;
        this.programs = [];
        this.language = (typeof window.Blockly.Blocks['control_if'] !== 'undefined') ? 'scratch' : 'blockly';
        this.languages = [];
        this.definitions = {};
        this.simpleGenerators = {};
        this.codeId = 0; // Currently edited node code
        this.workspace = null;
        this.options = {};
        this.initialScale = 1;
        this.divId = 'blocklyDiv';
        this.trashInToolbox = false;
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
            groupByCategory: true,
            generatedBlocks: {},
            standardBlocks: {
                includeAll: true,
                wholeCategories: [],
                singleBlocks: []
            }
        };

        this.allBlocksAllowed = [];
        this.blockCounts = {};
    }

    loadContext(mainContext) {
        this.mainContext = mainContext;
        // this.createGeneratorsAndBlocks();
    }

    load(locale, display, nbTestCases, options) {
        this.unloaded = false;

        window.FioiBlockly.loadLanguage(locale);

        if (this.scratchMode) {
            this.fixScratch();
        }

        if (options == undefined) options = {};
        if (options.divId) this.divId = options.divId;

        this.strings = window.languageStrings;
        if (options.startingBlockName) {
            this.strings.startingBlockName = options.startingBlockName;
        }

        if (options.maxListSize) {
            window.FioiBlockly.maxListSize = options.maxListSize;
        }
        this.placeholderBlocks = options.placeholderBlocks;

        this.options = options;

        addExtraBlocks(this.strings, this.getDefaultColours(), !this.mainContext.infos || !this.mainContext.infos.showIfMutator, this.scratchMode);
        this.createSimpleGeneratorsAndBlocks();

        this.display = display;

        if (display) {
            // this.loadHtml(nbTestCases);
            let xml = this.getToolboxXml();
            let wsConfig: any = {
                toolbox: "<xml>" + xml + "</xml>",
                comments: true,
                sounds: false,
                trashcan: true,
                media: this.mediaUrl,
                scrollbars: true,
                zoom: {startScale: 1}
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
            if (wsConfig.zoom.controls && window.blocklyUserScale) {
                wsConfig.zoom.startScale *= window.blocklyUserScale;
            }
            if (this.trashInToolbox) {
                window.Blockly.Trashcan.prototype.MARGIN_SIDE_ = window.jQuery('#blocklyDiv').width() - 110;
            }
            if (options.disable !== undefined) {
                wsConfig.disable = options.disable;
            }

            // Clean events if the previous unload wasn't done properly
            window.Blockly.removeEvents();

            // Inject Blockly
            this.workspace = window.Blockly.inject(this.divId, wsConfig);

            let toolboxNode = window.jQuery('#toolboxXml');
            if (toolboxNode.length != 0) {
                toolboxNode.html(xml);
            }

            // Restore clipboard if allowed
            if (blocklyClipboardSaved) {
                if (this.checkBlocksAreAllowed(blocklyClipboardSaved, false)) {
                    window.Blockly.clipboardXml_ = blocklyClipboardSaved;
                } else {
                    // Set to false to indicate that blocks were disallowed
                    window.Blockly.clipboardXml_ = false;
                }
                window.Blockly.clipboardSource_ = this.workspace;
            }

            window.jQuery(".blocklyToolboxDiv").css("background-color", "rgba(168, 168, 168, 0.5)");
            this.workspace.addChangeListener(this.onChange.bind(this));
            this.onChange();
        } else {
            let tmpOptions = new window.Blockly.Options({});
            this.workspace = new window.Blockly.Workspace(tmpOptions);
        }

        this.programs = [];
        for (let iCode = this.mainContext.nbCodes - 1; iCode >= 0; iCode--) {
            this.programs[iCode] = {blockly: null, blocklyJS: "", blocklyPython: "", javascript: ""};
            this.languages[iCode] = "blockly";
            this.setCodeId(iCode);
            if (this.startingBlock || options.startingExample) {
                let xml = this.getDefaultContent();
                window.Blockly.Events.recordUndo = false;
                window.Blockly.Xml.domToWorkspace(window.Blockly.Xml.textToDom(xml), this.workspace);
                window.Blockly.Events.recordUndo = true;
            }
            this.savePrograms();
        }

        let that = this;
        window.Blockly.BlockSvg.terminateDragCallback = function () {
            that.dragJustTerminated = true;
        };
    }

    unloadLevel() {
        this.unloaded = true; // Prevents from saving programs after unload

        try {
            // Need to hide the WidgetDiv before disposing of the workspace
            window.Blockly.WidgetDiv.hide();
        } catch (e) {
        }

        // Save clipboard
        if (this.display && window.Blockly.clipboardXml_) {
            blocklyClipboardSaved = window.Blockly.clipboardXml_;
        }

        let ws = this.workspace;
        if (ws != null) {
            try {
                ws.dispose();
            } catch (e) {
            }
        }
    }

    onChange(event = null) {
        let eventType = event ? event.constructor : null;

        let isBlockEvent = event ? (
            eventType === window.Blockly.Events.Create ||
            eventType === window.Blockly.Events.Delete ||
            eventType === window.Blockly.Events.Move ||
            eventType === window.Blockly.Events.Change) : true;

        if (isBlockEvent) {
            if (this.subTask) {
                this.subTask.onChange();
            }
            if (this.mainContext.onChange) {
                this.mainContext.onChange();
            }
        } else if (event.element != 'category' && event.element != 'selected') {
            window.Blockly.svgResize(this.workspace);
        }

        // Refresh the toolbox for new procedures (same with variables
        // but it's already handled correctly there)
        if (this.scratchMode && this.includeBlocks.groupByCategory && this.workspace.toolbox_
            && (eventType === window.Blockly.Events.Change || this.dragJustTerminated)
        ) {
            this.dragJustTerminated = false;
            this.workspace.toolbox_.refreshSelection();
        }
    }

    setIncludeBlocks(includeBlocks) {
        this.includeBlocks = includeBlocks;
    }

    setAvailableBlocks(availableBlocks: Block[]) {
        this.availableBlocks = availableBlocks;
        this.createGeneratorsAndBlocksForAvailableBlocks();
    }

    getEmptyContent() {
        if (this.scratchMode) {
            return '<xml><block type="robot_start" deletable="false" movable="false" x="10" y="20"></block></xml>';
        } else {
            return '<xml><block type="robot_start" deletable="false" movable="false" x="0" y="0"></block></xml>';
        }
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

        let xml = window.Blockly.Xml.textToDom(this.getEmptyContent())
        window.Blockly.Xml.domToWorkspace(xml, this.workspace);
    }

    getOrigin() {
        // Get x/y origin
        if (this.includeBlocks.groupByCategory && typeof this.options.scrollbars != 'undefined' && !this.options.scrollbars) {
            return this.scratchMode ? {x: 340, y: 20} : {x: 105, y: 2};
        }
        return this.scratchMode ? {x: 20, y: 20} : {x: 20, y: 2};
    }

    setCodeId(newCodeId: number) {
        this.codeId = newCodeId;
    }

    savePrograms() {
        if (this.unloaded) {
            console.error('savePrograms called after unload');
            return;
        }

        // Save zoom
        if (this.display && this.workspace.scale) {
            window.blocklyUserScale = this.workspace.scale / this.initialScale;
        }

        this.checkRobotStart();

        this.programs[this.codeId].javascript = window.jQuery("#program").val();
        if (this.workspace != null) {
            let xml = window.Blockly.Xml.workspaceToDom(this.workspace);
            this.cleanBlockAttributes(xml);

            // The additional variable contain all additional things that we can save, for example quickpi sensors,
            // subject title when edition is enabled...
            let additional = {};

            if (this.quickAlgoInterface && this.quickAlgoInterface.saveAdditional)
                this.quickAlgoInterface.saveAdditional(additional);

            let additionalNode = document.createElement("additional");
            additionalNode.innerText = JSON.stringify(additional);
            xml.appendChild(additionalNode);

            this.programs[this.codeId].blockly = window.Blockly.Xml.domToText(xml);
            this.programs[this.codeId].blocklyJS = this.getCode("javascript");
            this.programs[this.codeId].blocklyPython = this.getCode("python");
            console.log('python', this.programs[this.codeId].blocklyPython)
        }
    }

    loadPrograms() {
        if (this.workspace != null) {
            let xml = window.Blockly.Xml.textToDom(this.programs[this.codeId].blockly);
            this.workspace.clear();
            this.cleanBlockAttributes(xml, this.getOrigin());
            window.Blockly.Xml.domToWorkspace(xml, this.workspace);

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
        window.jQuery("#program").val(this.programs[this.codeId].javascript);
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
                if (this.trashInToolbox) {
                    window.Blockly.Trashcan.prototype.MARGIN_SIDE_ = panelWidth - 90;
                }
                window.Blockly.svgResize(this.workspace);
            }
        }
        this.prevWidth = panelWidth;
    }

    highlightBlock(id, keep) {
        if (!id) {
            keep = false;
        }

        if (!keep) {
            for (let i = 0; i < this.highlightedBlocks.length; i++) {
                let bid = this.highlightedBlocks[i];
                if (this.scratchMode) {
                    try {
                        this.workspace.glowBlock(bid, false);
                    } catch (e) {
                    }
                } else {
                    let block = this.workspace.getBlockById(bid);
                    if (block) {
                        block.removeSelect();
                    }
                }
            }
            this.highlightedBlocks = [];
        }

        if (this.scratchMode) {
            if (id) {
                this.workspace.glowBlock(id, true);
            }
        } else {
            this.workspace.traceOn(true);
            if (keep) {
                let block = this.workspace.getBlockById(id);
                if (block) {
                    block.addSelect();
                }
            } else {
                this.workspace.highlightBlock(id);
            }
        }

        if (id) {
            this.highlightedBlocks.push(id);
        }
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
        return this.scratchMode ? this.blocksToScratch(this.allBlocksAllowed) : this.allBlocksAllowed;
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
            let blocks;
            if (this.scratchMode) {
                // Convert block list to Scratch
                blocks = [];
                for (let j = 0; j < curLimit.blocks.length; j++) {
                    let curBlock = curLimit.blocks[j];
                    let convBlockList = blocklyToScratch.singleBlocks[curBlock];
                    if (convBlockList) {
                        for (let k = 0; k < convBlockList.length; k++) {
                            addInSet(blocks, this.normalizeType(convBlockList[k]));
                        }
                    } else {
                        addInSet(blocks, this.normalizeType(curBlock));
                    }
                }
            } else {
                blocks = curLimit.blocks;
            }

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

    getRemainingCapacity(workspace) {
        // Get the number of blocks allowed
        if (!this.maxBlocks) {
            return Infinity;
        }
        let remaining = workspace.remainingCapacity(this.maxBlocks + 1);
        let allBlocks = workspace.getAllBlocks();
        if (this.maxBlocks && remaining == Infinity) {
            // Blockly won't return anything as we didn't set a limit
            remaining = this.maxBlocks + 1 - allBlocks.length;
        }
        for (let i = 0; i < allBlocks.length; i++) {
            let block = allBlocks[i];
            if (typeof this.blockCounts[block.type] != 'undefined') {
                remaining -= this.blockCounts[block.type] - 1;
            }
        }
        return remaining;
    }

    isEmpty(workspace) {
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

    getCode(language, codeWorkspace = undefined, noReportValue = false, noConstraintCheck = false) {
        if (codeWorkspace == undefined) {
            codeWorkspace = this.workspace;
        }
        if (!this.checkConstraints(codeWorkspace) && !noConstraintCheck) {
            // Safeguard: avoid generating code when we use too many blocks
            return 'throw "' + this.strings.tooManyBlocks + '";';
        }
        let blocks = codeWorkspace.getTopBlocks(true);
        let languageObj = null;
        if (language == "javascript") {
            languageObj = window.Blockly.JavaScript;
        }
        if (language == "python") {
            languageObj = window.Blockly.Python;
        }
        languageObj.init(codeWorkspace);

        let oldReportValues = this.reportValues;
        if (noReportValue) {
            this.reportValues = false;
        }

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
            let blockCode = languageObj.blockToCode(block);
            if (window.arrayContains(["procedures_defnoreturn", "procedures_defreturn"], block.type)) {
                // For function blocks, the code is stored in languageObj.definitions_
            } else {
                if (block.type == "robot_start" || !this.startingBlock) {
                    comments.push(blockCode);
                }
            }
        }

        for (let def in languageObj.definitions_) {
            code.push(languageObj.definitions_[def]);
        }

        let codeString = code.join("\n");
        codeString += "\n";
        codeString += comments.join("\n");

        this.reportValues = oldReportValues;

        return codeString;
    }

    completeBlockHandler(block, objectName, context) {
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

    completeBlockJson(block, objectName, categoryName, context) {
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
                    if (block.yieldsValue == 'int') {
                        block.blocklyJson.outputShape = window.Blockly.OUTPUT_SHAPE_ROUND;
                    } else {
                        block.blocklyJson.outputShape = window.Blockly.OUTPUT_SHAPE_HEXAGONAL;
                    }

                    if (typeof block.blocklyJson.colour == "undefined") {
                        block.blocklyJson.colour = window.Blockly.Colours.sensing.primary;
                        block.blocklyJson.colourSecondary = window.Blockly.Colours.sensing.secondary;
                        block.blocklyJson.colourTertiary = window.Blockly.Colours.sensing.tertiary;
                    }
                }
            } else {
                block.blocklyJson.previousStatement = null;
                block.blocklyJson.nextStatement = null;

                if (this.scratchMode) {
                    if (typeof block.blocklyJson.colour == "undefined") {
                        block.blocklyJson.colour = window.Blockly.Colours.motion.primary;
                        block.blocklyJson.colourSecondary = window.Blockly.Colours.motion.secondary;
                        block.blocklyJson.colourTertiary = window.Blockly.Colours.motion.tertiary;
                    }
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
        } // TODO: Or maybe not?

        // TODO: Load default colours + custom styles
        if (typeof block.blocklyJson.colour == "undefined") {
            if (this.scratchMode) {
                block.blocklyJson.colour = window.Blockly.Colours.motion.primary;
                block.blocklyJson.colourSecondary = window.Blockly.Colours.motion.secondary;
                block.blocklyJson.colourTertiary = window.Blockly.Colours.motion.tertiary;
            } else {
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
    }

    completeBlockXml(block) {
        if (typeof block.blocklyXml == "undefined" || block.blocklyXml == "") {
            block.blocklyXml = "<block type='" + block.name + "'></block>";
        }
    }

    completeCodeGenerators(blockInfo, objectName) {
        if (typeof blockInfo.codeGenerators == "undefined") {
            blockInfo.codeGenerators = {};
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

        for (let language in {JavaScript: null, Python: null}) {
            // Prevent the function name to be used as a variable
            window.Blockly[language].addReservedWords(code);

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
                                    params += "function () {\n  " + window.Blockly.JavaScript.statementToCode(block, 'PARAM_' + iParam) + "}";
                                } else {
                                    params += window.Blockly[language].valueToCode(block, 'PARAM_' + iParam, window.Blockly[language].ORDER_ATOMIC);
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
                        if (that.mainContext.blocklyHelper.reportValues) {
                            reportedCode = "reportBlockValue('" + block.id + "', " + callCode + ")";
                        } else {
                            reportedCode = callCode;
                        }

                        if (typeof output == "undefined") {
                            return callCode + ";\n";
                        } else {
                            return [reportedCode, window.Blockly[language].ORDER_NONE];
                        }
                    }
                };
                setCodeGeneratorForLanguage(language);
            }
        }
    }

    applyCodeGenerators(block) {
        for (let language in block.codeGenerators) {
            window.Blockly[language][block.name] = block.codeGenerators[language];
        }
    }

    createBlock(block) {
        if (typeof block.fullBlock != "undefined") {
            window.Blockly.Blocks[block.name] = block.fullBlock;
        } else if (typeof block.blocklyInit == "undefined") {
            let blocklyjson = block.blocklyJson;
            window.Blockly.Blocks[block.name] = {
                init: function () {
                    this.jsonInit(blocklyjson);
                }
            };
        } else if (typeof block.blocklyInit == "function") {
            window.Blockly.Blocks[block.name] = {
                init: block.blocklyInit()
            };
        } else {
            console.error(block.name + ".blocklyInit is defined but not a function");
        }
    }

    createSimpleGenerator(label, code, type, nbParams) {
        let jsDefinitions = this.definitions['javascript'] ? this.definitions['javascript'] : [];
        let pyDefinitions = this.definitions['python'] ? this.definitions['python'] : [];

        // Prevent the function name to be used as a variable
        window.Blockly.JavaScript.addReservedWords(code);
        window.Blockly.Python.addReservedWords(code);

        window.Blockly.JavaScript[label] = function (block) {
            for (let iDef = 0; iDef < jsDefinitions.length; iDef++) {
                let def = jsDefinitions[iDef];
                window.Blockly.Javascript.definitions_[def.label] = def.code;
            }
            let params = "";
            for (let iParam = 0; iParam < nbParams; iParam++) {
                if (iParam != 0) {
                    params += ", ";
                }
                params += window.Blockly.JavaScript.valueToCode(block, 'NAME_' + (iParam + 1), window.Blockly.JavaScript.ORDER_ATOMIC);
            }
            if (type == 0) {
                return code + "(" + params + ");\n";
            } else if (type == 1) {
                return [code + "(" + params + ")", window.Blockly.JavaScript.ORDER_NONE];
            }

            return null;
        };
        window.Blockly.Python[label] = function (block) {
            for (let iDef = 0; iDef < pyDefinitions.length; iDef++) {
                let def = pyDefinitions[iDef];
                window.Blockly.Python.definitions_[def.label] = def.code;
            }
            let params = "";
            for (let iParam = 0; iParam < nbParams; iParam++) {
                if (iParam != 0) {
                    params += ", ";
                }
                params += window.Blockly.Python.valueToCode(block, 'NAME_' + (iParam + 1), window.Blockly.Python.ORDER_ATOMIC);
            }
            if (type == 0) {
                return code + "(" + params + ")\n";
            } else if (type == 1) {
                return [code + "(" + params + ")", window.Blockly.Python.ORDER_NONE];
            }

            return null;
        };
    }

    createSimpleBlock(label, code, type, nbParams) {
        window.Blockly.Blocks[label] = {
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
                // TODO :: merge createSimpleBlock with completeBlock*
                this.createSimpleBlock(label, generator.label, generator.type, generator.nbParams);
            }
        }
    }

    applyBlockOptions(block) {
        if (typeof block.countAs != 'undefined') {
            this.blockCounts[block.name] = block.countAs;
        }
    }

    createGeneratorsAndBlocks() {
        this.blockCounts = {};
        let customGenerators = this.mainContext.customBlocks;
        for (let objectName in customGenerators) {
            for (let categoryName in customGenerators[objectName]) {
                let category = customGenerators[objectName][categoryName];
                for (let iBlock = 0; iBlock < category.length; iBlock++) {
                    let block = category[iBlock];

                    /* TODO: Allow library writers to provide their own JS/Python code instead of just a handler */
                    this.completeBlockHandler(block, objectName, this.mainContext);
                    this.completeBlockJson(block, objectName, categoryName, this.mainContext); /* category.category is category name */
                    this.completeBlockXml(block);
                    this.completeCodeGenerators(block, objectName);
                    this.applyCodeGenerators(block);
                    this.createBlock(block);
                    this.applyBlockOptions(block);
                }
                // TODO: Anything of this still needs to be done?
                //this.createGenerator(label, objectName + "." + code, generator.type, generator.nbParams);
                //this.createBlock(label, generator.labelFr, generator.type, generator.nbParams);
            }
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
            this.completeCodeGenerators(blockInfo, generatorName);
            this.applyCodeGenerators(blockInfo);
            this.createBlock(blockInfo);
            this.applyBlockOptions(blockInfo);
        }
    }

    getBlocklyLibCode(generators) {
        let strCode = "";
        for (let objectName in generators) {
            strCode += "let " + objectName + " = {\n";
            for (let iGen = 0; iGen < generators[objectName].length; iGen++) {
                let generator = generators[objectName][iGen];

                if (generator.nbParams == 0) {
                    strCode += generator.codeFr + ": function() { ";
                } else {
                    strCode += generator.codeFr + ": function(param1) { ";
                }
                if (generator.type == 1) {
                    strCode += "return ";
                }
                if (generator.nbParams == 0) {
                    strCode += objectName + "_" + generator.labelEn + "(); }";
                } else {
                    strCode += objectName + "_" + generator.labelEn + "(param1); }";
                }
                if (iGen < generators[objectName].length - 1) {
                    strCode += ",";
                }
                strCode += "\n";
            }
            strCode += "};\n\n";
        }
        strCode += "Math['max'] = function(a, b) { if (a > b) return a; return b; };\n";
        strCode += "Math['min'] = function(a, b) { if (a > b) return b; return a; };\n";
        return strCode;
    }


    getDefaultColours() {
        window.Blockly.HSV_SATURATION = 0.65;
        window.Blockly.HSV_VALUE = 0.80;
        let colours = {
            categories: {
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
                variables: 30,
                procedures: 180,
                _default: 65
            },
            blocks: {}
        };

        if (typeof this.mainContext.provideBlocklyColours == "function") {
            let providedColours = this.mainContext.provideBlocklyColours();

            for (let group in providedColours) {
                if (!(group in colours)) {
                    colours[group] = {};
                }
                for (let name in providedColours[group]) {
                    colours[group][name] = providedColours[group][name];
                }
            }
        }

        return colours;
    }

    getStdBlocks() {
        return this.scratchMode
            ? getStandardScratchBlocks(this.placeholderBlocks, this.strings)
            : getStandardBlocklyBlocks(this.placeholderBlocks, !!this.mainContext?.showIfMutator);
    }

    getBlockXmlInfo(generatorStruct, blockName) {
        for (let categoryName in generatorStruct) {
            let blocks = generatorStruct[categoryName];
            for (let iBlock = 0; iBlock < blocks.length; iBlock++) {
                let block = blocks[iBlock];
                if (block.name == blockName) {
                    return {
                        category: categoryName,
                        xml: block.blocklyXml
                    };
                }
            }
        }

        console.error("Block not found: " + blockName);
        return null;
    }

    getBlockFromCustomBlocks(generatorName: string, category: string, name: string) {
        if (!(generatorName in this.availableBlocksInfo)) {
            throw new Error(`Generator not found: ${generatorName}`);
        }
        if (!(category in this.availableBlocksInfo[generatorName])) {
            throw new Error(`Category not found in generator ${generatorName}: ${category}`);
        }
        if (!(name in this.availableBlocksInfo[generatorName][category])) {
            throw new Error(`Block not found in generator ${generatorName} and category ${category}: ${name}`);
        }

        return this.availableBlocksInfo[generatorName][category][name];
    }


    addBlocksAndCategories(blockNames, blocksDefinition, categoriesInfos) {
        let colours = this.getDefaultColours();
        for (let iBlock = 0; iBlock < blockNames.length; iBlock++) {
            let blockName = blockNames[iBlock];
            let blockXmlInfo = this.getBlockXmlInfo(blocksDefinition, blockName);
            let categoryName = blockXmlInfo.category;

            if (!(categoryName in categoriesInfos)) {
                categoriesInfos[categoryName] = {
                    blocksXml: [],
                    colour: colours.blocks[blockName]
                };
            }
            let blockXml = blockXmlInfo.xml;
            if (categoriesInfos[categoryName].blocksXml.indexOf(blockXml) == -1) {
                categoriesInfos[categoryName].blocksXml.push(blockXml);
            }
            this.addBlocksAllowed([blockName]);
        }

        // by the way, just change the defaul colours of the blockly blocks:
        if (!this.scratchMode) {
            let defCat = ["logic", "loops", "math", "texts", "lists", "colour"];
            for (let iCat in defCat) {
                window.Blockly.Blocks[defCat[iCat]].HUE = colours.categories[defCat[iCat]];
            }
        }
    }

    getToolboxXml() {
        let categoriesInfos = {};
        let colours = this.getDefaultColours();

        // Reset the flyoutOptions for the variables and the procedures
        window.Blockly.Variables.resetFlyoutOptions();
        window.Blockly.Procedures.resetFlyoutOptions();

        // Initialize allBlocksAllowed
        this.allBlocksAllowed = [];
        this.addBlocksAllowed(['robot_start', 'placeholder_statement']);
        if (this.scratchMode) {
            this.addBlocksAllowed(['math_number', 'text']);
        }

        // *** Blocks from the lib
        for (let block of this.availableBlocks) {
            if (BlockType.Function !== block.type) {
                continue;
            }

            let colours = this.getDefaultColours();
            const blockInfo = this.getBlockFromCustomBlocks(block.generatorName, block.category, block.name);

            if (!(block.category in categoriesInfos)) {
                categoriesInfos[block.category] = {
                    blocksXml: [],
                    colour: colours.blocks[block.name]
                };
            }
            let blockXml = blockInfo.blocklyXml;
            if (categoriesInfos[block.category].blocksXml.indexOf(blockXml) == -1) {
                categoriesInfos[block.category].blocksXml.push(blockXml);
            }
            this.addBlocksAllowed([block.name]);

            // by the way, just change the defaul colours of the blockly blocks:
            if (!this.scratchMode) {
                let defCat = ["logic", "loops", "math", "texts", "lists", "colour"];
                for (let iCat in defCat) {
                    window.Blockly.Blocks[defCat[iCat]].HUE = colours.categories[defCat[iCat]];
                }
            }
        }

        // if (this.includeBlocks.generatedBlocks && 'singleBlocks' in this.includeBlocks.generatedBlocks) {
        //     for (let blockType in this.includeBlocks.generatedBlocks.singleBlocks) {
        //         this.addBlocksAndCategories(
        //             this.includeBlocks.generatedBlocks.singleBlocks[blockType],
        //             this.mainContext.customBlocks[blockType],
        //             categoriesInfos
        //         );
        //     }
        // }
        // for (let blockType in this.includeBlocks.generatedBlocks) {
        //     if (blockType == 'wholeCategories' || blockType == 'singleBlocks') continue;
        //     this.addBlocksAndCategories(
        //         this.includeBlocks.generatedBlocks[blockType],
        //         this.mainContext.customBlocks[blockType],
        //         categoriesInfos
        //     );
        // }

        for (let genName in this.simpleGenerators) {
            for (let iGen = 0; iGen < this.simpleGenerators[genName].length; iGen++) {
                let generator = this.simpleGenerators[genName][iGen];
                if (categoriesInfos[generator.category] == undefined) {
                    categoriesInfos[generator.category] = {
                        blocksXml: [],
                        colour: 210
                    };
                }
                let blockName = (genName == '.') ? generator.label + "__" : genName + "_" + generator.label + "__";
                categoriesInfos[generator.category].blocksXml.push("<block type='" + blockName + "'></block>");
            }
        }


        // *** Standard blocks
        let stdBlocks = this.getStdBlocks();

        // It is normally executed during load, but for
        let taskStdInclude = (this.includeBlocks && this.includeBlocks.standardBlocks) || {};
        let tsiSingleBlocks = taskStdInclude.singleBlocks || [];
        if (this.scratchMode) {
            tsiSingleBlocks = this.blocksToScratch(tsiSingleBlocks);
        }
        let stdInclude = {
            wholeCategories: [],
            singleBlocks: [],
            excludedBlocks: []
        };

        // Merge all lists into stdInclude
        if (taskStdInclude.includeAll) {
            if (this.scratchMode) {
                stdInclude.wholeCategories = ["control", "input", "lists", "operator", "tables", "texts", "variables", "functions"];
            } else {
                stdInclude.wholeCategories = ["input", "logic", "loops", "math", "texts", "lists", "dicts", "tables", "variables", "functions"];
            }
        }
        window.mergeIntoArray(stdInclude.wholeCategories, taskStdInclude.wholeCategories || []);
        window.mergeIntoArray(stdInclude.singleBlocks, tsiSingleBlocks || []);
        window.mergeIntoArray(stdInclude.excludedBlocks, taskStdInclude.excludedBlocks || []);
        // Add block sets
        if (taskStdInclude.blockSets) {
            for (let iSet in taskStdInclude.blockSets) {
                window.mergeIntoObject(stdInclude, blocklySets[taskStdInclude.blockSets[iSet]]);
            }
        }

        // Prevent from using excludedBlocks if includeAll is set
        if (taskStdInclude.includeAll) {
            stdInclude.excludedBlocks = [];
        }

        // Remove excludedBlocks from singleBlocks
        for (let iBlock = 0; iBlock < stdInclude.singleBlocks.length; iBlock++) {
            if (window.arrayContains(stdInclude.excludedBlocks, stdInclude.singleBlocks[iBlock])) {
                stdInclude.singleBlocks.splice(iBlock, 1);
                iBlock--;
            }
        }

        let handledCategories = [];
        for (let iCategory = 0; iCategory < stdInclude.wholeCategories.length; iCategory++) {
            let categoryName = stdInclude.wholeCategories[iCategory];
            if (this.scratchMode && !taskStdInclude.includeAll && blocklyToScratch.wholeCategories[categoryName]) {
                categoryName = blocklyToScratch.wholeCategories[categoryName];
            }

            if (window.arrayContains(handledCategories, categoryName)) {
                continue;
            }
            handledCategories.push(categoryName);

            if (!(categoryName in categoriesInfos)) {
                categoriesInfos[categoryName] = {
                    blocksXml: []
                };
            }
            if (categoryName == 'variables') {
                window.Blockly.Variables.flyoutOptions.any = true;
                continue;
            } else if (categoryName == 'functions') {
                window.Blockly.Procedures.flyoutOptions.includedBlocks = {noret: true, ret: true, ifret: true, noifret: true};
                continue;
            }
            let blocks = stdBlocks[categoryName];
            if (blocks) {
                if (!(blocks instanceof Array)) { // just for now, maintain backwards compatibility
                    blocks = blocks.blocks;
                }

                let blockNames = [];
                for (let iBlock = 0; iBlock < blocks.length; iBlock++) {
                    if (!(blocks[iBlock].excludedByDefault) && !window.arrayContains(stdInclude.excludedBlocks, blocks[iBlock].name)) {
                        blockNames.push(blocks[iBlock].name);
                        categoriesInfos[categoryName].blocksXml.push(blocks[iBlock].blocklyXml);
                    }
                }
                this.addBlocksAllowed(blockNames);
            }
        }

        let proceduresOptions = this.includeBlocks.procedures;
        if (typeof proceduresOptions !== 'undefined') {
            if (proceduresOptions.noret) {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['noret'] = true;
            }
            if (proceduresOptions.ret) {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['ret'] = true;
            }
            if (proceduresOptions.ifret) {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['ifret'] = true;
            }
            if (proceduresOptions.noifret) {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['noifret'] = true;
            }
            window.Blockly.Procedures.flyoutOptions.disableArgs = !!proceduresOptions.disableArgs;
        }

        let singleBlocks = stdInclude.singleBlocks;
        for (let iBlock = 0; iBlock < singleBlocks.length; iBlock++) {
            let blockName = singleBlocks[iBlock];
            if (blockName == 'procedures_defnoreturn') {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['noret'] = true;
            } else if (blockName == 'procedures_defreturn') {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['ret'] = true;
            } else if (blockName == 'procedures_ifreturn') {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['ifret'] = true;
            } else if (blockName == 'procedures_return') {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['noifret'] = true;
            } else {
                continue;
            }
            // If we're here, a block has been found
            this.addBlocksAllowed([blockName, 'procedures_callnoreturn', 'procedures_callreturn']);
            singleBlocks.splice(iBlock, 1);
            iBlock--;
        }
        if (window.Blockly.Procedures.flyoutOptions.includedBlocks['noret']
            || window.Blockly.Procedures.flyoutOptions.includedBlocks['ret']
            || window.Blockly.Procedures.flyoutOptions.includedBlocks['ifret']
            || window.Blockly.Procedures.flyoutOptions.includedBlocks['noifret']) {
            if (window.Blockly.Procedures.flyoutOptions.includedBlocks['noret']) {
                this.addBlocksAllowed(['procedures_defnoreturn', 'procedures_callnoreturn']);
            }
            if (window.Blockly.Procedures.flyoutOptions.includedBlocks['ret']) {
                this.addBlocksAllowed(['procedures_defreturn', 'procedures_callreturn']);
            }
            if (window.Blockly.Procedures.flyoutOptions.includedBlocks['ifret']) {
                this.addBlocksAllowed(['procedures_ifreturn', 'procedures_return']);
            }
            if (window.Blockly.Procedures.flyoutOptions.includedBlocks['noifret']) {
                this.addBlocksAllowed(['procedures_return']);
            }
            categoriesInfos['functions'] = {
                blocksXml: []
            };
            if (this.scratchMode && !window.arrayContains(singleBlocks, 'math_number')) {
                singleBlocks.push('math_number'); // TODO :: temporary
            }
            if (!this.includeBlocks.groupByCategory) {
                console.error('Task configuration error: groupByCategory must be activated for functions.');
            }
        }
        this.addBlocksAndCategories(singleBlocks, stdBlocks, categoriesInfos);

        // Handle variable blocks, which are normally automatically added with
        // the VARIABLES category but can be customized here
        window.Blockly.Variables.flyoutOptions.anyButton = !!this.includeBlocks.groupByCategory;
        if (typeof this.includeBlocks.variables !== 'undefined') {
            window.Blockly.Variables.flyoutOptions.fixed = (this.includeBlocks.variables.length > 0) ? this.includeBlocks.variables : [];
            if (typeof this.includeBlocks.variablesOnlyBlocks !== 'undefined') {
                window.Blockly.Variables.flyoutOptions.includedBlocks = {get: false, set: false, incr: false};
                for (let iBlock = 0; iBlock < this.includeBlocks.variablesOnlyBlocks.length; iBlock++) {
                    window.Blockly.Variables.flyoutOptions.includedBlocks[this.includeBlocks.variablesOnlyBlocks[iBlock]] = true;
                }
            }

            let varAnyIdx = window.Blockly.Variables.flyoutOptions.fixed.indexOf('*');
            if (varAnyIdx > -1) {
                window.Blockly.Variables.flyoutOptions.fixed.splice(varAnyIdx, 1);
                window.Blockly.Variables.flyoutOptions.any = true;
            }

            let blocksXml = window.Blockly.Variables.flyoutCategory();
            let xmlSer = new XMLSerializer();
            for (let i = 0; i < blocksXml.length; i++) {
                blocksXml[i] = xmlSer.serializeToString(blocksXml[i]);
            }

            categoriesInfos["variables"] = {
                blocksXml: blocksXml,
                colour: 330
            }
        }

        if (window.Blockly.Variables.flyoutOptions.includedBlocks['get']) {
            this.addBlocksAllowed(['variables_get']);
        }
        if (window.Blockly.Variables.flyoutOptions.includedBlocks['set']) {
            this.addBlocksAllowed(['variables_set']);
        }
        if (window.Blockly.Variables.flyoutOptions.includedBlocks['incr']) {
            this.addBlocksAllowed(['math_change']);
        }

        // Disable arguments in procedures if variables are not allowed
        if (!window.Blockly.Variables.flyoutOptions.any && proceduresOptions && typeof proceduresOptions.disableArgs == 'undefined') {
            window.Blockly.Procedures.flyoutOptions.disableArgs = true;
        }

        let orderedCategories = [];
        if (this.includeBlocks.blocksOrder) {
            let blocksOrder = this.includeBlocks.blocksOrder;
            if (this.scratchMode) {
                blocksOrder = this.blocksToScratch(blocksOrder);
            }

            function getBlockIdx(blockXml) {
                let blockType = window.Blockly.Xml.textToDom(blockXml, "text/xml").getAttribute('type');
                let blockIdx = blocksOrder.indexOf(blockType);
                return blockIdx == -1 ? 10000 : blockIdx;
            }

            function getCategoryIdx(categoryName) {
                let categoryIdx = blocksOrder.indexOf(categoryName);
                if (categoryIdx != -1) {
                    return categoryIdx;
                }
                for (let iBlock = 0; iBlock < categoriesInfos[categoryName].blocksXml.length; iBlock++) {
                    let blockXml = categoriesInfos[categoryName].blocksXml[iBlock];
                    let blockIdx = getBlockIdx(blockXml);
                    if (blockIdx != 10000) {
                        return blockIdx;
                    }
                }
                return 10000;
            }

            for (let categoryName in categoriesInfos) {
                orderedCategories.push(categoryName);
                categoriesInfos[categoryName].blocksXml.sort(function (a, b) {
                    let indexA = getBlockIdx(a);
                    let indexB = getBlockIdx(b);
                    return indexA - indexB;
                });
            }
            orderedCategories.sort(function (a, b) {
                let indexA = getCategoryIdx(a);
                let indexB = getCategoryIdx(b);
                return indexA - indexB;
            });
        } else {
            for (let categoryName in categoriesInfos) {
                orderedCategories.push(categoryName);
            }
        }

        let xmlString = "";
        for (let iCategory = 0; iCategory < orderedCategories.length; iCategory++) {
            let categoryName = orderedCategories[iCategory];
            let categoryInfo = categoriesInfos[categoryName];
            if (this.includeBlocks.groupByCategory) {
                let colour = categoryInfo.colour;
                if (typeof (colour) == "undefined") {
                    colour = colours.categories[categoryName]
                    if (typeof (colour) == "undefined") {
                        colour = colours.categories._default;
                    }
                }
                xmlString += "<category "
                    + " name='" + this.strings.categories[categoryName] + "'"
                    + " colour='" + colour + "'"
                    + (this.scratchMode ? " secondaryColour='" + colour + "'" : '')
                    + (categoryName == 'variables' ? ' custom="VARIABLE"' : '')
                    + (categoryName == 'functions' ? ' custom="PROCEDURE"' : '')
                    + ">";
            }
            let blocks = categoryInfo.blocksXml;
            for (let iBlock = 0; iBlock < blocks.length; iBlock++) {
                xmlString += blocks[iBlock];
            }
            if (this.includeBlocks.groupByCategory) {
                xmlString += "</category>";
            }
        }

        (function (strings) {
            xmlString = xmlString.replace(/{(\w+)}/g, function (m, p1) {
                return strings[p1]
            }); // taken from blockly/demo/code
        })(this.strings);

        return xmlString;
    }

    blocksToScratch(blockList) {
        let scratchBlocks = [];
        for (let iBlock = 0; iBlock < blockList.length; iBlock++) {
            let blockName = blockList[iBlock];
            if (blocklyToScratch.singleBlocks[blockName]) {
                for (let b = 0; b < blocklyToScratch.singleBlocks[blockName].length; b++) {
                    scratchBlocks.push(blocklyToScratch.singleBlocks[blockName][b]);
                }
            } else {
                scratchBlocks.push(blockName);
            }
        }
        return scratchBlocks;
    }

    fixScratch() {
        // Store the maxBlocks information somewhere, as Scratch ignores it
        window.Blockly.Workspace.prototype.maxBlocks = () => {
            return this.maxBlocks;
        };

        // Translate requested Blocks from Blockly to Scratch blocks
        // TODO :: full translation
        this.includeBlocks.standardBlocks.singleBlocks = this.blocksToScratch(this.includeBlocks.standardBlocks.singleBlocks || []);
    }

    checkBlocksAreAllowed(xml, silent) {
        if (this.includeBlocks && this.includeBlocks.standardBlocks && this.includeBlocks.standardBlocks.includeAll) {
            return true;
        }
        let allowed = this.getBlocksAllowed();
        let blockList = xml.getElementsByTagName('block');
        let notAllowed = [];
        let that = this;

        function checkBlock(block) {
            let blockName = block.getAttribute('type');
            blockName = that.normalizeType(blockName);
            if (!window.arrayContains(allowed, blockName)) {
                notAllowed.push(blockName);
            }
        }

        for (let i = 0; i < blockList.length; i++) {
            checkBlock(blockList[i]);
        }
        if (xml.localName == 'block') {
            // Also check the top element
            checkBlock(xml);
        }
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
                block.setAttribute('id', window.Blockly.genUid());
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
        let blockList = window.Blockly.Xml.textToDom(xml).getElementsByTagName('block');
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
