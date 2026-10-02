import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';

/**
 * One of the operators of `math_arithmetic` as a block of its own: the same two
 * operands, but the operator shown as a plain label instead of being picked
 * from a dropdown.
 */
interface FixedArithmeticBlock {
    /** Type the block is registered under, and referred to by in a toolbox. */
    type: string;
    /** Key in `Blockly.Msg` of the operator symbol shown between the operands. */
    symbolKey: string;
    /** Key in `Blockly.Msg` of the tooltip, the one of the matching operator. */
    tooltipKey: string;
    /** Operator and precedence of the JavaScript the block generates. */
    javascript: [string, JavascriptOrder];
    /** The same, for Python. */
    python: [string, PythonOrder];
}

const FIXED_ARITHMETIC_BLOCKS: FixedArithmeticBlock[] = [
    {
        type: 'math_sum',
        symbolKey: 'MATH_ADDITION_SYMBOL',
        tooltipKey: 'MATH_ARITHMETIC_TOOLTIP_ADD',
        javascript: [' + ', JavascriptOrder.ADDITION],
        python: [' + ', PythonOrder.ADDITIVE],
    },
    {
        type: 'math_difference',
        symbolKey: 'MATH_SUBTRACTION_SYMBOL',
        tooltipKey: 'MATH_ARITHMETIC_TOOLTIP_MINUS',
        javascript: [' - ', JavascriptOrder.SUBTRACTION],
        python: [' - ', PythonOrder.ADDITIVE],
    },
    {
        type: 'math_product',
        symbolKey: 'MATH_MULTIPLICATION_SYMBOL',
        tooltipKey: 'MATH_ARITHMETIC_TOOLTIP_MULTIPLY',
        javascript: [' * ', JavascriptOrder.MULTIPLICATION],
        python: [' * ', PythonOrder.MULTIPLICATIVE],
    },
    {
        type: 'math_division',
        symbolKey: 'MATH_DIVISION_SYMBOL',
        tooltipKey: 'MATH_ARITHMETIC_TOOLTIP_DIVIDE',
        javascript: [' / ', JavascriptOrder.DIVISION],
        python: [' / ', PythonOrder.MULTIPLICATIVE],
    },
];

/**
 * Registers the single-operator arithmetic blocks and their generators. Both
 * operands are read at the precedence of the operator itself, exactly as
 * `math_arithmetic` reads them, so the code they generate is the same.
 */
function addFixedArithmeticBlocks(defaultColors: BlocklyColours) {
    for (const {type, symbolKey, tooltipKey, javascript, python} of FIXED_ARITHMETIC_BLOCKS) {
        Blockly.Blocks[type] = {
            init: function() {
                this.jsonInit({
                    "message0": "%1 %2 %3",
                    "args0": [
                        {
                            "type": "input_value",
                            "name": "A",
                            "check": "Number"
                        },
                        {
                            "type": "field_label",
                            "text": Blockly.Msg[symbolKey]
                        },
                        {
                            "type": "input_value",
                            "name": "B",
                            "check": "Number"
                        }
                    ],
                    "inputsInline": true,
                    "output": "Number",
                    "colour": defaultColors.categories['math'],
                    "tooltip": Blockly.Msg[tooltipKey],
                    "helpUrl": Blockly.Msg['MATH_ARITHMETIC_HELPURL'],
                });
            }
        };

        const [jsOperator, jsOrder] = javascript;
        javascriptGenerator.forBlock[type] = function(block) {
            const argument0 = javascriptGenerator.valueToCode(block, 'A', jsOrder) || '0';
            const argument1 = javascriptGenerator.valueToCode(block, 'B', jsOrder) || '0';

            return [argument0 + jsOperator + argument1, jsOrder];
        }

        const [pythonOperator, pythonOrder] = python;
        pythonGenerator.forBlock[type] = function(block) {
            const argument0 = pythonGenerator.valueToCode(block, 'A', pythonOrder) || '0';
            const argument1 = pythonGenerator.valueToCode(block, 'B', pythonOrder) || '0';

            return [argument0 + pythonOperator + argument1, pythonOrder];
        }
    }
}

