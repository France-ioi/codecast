import * as Blockly from 'blockly/core';
import {Block, BlockType} from '../../task/blocks/block_types';
import {BlocklyColours} from './blockly_types';
import {getStandardBlocks} from './standard_blocks';
import {setProceduresDisableArgs} from './blocks/procedures';
import {QuickalgoLibraryInfos} from '../../task/task_types';

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

const CREATE_VARIABLE_CALLBACK_KEY = 'CREATE_VARIABLE';

const VARIABLE_BLOCK_NAMES = {
    get: 'variables_get',
    set: 'variables_set',
    incr: 'math_change',
};

interface VariablesFlyoutOptions {
    /** Allow to create any variable */
    any: boolean;
    /** Add the button to add variables (needs any=true) */
    anyButton: boolean;
    /** List of fixed variables (will create blocks for each of them) */
    fixed: string[];
    /** Blocks to add to the list */
    includedBlocks: {get: boolean, set: boolean, incr: boolean};
    /** Generate set/incr blocks only for the first (non-fixed) variable */
    shortList: boolean;
    setShadowType: 'number'|null;
}

let variablesFlyoutOptions: VariablesFlyoutOptions;

function resetVariablesFlyoutOptions() {
    variablesFlyoutOptions = {
        any: false,
        anyButton: true,
        fixed: [],
        includedBlocks: {get: true, set: true, incr: true},
        shortList: true,
        setShadowType: null,
    };
}

resetVariablesFlyoutOptions();

function createVariableFieldDom(variableName: string) {
    const field = Blockly.utils.xml.createElement('field');
    field.setAttribute('name', 'VAR');
    field.appendChild(Blockly.utils.xml.createTextNode(variableName));

    return field;
}

function createNumberShadowDom(inputName: string, value: number) {
    const input = Blockly.utils.xml.createElement('value');
    input.setAttribute('name', inputName);

    const shadowBlock = Blockly.utils.xml.createElement('shadow');
    shadowBlock.setAttribute('type', 'math_number');
    input.appendChild(shadowBlock);

    const numberField = Blockly.utils.xml.createElement('field');
    numberField.setAttribute('name', 'NUM');
    numberField.appendChild(Blockly.utils.xml.createTextNode(String(value)));
    shadowBlock.appendChild(numberField);

    return input;
}

/**
 * Characters allowed in variable names by exception to Blockly's rules, so that
 * French names keep their accents instead of being mangled into underscores.
 */
const ALLOWED_SPECIAL_CHARACTERS = 'àâçéèêëïîôùü';

/**
 * Port of FioiBlockly's `Blockly.Names.prototype.safeName_` override: same as
 * Blockly's `Names.safeName`, except the characters above are kept as-is.
 */
function safeVariableName(name: string) {
    if (!name) {
        return Blockly.Msg['UNNAMED_KEY'] || 'unnamed';
    }

    let safeName = '';
    for (let i = 0; i < name.length; i++) {
        const character = name[i];
        if (0 === i && '0123456789'.includes(character)) {
            // Most languages don't allow names with leading numbers.
            safeName = 'my_';
        }
        if (' ' === character) {
            safeName += '_';
        } else if (ALLOWED_SPECIAL_CHARACTERS.includes(character)) {
            safeName += character;
        } else {
            safeName += encodeURI(character).replace(/[^\w]/g, '_');
        }
    }

    return safeName;
}

// Make the code generators use the names the user typed, accents included.
// `safeName` is private in the typings, but it is the method Blockly calls.
(Blockly.Names.prototype as any).safeName = function(name: string) {
    return safeVariableName(name);
};

/**
 * Whether the name is usable as-is as a variable name, i.e. Blockly wouldn't
 * have to mangle it to generate code.
 */
function isSafeVariableName(name: string) {
    if (!name) {
        return false;
    }

    return safeVariableName(name) === name;
}

/**
 * Construct the blocks required by the flyout for the variable category.
 */
