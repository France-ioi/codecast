export function addExtraBlocks(strings, defaultColors) {
    window.Blockly.Blocks['controls_untilWhile'] = window.Blockly.Blocks['controls_whileUntil'];
    window.Blockly.JavaScript['controls_untilWhile'] = window.Blockly.JavaScript['controls_whileUntil'];
    window.Blockly.Python['controls_untilWhile'] = window.Blockly.Python['controls_whileUntil'];

    window.Blockly.Blocks['math_angle'] = {
        init: function () {
            this.setOutput(true, 'Number');
            this.appendDummyInput()
                .appendField(new window.Blockly.FieldAngle(90), "ANGLE");
            this.setColour(window.Blockly.Blocks.math.HUE);
        }
    };
    window.Blockly.JavaScript['math_angle'] = function (block) {
        return ['' + block.getFieldValue('ANGLE'), window.Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
    window.Blockly.Python['math_angle'] = function (block) {
        return ['' + block.getFieldValue('ANGLE'), window.Blockly.Python.ORDER_FUNCTION_CALL];
    };

    window.Blockly.Blocks['math_extra_single'] = {
        /**
         * Block for advanced math operators with single operand.
         * @this window.Blockly.Block
         */
        init: function () {
            var OPERATORS =
                [
                    [window.Blockly.Msg.MATH_SINGLE_OP_ABSOLUTE, 'ABS'],
                    ['-', 'NEG']
                ];
            this.setHelpUrl(window.Blockly.Msg.MATH_SINGLE_HELPURL);
            this.setColour(window.Blockly.Blocks.math.HUE);
            this.setOutput(true, 'Number');
            this.appendValueInput('NUM')
                .setCheck('Number')
                .appendField(new window.Blockly.FieldDropdown(OPERATORS), 'OP');
            // Assign 'this' to a variable for use in the tooltip closure below.
            var thisBlock = this;
            this.setTooltip(function () {
                var mode = thisBlock.getFieldValue('OP');
                var TOOLTIPS = {
                    'ABS': window.Blockly.Msg.MATH_SINGLE_TOOLTIP_ABS,
                    'NEG': window.Blockly.Msg.MATH_SINGLE_TOOLTIP_NEG
                };
                return TOOLTIPS[mode];
            });
        }
    };

    window.Blockly.JavaScript['math_extra_single'] = window.Blockly.JavaScript['math_single'];
    window.Blockly.Python['math_extra_single'] = window.Blockly.Python['math_single'];


    window.Blockly.Blocks['math_extra_double'] = {
        /**
         * Block for advanced math operators with double operand.
         * @this window.Blockly.Block
         */
        init: function () {
            var OPERATORS =
                [
                    ['min', 'MIN'],
                    ['max', 'MAX']
                ];
            this.setColour(window.Blockly.Blocks.math.HUE);
            this.setInputsInline(true);
            this.setOutput(true, 'Number');
            this.appendDummyInput('OP').appendField(new window.Blockly.FieldDropdown([["min", "MIN"], ["max", "MAX"], ["", ""]]), "OP");
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

    window.Blockly.JavaScript['math_extra_double'] = function (block) {
        // Math operators with double operand.
        var operator = block.getFieldValue('OP');
        var arg1 = window.Blockly.JavaScript.valueToCode(block, 'A', window.Blockly.JavaScript.ORDER_NONE) || '0';
        var arg2 = window.Blockly.JavaScript.valueToCode(block, 'B', window.Blockly.JavaScript.ORDER_NONE) || '0';
        if (operator == 'MIN') {
            var code = "Math.min(" + arg1 + ", " + arg2 + ")";
        }
        if (operator == 'MAX') {
            var code = "Math.max(" + arg1 + ", " + arg2 + ")";
        }
        return [code, window.Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    window.Blockly.Python['math_extra_double'] = function (block) {
        // Math operators with double operand.
        var operator = block.getFieldValue('OP');
        var arg1 = window.Blockly.Python.valueToCode(block, 'A', window.Blockly.Python.ORDER_NONE) || '0';
        var arg2 = window.Blockly.Python.valueToCode(block, 'B', window.Blockly.Python.ORDER_NONE) || '0';
        if (operator == 'MIN') {
            var code = "Math.min(" + arg1 + ", " + arg2 + ")";
        }
        if (operator == 'MAX') {
            var code = "Math.max(" + arg1 + ", " + arg2 + ")";
        }
        return [code, window.Blockly.Python.ORDER_FUNCTION_CALL];
    };

    window.Blockly.Blocks['controls_loop'] = {
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
    window.Blockly.JavaScript['controls_loop'] = function (block) {
        var statements = window.Blockly.JavaScript.statementToCode(block, 'inner_blocks');
        var code = 'while(true){\n' + statements + '}\n';
        return code;
    };


    window.Blockly.Blocks['controls_infiniteloop'] = {
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
    window.Blockly.JavaScript['controls_infiniteloop'] = function (block) {
        var statements = window.Blockly.JavaScript.statementToCode(block, 'inner_blocks');
        var code = 'while(true){\n' + statements + '}\n';
        return code;
    };
    window.Blockly.Python['controls_infiniteloop'] = function (block) {
        // Do while/until loop.
        var branch = window.Blockly.Python.statementToCode(block, 'inner_blocks');
        branch = window.Blockly.Python.addLoopTrap(branch, block.id) ||
            window.Blockly.Python.PASS;

        return 'while True:\n' + branch;
    };

    if (this.scratchMode) {
        window.Blockly.Blocks['robot_start'] = {
            init: function () {
                this.jsonInit({
                    "id": "event_whenflagclicked",
                    "message0": strings.startingBlockName,
                    // former Scratch-like display
                    /*"message0": that.strings.flagClicked,
                    "args0": [
                      {
                        "type": "field_image",
                        "src": window.Blockly.mainWorkspace.options.pathToMedia + "icons/event_whenflagclicked.svg",
                        "width": 24,
                        "height": 24,
                        "alt": "flag",
                        "flip_rtl": true
                      }
                    ],*/
                    "inputsInline": true,
                    "nextStatement": null,
                    "category": window.Blockly.Categories.event,
                    "colour": window.Blockly.Colours.event.primary,
                    "colourSecondary": window.Blockly.Colours.event.secondary,
                    "colourTertiary": window.Blockly.Colours.event.tertiary
                });
            }
        };

        window.Blockly.Blocks['placeholder_statement'] = {
            init: function () {
                this.jsonInit({
                    "id": "placeholder_statement",
                    "message0": "",
                    "inputsInline": true,
                    "previousStatement": null,
                    "nextStatement": null,
                    "category": window.Blockly.Categories.event,
                    "colour": "#BDCCDB",
                    "colourSecondary": "#BDCCDB",
                    "colourTertiary": "#BDCCDB"
                });
                this.appendDummyInput().appendField("                    ");
            }
        };

        window.Blockly.JavaScript['control_forever'] = function (block) {
            var statements = window.Blockly.JavaScript.statementToCode(block, 'SUBSTACK');
            var code = 'while(true){\n' + statements + '}\n';
            return code;
        };
        window.Blockly.Python['control_forever'] = function (block) {
            // Do while/until loop.
            var branch = window.Blockly.Python.statementToCode(block, 'SUBSTACK');
            branch = window.Blockly.Python.addLoopTrap(branch, block.id) ||
                window.Blockly.Python.PASS;

            return 'while True:\n' + branch;
        };

    } else {
        if (!this.mainContext.infos || !this.mainContext.infos.showIfMutator) {
            var old = window.Blockly.Blocks.controls_if.init;
            window.Blockly.Blocks.controls_if.init = function () {
                old.call(this);
                this.setMutator(undefined)
            };
        }

        window.Blockly.Blocks['robot_start'] = {
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

        window.Blockly.Blocks['placeholder_statement'] = {
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

    window.Blockly.JavaScript['robot_start'] = function (block) {
        return "";
    };

    window.Blockly.Python['robot_start'] = function (block) {
        return "";
    };

    window.Blockly.JavaScript['placeholder_statement'] = function (block) {
        return "";
    };

    window.Blockly.Python['placeholder_statement'] = function (block) {
        return "pass";
    }
}
