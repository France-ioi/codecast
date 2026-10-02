import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';

let disableArgs = false;

/**
 * Whether function definitions may declare parameters. When disabled, the
 * definition blocks lose the "+" that adds one. Set from the task options.
 */
export function setProceduresDisableArgs(newDisableArgs?: boolean) {
    disableArgs = !!newDisableArgs;
}

/** One of the two blocks that define a function. */
interface ProcedureDefBlock {
    /** Type the block is registered under. */
    type: string;
    /** Prefix of the keys its messages have in `Blockly.Msg`. */
    messagePrefix: string;
    /** Whether the function returns a value, and so the block has a RETURN input. */
    returnsValue: boolean;
}

const PROCEDURE_DEF_BLOCKS: ProcedureDefBlock[] = [
    {type: 'procedures_defnoreturn', messagePrefix: 'PROCEDURES_DEFNORETURN', returnsValue: false},
    {type: 'procedures_defreturn', messagePrefix: 'PROCEDURES_DEFRETURN', returnsValue: true},
];

/**
 * Applies our customisations to one of the function definition blocks of
 * `@blockly/block-plus-minus`, by extending its `init` instead of replacing it.
 *
 * The plugin builds its blocks from a JSON definition: everything that makes the
 * +/- UI work — the parameter rows, `getProcedureDef`, the mutation
 * serialization, the callers being kept in sync — is installed by the extensions
 * and the mutator that its `init` applies through `jsonInit`. Overwriting `init`,
 * the way {@link defineStockProcedureDefBlock} does on Blockly's own blocks,
 * would drop all of it and leave a block that only looks like a function.
 */
function customizeProcedureDefBlock({type, messagePrefix}: ProcedureDefBlock, defaultColors: BlocklyColours) {
    const blockDefinition = Blockly.Blocks[type];
    if (!blockDefinition) {
        return;
    }

    const pluginInit = blockDefinition.init;
    blockDefinition.init = function() {
        pluginInit.call(this);

        (this.getField('NAME') as Blockly.FieldTextInput).setSpellcheck(false);
        this.setColour(defaultColors.categories['functions']);

        // Parameters are added by the "+" field the plugin puts on the TOP
        // input, and removed by the "-" of each parameter row. Taking the "+"
        // away is what the mutator icon not being set used to be: a block that
        // still displays the parameters it is loaded with, but to which the
        // user cannot add any.
        if (disableArgs) {
            this.getInput('TOP').removeField('PLUS', true);
        }

        if ((this.workspace.options.comments ||
                (this.workspace.options.parentWorkspace &&
                    this.workspace.options.parentWorkspace.options.comments)) &&
            Blockly.Msg[messagePrefix + '_COMMENT']) {
            this.setCommentText(Blockly.Msg[messagePrefix + '_COMMENT']);
        }
    };
}

/**
 * Replaces the `init` of one of Blockly's own function definition blocks, the
 * ones with a mutator dialog, used when the task did not ask for the +/- UI.
 *
 * Only `init` is overridden: the rest of the standard definition mixin
 * (setStatements_, updateParams_, compose/decompose, getProcedureDef, …) is
 * kept as-is.
 */
function defineStockProcedureDefBlock({type, messagePrefix, returnsValue}: ProcedureDefBlock, defaultColors: BlocklyColours) {
    const blockDefinition = Blockly.Blocks[type];
    if (!blockDefinition) {
        return;
    }

    blockDefinition.init = function() {
        const nameField = new Blockly.FieldTextInput('');
        nameField.setValidator(Blockly.Procedures.rename);
        nameField.setSpellcheck(false);
        this.appendDummyInput()
            .appendField(Blockly.Msg[messagePrefix + '_TITLE'])
            .appendField(nameField, 'NAME')
            .appendField('', 'PARAMS');
        if (returnsValue) {
            this.appendValueInput('RETURN')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField(Blockly.Msg['PROCEDURES_DEFRETURN_RETURN']);
        }
        if (!disableArgs) {
            this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
        }
        if ((this.workspace.options.comments ||
                (this.workspace.options.parentWorkspace &&
                    this.workspace.options.parentWorkspace.options.comments)) &&
            Blockly.Msg[messagePrefix + '_COMMENT']) {
            this.setCommentText(Blockly.Msg[messagePrefix + '_COMMENT']);
        }
        this.setColour(defaultColors.categories['functions']);
        this.setTooltip(Blockly.Msg[messagePrefix + '_TOOLTIP']);
        this.setHelpUrl(Blockly.Msg[messagePrefix + '_HELPURL']);
        this.arguments_ = [];
        this.argumentVarModels_ = [];
        this.setStatements_(true);
        this.statementConnection_ = null;
    };
}