export function addMathBlocks(defaultColors: BlocklyColours) {
    // Overrides the standard block to add the DIVIDEFLOOR and POWER operators.
    Blockly.Blocks['math_arithmetic'] = {
        init: function() {
            this.jsonInit({
                "message0": "%1 %2 %3",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "A",
                        "check": "Number"
                    },
                    {
                        "type": "field_dropdown",
                        "name": "OP",
                        "options": [
                            [Blockly.Msg['MATH_ADDITION_SYMBOL'], 'ADD'],
                            [Blockly.Msg['MATH_SUBTRACTION_SYMBOL'], 'MINUS'],
                            [Blockly.Msg['MATH_MULTIPLICATION_SYMBOL'], 'MULTIPLY'],
                            [Blockly.Msg['MATH_DIVISION_SYMBOL'], 'DIVIDE'],
                            [Blockly.Msg['MATH_DIVISIONFLOOR_SYMBOL'], 'DIVIDEFLOOR'],
                            [Blockly.Msg['MATH_POWER_SYMBOL'], 'POWER'],
                        ]
                    },
                    {
                        "type": "input_value",
                        "name": "B",
                        "check": "Number"
                    }
                ],
                "inputsInline": true,
                "output": "Number",
                "colour": defaultColors.categories['math'],
                "helpUrl": Blockly.Msg['MATH_ARITHMETIC_HELPURL'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                const mode = thisBlock.getFieldValue('OP');
                const TOOLTIPS = {
                    'ADD': Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_ADD'],
                    'MINUS': Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_MINUS'],
                    'MULTIPLY': Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_MULTIPLY'],
                    'DIVIDE': Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_DIVIDE'],
                    'DIVIDEFLOOR': Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_DIVIDEFLOOR'],
                    'POWER': Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_POWER'],
                };
                return TOOLTIPS[mode];
            });
        }
    };

    javascriptGenerator.forBlock['math_arithmetic'] = function(block) {
        // Basic arithmetic operators, and power.
        const OPERATORS: {[key: string]: [string, JavascriptOrder]} = {
            'ADD': [' + ', JavascriptOrder.ADDITION],
            'MINUS': [' - ', JavascriptOrder.SUBTRACTION],
            'MULTIPLY': [' * ', JavascriptOrder.MULTIPLICATION],
            'DIVIDE': [' / ', JavascriptOrder.DIVISION],
            // Handled separately :
            'DIVIDEFLOOR': [null, JavascriptOrder.NONE],
            'POWER': [null, JavascriptOrder.NONE],
        };

        const op = block.getFieldValue('OP');
        const [operator, order] = OPERATORS[op];

        const argument0 = javascriptGenerator.valueToCode(block, 'A', order) || '0';
        const argument1 = javascriptGenerator.valueToCode(block, 'B', order) || '0';

        if ('DIVIDEFLOOR' === op) {
            return [`Math.floor((${argument0}) / (${argument1}))`, JavascriptOrder.FUNCTION_CALL];
        }
        // Power in JavaScript requires a special case since it has no operator.
        if ('POWER' === op) {
            return [`Math.pow(${argument0}, ${argument1})`, JavascriptOrder.FUNCTION_CALL];
        }

        return [argument0 + operator + argument1, order];
    }

    pythonGenerator.forBlock['math_arithmetic'] = function(block) {
        // Basic arithmetic operators, and power.
        const OPERATORS: {[key: string]: [string, PythonOrder]} = {
            'ADD': [' + ', PythonOrder.ADDITIVE],
            'MINUS': [' - ', PythonOrder.ADDITIVE],
            'MULTIPLY': [' * ', PythonOrder.MULTIPLICATIVE],
            'DIVIDE': [' / ', PythonOrder.MULTIPLICATIVE],
            'DIVIDEFLOOR': [' // ', PythonOrder.MULTIPLICATIVE],
            'POWER': [' ** ', PythonOrder.EXPONENTIATION],
        };

        const [operator, order] = OPERATORS[block.getFieldValue('OP')];
        const argument0 = pythonGenerator.valueToCode(block, 'A', order) || '0';
        const argument1 = pythonGenerator.valueToCode(block, 'B', order) || '0';

        // In case of 'DIVIDE', division between integers returns different results
        // in Python 2 and 3. However, is not an issue since Blockly does not
        // guarantee identical results in all languages.  To do otherwise would
        // require every operator to be wrapped in a function call.  This would kill
        // legibility of the generated code.
        return [argument0 + operator + argument1, order];
    }

    addFixedArithmeticBlocks(defaultColors);

    // Overrides the standard generator to report the new value of the variable.
    javascriptGenerator.forBlock['math_change'] = function(block) {
        // Add to a variable in place.
        const argument0 = javascriptGenerator.valueToCode(block, 'DELTA',
            JavascriptOrder.ADDITION) || '0';
        const varName = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            Blockly.Names.NameType.VARIABLE
        );

        return `${varName} = (typeof ${varName} == 'number' ? ${varName} : 0) + ${argument0};
reportBlockValue('${block.id}', ${varName}, '${varName}');
`;
    }
}