function variablesFlyoutCategory(workspace?: Blockly.Workspace): Element[] {
    const xmlList: Element[] = [];
    const options = variablesFlyoutOptions;

    let fullVariableList: string[] = [];
    if (options.any) {
        if (workspace) {
            fullVariableList = workspace.getVariableMap().getAllVariables().map(variable => variable.getName());
        } else if (-1 < options.fixed.indexOf('newvar')) {
            let newVarIdx = 0;
            while (-1 < options.fixed.indexOf('newvar' + newVarIdx)) {
                newVarIdx++;
            }
            fullVariableList = ['newvar' + newVarIdx];
        } else {
            fullVariableList = ['newvar'];
        }

        for (let i = 0; i < options.fixed.length; i++) {
            const idx = fullVariableList.indexOf(options.fixed[i]);
            if (-1 < idx) {
                fullVariableList.splice(idx, 1);
            }
        }
        fullVariableList.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));

        if (options.anyButton) {
            const button = Blockly.utils.xml.createElement('button');
            button.setAttribute('text', Blockly.Msg['NEW_VARIABLE']);
            // Blockly no longer has a default action for buttons: the key is
            // registered by `registerVariablesFlyout`.
            button.setAttribute('callbackKey', CREATE_VARIABLE_CALLBACK_KEY);
            xmlList.push(button);
        }
    }

    const variableList = options.fixed.concat(fullVariableList);
    if (0 === variableList.length) {
        return xmlList;
    }

    // Shared between the three block kinds below.
    const makeBlock = function(blockType: string, i: number) {
        const block = Blockly.utils.xml.createElement('block');
        block.setAttribute('type', blockType);
        if (!options.any && i < options.fixed.length) {
            block.setAttribute('editable', 'false');
        }
        block.setAttribute('gap', i === variableList.length - 1 ? '24' : '8');

        return block;
    };

    if (options.includedBlocks.get && Blockly.Blocks[VARIABLE_BLOCK_NAMES.get]) {
        for (let i = 0; i < variableList.length; i++) {
            // <block type="variables_get" gap="8">
            //   <field name="VAR">item</field>
            // </block>
            const block = makeBlock(VARIABLE_BLOCK_NAMES.get, i);
            block.appendChild(createVariableFieldDom(variableList[i]));
            xmlList.push(block);
        }
    }

    if (options.includedBlocks.set && Blockly.Blocks[VARIABLE_BLOCK_NAMES.set]) {
        for (let i = 0; i < variableList.length; i++) {
            // <block type="variables_set" gap="20">
            //   <field name="VAR">item</field>
            //   <value name="VALUE">
            //     <shadow type="math_number">
            //       <field name="NUM">0</field>
            //     </shadow>
            //   </value>
            // </block>
            if (options.shortList && i > options.fixed.length) {
                break;
            }

            const block = makeBlock(VARIABLE_BLOCK_NAMES.set, i);
            block.appendChild(createVariableFieldDom(variableList[i]));
            if ('number' === options.setShadowType) {
                block.appendChild(createNumberShadowDom('VALUE', 0));
            }
            xmlList.push(block);
        }
    }

    if (options.includedBlocks.incr && Blockly.Blocks[VARIABLE_BLOCK_NAMES.incr]) {
        for (let i = 0; i < variableList.length; i++) {
            // <block type="math_change">
            //   <value name="DELTA">
            //     <shadow type="math_number">
            //       <field name="NUM">1</field>
            //     </shadow>
            //   </value>
            // </block>
            if (options.shortList && i > options.fixed.length) {
                break;
            }

            const block = makeBlock(VARIABLE_BLOCK_NAMES.incr, i);
            block.appendChild(createNumberShadowDom('DELTA', 1));
            block.appendChild(createVariableFieldDom(variableList[i]));
            xmlList.push(block);
        }
    }

    return xmlList;
}

/**
 * Prompt the user for a new variable name, re-prompting while the name isn't
 * usable. Calls back with the new name, or null if the user cancelled or picked
 * something illegal. The callback always runs exactly once, so callers can use
 * it to clean up.
 */
