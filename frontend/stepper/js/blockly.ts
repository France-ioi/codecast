import {QuickAlgoLibrary} from "../../task/libs/quickalgo_librairies";

const blocklyAllowedSiblings = {
    'controls_repeat_ext_noShadow': ['controls_repeat_ext'],
    'controls_whileUntil': ['controls_untilWhile'],
    'controls_untilWhile': ['controls_whileUntil'],
    'controls_if_else': ['controls_if'],
    'lists_create_with_empty': ['lists_create_with']
}

window.arrayContains = function (array, needle) {
    for (var index in array) {
        if (needle == array[index]) {
            return true;
        }
    }
    return false;
};

window.mergeIntoArray = function (into, other) {
    for (var iOther in other) {
        var intoContains = false;

        for (var iInto in into) {
            if (other[iOther] == into[iInto]) {
                intoContains = true;
            }
        }

        if (!intoContains) {
            into.push(other[iOther]);
        }
    }
}

// Merges objects into each other similar to $.extend, but
// merges Arrays differently (see above)
// (Deep-Copy only)
window.mergeIntoObject = (into, other) => {
    for (var property in other) {
        if (other[property] instanceof Array) {
            if (!(into[property] instanceof Array)) {
                into[property] = [];
            }
            window.mergeIntoArray(into[property], other[property]);
        }
        if (other[property] instanceof Object) {
            if (!(into[property] instanceof Object)) {
                into[property] = {};
            }
            window.mergeIntoObject(into[property], other[property]);
        }
        into[property] = other[property];
    }
}


export const getBlocklyHelper = (task, context) => {
    console.log('blockly helper task', task);

    window.quickAlgoInterface = {
        updateControlsDisplay: () => {},
    };

    const blocklyHelper = window.getBlocklyHelper(task.gridInfos.maxInstructions, task);
    blocklyHelper.loadContext(context);

    return blocklyHelper;
};

class BlocklyHelperTest {
    private context: QuickAlgoLibrary;
    private allBlocksAllowed = [];
    private scratchMode = (typeof window.Blockly.Blocks['control_if'] !== 'undefined');
    private maxBlocks = null;
    private textFile = null
    private extended = false;
    private language = (typeof window.Blockly.Blocks['control_if'] !== 'undefined') ? 'scratch' : 'blockly',
    private languages = [];
    private locale = 'fr';
    private definitions = {};
    private simpleGenerators = {};
    private codeId = 0;
    private workspace = null;
    private options = {};
    private hidden = false;
    private trashInToolbox = false;
    private startingBlock = true;
    private unloaded = false;
    private reloadForFlyout = 0;
    private readOnly = false;
    private reportValues = true;
    private highlightedBlocks = [];

    constructor(context: QuickAlgoLibrary, options) {
        let unloaded = false;

        window.FioiBlockly.loadLanguage(this.locale);

        if (this.scratchMode) {
            this.fixScratch();
        }

        if (options == undefined) options = {};

        this.strings = window.languageStrings;
        if (options.startingBlockName) {
            this.strings.startingBlockName = options.startingBlockName;
        }

        if (options.maxListSize) {
            window.FioiBlockly.maxListSize = options.maxListSize;
        }
        this.placeholderBlocks = options.placeholderBlocks;

        this.addExtraBlocks();
        this.createSimpleGeneratorsAndBlocks();
    }

    setContext(context) {
        this.context = context;
    }

