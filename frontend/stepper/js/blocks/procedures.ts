import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';

let disableArgs = false;

/**
 * Whether function definitions may declare parameters. When disabled, the
 * definition blocks lose their mutator. Set from the task options.
 */
export function setProceduresDisableArgs(newDisableArgs?: boolean) {
    disableArgs = !!newDisableArgs;
}

export function addProcedureBlocks(defaultColors: BlocklyColours) {
    // Only `init` is overridden: the rest of the standard definition mixin
    // (setStatements_, updateParams_, compose/decompose, getProcedureDef, …) is
    // kept as-is.
    if (Blockly.Blocks['procedures_defnoreturn']) {
        Blockly.Blocks['procedures_defnoreturn'].init = function() {
            const nameField = new Blockly.FieldTextInput('');
            nameField.setValidator(Blockly.Procedures.rename);
            nameField.setSpellcheck(false);
            this.appendDummyInput()
                .appendField(Blockly.Msg['PROCEDURES_DEFNORETURN_TITLE'])
                .appendField(nameField, 'NAME')
                .appendField('', 'PARAMS');
            if (!disableArgs) {
                this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
            }
            if ((this.workspace.options.comments ||
                    (this.workspace.options.parentWorkspace &&
                        this.workspace.options.parentWorkspace.options.comments)) &&
                Blockly.Msg['PROCEDURES_DEFNORETURN_COMMENT']) {
                this.setCommentText(Blockly.Msg['PROCEDURES_DEFNORETURN_COMMENT']);
            }
            this.setColour(defaultColors.categories['functions']);
            this.setTooltip(Blockly.Msg['PROCEDURES_DEFNORETURN_TOOLTIP']);
            this.setHelpUrl(Blockly.Msg['PROCEDURES_DEFNORETURN_HELPURL']);
            this.arguments_ = [];
            this.argumentVarModels_ = [];
            this.setStatements_(true);
            this.statementConnection_ = null;
        };
    }

    if (Blockly.Blocks['procedures_defreturn']) {
        Blockly.Blocks['procedures_defreturn'].init = function() {
            const nameField = new Blockly.FieldTextInput('');
            nameField.setValidator(Blockly.Procedures.rename);
            nameField.setSpellcheck(false);
            this.appendDummyInput()
                .appendField(Blockly.Msg['PROCEDURES_DEFRETURN_TITLE'])
                .appendField(nameField, 'NAME')
                .appendField('', 'PARAMS');
            this.appendValueInput('RETURN')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField(Blockly.Msg['PROCEDURES_DEFRETURN_RETURN']);
            if (!disableArgs) {
                this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
            }
            if ((this.workspace.options.comments ||
                    (this.workspace.options.parentWorkspace &&
                        this.workspace.options.parentWorkspace.options.comments)) &&
                Blockly.Msg['PROCEDURES_DEFRETURN_COMMENT']) {
                this.setCommentText(Blockly.Msg['PROCEDURES_DEFRETURN_COMMENT']);
            }
            this.setColour(defaultColors.categories['functions']);
            this.setTooltip(Blockly.Msg['PROCEDURES_DEFRETURN_TOOLTIP']);
            this.setHelpUrl(Blockly.Msg['PROCEDURES_DEFRETURN_HELPURL']);
            this.arguments_ = [];
            this.argumentVarModels_ = [];
            this.setStatements_(true);
            this.statementConnection_ = null;
        };
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