function promptVariableName(promptText: string, defaultText: string, callback: (name: string|null) => void, wasInvalid: boolean = false) {
    const cb = function(newVar: string|null) {
        // Merge runs of whitespace.  Strip leading and trailing whitespace.
        if (newVar) {
            newVar = newVar.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
            // Check name is legal
            if (!isSafeVariableName(newVar)) {
                promptVariableName(promptText, newVar, callback, true);

                return;
            }
            if (newVar === Blockly.Msg['RENAME_VARIABLE'] || newVar === Blockly.Msg['NEW_VARIABLE']) {
                // Ok, not ALL names are legal...
                newVar = null;
            }
        }
        callback(newVar);
    };

    const fullPromptText = wasInvalid
        ? '<i>' + Blockly.Msg['INVALID_NAME'] + '</i><br />' + promptText
        : promptText;

    // The popup only calls `agreeFunc` when it is validated, so dismissing it
    // needs its own path to the callback.
    const onCancel = () => callback(null);

    if (defaultText) {
        window.displayHelper.showPopupMessage(fullPromptText, 'input', null, cb, Blockly.Msg['UNDO'], null, defaultText, onCancel);
    } else {
        window.displayHelper.showPopupMessage(fullPromptText, 'input', null, cb, undefined, undefined, undefined, onCancel);
    }
}

function createVariable(workspace: Blockly.WorkspaceSvg) {
    // Our name prompt is a DOM modal, so opening it moves the focus out of the
    // toolbox — which Blockly answers by auto-hiding the flyout
    // (`Toolbox.onTreeBlur` -> `autoHide`). Nothing to do about it here: the
    // flyout is set never to auto-close (see blockly_helper.ts), so the
    // variables category stays open while the name is being typed, and Blockly
    // refreshes it by itself on VAR_CREATE.
    promptVariableName(Blockly.Msg['NEW_VARIABLE_TITLE'], '', function(text) {
        if (!text) {
            return;
        }
        if (workspace.getVariableMap().getVariable(text)) {
            window.displayHelper.showPopupMessage(
                Blockly.Msg['VARIABLE_ALREADY_EXISTS'].replace('%1', text.toLowerCase()), 'blanket');
        } else {
            workspace.getVariableMap().createVariable(text);
        }
    });
}

/**
 * Rename a variable with the same prompt as when creating one, instead of the
 * `window.prompt` based `Blockly.Variables.renameVariable`. Keeps the checks
 * Blockly does before renaming; `defaultName` is what the prompt starts with,
 * so a rejected name can be offered back for editing.
 */
function renameVariable(workspace: Blockly.Workspace, variable: Blockly.IVariableModel<Blockly.IVariableState>, defaultName: string = variable.getName()) {
    const promptText = Blockly.Msg['RENAME_VARIABLE_TITLE'].replace('%1', variable.getName());

    promptVariableName(promptText, defaultName, function(newName) {
        if (!newName) {
            return;
        }

        // Blockly re-prompts with the refused name once the message is closed.
        const retry = () => renameVariable(workspace, variable, newName);

        // Same name, but held by a variable of another type.
        const otherVariable = Blockly.Variables.nameUsedWithAnyType(newName, workspace);
        if (otherVariable && otherVariable.getType() !== variable.getType()) {
            window.displayHelper.showPopupMessage(
                Blockly.Msg['VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE']
                    .replace('%1', otherVariable.getName())
                    .replace('%2', otherVariable.getType()),
                'blanket', null, retry);

            return;
        }

        const conflictingParameter = Blockly.Variables.nameUsedWithConflictingParam(variable.getName(), newName, workspace);
        if (conflictingParameter) {
            window.displayHelper.showPopupMessage(
                Blockly.Msg['VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER']
                    .replace('%1', newName)
                    .replace('%2', conflictingParameter),
                'blanket', null, retry);

            return;
        }

        workspace.getVariableMap().renameVariable(variable, newName);
    });
}

// FioiBlockly overrode `FieldVariable.prototype.classValidator` to rename
// variables through its own prompt; the modern equivalent is the handler for
// the field dropdown items, which otherwise calls the `window.prompt` based
// `Blockly.Variables.renameVariable`. Deleting a variable is left untouched.
const originalOnItemSelected = (Blockly.FieldVariable.prototype as any).onItemSelected_;
(Blockly.FieldVariable.prototype as any).onItemSelected_ = function(this: Blockly.FieldVariable, menu: Blockly.Menu, menuItem: Blockly.MenuItem) {
    const sourceBlock = this.getSourceBlock();
    const variable = this.getVariable();
    if (Blockly.RENAME_VARIABLE_ID === menuItem.getValue() && variable && sourceBlock && !sourceBlock.isDeadOrDying()) {
        renameVariable(sourceBlock.workspace, variable);

        return;
    }

    originalOnItemSelected.call(this, menu, menuItem);
};

