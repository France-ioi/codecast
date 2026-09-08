import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export function addTextBlocks(defaultColors: BlocklyColours) {
    Blockly.Blocks['text_print_noend'] = {
        /**
         * Block for print statement, without a trailing newline.
         */
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['TEXT_PRINT_NOEND_TITLE'],
                "args0": [
                    {
                        "type": "input_value",
                        "name": "TEXT"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": defaultColors.categories['texts'],
                "tooltip": Blockly.Msg['TEXT_PRINT_NOEND_TOOLTIP'],
                "helpUrl": Blockly.Msg['TEXT_PRINT_HELPURL'],
            });
        }
    };

    javascriptGenerator.forBlock['text_print'] = function (block) {
        return "print(" + (javascriptGenerator.valueToCode(block, "TEXT", JavascriptOrder.NONE) || "''") + ");\n";
    };
    javascriptGenerator.forBlock['text_print_noend'] = function (block) {
        return "print(" + (javascriptGenerator.valueToCode(block, "TEXT", JavascriptOrder.NONE) || "''") + ", '');\n";
    };

    pythonGenerator.forBlock['text_print_noend'] = function(block) {
        // Print statement.
        const msg = pythonGenerator.valueToCode(block, 'TEXT',
            PythonOrder.NONE) || "''";

        return `print(${msg}, end="")\n`;
    }

    Blockly.Blocks['text_eval'] = {
        // Block to evaluate an expression
        init: function() {
            this.setColour(defaultColors.categories['texts']);

            const textInput = new Blockly.FieldTextInput('');

            // Highlight the field in red but don't erase it: the validator always
            // accepts the value, it only reports the problem.
            const thisBlock = this;
            let msgTimeout = null;
            textInput.setValidator(function(this: Blockly.FieldTextInput, text: string) {
                const validationMsg = validateExpression(text, thisBlock.workspace);
                const htmlInput = (this as unknown as {htmlInput_: HTMLInputElement|null}).htmlInput_;

                if (null !== validationMsg) {
                    if (htmlInput) {
                        Blockly.utils.dom.addClass(htmlInput, 'blocklyInvalidInput');
                    }
                    if (msgTimeout) {
                        clearTimeout(msgTimeout);
                    }
                    msgTimeout = setTimeout(function() {
                        thisBlock.setWarningText(Blockly.Msg['TEXT_EVAL_INVALID'].replace('%1', validationMsg));
                    }, 2000);
                } else {
                    if (htmlInput) {
                        Blockly.utils.dom.removeClass(htmlInput, 'blocklyInvalidInput');
                    }
                    thisBlock.setWarningText(null);
                    if (msgTimeout) {
                        clearTimeout(msgTimeout);
                        msgTimeout = null;
                    }
                }

                return undefined;
            });

            this.appendDummyInput()
                .appendField(Blockly.Msg['TEXT_EVAL_TITLE'])
                .appendField(textInput, 'EXPR');
            this.setOutput(true);
            this.setTooltip(Blockly.Msg['TEXT_EVAL_TOOLTIP']);
        }
    };

    javascriptGenerator.forBlock['text_eval'] = function(block) {
        const expr = block.getFieldValue('EXPR');
        const reindexExpr = reindexExpression(expr, block.workspace);
        if (null === reindexExpr) {
            return ['false', JavascriptOrder.ATOMIC];
        }

        return [reindexExpr, JavascriptOrder.NONE];
    }

    pythonGenerator.forBlock['text_eval'] = function(block) {
        const expr = block.getFieldValue('EXPR');
        const reindexExpr = reindexExpression(expr, block.workspace);
        if (null === reindexExpr) {
            return ['false', PythonOrder.ATOMIC];
        }

        return [reindexExpr, PythonOrder.NONE];
    }

    Blockly.Blocks['text_str'] = {
        /**
         * Block to convert to string.
         */
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['TEXT_STR_TITLE'],
                "args0": [
                    {
                        "type": "input_value",
                        "name": "EXPR"
                    }
                ],
                "output": "String",
                "colour": defaultColors.categories['texts'],
                "tooltip": Blockly.Msg['TEXT_STR_TOOLTIP'],
            });
        }
    };

    javascriptGenerator.forBlock['text_str'] = function(block) {
        const functionName = javascriptGenerator.provideFunction_(
            'textStr',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(x, forceStr) {
  if(Array.isArray(x)) {
    var strs = [];
    for(var i = 0; i < x.length; i++) {
       strs[i] = ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(x[i], true);
    }
    return "["+strs.join(', ')+"]";
  } else if(x && typeof x == "object" && Object.prototype.toString(x) === "[object Object]") {
    var strs = [];
    for(var key in x) {
       if(key == "constructor") continue;
       strs.push("'" + key + "': " + ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(x[key], true));
    }
    return "{"+strs.join(', ')+"}";
  } else if(x && forceStr && typeof x == "string") {
    return "\\"" + x + "\\"";
  } else if(x) {
    return String(x);
  } else {
    return "" + x;
  }
}`);

        const expr = javascriptGenerator.valueToCode(block, 'EXPR', JavascriptOrder.NONE) || 'null';

        return [`${functionName}(${expr})`, JavascriptOrder.FUNCTION_CALL];
    }

    pythonGenerator.forBlock['text_str'] = function(block) {
        const expr = pythonGenerator.valueToCode(block, 'EXPR', PythonOrder.NONE) || 'None';

        return [`str(${expr})`, PythonOrder.FUNCTION_CALL];
    }
}

const EVAL_ALLOWED_TYPES = [
    'Literal',
    'Identifier',
    'BinaryExpression',
    'UnaryExpression',
    'ArrayExpression',
    'MemberExpression',
    'ExpressionStatement',
    'Program',
];

/**
 * Validate contents of the expression block.
 * Returns null if the expression is valid, the reason why it isn't otherwise.
 */
function validateExpression(text: string, workspace?: Blockly.Workspace): string|null {
    // acorn parses programs, it won't tell if there's a ';'
    if (-1 !== text.indexOf(';')) {
        // Semi-colon is not allowed
        return Blockly.Msg['EVAL_ERROR_SEMICOLON'];
    }

    // Parse the expression
    let ast: acorn.Node;
    try {
        ast = acorn.parse(text, {ecmaVersion: 2020});
    } catch (e) {
        // Couldn't parse
        return Blockly.Msg['EVAL_ERROR_SYNTAX'];
    }

    let msg: string|null = null;
    let variableList: string[]|null = null;

    // Walk the AST
    walk.full(ast as any, function(node: any, state: unknown, type: string) {
        if (-1 === EVAL_ALLOWED_TYPES.indexOf(type)) {
            // Type is not allowed
            msg = Blockly.Msg['EVAL_ERROR_TYPE'].replace('%1', type);

            return;
        }

        if ('MemberExpression' === type && ('[' !== text[node.object.end] || node.property.end === node.end || ']' !== text[node.end - 1])) {
            // This type of MemberExpression is not allowed
            msg = Blockly.Msg['EVAL_ERROR_TYPE'].replace('%1', type);

            return;
        }

        if ('Identifier' === type && workspace) {
            // Check if variable is defined
            if (null === variableList) {
                variableList = workspace.getVariableMap().getAllVariables().map(variable => variable.getName());
            }
            if (-1 === variableList.indexOf(node.name)) {
                // Variable is not defined
                msg = Blockly.Msg['EVAL_ERROR_VAR'].replace('%1', node.name);
            }
        }
    });

    return msg;
}

/**
 * Reindex 1-based array indexes to 0-based.
 * Returns null if the expression isn't valid.
 */
function reindexExpression(text: string, workspace?: Blockly.Workspace): string|null {
    if (null !== validateExpression(text, workspace)) {
        // We shouldn't be generating code for an invalid block
        return null;
    }

    // Parsing worked for validate, it will work this time too
    const ast = acorn.parse(text, {ecmaVersion: 2020});

    // This array will contain the pairs of positions for '[' and ']'
    const reindexes: [number, number][] = [];
    walk.full(ast as any, function(node: any, state: unknown, type: string) {
        if ('MemberExpression' === type) {
            reindexes.push([node.object.end, node.end - 1]);
        }
    });

    // Apply reindexing
    let newText = text;
    for (let i = 0; i < reindexes.length; i++) {
        const [start, end] = reindexes[i];

        newText = newText.slice(0, start + 1) + '(' + newText.slice(start + 1, end) + ')-1' + newText.slice(end);

        // Adjust start and end for next reindexes
        for (let j = i + 1; j < reindexes.length; j++) {
            if (start < reindexes[j][0]) {
                reindexes[j][0] += 1;
            }
            if (start < reindexes[j][1]) {
                reindexes[j][1] += 1;
            }
            if (end < reindexes[j][0]) {
                reindexes[j][0] += 3;
            }
            if (end < reindexes[j][1]) {
                reindexes[j][1] += 3;
            }
        }
    }

    return newText;
}