    getDefaultColours () {
        const colours = {
            categories: {
                logic: 210,
                loops: 120,
                control: 120,
                math: 230,
                operator: 230,
                texts: 160,
                lists: 260,
                colour: 20,
                variables: 330,
                functions: 290,
                _default: 65
            },
            blocks: {}
        };

        if (typeof this.context.provideBlocklyColours == "function") {
            const providedColours = this.context.provideBlocklyColours();

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
    addBlocksAllowed(blocks) {
        for (let i = 0; i < blocks.length; i++) {
            let name = blocks[i];
            if (-1 !== this.allBlocksAllowed.indexOf(name)) {
                continue;
            }
            this.allBlocksAllowed.push(name);
            if (blocklyAllowedSiblings[name]) {
                this.addBlocksAllowed(blocklyAllowedSiblings[name]);
            }
        }
    }

    getToolboxXml() {
        const categoriesInfos = {};
        const colours = this.getDefaultColours();

        // Reset the flyoutOptions for the variables and the procedures
        window.Blockly.Variables.resetFlyoutOptions();
        window.Blockly.Procedures.resetFlyoutOptions();

        // Initialize allBlocksAllowed
        this.allBlocksAllowed = [];
        this.addBlocksAllowed(['robot_start', 'placeholder_statement']);
        if(this.scratchMode) {
            this.addBlocksAllowed(['math_number', 'text']);
        }


        // *** Blocks from the lib
        if(this.includeBlocks.generatedBlocks && 'wholeCategories' in this.includeBlocks.generatedBlocks) {
            for(var blockType in this.includeBlocks.generatedBlocks.wholeCategories) {
                var categories = this.includeBlocks.generatedBlocks.wholeCategories[blockType];
                for(var i=0; i<categories.length; i++) {
                    var category = categories[i];
                    if(blockType in this.mainContext.customBlocks && category in this.mainContext.customBlocks[blockType]) {
                        var contextBlocks = this.mainContext.customBlocks[blockType][category];
                        var blockNames = [];
                        for(var i=0; i<contextBlocks.length; i++) {
                            blockNames.push(contextBlocks[i].name);
                        }
                        this.addBlocksAndCategories(
                            blockNames,
                            this.mainContext.customBlocks[blockType],
                            categoriesInfos
                        );
                    }
                }
            }
        }
        if(this.includeBlocks.generatedBlocks && 'singleBlocks' in this.includeBlocks.generatedBlocks) {
            for(var blockType in this.includeBlocks.generatedBlocks.singleBlocks) {
                this.addBlocksAndCategories(
                    this.includeBlocks.generatedBlocks.singleBlocks[blockType],
                    this.mainContext.customBlocks[blockType],
                    categoriesInfos
                );
            }
        }
        for (var blockType in this.includeBlocks.generatedBlocks) {
            if(blockType == 'wholeCategories' || blockType == 'singleBlocks') continue;
            this.addBlocksAndCategories(
                this.includeBlocks.generatedBlocks[blockType],
                this.mainContext.customBlocks[blockType],
                categoriesInfos
            );
        }

        for (var genName in this.simpleGenerators) {
            for (var iGen = 0; iGen < this.simpleGenerators[genName].length; iGen++) {
                var generator = this.simpleGenerators[genName][iGen];
                if (categoriesInfos[generator.category] == undefined) {
                    categoriesInfos[generator.category] = {
                        blocksXml: [],
                        colour: 210
                    };
                }
                var blockName = (genName == '.') ? generator.label + "__" : genName + "_" + generator.label + "__";
                categoriesInfos[generator.category].blocksXml.push("<block type='"+blockName+"'></block>");
            }
        }


        // *** Standard blocks
        var stdBlocks = this.getStdBlocks();

        var taskStdInclude = (this.includeBlocks && this.includeBlocks.standardBlocks) || {};
        var stdInclude = {
            wholeCategories: [],
            singleBlocks: [],
            excludedBlocks: []
        };

        // Merge all lists into stdInclude
        if (taskStdInclude.includeAll) {
            if(this.scratchMode) {
                stdInclude.wholeCategories = ["control", "input", "lists", "operator", "tables", "texts", "variables", "functions"];
            } else {
                stdInclude.wholeCategories = ["input", "logic", "loops", "math", "texts", "lists", "dicts", "tables", "variables", "functions"];
            }
        }
        mergeIntoArray(stdInclude.wholeCategories, taskStdInclude.wholeCategories || []);
        mergeIntoArray(stdInclude.singleBlocks, taskStdInclude.singleBlocks || []);
        mergeIntoArray(stdInclude.excludedBlocks, taskStdInclude.excludedBlocks || []);
        // Add block sets
        if(taskStdInclude.blockSets) {
            for(var iSet in taskStdInclude.blockSets) {
                mergeIntoObject(stdInclude, blocklySets[taskStdInclude.blockSets[iSet]]);
            }
        }

        // Prevent from using excludedBlocks if includeAll is set
        if(taskStdInclude.includeAll) { stdInclude.excludedBlocks = []; }

        // Remove excludedBlocks from singleBlocks
        for(var iBlock=0; iBlock < stdInclude.singleBlocks; iBlock++) {
            if(arrayContains(stdInclude.excludedBlocks, stdInclude.singleBlocks[iBlock])) {
                stdInclude.singleBlocks.splice(iBlock, 1);
                iBlock--;
            }
        }

        var handledCategories = [];
        for (var iCategory = 0; iCategory < stdInclude.wholeCategories.length; iCategory++) {
            var categoryName = stdInclude.wholeCategories[iCategory];
            if(this.scratchMode && !taskStdInclude.includeAll && blocklyToScratch.wholeCategories[categoryName]) {
                categoryName = blocklyToScratch.wholeCategories[categoryName];
            }

            if(arrayContains(handledCategories, categoryName)) { continue; }
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
                window.Blockly.Procedures.flyoutOptions.includedBlocks = {noret: true, ret: true, ifret: true};
                continue;
            }
            var blocks = stdBlocks[categoryName];
            if(blocks) {
                if (!(blocks instanceof Array)) { // just for now, maintain backwards compatibility
                    blocks = blocks.blocks;
                }

                var blockNames = [];
                for (var iBlock = 0; iBlock < blocks.length; iBlock++) {
                    if (!(blocks[iBlock].excludedByDefault) && !arrayContains(stdInclude.excludedBlocks, blocks[iBlock].name)) {
                        blockNames.push(blocks[iBlock].name);
                        categoriesInfos[categoryName].blocksXml.push(blocks[iBlock].blocklyXml);
                    }
                }
                this.addBlocksAllowed(blockNames);
            }
        }

        if(typeof this.includeBlocks.procedures !== 'undefined') {
            var proceduresOptions = this.includeBlocks.procedures;
            if(proceduresOptions.noret) { window.Blockly.Procedures.flyoutOptions.includedBlocks['noret'] = true; }
            if(proceduresOptions.ret) { window.Blockly.Procedures.flyoutOptions.includedBlocks['ret'] = true; }
            if(proceduresOptions.ifret) { window.Blockly.Procedures.flyoutOptions.includedBlocks['ifret'] = true; }
            window.Blockly.Procedures.flyoutOptions.disableArgs = !!proceduresOptions.disableArgs;
        }

        var singleBlocks = stdInclude.singleBlocks;
        for(var iBlock = 0; iBlock < singleBlocks.length; iBlock++) {
            var blockName = singleBlocks[iBlock];
            if(blockName == 'procedures_defnoreturn') {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['noret'] = true;
            } else if(blockName == 'procedures_defreturn') {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['ret'] = true;
            } else if(blockName == 'procedures_ifreturn') {
                window.Blockly.Procedures.flyoutOptions.includedBlocks['ifret'] = true;
            } else {
                continue;
            }
            // If we're here, a block has been found
            this.addBlocksAllowed([blockName, 'procedures_callnoreturn', 'procedures_callreturn']);
            singleBlocks.splice(iBlock, 1);
            iBlock--;
        }
        if(window.Blockly.Procedures.flyoutOptions.includedBlocks['noret']
            || window.Blockly.Procedures.flyoutOptions.includedBlocks['ret']
            || window.Blockly.Procedures.flyoutOptions.includedBlocks['ifret']) {
            if(window.Blockly.Procedures.flyoutOptions.includedBlocks['noret']) {
                this.addBlocksAllowed(['procedures_defnoreturn', 'procedures_callnoreturn']);
            }
            if(window.Blockly.Procedures.flyoutOptions.includedBlocks['ret']) {
                this.addBlocksAllowed(['procedures_defreturn', 'procedures_callreturn']);
            }
            if(window.Blockly.Procedures.flyoutOptions.includedBlocks['ifret']) {
                this.addBlocksAllowed(['procedures_ifreturn']);
            }
            categoriesInfos['functions'] = {
                blocksXml: []
            };
            if(this.scratchMode && !arrayContains(singleBlocks, 'math_number')) {
                singleBlocks.push('math_number'); // TODO :: temporary
            }
            if(!this.includeBlocks.groupByCategory) {
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
                for (var iBlock=0; iBlock < this.includeBlocks.variablesOnlyBlocks.length; iBlock++) {
                    window.Blockly.Variables.flyoutOptions.includedBlocks[this.includeBlocks.variablesOnlyBlocks[iBlock]] = true;
                }
            }

            var varAnyIdx = window.Blockly.Variables.flyoutOptions.fixed.indexOf('*');
            if(varAnyIdx > -1) {
                window.Blockly.Variables.flyoutOptions.fixed.splice(varAnyIdx, 1);
                window.Blockly.Variables.flyoutOptions.any = true;
            }

            var blocksXml = window.Blockly.Variables.flyoutCategory();
            var xmlSer = new XMLSerializer();
            for(var i=0; i<blocksXml.length; i++) {
                blocksXml[i] = xmlSer.serializeToString(blocksXml[i]);
            }

            categoriesInfos["variables"] = {
                blocksXml: blocksXml,
                colour: 330
            }
        }

        if(window.Blockly.Variables.flyoutOptions.includedBlocks['get']) {
            this.addBlocksAllowed(['variables_get']);
        }
        if(window.Blockly.Variables.flyoutOptions.includedBlocks['set']) {
            this.addBlocksAllowed(['variables_set']);
        }
        if(window.Blockly.Variables.flyoutOptions.includedBlocks['incr']) {
            this.addBlocksAllowed(['math_change']);
        }

        var xmlString = "";
        for (var categoryName in categoriesInfos) {
            var categoryInfo = categoriesInfos[categoryName];
            if (this.includeBlocks.groupByCategory) {
                var colour = categoryInfo.colour;
                if (typeof(colour) == "undefined") {
                    colour = colours.categories[categoryName]
                    if (typeof(colour) == "undefined") {
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
            var blocks = categoryInfo.blocksXml;
            for (var iBlock = 0; iBlock < blocks.length; iBlock++) {
                xmlString += blocks[iBlock];
            }
            if (this.includeBlocks.groupByCategory) {
                xmlString += "</category>";
            }
        }

        (function (strings) {
            xmlString = xmlString.replace(/{(\w+)}/g, function(m, p1) {return strings[p1]}); // taken from blockly/demo/code
        })(this.strings);

        return xmlString;
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

    getStdBlocks() {
        return this.scratchMode ? this.getStdScratchBlocks() : this.getStdBlocklyBlocks();
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

    createGeneratorsAndBlocks() {
        var customGenerators = this.context.customBlocks;
        for (var objectName in customGenerators) {
            for (var categoryName in customGenerators[objectName]) {
                var category = customGenerators[objectName][categoryName];
                for (var iBlock = 0; iBlock < category.length; iBlock++) {
                    var block = category[iBlock];

                    /* TODO: Allow library writers to provide their own JS/Python code instead of just a handler */
                    this.completeBlockHandler(block, objectName, this.context);
                    this.completeBlockJson(block, objectName, categoryName, this.context); /* category.category is category name */
                    this.completeBlockXml(block);
                    this.completeCodeGenerators(block, objectName);
                    this.applyCodeGenerators(block);
                    this.createBlock(block);
                }
// TODO: Anything of this still needs to be done?
//this.createGenerator(label, objectName + "." + code, generator.type, generator.nbParams);
//this.createBlock(label, generator.labelFr, generator.type, generator.nbParams);
            }
        }
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
            for (var iParam = 0; iParam < block.params.length; iParam++) {
                var param = {
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
            block.blocklyJson.message0 = context.strings.label[block.name];
// TODO: Load default colours + custom styles
            if (typeof block.blocklyJson.message0 == "undefined") {
                block.blocklyJson.message0 = "<translation missing: " + block.name + ">";
            }

            // append all missing params to the message string
            if (typeof block.blocklyJson.args0 != "undefined") {
                var alreadyInserted = (block.blocklyJson.message0.match(/%/g) || []).length;
                for (var iArgs0 = alreadyInserted; iArgs0 < block.blocklyJson.args0.length; iArgs0++) {
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
                var colours = this.getDefaultColours();
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

        var that = this;

        // for closure:
        var args0 = blockInfo.blocklyJson.args0;
        var code = this.context.strings.code[blockInfo.name];
        var output = blockInfo.blocklyJson.output;
        var blockParams = blockInfo.params;

        for (var language in {JavaScript: null, Python: null}) {
            if (typeof blockInfo.codeGenerators[language] == "undefined") {
                // Prevent the function name to be used as a variable
                window.Blockly[language].addReservedWords(code);

                function setCodeGeneratorForLanguage(language) {
                    blockInfo.codeGenerators[language] = function (block) {
                        var params = "";

                        /* There are three kinds of input: value_input, statement_input and dummy_input,
                           We should definitely consider value_input here and not consider dummy_input here.

                           I don't know how statement_input is handled best, so I'll ignore it first -- Robert
                         */
                        var iParam = 0;
                        for (var iArgs0 in args0) {
                            if (args0[iArgs0].type == "input_value") {
                                if (iParam) {
                                    params += ", ";
                                }
                                params += window.Blockly[language].valueToCode(block, 'PARAM_' + iParam, window.Blockly[language].ORDER_ATOMIC);
                                iParam += 1;
                            }
                            if (args0[iArgs0].type == "field_number"
                                || args0[iArgs0].type == "field_angle"
                                || args0[iArgs0].type == "field_dropdown"
                                || args0[iArgs0].type == "field_input") {
                                if (iParam) {
                                    params += ", ";
                                }
                                var fieldValue = block.getFieldValue('PARAM_' + iParam);
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

                        var callCode = code + '(' + params + ')';
                        // Add reportValue to show the value in step-by-step mode
                        if (that.reportValues) {
                            var reportedCode = "reportBlockValue('" + block.id + "', " + callCode + ")";
                        } else {
                            var reportedCode = callCode;
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
        if (typeof block.blocklyInit == "undefined") {
            const blocklyjson = block.blocklyJson;
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

    createSimpleGeneratorsAndBlocks() {
        for (var genName in this.simpleGenerators) {
            for (var iGen = 0; iGen < this.simpleGenerators[genName].length; iGen++) {
                var generator = this.simpleGenerators[genName][iGen];
                if(genName == '.') {
                    var label = generator.label + "__";
                    var code = generator.code;
                } else {
                    var label = genName + "_" + generator.label + "__";
                    var code = genName + "." + generator.code;
                }
                this.createSimpleGenerator(label, code, generator.type, generator.nbParams);
                // TODO :: merge createSimpleBlock with completeBlock*
                this.createSimpleBlock(label, generator.label, generator.type, generator.nbParams);
            }
        }
    }


    createSimpleGenerator(label, code, type, nbParams) {
        var jsDefinitions = this.definitions['javascript'] ? this.definitions['javascript'] : [];
        var pyDefinitions = this.definitions['python'] ? this.definitions['python'] : [];

        // Prevent the function name to be used as a variable
        Blockly.JavaScript.addReservedWords(code);
        Blockly.Python.addReservedWords(code);

        Blockly.JavaScript[label] = function(block) {
            for (var iDef=0; iDef < jsDefinitions.length; iDef++) {
                var def = jsDefinitions[iDef];
                Blockly.Javascript.definitions_[def.label] = def.code;
            }
            var params = "";
            for (var iParam = 0; iParam < nbParams; iParam++) {
                if (iParam != 0) {
                    params += ", ";
                }
                params += Blockly.JavaScript.valueToCode(block, 'NAME_' + (iParam + 1), Blockly.JavaScript.ORDER_ATOMIC);
            }
            if (type == 0) {
                return code + "(" + params + ");\n";
            } else if (type == 1){
                return [code + "(" + params + ")", Blockly.JavaScript.ORDER_NONE];
            }
        };
        window.Blockly.Python[label] = function(block) {
            for (var iDef=0; iDef < pyDefinitions.length; iDef++) {
                var def = pyDefinitions[iDef];
                window.Blockly.Python.definitions_[def.label] = def.code;
            }
            var params = "";
            for (var iParam = 0; iParam < nbParams; iParam++) {
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
        };
    }

    createSimpleBlock(label, code, type, nbParams) {
        window.Blockly.Blocks[label] = {
            init: function() {
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
                for (var iParam = 0; iParam < nbParams; iParam++) {
                    this.appendValueInput("NAME_" + (iParam + 1)).setCheck(null);
                }
                this.setColour(210);
                this.setTooltip('');
                this.setHelpUrl('');
            }
        };
    }

    getStdBlocklyBlocks() {
        return {
            input: [
                {
                    name: "input_num",
                    blocklyXml: "<block type='input_num'></block>"
                },
                {
                    name: "input_num_list",
                    blocklyXml: "<block type='input_num_list'></block>"
                },
                {
                    name: "input_line",
                    blocklyXml: "<block type='input_line'></block>"
                },
                {
                    name: "input_num_next",
                    blocklyXml: "<block type='input_num_next'></block>"
                },
                {
                    name: "input_char",
                    blocklyXml: "<block type='input_char'></block>"
                },
                {
                    name: "input_word",
                    blocklyXml: "<block type='input_word'></block>"
                }
            ],
            logic: [
                {
                    name: "controls_if",
                    blocklyXml: "<block type='controls_if'>" +
                        this.getPlaceholderBlock('DO0') +
                        "</block>"
                },
                {
                    name: "controls_if_else",
                    blocklyXml: "<block type='controls_if'><mutation else='1'></mutation>" +
                        this.getPlaceholderBlock('DO0') +
                        this.getPlaceholderBlock('ELSE') +
                        "</block>",
                    excludedByDefault: this.mainContext ? this.mainContext.showIfMutator : false
                },
                {
                    name: "logic_compare",
                    blocklyXml: "<block type='logic_compare'></block>"
                },
                {
                    name: "logic_operation",
                    blocklyXml: "<block type='logic_operation' inline='false'></block>"
                },
                {
                    name: "logic_negate",
                    blocklyXml: "<block type='logic_negate'></block>"
                },
                {
                    name: "logic_boolean",
                    blocklyXml: "<block type='logic_boolean'></block>"
                },
                {
                    name: "logic_null",
                    blocklyXml: "<block type='logic_null'></block>",
                    excludedByDefault: true
                },
                {
                    name: "logic_ternary",
                    blocklyXml: "<block type='logic_ternary'></block>",
                    excludedByDefault: true
                }
            ],
            loops: [
                {
                    name: "controls_loop",
                    blocklyXml: "<block type='controls_loop'></block>",
                    excludedByDefault: true
                },
                {
                    name: "controls_repeat",
                    blocklyXml: "<block type='controls_repeat'>" +
                        this.getPlaceholderBlock('DO') +
                        "</block>",
                    excludedByDefault: true
                },
                {
                    name: "controls_repeat_ext",
                    blocklyXml: "<block type='controls_repeat_ext'>" +
                        "  <value name='TIMES'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>10</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        this.getPlaceholderBlock('DO') +
                        "</block>"
                },
                {
                    name: "controls_repeat_ext_noShadow",
                    blocklyXml: "<block type='controls_repeat_ext'></block>",
                    excludedByDefault: true
                },
                {
                    name: "controls_whileUntil",
                    blocklyXml: "<block type='controls_whileUntil'></block>"
                },
                {
                    name: "controls_untilWhile",
                    blocklyXml: "<block type='controls_whileUntil'><field name='MODE'>UNTIL</field></block>",
                    excludedByDefault: true
                },
                {
                    name: "controls_for",
                    blocklyXml: "<block type='controls_for'>" +
                        "  <value name='FROM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='TO'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>10</field>" +
                        "     </shadow>" +
                        "  </value>" +
                        "  <value name='BY'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "controls_for_noShadow",
                    blocklyXml: "<block type='controls_for'></block>",
                    excludedByDefault: true
                },
                {
                    name: "controls_for_fillShadow",
                    blocklyXml: "<block type='controls_for'>" +
                        "  <value name='FROM'>" +
                        "    <block type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </block>" +
                        "  </value>" +
                        "  <value name='TO'>" +
                        "    <block type='math_number'>" +
                        "      <field name='NUM'>10</field>" +
                        "     </block>" +
                        "  </value>" +
                        "  <value name='BY'>" +
                        "    <block type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </block>" +
                        "  </value>" +
                        "</block>",
                    excludedByDefault: true
                },
                {
                    name: "controls_forEach",
                    blocklyXml: "<block type='controls_forEach'></block>",
                    excludedByDefault: true
                },
                {
                    name: "controls_flow_statements",
                    blocklyXml: "<block type='controls_flow_statements'></block>"
                },
                {
                    name: "controls_infiniteloop",
                    blocklyXml: "<block type='controls_infiniteloop'></block>",
                    excludedByDefault: true
                },
            ],
            math: [
                {
                    name: "math_number",
                    blocklyXml: "<block type='math_number' gap='32'></block>"
                },
                {
                    name: "math_arithmetic",
                    blocklyXml: "<block type='math_arithmetic'>" +
                        "  <value name='A'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='B'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "math_arithmetic_noShadow",
                    blocklyXml: "<block type='math_arithmetic'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_single",
                    blocklyXml: "<block type='math_single'>" +
                        "  <value name='NUM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>9</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "math_single_noShadow",
                    blocklyXml: "<block type='math_single'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_extra_single",
                    blocklyXml: "<block type='math_extra_single'>" +
                        "  <value name='NUM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>9</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    excludedByDefault: true
                },
                {
                    name: "math_extra_single_noShadow",
                    blocklyXml: "<block type='math_extra_single'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_extra_double",
                    blocklyXml: "<block type='math_extra_double'>" +
                        "  <value name='A'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='B'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    excludedByDefault: true
                },
                {
                    name: "math_extra_double",
                    blocklyXml: "<block type='math_extra_double'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_trig",
                    blocklyXml: "<block type='math_trig'>" +
                        "  <value name='NUM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>45</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    excludedByDefault: true
                },
                {
                    name: "math_trig_noShadow",
                    blocklyXml: "<block type='math_trig'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_constant",
                    blocklyXml: "<block type='math_constant'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_number_property",
                    blocklyXml: "<block type='math_number_property'>" +
                        "  <value name='NUMBER_TO_CHECK'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "math_number_property_noShadow",
                    blocklyXml: "<block type='math_number_property'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_round",
                    blocklyXml: "<block type='math_round'>" +
                        "  <value name='NUM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>3.1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "math_round_noShadow",
                    blocklyXml: "<block type='math_round'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_on_list",
                    blocklyXml: "<block type='math_on_list'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_modulo",
                    blocklyXml: "<block type='math_modulo'>" +
                        "  <value name='DIVIDEND'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>64</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='DIVISOR'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>10</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "math_modulo_noShadow",
                    blocklyXml: "<block type='math_modulo'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_constrain",
                    blocklyXml: "<block type='math_constrain'>" +
                        "  <value name='VALUE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>50</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='LOW'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='HIGH'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>100</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    excludedByDefault: true
                },
                {
                    name: "math_constrain_noShadow",
                    blocklyXml: "<block type='math_constrain'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_random_int",
                    blocklyXml: "<block type='math_random_int'>" +
                        "  <value name='FROM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='TO'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>100</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    excludedByDefault: true
                },
                {
                    name: "math_random_int_noShadow",
                    blocklyXml: "<block type='math_random_int'></block>",
                    excludedByDefault: true
                },
                {
                    name: "math_random_float",
                    blocklyXml: "<block type='math_random_float'></block>",
                    excludedByDefault: true
                }
            ],
            texts: [
                {
                    name: "text",
                    blocklyXml: "<block type='text'></block>"
                },
                {
                    name: "text_eval",
                    blocklyXml: "<block type='text_eval'></block>"
                },
                {
                    name: "text_print",
                    blocklyXml: "<block type='text_print'>" +
                        "  <value name='TEXT'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_print_noend",
                    blocklyXml: "<block type='text_print_noend'>" +
                        "  <value name='TEXT'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_join",
                    blocklyXml: "<block type='text_join'></block>"
                },
                {
                    name: "text_append",
                    blocklyXml: "<block type='text_append'></block>"
                },
                {
                    name: "text_length",
                    blocklyXml: "<block type='text_length'>" +
                        "  <value name='VALUE'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_length_noShadow",
                    blocklyXml: "<block type='text_length'></block>",
                    excludedByDefault: true
                },
                {
                    name: "text_isEmpty",
                    blocklyXml: "<block type='text_isEmpty'>" +
                        "  <value name='VALUE'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'></field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_isEmpty_noShadow",
                    blocklyXml: "<block type='text_isEmpty'></block>",
                    excludedByDefault: true
                },
                {
                    name: "text_indexOf",
                    blocklyXml: "<block type='text_indexOf'>" +
                        "  <value name='VALUE'>" +
                        "    <block type='variables_get'>" +
                        "      <field name='VAR'>{textVariable}</field>" +
                        "    </block>" +
                        "  </value>" +
                        "  <value name='FIND'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_indexOf_noShadow",
                    blocklyXml: "<block type='text_indexOf'></block>",
                    excludedByDefault: true
                },
                {
                    name: "text_charAt",
                    blocklyXml: "<block type='text_charAt'>" +
                        "  <value name='VALUE'>" +
                        "    <block type='variables_get'>" +
                        "      <field name='VAR'>{textVariable}</field>" +
                        "    </block>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_charAt_noShadow",
                    blocklyXml: "<block type='text_charAt'></block>",
                    excludedByDefault: true

                },
                {
                    name: "text_getSubstring",
                    blocklyXml: "<block type='text_getSubstring'>" +
                        "  <value name='STRING'>" +
                        "    <block type='variables_get'>" +
                        "      <field name='VAR'>{textVariable}</field>" +
                        "    </block>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_getSubstring_noShadow",
                    blocklyXml: "<block type='text_getSubstring'></block>",
                    excludedByDefault: true
                },
                {
                    name: "text_changeCase",
                    blocklyXml: "<block type='text_changeCase'>" +
                        "  <value name='TEXT'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_changeCase_noShadow",
                    blocklyXml: "<block type='text_changeCase'></block>",
                    excludedByDefault: true
                },
                {
                    name: "text_trim",
                    blocklyXml: "<block type='text_trim'>" +
                        "  <value name='TEXT'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_trim_noShadow",
                    blocklyXml: "<block type='text_trim'></block>",
                    excludedByDefault: true
                },
                {
                    name: "text_print_noShadow",
                    blocklyXml: "<block type='text_print'></block>",
                    excludedByDefault: true
                },
                {
                    name: "text_prompt_ext",
                    blocklyXml: "<block type='text_prompt_ext'>" +
                        "  <value name='TEXT'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    excludedByDefault: true
                },
                {
                    name: "text_prompt_ext_noShadow",
                    blocklyXml: "<block type='text_prompt_ext'></block>",
                    excludedByDefault: true
                }
            ],
            lists: [
                {
                    name: "lists_create_with_empty",
                    blocklyXml: "<block type='lists_create_with'>" +
                        "  <mutation items='0'></mutation>" +
                        "</block>"
                },
                {
                    name: "lists_create_with",
                    blocklyXml: "<block type='lists_create_with'></block>"
                },
                {
                    name: "lists_repeat",
                    blocklyXml: "<block type='lists_repeat'>" +
                        "  <value name='NUM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>5</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "lists_length",
                    blocklyXml: "<block type='lists_length'></block>"
                },
                {
                    name: "lists_isEmpty",
                    blocklyXml: "<block type='lists_isEmpty'></block>"
                },
                {
                    name: "lists_indexOf",
                    blocklyXml: "<block type='lists_indexOf'>" +
                        "  <value name='VALUE'>" +
                        "    <block type='variables_get'>" +
                        "      <field name='VAR'>{listVariable}</field>" +
                        "    </block>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "lists_getIndex",
                    blocklyXml: "<block type='lists_getIndex'>" +
                        "  <value name='VALUE'>" +
                        "    <block type='variables_get'>" +
                        "      <field name='VAR'>{listVariable}</field>" +
                        "    </block>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "lists_setIndex",
                    blocklyXml: "<block type='lists_setIndex'>" +
                        "  <value name='LIST'>" +
                        "    <block type='variables_get'>" +
                        "      <field name='VAR'>{listVariable}</field>" +
                        "    </block>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "lists_getSublist",
                    blocklyXml: "<block type='lists_getSublist'>" +
                        "  <value name='LIST'>" +
                        "    <block type='variables_get'>" +
                        "      <field name='VAR'>{listVariable}</field>" +
                        "    </block>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "lists_sort_place",
                    blocklyXml: "<block type='lists_sort_place'><field name='VAR'>{listVariable}</field></block>"
                },
                {
                    name: "lists_sort",
                    blocklyXml: "<block type='lists_sort'></block>"
                },
                {
                    name: "lists_split",
                    blocklyXml: "<block type='lists_split'>" +
                        "  <value name='DELIM'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>,</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "lists_append",
                    blocklyXml: "<block type='lists_append'><field name='VAR'>{listVariable}</field></block>"
                }
            ],
            tables: [
                {
                    name: "tables_2d_init",
                    blocklyXml: "<block type='tables_2d_init'>" +
                        "  <value name='LINES'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COLS'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_2d_set",
                    blocklyXml: "<block type='tables_2d_set'>" +
                        "  <value name='LINE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COL'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_2d_get",
                    blocklyXml: "<block type='tables_2d_get'>" +
                        "  <value name='LINE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COL'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_3d_init",
                    blocklyXml: "<block type='tables_3d_init'>" +
                        "  <value name='LAYERS'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='LINES'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COLS'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_3d_set",
                    blocklyXml: "<block type='tables_3d_set'>" +
                        "  <value name='LAYER'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='LINE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COL'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_3d_get",
                    blocklyXml: "<block type='tables_3d_get'>" +
                        "  <value name='LAYER'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='LINE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COL'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                }
            ],
            // Note :: this category is not enabled unless explicitly specified
            colour: [
                {
                    name: "colour_picker",
                    blocklyXml: "<block type='colour_picker'></block>"
                },
                {
                    name: "colour_random",
                    blocklyXml: "<block type='colour_random'></block>"
                },
                {
                    name: "colour_rgb",
                    blocklyXml: "<block type='colour_rgb'>" +
                        "  <value name='RED'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>100</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='GREEN'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>50</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='BLUE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "colour_rgb_noShadow",
                    blocklyXml: "<block type='colour_rgb'></block>",
                    excludedByDefault: true
                },
                {
                    name: "colour_blend",
                    blocklyXml: "<block type='colour_blend'>" +
                        "  <value name='COLOUR1'>" +
                        "    <shadow type='colour_picker'>" +
                        "      <field name='COLOUR'>#ff0000</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COLOUR2'>" +
                        "    <shadow type='colour_picker'>" +
                        "      <field name='COLOUR'>#3333ff</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='RATIO'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0.5</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "colour_blend_noShadow",
                    blocklyXml: "<block type='colour_blend'></block>",
                    excludedByDefault: true
                }
            ],
            dicts: [
                {
                    name: "dicts_create_with",
                    blocklyXml: "<block type='dicts_create_with'></block>"
                },
                {
                    name: "dict_get_literal",
                    blocklyXml: "<block type='dict_get_literal'></block>"
                },
                {
                    name: "dict_set_literal",
                    blocklyXml: "<block type='dict_set_literal'></block>"
                },
                {
                    name: "dict_keys",
                    blocklyXml: "<block type='dict_keys'></block>"
                }
            ],
            variables: [],
            functions: []
        };
    }

    getStdScratchBlocks() {
        // TODO :: make the list of standard scratch blocks
        return {
            control: [
                {
                    name: "control_if",
                    blocklyXml: "<block type='control_if'>" +
                        this.getPlaceholderBlock('SUBSTACK') +
                        "</block>"
                },
                {
                    name: "control_if_else",
                    blocklyXml: "<block type='control_if_else'>" +
                        this.getPlaceholderBlock('SUBSTACK') +
                        this.getPlaceholderBlock('SUBSTACK2') +
                        "</block>"
                },
                {
                    name: "control_repeat",
                    blocklyXml: "<block type='control_repeat'>" +
                        "  <value name='TIMES'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>10</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        this.getPlaceholderBlock('SUBSTACK') +
                        "</block>"
                },
                {
                    name: "control_repeat_until",
                    blocklyXml: "<block type='control_repeat_until'>" +
                        this.getPlaceholderBlock('SUBSTACK') +
                        "</block>"
                },
                {
                    name: "control_forever",
                    blocklyXml: "<block type='control_forever'></block>",
                    excludedByDefault: true
                }
            ],
            input: [
                {
                    name: "input_num",
                    blocklyXml: "<block type='input_num'></block>"
                },
                {
                    name: "input_num_list",
                    blocklyXml: "<block type='input_num_list'></block>"
                },
                {
                    name: "input_line",
                    blocklyXml: "<block type='input_line'></block>"
                },
                {
                    name: "input_num_next",
                    blocklyXml: "<block type='input_num_next'></block>"
                },
                {
                    name: "input_char",
                    blocklyXml: "<block type='input_char'></block>"
                },
                {
                    name: "input_word",
                    blocklyXml: "<block type='input_word'></block>"
                }
            ],
            lists: [
                {
                    name: "data_listrepeat",
                    blocklyXml: "<block type='data_listrepeat'>" +
                        "  <field name='LIST'>" + (this.strings ? this.strings.listVariable : 'list') + "</field>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'></field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='TIMES'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "data_itemoflist",
                    blocklyXml: "<block type='data_itemoflist'>" +
                        "  <field name='LIST'>" + (this.strings ? this.strings.listVariable : 'list') + "</field>" +
                        "  <value name='INDEX'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "data_replaceitemoflist",
                    blocklyXml: "<block type='data_replaceitemoflist'>" +
                        "  <field name='LIST'>" + (this.strings ? this.strings.listVariable : 'list') + "</field>" +
                        "  <value name='INDEX'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'></field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "lists_sort_place",
                    blocklyXml: "<block type='lists_sort_place'><field name='VAR'>{listVariable}</field></block>"
                }
            ],
            math: [
                {
                    name: "math_number",
                    blocklyXml: "<block type='math_number' gap='32'></block>"
                }
            ],
            operator: [
                {
                    name: "operator_add",
                    blocklyXml: "<block type='operator_add'>" +
                        "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_subtract",
                    blocklyXml: "<block type='operator_subtract'>" +
                        "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_multiply",
                    blocklyXml: "<block type='operator_multiply'>" +
                        "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_divide",
                    blocklyXml: "<block type='operator_divide'>" +
                        "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_dividefloor",
                    blocklyXml: "<block type='operator_dividefloor'>" +
                        "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_equals",
                    blocklyXml: "<block type='operator_equals'>" +
                        "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_gt",
                    blocklyXml: "<block type='operator_gt'>" +
                        "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_gte",
                    blocklyXml: "<block type='operator_gte'>" +
                        "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_lt",
                    blocklyXml: "<block type='operator_lt'>" +
                        "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_lte",
                    blocklyXml: "<block type='operator_lte'>" +
                        "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                        "</block>"
                },
                {
                    name: "operator_and",
                    blocklyXml: "<block type='operator_and'></block>"
                },
                {
                    name: "operator_or",
                    blocklyXml: "<block type='operator_or'></block>"
                },
                {
                    name: "operator_not",
                    blocklyXml: "<block type='operator_not'></block>"
                },
                {
                    name: "operator_join",
                    blocklyXml: "<block type='operator_join'>" +
                        "  <value name='STRING1'><shadow type='text'><field name='TEXT'></field></shadow></value>" +
                        "  <value name='STRING2'><shadow type='text'><field name='TEXT'></field></shadow></value>" +
                        "</block>"
                }
            ],
            tables: [
                {
                    name: "tables_2d_init",
                    blocklyXml: "<block type='tables_2d_init'>" +
                        "  <value name='LINES'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COLS'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_2d_set",
                    blocklyXml: "<block type='tables_2d_set'>" +
                        "  <value name='LINE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COL'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_2d_get",
                    blocklyXml: "<block type='tables_2d_get'>" +
                        "  <value name='LINE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COL'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_3d_init",
                    blocklyXml: "<block type='tables_3d_init'>" +
                        "  <value name='LAYERS'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='LINES'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COLS'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_3d_set",
                    blocklyXml: "<block type='tables_3d_set'>" +
                        "  <value name='LAYER'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='LINE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COL'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='ITEM'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "tables_3d_get",
                    blocklyXml: "<block type='tables_3d_get'>" +
                        "  <value name='LAYER'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>2</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='LINE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "  <value name='COL'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>1</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                }
            ],
            texts: [
                {
                    name: "text_print",
                    blocklyXml: "<block type='text_print'>" +
                        "  <value name='TEXT'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_print_noend",
                    blocklyXml: "<block type='text_print_noend'>" +
                        "  <value name='TEXT'>" +
                        "    <shadow type='text'>" +
                        "      <field name='TEXT'>abc</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>"
                },
                {
                    name: "text_eval",
                    blocklyXml: "<block type='text_eval'></block>"
                }
            ],
            variables: [],
            functions: []
        };
    }

    getPlaceholderBlock(name) {
        return this.placeholderBlocks ? "<statement name='" + name + "'><shadow type='placeholder_statement'></shadow></statement>" : '';
    }
}