/**
 * Plug our variables flyout into a workspace. Must be called after the
 * workspace is injected, and before its toolbox is displayed.
 */
export function registerVariablesFlyout(workspace: Blockly.WorkspaceSvg) {
    workspace.registerToolboxCategoryCallback(Blockly.Variables.CATEGORY_NAME, variablesFlyoutCategory);
    workspace.registerButtonCallback(CREATE_VARIABLE_CALLBACK_KEY, function(button) {
        createVariable(button.getTargetWorkspace());
    });
}

const PROCEDURE_BLOCK_NAMES = {
    noret: 'procedures_defnoreturn',
    ret: 'procedures_defreturn',
    ifret: 'procedures_ifreturn',
    noifret: 'procedures_return',
};

interface ProceduresFlyoutOptions {
    /** Put the fields of the call blocks inline */
    inlineArgs: boolean;
    /** Blocks to add to the list */
    includedBlocks: {noret: boolean, ret: boolean, ifret: boolean, noifret: boolean};
}

const proceduresFlyoutOptions: ProceduresFlyoutOptions = {
    inlineArgs: false,
    includedBlocks: {noret: false, ret: false, ifret: false, noifret: false},
};

function resetProceduresFlyoutOptions() {
    // `inlineArgs` is deliberately kept: it is set by the app, not by the task.
    proceduresFlyoutOptions.includedBlocks = {noret: false, ret: false, ifret: false, noifret: false};
}

/**
 * Whether the call blocks display their arguments inline. Set by the app, and
 * kept when a new task is loaded.
 */
export function setProceduresInlineArgs(inlineArgs: boolean) {
    proceduresFlyoutOptions.inlineArgs = inlineArgs;
}

/**
 * Construct the blocks required by the flyout for the procedures category:
 * the definition blocks that the task includes, followed by a call block for
 * each function the user has defined.
 */
function proceduresFlyoutCategory(workspace: Blockly.Workspace): Element[] {
    const xmlList: Element[] = [];
    const includedBlocks = proceduresFlyoutOptions.includedBlocks;

    const makeBlock = function(blockType: string) {
        const block = Blockly.utils.xml.createElement('block');
        block.setAttribute('type', blockType);
        block.setAttribute('gap', '16');
        xmlList.push(block);

        return block;
    };

    const appendNameField = function(block: Element, defaultName: string) {
        const nameField = Blockly.utils.xml.createElement('field');
        nameField.setAttribute('name', 'NAME');
        nameField.appendChild(Blockly.utils.xml.createTextNode(defaultName));
        block.appendChild(nameField);
    };

    if (includedBlocks.noret && Blockly.Blocks[PROCEDURE_BLOCK_NAMES.noret]) {
        // <block type="procedures_defnoreturn" gap="16">
        //   <field name="NAME">do something</field>
        // </block>
        appendNameField(makeBlock(PROCEDURE_BLOCK_NAMES.noret), Blockly.Msg['PROCEDURES_DEFNORETURN_PROCEDURE']);
    }

    if (includedBlocks.ret && Blockly.Blocks[PROCEDURE_BLOCK_NAMES.ret]) {
        // <block type="procedures_defreturn" gap="16">
        //   <field name="NAME">do something</field>
        // </block>
        appendNameField(makeBlock(PROCEDURE_BLOCK_NAMES.ret), Blockly.Msg['PROCEDURES_DEFRETURN_PROCEDURE']);
    }

    if (includedBlocks.ifret && Blockly.Blocks[PROCEDURE_BLOCK_NAMES.ifret]) {
        // <block type="procedures_ifreturn" gap="16"></block>
        makeBlock(PROCEDURE_BLOCK_NAMES.ifret);
    }

    if (includedBlocks.noifret && Blockly.Blocks[PROCEDURE_BLOCK_NAMES.noifret]) {
        // <block type="procedures_return" gap="16"></block>
        makeBlock(PROCEDURE_BLOCK_NAMES.noifret);
    }

    if (xmlList.length) {
        // Add slightly larger gap between system blocks and user calls.
        xmlList[xmlList.length - 1].setAttribute('gap', '24');
    }

    const populateProcedures = function(procedureList: Blockly.Procedures.ProcedureTuple[], templateName: string) {
        for (const [name, args] of procedureList) {
            // <block type="procedures_callnoreturn" gap="16">
            //   <mutation name="do something">
            //     <arg name="x"></arg>
            //   </mutation>
            // </block>
            const block = makeBlock(templateName);
            if (proceduresFlyoutOptions.inlineArgs) {
                block.setAttribute('inline', 'true');
            }

            const mutation = Blockly.utils.xml.createElement('mutation');
            mutation.setAttribute('name', name);
            block.appendChild(mutation);

            for (const argName of args) {
                const arg = Blockly.utils.xml.createElement('arg');
                arg.setAttribute('name', argName);
                mutation.appendChild(arg);
            }
        }
    };

    const [noReturnProcedures, returnProcedures] = Blockly.Procedures.allProcedures(workspace);
    populateProcedures(noReturnProcedures, 'procedures_callnoreturn');
    populateProcedures(returnProcedures, 'procedures_callreturn');

    return xmlList;
}

