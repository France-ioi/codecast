import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';
import {addGeneratorDefinition} from './utils';

/** A `lists_setIndex` block, which rebuilds its 'AT' input on the fly. */
type SetIndexBlock = Blockly.Block & {updateAt_: (isAt: boolean) => void};

const DEFAULT_MAX_LIST_SIZE = 100;

let maxListSize = DEFAULT_MAX_LIST_SIZE;

/**
 * Maximum size a list created with `lists_repeat` may have, enforced at runtime
 * by the generated code. Set from the task options.
 */
export function setMaxListSize(newMaxListSize?: number) {
    maxListSize = newMaxListSize ?? DEFAULT_MAX_LIST_SIZE;
}

export function addListBlocks(defaultColors: BlocklyColours) {
    Blockly.Blocks['lists_append'] = {
        /**
         * Block for appending to a list in place.
         */
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['LISTS_APPEND_MSG'],
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": "liste"
                    },
                    {
                        "type": "input_value",
                        "name": "ITEM",
                        "check": "Number"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": defaultColors.categories['lists'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                return Blockly.Msg['LISTS_APPEND_TOOLTIP'].replace('%1',
                    thisBlock.getFieldValue('VAR'));
            });
        }
    };

    javascriptGenerator.forBlock['lists_append'] = function(block) {
        const varName = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            Blockly.Names.NameType.VARIABLE
        );
        const value = javascriptGenerator.valueToCode(block, 'ITEM',
            JavascriptOrder.NONE) || '___';

        return `${varName}.push(${value});\n`;
    }

    pythonGenerator.forBlock['lists_append'] = function(block) {
        const varName = pythonGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            Blockly.Names.NameType.VARIABLE
        );
        const value = pythonGenerator.valueToCode(block, 'ITEM',
            PythonOrder.NONE) || '___';

        return `${varName}.append(${value})\n`;
    }

    Blockly.Blocks['lists_sort_place'] = {
        /**
         * Block for sorting a list in place.
         */
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['LISTS_SORT_PLACE_MSG'],
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": "liste"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": defaultColors.categories['lists'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                return Blockly.Msg['LISTS_SORT_PLACE_TOOLTIP'].replace('%1',
                    thisBlock.getFieldValue('VAR'));
            });
        }
    };

    javascriptGenerator.forBlock['lists_sort_place'] = function(block) {
        // Javascript default sort is lexicographic, which doesn't work for numbers.
        // By using the normal compare operator, we circumvent this issue; moreover,
        // it returns false for uncomparable values, which will in this case not
        // modify the place of these values in the list.
        const functionName = javascriptGenerator.provideFunction_(
            'list_sort_auto',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(a, b) {
    if(a === b) {
        return 0;
    } else if(a > b) {
        return 1;
    } else {
        return -1;
    }
}`);

        const varName = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            Blockly.Names.NameType.VARIABLE
        );

        return `${varName}.sort(${functionName});\n`;
    }

    pythonGenerator.forBlock['lists_sort_place'] = function(block) {
        const varName = pythonGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            Blockly.Names.NameType.VARIABLE
        );

        return `${varName}.sort()\n`;
    }

    // Overrides the standard generator to enforce a maximum list size.
    javascriptGenerator.forBlock['lists_repeat'] = function(block) {
        // Create a list with one element repeated.
        // The error message is built at runtime as it contains the actual size.
        const [msgBefore, msgAfter] = Blockly.Msg['LISTS_CREATE_WITH_TOO_LARGE']
            .replace('%2', String(maxListSize))
            .split('%1');

        const functionName = javascriptGenerator.provideFunction_(
            'listsRepeat',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(value, n) {
    if(n > ${maxListSize}) {
        throw ${javascriptGenerator.quote_(msgBefore)} + n + ${javascriptGenerator.quote_(msgAfter ?? '')};
    }
    var array = [];
    for(var i = 0; i < n; i++) {
        array[i] = value;
    }
    return array;
}`);

        const element = javascriptGenerator.valueToCode(block, 'ITEM',
            JavascriptOrder.COMMA) || 'null';
        const repeatCount = javascriptGenerator.valueToCode(block, 'NUM',
            JavascriptOrder.COMMA) || '0';

        return [`${functionName}(${element}, ${repeatCount})`, JavascriptOrder.FUNCTION_CALL];
    }

    // Modify order of fields: the index is shown before the SET/INSERT dropdown.
    Blockly.Blocks['lists_setIndex'] = {
        /**
         * Block for setting the element at index.
         */
        init: function() {
            const MODE: Blockly.MenuOption[] = [
                [Blockly.Msg['LISTS_SET_INDEX_SET'], 'SET'],
                [Blockly.Msg['LISTS_SET_INDEX_INSERT'], 'INSERT'],
            ];
            this.WHERE_OPTIONS = [
                [Blockly.Msg['LISTS_GET_INDEX_FROM_START'], 'FROM_START'],
                [Blockly.Msg['LISTS_GET_INDEX_FROM_END'], 'FROM_END'],
                [Blockly.Msg['LISTS_GET_INDEX_FIRST'], 'FIRST'],
                [Blockly.Msg['LISTS_GET_INDEX_LAST'], 'LAST'],
                [Blockly.Msg['LISTS_GET_INDEX_RANDOM'], 'RANDOM'],
            ];
            this.setHelpUrl(Blockly.Msg['LISTS_SET_INDEX_HELPURL']);
            this.setColour(defaultColors.categories['lists']);
            this.appendValueInput('LIST')
                .setCheck('Array')
                .appendField(Blockly.Msg['LISTS_SET_INDEX_INPUT_IN_LIST']);
            this.appendDummyInput('AT');
            this.appendDummyInput('MODEDUMMY')
                .appendField(new Blockly.FieldDropdown(MODE), 'MODE');
            this.appendValueInput('TO');
            this.setInputsInline(true);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.updateAt_(true);
            const thisBlock = this;
            this.setTooltip(function() {
                const mode = thisBlock.getFieldValue('MODE');
                const where = thisBlock.getFieldValue('WHERE');
                let tooltip = '';
                switch (mode + ' ' + where) {
                    case 'SET FROM_START':
                    case 'SET FROM_END':
                        tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_SET_FROM'];
                        break;
                    case 'SET FIRST':
                        tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_SET_FIRST'];
                        break;
                    case 'SET LAST':
                        tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_SET_LAST'];
                        break;
                    case 'SET RANDOM':
                        tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_SET_RANDOM'];
                        break;
                    case 'INSERT FROM_START':
                    case 'INSERT FROM_END':
                        tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_INSERT_FROM'];
                        break;
                    case 'INSERT FIRST':
                        tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST'];
                        break;
                    case 'INSERT LAST':
                        tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_INSERT_LAST'];
                        break;
                    case 'INSERT RANDOM':
                        tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM'];
                        break;
                }
                if ('FROM_START' === where || 'FROM_END' === where) {
                    tooltip += '  ' + Blockly.Msg['LISTS_INDEX_FROM_START_TOOLTIP']
                        .replace('%1',
                            thisBlock.workspace.options.oneBasedIndex ? '#1' : '#0');
                }

                return tooltip;
            });
        },
        /**
         * Create XML to represent whether there is an 'AT' input.
         */
        mutationToDom: function() {
            const container = Blockly.utils.xml.createElement('mutation');
            const isAt = Blockly.inputs.inputTypes.VALUE === this.getInput('AT').type;
            container.setAttribute('at', String(isAt));

            return container;
        },
        /**
         * Parse XML to restore the 'AT' input.
         */
        domToMutation: function(xmlElement: Element) {
            // Note: Until January 2013 this block did not have mutations,
            // so 'at' defaults to true.
            const isAt = ('false' !== xmlElement.getAttribute('at'));
            this.updateAt_(isAt);
        },
        /**
         * Create or delete an input for the numeric index.
         */
        updateAt_: function(isAt: boolean) {
            // Destroy old 'AT' and 'ORDINAL' input.
            this.removeInput('AT');
            this.removeInput('ORDINAL', true);
            // Create either a value 'AT' input or a dummy input.
            if (isAt) {
                this.appendValueInput('AT').setCheck('Number');
                if (Blockly.Msg['ORDINAL_NUMBER_SUFFIX']) {
                    this.appendDummyInput('ORDINAL')
                        .appendField(Blockly.Msg['ORDINAL_NUMBER_SUFFIX']);
                }
            } else {
                this.appendDummyInput('AT');
            }

            const menu = new Blockly.FieldDropdown(this.WHERE_OPTIONS, function(this: Blockly.FieldDropdown, value: string) {
                const newAt = ('FROM_START' === value) || ('FROM_END' === value);
                // The 'isAt' variable is available due to this function being a closure.
                if (newAt !== isAt) {
                    const block = this.getSourceBlock() as SetIndexBlock;
                    block.updateAt_(newAt);
                    // This menu has been destroyed and replaced.  Update the replacement.
                    block.setFieldValue(value, 'WHERE');

                    return null;
                }

                return undefined;
            });

            this.moveInputBefore('AT', 'MODEDUMMY');
            if (this.getInput('ORDINAL')) {
                this.moveInputBefore('ORDINAL', 'TO');
            }

            this.getInput('AT').appendField(menu, 'WHERE');
        }
    };

    javascriptGenerator.forBlock['lists_setIndex'] = function(block) {
        // Set element at index.
        // Note: Until February 2013 this block did not have MODE or WHERE inputs.
        let list = javascriptGenerator.valueToCode(block, 'LIST',
            JavascriptOrder.MEMBER) || '[]';
        const mode = block.getFieldValue('MODE') || 'GET';
        const where = block.getFieldValue('WHERE') || 'FROM_START';
        const value = javascriptGenerator.valueToCode(block, 'TO',
            JavascriptOrder.ASSIGNMENT) || 'null';

        // Cache non-trivial values to variables to prevent repeated look-ups.
        // Closure, which accesses and modifies 'list'.
        function cacheList() {
            if (list.match(/^\w+$/)) {
                return '';
            }
            const listVar = javascriptGenerator.nameDB_.getDistinctName(
                'tmpList', Blockly.Names.NameType.VARIABLE);
            const code = `var ${listVar} = ${list};\n`;
            list = listVar;

            return code;
        }

        switch (where) {
            case 'FIRST':
                if ('SET' === mode) {
                    return `${list}[0] = ${value};\n`;
                } else if ('INSERT' === mode) {
                    return `${list}.unshift(${value});\n`;
                }
                break;
            case 'LAST': {
                if ('SET' === mode) {
                    let code = cacheList();
                    code += `${list}[${list}.length - 1] = ${value};\n`;

                    return code;
                } else if ('INSERT' === mode) {
                    return `${list}.push(${value});\n`;
                }
                break;
            }
            case 'FROM_START': {
                const at = javascriptGenerator.getAdjusted(block, 'AT');
                if ('SET' === mode) {
                    let code = `if(${at} > 1000000) { throw "List index > 1000000"; }\n`;
                    code += `${list}[${at}] = ${value};\n`;

                    return code;
                } else if ('INSERT' === mode) {
                    return `${list}.splice(${at}, 0, ${value});\n`;
                }
                break;
            }
            case 'FROM_END': {
                const at = javascriptGenerator.getAdjusted(block, 'AT', 1, false,
                    JavascriptOrder.SUBTRACTION);
                let code = cacheList();
                if ('SET' === mode) {
                    code += `if(${list}.length - ${at} > 1000000) { throw "List index > 1000000"; }\n`;
                    code += `${list}[${list}.length - ${at}] = ${value};\n`;

                    return code;
                } else if ('INSERT' === mode) {
                    code += `${list}.splice(${list}.length - ${at}, 0, ${value});\n`;

                    return code;
                }
                break;
            }
            case 'RANDOM': {
                let code = cacheList();
                const xVar = javascriptGenerator.nameDB_.getDistinctName(
                    'tmpX', Blockly.Names.NameType.VARIABLE);
                code += `var ${xVar} = Math.floor(Math.random() * ${list}.length);\n`;
                if ('SET' === mode) {
                    code += `${list}[${xVar}] = ${value};\n`;

                    return code;
                } else if ('INSERT' === mode) {
                    code += `${list}.splice(${xVar}, 0, ${value});\n`;

                    return code;
                }
                break;
            }
        }

        throw new Error('Unhandled combination (lists_setIndex).');
    }

    pythonGenerator.forBlock['lists_setIndex'] = function(block) {
        // Set element at index.
        // Note: Until February 2013 this block did not have MODE or WHERE inputs.
        let list = pythonGenerator.valueToCode(block, 'LIST',
            PythonOrder.MEMBER) || '[]';
        const mode = block.getFieldValue('MODE') || 'GET';
        const where = block.getFieldValue('WHERE') || 'FROM_START';
        const value = pythonGenerator.valueToCode(block, 'TO',
            PythonOrder.NONE) || 'None';

        // Cache non-trivial values to variables to prevent repeated look-ups.
        // Closure, which accesses and modifies 'list'.
        function cacheList() {
            if (list.match(/^\w+$/)) {
                return '';
            }
            const listVar = pythonGenerator.nameDB_.getDistinctName(
                'tmp_list', Blockly.Names.NameType.VARIABLE);
            const code = `${listVar} = ${list}\n`;
            list = listVar;

            return code;
        }

        // TODO :: set this as an option
        //  if ('SET' === mode) {
        //      pythonGenerator.provideFunction_('assignIndex', `
        //  def ${pythonGenerator.FUNCTION_NAME_PLACEHOLDER_}(l, i, x):
        //      if i > 1000000:
        //          raise IndexError("list index > 1000000")
        //      n = len(l)
        //      if i >= n:
        //          l.extend([None]*(i-n+1))
        //      l[i] = x`);
        //  }
        function makeAssignIndex(at: string|number, v: string) {
            // TODO :: set this as an option
            //  return `assignIndex(${list}, ${at}, ${v})\n`;
            return `${list}[${at}] = ${v}\n`;
        }

        switch (where) {
            case 'FIRST':
                if ('SET' === mode) {
                    return makeAssignIndex(0, value);
                } else if ('INSERT' === mode) {
                    return `${list}.insert(0, ${value})\n`;
                }
                break;
            case 'LAST':
                if ('SET' === mode) {
                    return makeAssignIndex(-1, value);
                } else if ('INSERT' === mode) {
                    return `${list}.append(${value})\n`;
                }
                break;
            case 'FROM_START': {
                const at = pythonGenerator.getAdjustedInt(block, 'AT');
                if ('SET' === mode) {
                    return makeAssignIndex(at, value);
                } else if ('INSERT' === mode) {
                    return `${list}.insert(${at}, ${value})\n`;
                }
                break;
            }
            case 'FROM_END': {
                const at = pythonGenerator.getAdjustedInt(block, 'AT', 1, true);
                if ('SET' === mode) {
                    return makeAssignIndex(at, value);
                } else if ('INSERT' === mode) {
                    return `${list}.insert(${at}, ${value})\n`;
                }
                break;
            }
            case 'RANDOM': {
                addGeneratorDefinition(pythonGenerator, 'import_random', 'import random');
                let code = cacheList();
                const xVar = pythonGenerator.nameDB_.getDistinctName(
                    'tmp_x', Blockly.Names.NameType.VARIABLE);
                code += `${xVar} = int(random.random() * len(${list}))\n`;
                if ('SET' === mode) {
                    code += makeAssignIndex(xVar, value);

                    return code;
                } else if ('INSERT' === mode) {
                    code += `${list}.insert(${xVar}, ${value})\n`;

                    return code;
                }
                break;
            }
        }

        throw new Error('Unhandled combination (lists_setIndex).');
    }
}
