import * as Blockly from 'blockly/core';
import {Block, BlockType} from '../../task/blocks/block_types';
import {BlocklyColours} from './blockly_types';
import {getStandardBlocks} from './standard_blocks';
import {setProceduresDisableArgs} from './blocks/procedures';

const blocklySets = {
    allDefault: {
        wholeCategories: ["input", "logic", "loops", "math", "texts", "lists", "dicts", "tables", "variables", "functions"]
    },
    allJls: {
        wholeCategories: ["input", "logic", "loops", "math", "texts", "lists", "dicts", "tables", "variables", "functions"],
        excludedBlocks: ['text_eval', 'text_print', 'text_print_noend']
    }
};

// Blockly to Scratch translations
const blocklyToScratch = {
    wholeCategories: {
        'loops': 'control',
        'logic': 'operator',
        'math': 'operator'
    }
};

/**
 * Everything the toolbox generation needs from the Blockly helper. Passed in
 * explicitly rather than reading the helper, so this module stays independent
 * from it.
 */
export interface ToolboxOptions {
    scratchMode: boolean;
    groupByCategory: boolean;
    placeholderBlocks: boolean;
    showIfMutator: boolean;
    strings: any;
    colours: BlocklyColours;
    includeBlocks: any;
    availableBlocks: Block[];
    availableBlocksInfo: Record<string, Record<string, Record<string, Block>>>;
    simpleGenerators: {[generatorName: string]: {label: string, code: string, category: string, type: number, nbParams: number}[]};
    transcribeBlocks: (blockList: string[]) => string[];
    addBlocksAllowed: (blocks: string[]) => void;
}

