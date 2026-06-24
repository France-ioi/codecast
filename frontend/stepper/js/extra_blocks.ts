import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';
import * as Blockly from 'blockly/core';
import {FieldAngle} from '@blockly/field-angle';
import {BlocklyColours} from './blockly_types';

export function addExtraBlocks(
    strings: {[key: string]: string},
    defaultColors: BlocklyColours,
    showIfMutator: boolean,
    scratchMode: boolean,
) {
    Blockly.Blocks['controls_untilWhile'] = Blockly.Blocks['controls_whileUntil'];
    javascriptGenerator.forBlock['controls_untilWhile'] = javascriptGenerator.forBlock['controls_whileUntil'];
    pythonGenerator.forBlock['controls_untilWhile'] = pythonGenerator.forBlock['controls_whileUntil'];

    Blockly.Blocks['math_angle'] = {
        init: function () {
            this.setOutput(true, 'Number');
            this.appendDummyInput()
                .appendField(new FieldAngle(90), "ANGLE");
            this.setColour(defaultColors.categories['math']);
        }
    };
    javascriptGenerator.forBlock['math_angle'] = function (block) {
        return ['' + block.getFieldValue('ANGLE'), JavascriptOrder.FUNCTION_CALL];
    };
    pythonGenerator.forBlock['math_angle'] = function (block) {
        return ['' + block.getFieldValue('ANGLE'), PythonOrder.FUNCTION_CALL];
    };

    Blockly.Blocks['math_extra_single'] = {
        /**
         * Block for advanced math operators with single operand.
         * @this Blockly.Block
         */
        init: function () {
            const OPERATORS: Blockly.MenuOption[] = [
                [Blockly.Msg['MATH_SINGLE_OP_ABSOLUTE'], 'ABS'],
                ['-', 'NEG']
            ];
            this.setHelpUrl(Blockly.Msg['MATH_SINGLE_HELPURL']);
            this.setColour(defaultColors.categories['math']);
            this.setOutput(true, 'Number');
            this.appendValueInput('NUM')
                .setCheck('Number')
                .appendField(new Blockly.FieldDropdown(OPERATORS), 'OP');
            const thisBlock = this;
            this.setTooltip(function () {
                const mode = thisBlock.getFieldValue('OP');
                const TOOLTIPS = {
                    'ABS': Blockly.Msg['MATH_SINGLE_TOOLTIP_ABS'],
                    'NEG': Blockly.Msg['MATH_SINGLE_TOOLTIP_NEG']
                };
                return TOOLTIPS[mode];
            });
        }
    };

    javascriptGenerator.forBlock['math_extra_single'] = javascriptGenerator.forBlock['math_single'];
    pythonGenerator.forBlock['math_extra_single'] = pythonGenerator.forBlock['math_single'];


    Blockly.Blocks['math_extra_double'] = {
        /**
         * Block for advanced math operators with double operand.
         * @this Blockly.Block
         */
        init: function () {
            this.setColour(defaultColors.categories['math']);
            this.setInputsInline(true);
            this.setOutput(true, 'Number');
            this.appendDummyInput('OP').appendField(new Blockly.FieldDropdown([["min", "MIN"], ["max", "MAX"], ["", ""]]), "OP");
            this.appendDummyInput().appendField(" entre ");
            this.appendValueInput('A').setCheck('Number');
            this.appendDummyInput().appendField(" et ");
            this.appendValueInput('B').setCheck('Number');
            // Assign 'this' to a variable for use in the tooltip closure below.
            const thisBlock = this;
            this.setTooltip(function () {
                const mode = thisBlock.getFieldValue('OP');
                const TOOLTIPS = {
                    'MIN': strings['smallestOfTwoNumbers'],
                    'MAX': strings['greatestOfTwoNumbers']
                };
                return TOOLTIPS[mode];
            });
        }
    };

    javascriptGenerator.forBlock['math_extra_double'] = function (block) {
        // Math operators with double operand.
        const operator = block.getFieldValue('OP');
        const arg1 = javascriptGenerator.valueToCode(block, 'A', JavascriptOrder.NONE) || '0';
        const arg2 = javascriptGenerator.valueToCode(block, 'B', JavascriptOrder.NONE) || '0';
        let code = '';
        if (operator == 'MIN') {
            code = "Math.min(" + arg1 + ", " + arg2 + ")";
        }
        if (operator == 'MAX') {
            code = "Math.max(" + arg1 + ", " + arg2 + ")";
        }
        return [code, JavascriptOrder.FUNCTION_CALL];
    };

    pythonGenerator.forBlock['math_extra_double'] = function (block) {
        // Math operators with double operand.
        const operator = block.getFieldValue('OP');
        const arg1 = pythonGenerator.valueToCode(block, 'A', PythonOrder.NONE) || '0';
        const arg2 = pythonGenerator.valueToCode(block, 'B', PythonOrder.NONE) || '0';
        let code = '';
        if (operator == 'MIN') {
            code = "Math.min(" + arg1 + ", " + arg2 + ")";
        }
        if (operator == 'MAX') {
            code = "Math.max(" + arg1 + ", " + arg2 + ")";
        }
        return [code, PythonOrder.FUNCTION_CALL];
    };

    Blockly.Blocks['controls_loop'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(strings['loopRepeat']);
            this.appendStatementInput("inner_blocks")
                .setCheck(null)
                .appendField(strings['loopDo']);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(defaultColors.categories["loops"])
            this.setTooltip("");
            this.setHelpUrl("");
        }
    }
    javascriptGenerator.forBlock['controls_loop'] = function (block) {
        const statements = javascriptGenerator.statementToCode(block, 'inner_blocks');
        return 'while(true){\n' + statements + '}\n';
    };


    Blockly.Blocks['controls_infiniteloop'] = {
        init: function () {
            this.appendStatementInput("inner_blocks")
                .setCheck(null)
                .appendField(strings['infiniteLoop']);
            this.setPreviousStatement(true, null);
            this.setNextStatement(false, null);
            this.setColour(defaultColors.categories["loops"])
            this.setTooltip("");
            this.setHelpUrl("");
        }
    }
    javascriptGenerator.forBlock['controls_infiniteloop'] = function (block) {
        const statements = javascriptGenerator.statementToCode(block, 'inner_blocks');
        return 'while(true){\n' + statements + '}\n';
    };
    pythonGenerator.forBlock['controls_infiniteloop'] = function (block) {
        // Do while/until loop.
        let branch = pythonGenerator.statementToCode(block, 'inner_blocks');
        branch = pythonGenerator.addLoopTrap(branch, block) ||
            pythonGenerator.PASS;

        return 'while True:\n' + branch;
    };

    if (!showIfMutator) {
        const old = Blockly.Blocks['controls_if'].init;
        Blockly.Blocks['controls_if'].init = function () {
            old.call(this);
            this.setMutator(undefined)
        };
    }

    if (scratchMode) {
        Blockly.Blocks['robot_start'] = {
            init: function () {
                this.jsonInit({
                    "message0": strings['startingBlockName'],
                    "inputsInline": true,
                    "nextStatement": null,
                    "colour": defaultColors.categories['event'],
                });
                this.hat = 'cap';
            }
        };

        Blockly.Blocks['placeholder_statement'] = {
            init: function () {
                this.jsonInit({
                    "message0": "",
                    "inputsInline": true,
                    "previousStatement": null,
                    "nextStatement": null,
                    "colour": "#BDCCDB",
                });
                this.appendDummyInput().appendField("                    ");
            }
        };
    } else {
        Blockly.Blocks['robot_start'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(strings['startingBlockName']);
                this.setNextStatement(true);
                this.setColour(210);
                this.setTooltip('');
                this.setDeletable(false);
                this.setEditable(false);
                this.setMovable(false);
            }
        };

        Blockly.Blocks['placeholder_statement'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("                    ");
                this.setPreviousStatement(true);
                this.setNextStatement(true);
                this.setColour(210);
                this.setTooltip('');
            }
        };
    }

    javascriptGenerator.forBlock['robot_start'] = function () {
        return "";
    };

    pythonGenerator.forBlock['robot_start'] = function () {
        return "";
    };

    javascriptGenerator.forBlock['placeholder_statement'] = function () {
        return "";
    };

    pythonGenerator.forBlock['placeholder_statement'] = function () {
        return "pass";
    }

    // TODO Blockly: remove this
    javascriptGenerator.forBlock['variables_set'] = function(block) {
        // Variable setter.
        var argument0 = javascriptGenerator.valueToCode(block, 'VALUE',
            JavascriptOrder.ASSIGNMENT) || '0';

        const varName = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            Blockly.Names.NameType.VARIABLE
        );

        // var varName = javascriptGenerator.variableDB_.getName(
        //     block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
        var assignCode = varName + ' = ' + argument0 + ';\n';

        // Report value if available
        var reportCode = "reportBlockValue('" + block.id + "', "+varName+", '"+varName+"');\n";

        return assignCode + reportCode;
    };

}