/**
 * @param plusMinusEnabled Whether the definition blocks are the ones of
 *     `@blockly/block-plus-minus`, the task having asked for the +/- UI.
 */
export function addProcedureBlocks(defaultColors: BlocklyColours, plusMinusEnabled: boolean) {
    for (const procedureDefBlock of PROCEDURE_DEF_BLOCKS) {
        if (plusMinusEnabled) {
            customizeProcedureDefBlock(procedureDefBlock, defaultColors);
        } else {
            defineStockProcedureDefBlock(procedureDefBlock, defaultColors);
        }
    }

    Blockly.Blocks['procedures_return'] = {
        /**
         * Block for returning a value from a procedure.
         */
        init: function() {
            this.appendValueInput('VALUE')
                .appendField(Blockly.Msg['PROCEDURES_DEFRETURN_RETURN']);
            this.setInputsInline(true);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(defaultColors.categories['functions']);
            this.hasReturnValue_ = true;
        },
        /**
         * Create XML to represent whether this block has a return value.
         */
        mutationToDom: function() {
            const container = Blockly.utils.xml.createElement('mutation');
            container.setAttribute('value', String(Number(this.hasReturnValue_)));

            return container;
        },
        /**
         * Parse XML to restore whether this block has a return value.
         */
        domToMutation: function(xmlElement: Element) {
            this.hasReturnValue_ = (1 === Number(xmlElement.getAttribute('value')));
            if (!this.hasReturnValue_) {
                this.removeInput('VALUE');
                this.appendDummyInput('VALUE')
                    .appendField(Blockly.Msg['PROCEDURES_DEFRETURN_RETURN']);
            }
        },
        /**
         * Called whenever anything on the workspace changes.
         * Add a warning if this block is not nested inside a procedure.
         */
        onchange: function(e: Blockly.Events.Abstract) {
            // Only react to blocks actually moving around, as Blockly does for
            // `procedures_ifreturn`: rebuilding the inputs on every event would
            // fight with drags and field edits.
            if (this.workspace.isDragging && this.workspace.isDragging()) {
                return;
            }
            if (Blockly.Events.BLOCK_MOVE !== e.type && Blockly.Events.BLOCK_CREATE !== e.type) {
                return;
            }

            let legal = false;
            // Is the block nested in a procedure?
            let block = this;
            do {
                if (-1 !== this.FUNCTION_TYPES.indexOf(block.type)) {
                    legal = true;
                    break;
                }
                block = block.getSurroundParent();
            } while (block);

            if (legal) {
                // If needed, toggle whether this block has a return value.
                if ('procedures_defnoreturn' === block.type && this.hasReturnValue_) {
                    this.removeInput('VALUE');
                    this.appendDummyInput('VALUE')
                        .appendField(Blockly.Msg['PROCEDURES_DEFRETURN_RETURN']);
                    this.hasReturnValue_ = false;
                } else if ('procedures_defreturn' === block.type && !this.hasReturnValue_) {
                    this.removeInput('VALUE');
                    this.appendValueInput('VALUE')
                        .appendField(Blockly.Msg['PROCEDURES_DEFRETURN_RETURN']);
                    this.hasReturnValue_ = true;
                }
                this.setWarningText(null);
            } else {
                this.setWarningText(Blockly.Msg['PROCEDURES_IFRETURN_WARNING']);
            }
        },
        /**
         * List of block types that are functions and thus do not need warnings.
         * To add a new function type add this to your code:
         * Blockly.Blocks['procedures_return'].FUNCTION_TYPES.push('custom_func');
         */
        FUNCTION_TYPES: ['procedures_defnoreturn', 'procedures_defreturn'],
    };

    javascriptGenerator.forBlock['procedures_return'] = function(block) {
        if (!(block as unknown as {hasReturnValue_: boolean}).hasReturnValue_) {
            return 'return;\n';
        }

        const value = javascriptGenerator.valueToCode(block, 'VALUE',
            JavascriptOrder.NONE) || 'null';

        return `return ${value};\n`;
    }

    pythonGenerator.forBlock['procedures_return'] = function(block) {
        // Conditionally return value from a procedure.
        if (!(block as unknown as {hasReturnValue_: boolean}).hasReturnValue_) {
            return 'return\n';
        }

        const value = pythonGenerator.valueToCode(block, 'VALUE',
            PythonOrder.NONE) || 'None';

        return `return ${value}\n`;
    }
}