function getBlockXmlInfo(generatorStruct, blockName) {
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

function getBlockFromCustomBlocks(availableBlocksInfo: ToolboxOptions['availableBlocksInfo'], generatorName: string, category: string, name: string) {
    if (!(generatorName in availableBlocksInfo)) {
        throw new Error(`Generator not found: ${generatorName}`);
    }
    if (!(category in availableBlocksInfo[generatorName])) {
        throw new Error(`Category not found in generator ${generatorName}: ${category}`);
    }
    if (!(name in availableBlocksInfo[generatorName][category])) {
        throw new Error(`Block not found in generator ${generatorName} and category ${category}: ${name}`);
    }

    return availableBlocksInfo[generatorName][category][name];
}

function addBlocksAndCategories(blockNames, blocksDefinition, categoriesInfos, options: ToolboxOptions) {
    let colours = options.colours;
    for (let iBlock = 0; iBlock < blockNames.length; iBlock++) {
        let blockName = blockNames[iBlock];
        let blockXmlInfo = getBlockXmlInfo(blocksDefinition, blockName);
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

        if (!(blockName in Blockly.Blocks)) {
            throw new Error(`Block not found: ${blockName}`);
        }

        if (!Blockly.Blocks[blockName].oldInit) {
            Blockly.Blocks[blockName].oldInit = Blockly.Blocks[blockName].init;
        }
        const oldInit = Blockly.Blocks[blockName].oldInit;
        Blockly.Blocks[blockName].init = function() {
            oldInit.call(this);
            this.setStyle(`${categoryName}_blocks`);
        };

        options.addBlocksAllowed([blockName]);
    }
}

export function getToolboxXml(options: ToolboxOptions) {
    let categoriesInfos = {};
    let colours = options.colours;

    // TODO Blockly: re-enable variables and procedures code when FioiBlockly will be migrated

    // Reset the flyoutOptions for the variables and the procedures
    // Blockly.Variables.resetFlyoutOptions();
    // Blockly.Procedures.resetFlyoutOptions();

    options.addBlocksAllowed(['robot_start', 'placeholder_statement']);
    if (options.scratchMode) {
        options.addBlocksAllowed(['math_number', 'text']);
    }

    // *** Blocks from the lib
    for (let block of options.availableBlocks) {
        if (BlockType.Function !== block.type) {
            continue;
        }

        // Don't show printer lib blocks if similar Blockly standard blocks are already included
        if ('printer' === block.generatorName && 'print' === block.name && options.includeBlocks?.standardBlocks?.singleBlocks?.includes('text_print')) {
            continue;
        }
        if ('printer' === block.generatorName && 'read' === block.name && options.includeBlocks?.standardBlocks?.singleBlocks?.includes('input_num')) {
            continue;
        }

        const blockInfo = getBlockFromCustomBlocks(options.availableBlocksInfo, block.generatorName, block.category, block.name);

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
        options.addBlocksAllowed([block.name]);
    }

    for (let genName in options.simpleGenerators) {
        for (let iGen = 0; iGen < options.simpleGenerators[genName].length; iGen++) {
            let generator = options.simpleGenerators[genName][iGen];
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
    let stdBlocks = getStandardBlocks(options.scratchMode, options.placeholderBlocks, options.showIfMutator);

    // It is normally executed during load, but for
    let taskStdInclude = (options.includeBlocks && options.includeBlocks.standardBlocks) || {};
    let tsiSingleBlocks = taskStdInclude.singleBlocks || [];
    tsiSingleBlocks = options.transcribeBlocks(tsiSingleBlocks);
    let stdInclude = {
        wholeCategories: [],
        singleBlocks: [],
        excludedBlocks: []
    };

    // Merge all lists into stdInclude
    if (taskStdInclude.includeAll) {
        if (options.scratchMode) {
            stdInclude.wholeCategories = ["control", "input", "lists", "operator", "math", "tables", "texts", "variables", "functions"];
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
        if (options.scratchMode && !taskStdInclude.includeAll && blocklyToScratch.wholeCategories[categoryName]) {
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
        // if (categoryName == 'variables') {
        //     Blockly.Variables.flyoutOptions.any = true;
        //     continue;
        // } else if (categoryName == 'functions') {
        //     Blockly.Procedures.flyoutOptions.includedBlocks = {noret: true, ret: true, ifret: true, noifret: true};
        //     continue;
        // }
        let blocks = stdBlocks[categoryName];
        if (blocks) {
            if (!(blocks instanceof Array)) { // just for now, maintain backwards compatibility
                blocks = blocks.blocks;
            }

            let blockNames = [];
            for (let iBlock = 0; iBlock < blocks.length; iBlock++) {
                if (!(blocks[iBlock].excludedByDefault) && !window.arrayContains(stdInclude.excludedBlocks, blocks[iBlock].name)) {
                    const blockName = blocks[iBlock].name;
                    blockNames.push(blockName);
                }
            }

            addBlocksAndCategories(blockNames, stdBlocks, categoriesInfos, options);
        }
    }

    const proceduresOptions = options.includeBlocks.procedures;
    setProceduresDisableArgs(proceduresOptions && proceduresOptions.disableArgs);
    // TODO Blockly: re-enable when the FioiBlockly procedures flyout will be migrated
    // if (typeof proceduresOptions !== 'undefined') {
    //     if (proceduresOptions.noret) {
    //         Blockly.Procedures.flyoutOptions.includedBlocks['noret'] = true;
    //     }
    //     if (proceduresOptions.ret) {
    //         Blockly.Procedures.flyoutOptions.includedBlocks['ret'] = true;
    //     }
    //     if (proceduresOptions.ifret) {
    //         Blockly.Procedures.flyoutOptions.includedBlocks['ifret'] = true;
    //     }
    //     if (proceduresOptions.noifret) {
    //         Blockly.Procedures.flyoutOptions.includedBlocks['noifret'] = true;
    //     }
    // }
    //
    let singleBlocks = stdInclude.singleBlocks;
    // for (let iBlock = 0; iBlock < singleBlocks.length; iBlock++) {
    //     let blockName = singleBlocks[iBlock];
    //     if (blockName == 'procedures_defnoreturn') {
    //         Blockly.Procedures.flyoutOptions.includedBlocks['noret'] = true;
    //     } else if (blockName == 'procedures_defreturn') {
    //         Blockly.Procedures.flyoutOptions.includedBlocks['ret'] = true;
    //     } else if (blockName == 'procedures_ifreturn') {
    //         Blockly.Procedures.flyoutOptions.includedBlocks['ifret'] = true;
    //     } else if (blockName == 'procedures_return') {
    //         Blockly.Procedures.flyoutOptions.includedBlocks['noifret'] = true;
    //     } else {
    //         continue;
    //     }
    //     // If we're here, a block has been found
    //     options.addBlocksAllowed([blockName, 'procedures_callnoreturn', 'procedures_callreturn']);
    //     singleBlocks.splice(iBlock, 1);
    //     iBlock--;
    // }
    // if (Blockly.Procedures.flyoutOptions.includedBlocks['noret']
    //     || Blockly.Procedures.flyoutOptions.includedBlocks['ret']
    //     || Blockly.Procedures.flyoutOptions.includedBlocks['ifret']
    //     || Blockly.Procedures.flyoutOptions.includedBlocks['noifret']) {
    //     if (Blockly.Procedures.flyoutOptions.includedBlocks['noret']) {
    //         options.addBlocksAllowed(['procedures_defnoreturn', 'procedures_callnoreturn']);
    //     }
    //     if (Blockly.Procedures.flyoutOptions.includedBlocks['ret']) {
    //         options.addBlocksAllowed(['procedures_defreturn', 'procedures_callreturn']);
    //     }
    //     if (Blockly.Procedures.flyoutOptions.includedBlocks['ifret']) {
    //         options.addBlocksAllowed(['procedures_ifreturn', 'procedures_return']);
    //     }
    //     if (Blockly.Procedures.flyoutOptions.includedBlocks['noifret']) {
    //         options.addBlocksAllowed(['procedures_return']);
    //     }
    //     categoriesInfos['functions'] = {
    //         blocksXml: []
    //     };
    //     if (options.scratchMode && !window.arrayContains(singleBlocks, 'math_number')) {
    //         singleBlocks.push('math_number'); // TODO :: temporary
    //     }
    //     if (!options.groupByCategory) {
    //         console.error('Task configuration error: groupByCategory must be activated for functions.');
    //     }
    // }
    addBlocksAndCategories(singleBlocks, stdBlocks, categoriesInfos, options);

    // TODO Blockly: remove this temporary code when FioiBlockly will be enabled
    categoriesInfos['functions'] = {
        blocksXml: `<block type='procedures_defnoreturn'></block>
<block type='procedures_callnoreturn'></block>
<block type='procedures_defreturn'></block>
<block type='procedures_callreturn'></block>
<block type='procedures_ifreturn'></block>
<block type='procedures_return'></block>
`,
    };


    // Handle variable blocks, which are normally automatically added with
    // the VARIABLES category but can be customized here
    // Blockly.Variables.flyoutOptions.anyButton = !!options.groupByCategory;
    if (typeof options.includeBlocks.variables !== 'undefined') {
        // Blockly.Variables.flyoutOptions.fixed = (options.includeBlocks.variables.length > 0) ? options.includeBlocks.variables : [];
        // if (typeof options.includeBlocks.variablesOnlyBlocks !== 'undefined') {
        //     Blockly.Variables.flyoutOptions.includedBlocks = {get: false, set: false, incr: false};
        //     for (let iBlock = 0; iBlock < options.includeBlocks.variablesOnlyBlocks.length; iBlock++) {
        //         Blockly.Variables.flyoutOptions.includedBlocks[options.includeBlocks.variablesOnlyBlocks[iBlock]] = true;
        //     }
        // }

        // let varAnyIdx = Blockly.Variables.flyoutOptions.fixed.indexOf('*');
        // if (varAnyIdx > -1) {
        //     Blockly.Variables.flyoutOptions.fixed.splice(varAnyIdx, 1);
        //     Blockly.Variables.flyoutOptions.any = true;
        // }

        // let blocksXml = Blockly.Variables.flyoutCategory();
        // let xmlSer = new XMLSerializer();
        // for (let i = 0; i < blocksXml.length; i++) {
        //     blocksXml[i] = xmlSer.serializeToString(blocksXml[i]);
        // }
        //
        // categoriesInfos["variables"] = {
        //     blocksXml: blocksXml,
        //     colour: 330
        // }

        // TODO Blockly: remove this temporary code when FioiBlockly will be enabled
        options.addBlocksAllowed(['variables_get', 'variables_set']);
        categoriesInfos["variables"] = {
            blocksXml: `<block type='variables_get'></block><block type='variables_set'></block>`,
        };
    }

    // if (Blockly.Variables.flyoutOptions.includedBlocks['get']) {
    //     options.addBlocksAllowed(['variables_get']);
    // }
    // if (Blockly.Variables.flyoutOptions.includedBlocks['set']) {
    //     options.addBlocksAllowed(['variables_set']);
    // }
    // if (Blockly.Variables.flyoutOptions.includedBlocks['incr']) {
    //     options.addBlocksAllowed(['math_change']);
    // }

    // Disable arguments in procedures if variables are not allowed
    // if (!Blockly.Variables.flyoutOptions.any && proceduresOptions && typeof proceduresOptions.disableArgs == 'undefined') {
    //     Blockly.Procedures.flyoutOptions.disableArgs = true;
    // }

    let orderedCategories = [];
    if (options.includeBlocks.blocksOrder) {
        let blocksOrder = options.includeBlocks.blocksOrder;
        blocksOrder = options.transcribeBlocks(blocksOrder);

        function getBlockIdx(blockXml) {
            let blockType = Blockly.utils.xml.textToDom(blockXml).getAttribute('type');
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
        if (0 === categoryInfo.blocksXml.length) {
            continue;
        }

        if (options.groupByCategory) {
            let colour = categoryInfo.colour;
            if (typeof (colour) == "undefined") {
                colour = colours.categories[categoryName]
                if (typeof (colour) == "undefined") {
                    colour = colours.categories['_default'];
                }
            }
            xmlString += "<category "
                + " name='" + options.strings.categories[categoryName] + "'"
                + " colour='" + colour + "'"
                + (options.scratchMode ? " secondaryColour='" + colour + "'" : '')
                + (categoryName == 'variables' ? ' custom="VARIABLE"' : '')
                + (categoryName == 'functions' ? ' custom="PROCEDURE"' : '')
                + ">";
        }
        let blocks = categoryInfo.blocksXml;
        for (let iBlock = 0; iBlock < blocks.length; iBlock++) {
            xmlString += blocks[iBlock];
        }
        if (options.groupByCategory) {
            xmlString += "</category>";
        }
    }

    (function (strings) {
        xmlString = xmlString.replace(/{(\w+)}/g, function (m, p1) {
            return strings[p1]
        }); // taken from blockly/demo/code
    })(options.strings);

    console.log('toolbox', xmlString);

    return xmlString;
}