/**
 * Plug our procedures flyout into a workspace. Must be called after the
 * workspace is injected, and before its toolbox is displayed.
 */
export function registerProceduresFlyout(workspace: Blockly.WorkspaceSvg) {
    workspace.registerToolboxCategoryCallback(Blockly.Procedures.CATEGORY_NAME, proceduresFlyoutCategory);
}

/**
 * Everything the toolbox generation needs from the Blockly helper. Passed in
 * explicitly rather than reading the helper, so this module stays independent
 * from it.
 */
export interface ToolboxOptions {
    scratchMode: boolean;
    groupByCategory: boolean;
    placeholderBlocks: boolean;
    contextInfos: QuickalgoLibraryInfos;
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

    resetVariablesFlyoutOptions();
    resetProceduresFlyoutOptions();

    options.addBlocksAllowed(['robot_start', 'placeholder_statement', 'math_number', 'text']);

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
    let stdBlocks = getStandardBlocks(options.scratchMode, options.placeholderBlocks, options.contextInfos.showIfMutator);

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
        if ('variables' === categoryName) {
            variablesFlyoutOptions.any = true;
            continue;
        }
        if ('functions' === categoryName) {
            proceduresFlyoutOptions.includedBlocks = {noret: true, ret: true, ifret: true, noifret: true};
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
                    const blockName = blocks[iBlock].name;
                    blockNames.push(blockName);
                }
            }

            addBlocksAndCategories(blockNames, stdBlocks, categoriesInfos, options);
        }
    }

    const proceduresOptions = options.includeBlocks.procedures;
    setProceduresDisableArgs(proceduresOptions && proceduresOptions.disableArgs);
    if (typeof proceduresOptions !== 'undefined') {
        for (const blockKind of ['noret', 'ret', 'ifret', 'noifret']) {
            if (proceduresOptions[blockKind]) {
                proceduresFlyoutOptions.includedBlocks[blockKind] = true;
            }
        }
    }

    let singleBlocks = stdInclude.singleBlocks;
    for (let iBlock = 0; iBlock < singleBlocks.length; iBlock++) {
        const blockKind = Object.keys(PROCEDURE_BLOCK_NAMES)
            .find(kind => PROCEDURE_BLOCK_NAMES[kind] === singleBlocks[iBlock]);
        if (!blockKind) {
            continue;
        }

        // The procedure blocks are all handled by the category, they can't be
        // added to the toolbox one by one.
        proceduresFlyoutOptions.includedBlocks[blockKind] = true;
        options.addBlocksAllowed([singleBlocks[iBlock], 'procedures_callnoreturn', 'procedures_callreturn']);
        singleBlocks.splice(iBlock, 1);
        iBlock--;
    }

    const proceduresIncludedBlocks = proceduresFlyoutOptions.includedBlocks;
    if (proceduresIncludedBlocks.noret || proceduresIncludedBlocks.ret
        || proceduresIncludedBlocks.ifret || proceduresIncludedBlocks.noifret) {
        if (proceduresIncludedBlocks.noret) {
            options.addBlocksAllowed(['procedures_defnoreturn', 'procedures_callnoreturn']);
        }
        if (proceduresIncludedBlocks.ret) {
            options.addBlocksAllowed(['procedures_defreturn', 'procedures_callreturn']);
        }
        if (proceduresIncludedBlocks.ifret) {
            options.addBlocksAllowed(['procedures_ifreturn', 'procedures_return']);
        }
        if (proceduresIncludedBlocks.noifret) {
            options.addBlocksAllowed(['procedures_return']);
        }
        // A `custom="PROCEDURE"` category: Blockly fills it from the callback
        // registered by `registerProceduresFlyout`, so it has no static blocks.
        categoriesInfos['functions'] = {
            blocksXml: []
        };
        if (options.scratchMode && !window.arrayContains(singleBlocks, 'math_number')) {
            singleBlocks.push('math_number'); // TODO :: temporary
        }
        if (!options.groupByCategory) {
            console.error('Task configuration error: groupByCategory must be activated for functions.');
        }
    }
    addBlocksAndCategories(singleBlocks, stdBlocks, categoriesInfos, options);

    // Handle variable blocks, which are normally automatically added with
    // the VARIABLES category but can be customized here
    variablesFlyoutOptions.anyButton = !!options.groupByCategory;
    if (typeof options.includeBlocks.variables !== 'undefined') {
        variablesFlyoutOptions.fixed = (options.includeBlocks.variables.length > 0) ? options.includeBlocks.variables : [];
        if (typeof options.includeBlocks.variablesOnlyBlocks !== 'undefined') {
            variablesFlyoutOptions.includedBlocks = {get: false, set: false, incr: false};
            for (let iBlock = 0; iBlock < options.includeBlocks.variablesOnlyBlocks.length; iBlock++) {
                variablesFlyoutOptions.includedBlocks[options.includeBlocks.variablesOnlyBlocks[iBlock]] = true;
            }
        }

        let varAnyIdx = variablesFlyoutOptions.fixed.indexOf('*');
        if (varAnyIdx > -1) {
            variablesFlyoutOptions.fixed.splice(varAnyIdx, 1);
            variablesFlyoutOptions.any = true;
        }
    }

    // Unlike FioiBlockly, which always allowed the variable blocks, only do so
    // when the category is actually shown, as the previous code here did.
    if (variablesFlyoutOptions.any || variablesFlyoutOptions.fixed.length) {
        // When grouped by category, this is a `custom="VARIABLE"` category:
        // Blockly fills it from the callback registered by
        // `registerVariablesFlyout`, so it needs no static blocks. Without
        // categories there is no callback to call, so generate the blocks here
        // (they can't depend on the workspace variables, which don't exist yet).
        categoriesInfos["variables"] = {
            blocksXml: variablesFlyoutCategory().map(element => Blockly.Xml.domToText(element)),
            colour: colours.blocks['variables'],
        };

        if (variablesFlyoutOptions.includedBlocks['get']) {
            options.addBlocksAllowed(['variables_get']);
        }
        if (variablesFlyoutOptions.includedBlocks['set']) {
            options.addBlocksAllowed(['variables_set']);
        }
        if (variablesFlyoutOptions.includedBlocks['incr']) {
            options.addBlocksAllowed(['math_change']);
        }
    }

    if (options.contextInfos.variablesSetShadowType) {
        variablesFlyoutOptions.setShadowType = 'number';
    }

    // Disable arguments in procedures if variables are not allowed
    if (!variablesFlyoutOptions.any && proceduresOptions && typeof proceduresOptions.disableArgs == 'undefined') {
        setProceduresDisableArgs(true);
    }

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
        // 'variables' and 'functions' are custom categories: they have no
        // static blocks, Blockly fills them from the registered callbacks, so
        // never skip them as "empty".
        if (0 === categoryInfo.blocksXml.length && 'variables' !== categoryName && 'functions' !== categoryName) {
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
