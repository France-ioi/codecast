import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';

export function addLogicBlocks(defaultColors: BlocklyColours) {
    // Overrides the standard block to use standard operator names
    // (for instance '!=' instead of '≠').
    Blockly.Blocks['logic_compare'] = {
        /**
         * Block for comparison operator.
         */
        init: function() {
            const rtlOperators: Blockly.MenuOption[] = [
                ['==', 'EQ'],
                ['!=', 'NEQ'],
                ['>', 'LT'],
                ['>=', 'LTE'],
                ['<', 'GT'],
                ['<=', 'GTE'],
            ];
            const ltrOperators: Blockly.MenuOption[] = [
                ['==', 'EQ'],
                ['!=', 'NEQ'],
                ['<', 'LT'],
                ['<=', 'LTE'],
                ['>', 'GT'],
                ['>=', 'GTE'],
            ];

            this.jsonInit({
                "message0": "%1 %2 %3",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "A"
                    },
                    {
                        "type": "field_dropdown",
                        "name": "OP",
                        "options": this.RTL ? rtlOperators : ltrOperators
                    },
                    {
                        "type": "input_value",
                        "name": "B"
                    }
                ],
                "inputsInline": true,
                "output": "Boolean",
                "colour": defaultColors.categories['logic'],
                "helpUrl": Blockly.Msg['LOGIC_COMPARE_HELPURL'],
                // Prevents mismatched types from being compared. Blockly now ships
                // this check as an extension, so we no longer need our own onchange.
                "extensions": ["logic_compare"],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                const op = thisBlock.getFieldValue('OP');
                const TOOLTIPS = {
                    'EQ': Blockly.Msg['LOGIC_COMPARE_TOOLTIP_EQ'],
                    'NEQ': Blockly.Msg['LOGIC_COMPARE_TOOLTIP_NEQ'],
                    'LT': Blockly.Msg['LOGIC_COMPARE_TOOLTIP_LT'],
                    'LTE': Blockly.Msg['LOGIC_COMPARE_TOOLTIP_LTE'],
                    'GT': Blockly.Msg['LOGIC_COMPARE_TOOLTIP_GT'],
                    'GTE': Blockly.Msg['LOGIC_COMPARE_TOOLTIP_GTE'],
                };

                return TOOLTIPS[op];
            });
        }
    };
}
