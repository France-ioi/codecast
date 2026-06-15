import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';
import * as Blockly from 'blockly/core';

export function addExtraBlocks(strings, defaultColors, showIfMutator, scratchMode ) {
    Blockly.Blocks['controls_untilWhile'] = Blockly.Blocks['controls_whileUntil'];
    javascriptGenerator.forBlock['controls_untilWhile'] = javascriptGenerator.forBlock['controls_whileUntil'];
    pythonGenerator.forBlock['controls_untilWhile'] = pythonGenerator.forBlock['controls_whileUntil'];

    Blockly.Blocks['math_angle'] = {
        init: function () {
            this.setOutput(true, 'Number');
            this.appendDummyInput()
                .appendField(new Blockly.FieldAngle(90), "ANGLE");
            this.setColour(Blockly.Blocks.math.HUE);
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
            var OPERATORS =
                [
                    [Blockly.Msg.MATH_SINGLE_OP_ABSOLUTE, 'ABS'],
                    ['-', 'NEG']
                ];
            this.setHelpUrl(Blockly.Msg.MATH_SINGLE_HELPURL);
            this.setColour(Blockly.Blocks.math.HUE);
            this.setOutput(true, 'Number');
            this.appendValueInput('NUM')
                .setCheck('Number')
                .appendField(new Blockly.FieldDropdown(OPERATORS), 'OP');
            // Assign 'this' to a variable for use in the tooltip closure below.
            var thisBlock = this;
            this.setTooltip(function () {
                var mode = thisBlock.getFieldValue('OP');
                var TOOLTIPS = {
                    'ABS': Blockly.Msg.MATH_SINGLE_TOOLTIP_ABS,
                    'NEG': Blockly.Msg.MATH_SINGLE_TOOLTIP_NEG
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
            var OPERATORS =
                [
                    ['min', 'MIN'],
                    ['max', 'MAX']
                ];
            this.setColour(Blockly.Blocks.math.HUE);
            this.setInputsInline(true);
            this.setOutput(true, 'Number');
            this.appendDummyInput('OP').appendField(new Blockly.FieldDropdown([["min", "MIN"], ["max", "MAX"], ["", ""]]), "OP");
            this.appendDummyInput().appendField(" entre ");
            this.appendValueInput('A').setCheck('Number');
            this.appendDummyInput().appendField(" et ");
            this.appendValueInput('B').setCheck('Number');
            // Assign 'this' to a variable for use in the tooltip closure below.
            var thisBlock = this;
            this.setTooltip(function () {
                var mode = thisBlock.getFieldValue('OP');
                var TOOLTIPS = {
                    'MIN': strings.smallestOfTwoNumbers,
                    'MAX': strings.greatestOfTwoNumbers
                };
                return TOOLTIPS[mode];
            });
        }
    };

    javascriptGenerator.forBlock['math_extra_double'] = function (block) {
        // Math operators with double operand.
        var operator = block.getFieldValue('OP');
        var arg1 = javascriptGenerator.valueToCode(block, 'A', JavascriptOrder.NONE) || '0';
        var arg2 = javascriptGenerator.valueToCode(block, 'B', JavascriptOrder.NONE) || '0';
        if (operator == 'MIN') {
            var code = "Math.min(" + arg1 + ", " + arg2 + ")";
        }
        if (operator == 'MAX') {
            var code = "Math.max(" + arg1 + ", " + arg2 + ")";
        }
        return [code, JavascriptOrder.FUNCTION_CALL];
    };

    pythonGenerator.forBlock['math_extra_double'] = function (block) {
        // Math operators with double operand.
        var operator = block.getFieldValue('OP');
        var arg1 = pythonGenerator.valueToCode(block, 'A', PythonOrder.NONE) || '0';
        var arg2 = pythonGenerator.valueToCode(block, 'B', PythonOrder.NONE) || '0';
        if (operator == 'MIN') {
            var code = "Math.min(" + arg1 + ", " + arg2 + ")";
        }
        if (operator == 'MAX') {
            var code = "Math.max(" + arg1 + ", " + arg2 + ")";
        }
        return [code, PythonOrder.FUNCTION_CALL];
    };

    Blockly.Blocks['controls_loop'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(strings.loopRepeat);
            this.appendStatementInput("inner_blocks")
                .setCheck(null)
                .appendField(strings.loopDo);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(defaultColors.categories["loops"])
            this.setTooltip("");
            this.setHelpUrl("");
        }
    }
    javascriptGenerator.forBlock['controls_loop'] = function (block) {
        var statements = javascriptGenerator.statementToCode(block, 'inner_blocks');
        var code = 'while(true){\n' + statements + '}\n';
        return code;
    };


    Blockly.Blocks['controls_infiniteloop'] = {
        init: function () {
            this.appendStatementInput("inner_blocks")
                .setCheck(null)
                .appendField(strings.infiniteLoop);
            this.setPreviousStatement(true, null);
            this.setNextStatement(false, null);
            this.setColour(defaultColors.categories["loops"])
            this.setTooltip("");
            this.setHelpUrl("");
        }
    }
    javascriptGenerator.forBlock['controls_infiniteloop'] = function (block) {
        var statements = javascriptGenerator.statementToCode(block, 'inner_blocks');
        var code = 'while(true){\n' + statements + '}\n';
        return code;
    };
    pythonGenerator.forBlock['controls_infiniteloop'] = function (block) {
        // Do while/until loop.
        var branch = pythonGenerator.statementToCode(block, 'inner_blocks');
        branch = pythonGenerator.addLoopTrap(branch, block) ||
            pythonGenerator.PASS;

        return 'while True:\n' + branch;
    };

    if (scratchMode) {
        Blockly.Blocks['robot_start'] = {
            init: function () {
                this.jsonInit({
                    "id": "event_whenflagclicked",
                    "message0": strings.startingBlockName,
                    // former Scratch-like display
                    /*"message0": that.strings.flagClicked,
                    "args0": [
                      {
                        "type": "field_image",
                        "src": Blockly.mainWorkspace.options.pathToMedia + "icons/event_whenflagclicked.svg",
                        "width": 24,
                        "height": 24,
                        "alt": "flag",
                        "flip_rtl": true
                      }
                    ],*/
                    "inputsInline": true,
                    "nextStatement": null,
                    "category": Blockly.Categories.event,
                    "colour": Blockly.Colours.event.primary,
                    "colourSecondary": Blockly.Colours.event.secondary,
                    "colourTertiary": Blockly.Colours.event.tertiary
                });
            }
        };

        Blockly.Blocks['placeholder_statement'] = {
            init: function () {
                this.jsonInit({
                    "id": "placeholder_statement",
                    "message0": "",
                    "inputsInline": true,
                    "previousStatement": null,
                    "nextStatement": null,
                    "category": Blockly.Categories.event,
                    "colour": "#BDCCDB",
                    "colourSecondary": "#BDCCDB",
                    "colourTertiary": "#BDCCDB"
                });
                this.appendDummyInput().appendField("                    ");
            }
        };

        javascriptGenerator.forBlock['control_forever'] = function (block) {
            var statements = javascriptGenerator.statementToCode(block, 'SUBSTACK');
            var code = 'while(true){\n' + statements + '}\n';
            return code;
        };
        pythonGenerator.forBlock['control_forever'] = function (block) {
            // Do while/until loop.
            var branch = pythonGenerator.statementToCode(block, 'SUBSTACK');
            branch = pythonGenerator.addLoopTrap(branch, block) ||
                pythonGenerator.PASS;

            return 'while True:\n' + branch;
        };

    } else {
        if (!showIfMutator) {
            var old = Blockly.Blocks.controls_if.init;
            Blockly.Blocks.controls_if.init = function () {
                old.call(this);
                this.setMutator(undefined)
            };
        }

        Blockly.Blocks['robot_start'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(strings.startingBlockName);
                this.setNextStatement(true);
                this.setColour(210);
                this.setTooltip('');
                this.deletable_ = false;
                this.editable_ = false;
                this.movable_ = false;
                //    this.setHelpUrl('http://www.example.com/');
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
                //    this.setHelpUrl('http://www.example.com/');
            }
        };
    }

    javascriptGenerator.forBlock['robot_start'] = function (block) {
        return "";
    };

    pythonGenerator.forBlock['robot_start'] = function (block) {
        return "";
    };

    javascriptGenerator.forBlock['placeholder_statement'] = function (block) {
        return "";
    };

    pythonGenerator.forBlock['placeholder_statement'] = function (block) {
        return "pass";
    }
}
