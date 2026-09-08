import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator,  Order as PythonOrder} from 'blockly/python';

export function addTableBlocks(defaultColors: BlocklyColours) {
    Blockly.Blocks['tables_2d_init'] = {
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['TABLES_2D_INIT'],
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": Blockly.Msg['TABLES_VAR_NAME']
                    },
                    {
                        "type": "input_value",
                        "name": "LINES"
                    },
                    {
                        "type": "input_value",
                        "name": "COLS"
                    },
                    {
                        "type": "input_value",
                        "name": "ITEM"
                    }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": defaultColors.categories['tables'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                return Blockly.Msg['TABLES_2D_INIT_TOOLTIP'].replace('%1',
                    thisBlock.getFieldValue('VAR'));
            });
        }
    };

    javascriptGenerator.forBlock['tables_2d_init'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if (blockVarName) {
            varName = javascriptGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        // Use a function to keep scope contained
        const functionName = javascriptGenerator.provideFunction_(
            'tables_2d_init',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(x, y, a) {
    if(x > 1000000 || y > 1000000) { throw "${Blockly.Msg['TABLES_TOO_BIG']}"; }
    var table = [];
    var row = [];
    for(var i = 0; i < y; i++) {
        row[i] = a;
    }
    for(var i = 0; i < x; i++) {
        table[i] = row.slice(0);
    }
    return table;
}`);

        const at1 = javascriptGenerator.valueToCode(block, 'LINES', JavascriptOrder.COMMA) || '0';
        const at2 = javascriptGenerator.valueToCode(block, 'COLS', JavascriptOrder.COMMA) || '0';
        const value = javascriptGenerator.valueToCode(block, 'ITEM',
            JavascriptOrder.ASSIGNMENT) || 'null';

        return `var ${varName} = ${functionName}(${at1}, ${at2}, ${value});
reportBlockValue('${block.id}', ${varName}, '${varName}');
`;
    }

    pythonGenerator.forBlock['tables_2d_init'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if (blockVarName) {
            varName = pythonGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        // Use a function to keep scope contained
        const functionName = pythonGenerator.provideFunction_(
            'tables_2d_init',
            `
def ${pythonGenerator.FUNCTION_NAME_PLACEHOLDER_}(x, y, a):
    if x > 1000000 or y > 1000000: raise IndexError("${Blockly.Msg['TABLES_TOO_BIG']}")
    return [[a] * y for i in range(x)]`);

        const at1 = pythonGenerator.valueToCode(block, 'LINES', PythonOrder.NONE) || '0';
        const at2 = pythonGenerator.valueToCode(block, 'COLS', PythonOrder.NONE) || '0';
        const value = pythonGenerator.valueToCode(block, 'ITEM',
            PythonOrder.NONE) || 'null';

        return `${varName} = ${functionName}(${at1}, ${at2}, ${value});
`;
    }

    Blockly.Blocks['tables_2d_set'] = {
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['TABLES_2D_SET'],
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": Blockly.Msg['TABLES_VAR_NAME']
                    },
                    {
                        "type": "input_value",
                        "name": "LINE"
                    },
                    {
                        "type": "input_value",
                        "name": "COL"
                    },
                    {
                        "type": "input_value",
                        "name": "ITEM"
                    }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": defaultColors.categories['tables'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                return Blockly.Msg['TABLES_2D_SET_TOOLTIP'].replace('%1',
                    thisBlock.getFieldValue('VAR'));
            });
        }
    };

    javascriptGenerator.forBlock['tables_2d_set'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if (blockVarName) {
            varName = javascriptGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        const at1 = javascriptGenerator.getAdjusted(block, 'LINE');
        const at2 = javascriptGenerator.getAdjusted(block, 'COL');
        const value = javascriptGenerator.valueToCode(block, 'ITEM',
            JavascriptOrder.ASSIGNMENT) || 'null';

        let code = "if(typeof " + varName + "[" + at1 + "] == 'undefined' || typeof " + varName + "[" + at1 + "][" + at2 + "] == 'undefined') { throw \"" + Blockly.Msg['TABLES_OUT_OF_BOUNDS'] + "\"; }\n";
        code += varName + '[' + at1 + '][' + at2 + '] = ' + value + ";\n";
        return code;
    }

    pythonGenerator.forBlock['tables_2d_set'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if (blockVarName) {
            varName = pythonGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        const at1 = pythonGenerator.getAdjustedInt(block, 'LINE');
        const at2 = pythonGenerator.getAdjustedInt(block, 'COL');
        const value = pythonGenerator.valueToCode(block, 'ITEM',
            PythonOrder.NONE) || 'None';

        let code = '';
        // TODO :: set this as an option
        //  code += 'if ' + at1 + ' >= len(' + varName + ') or ' + at2 + ' >= len(' + varName + '[' + at1 + ']): raise IndexError("' + Blockly.Msg.TABLES_OUT_OF_BOUNDS + '")\n';
        code += varName + '[' + at1 + '][' + at2 + '] = ' + value + "\n";
        return code;
    }

    Blockly.Blocks['tables_2d_get'] = {
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['TABLES_2D_GET'],
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": Blockly.Msg['TABLES_VAR_NAME']
                    },
                    {
                        "type": "input_value",
                        "name": "LINE"
                    },
                    {
                        "type": "input_value",
                        "name": "COL"
                    }
                ],
                "inputsInline": true,
                "output": null,
                "colour": defaultColors.categories['tables'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                return Blockly.Msg['TABLES_2D_GET_TOOLTIP'].replace('%1',
                    thisBlock.getFieldValue('VAR'));
            });
        }
    };

    javascriptGenerator.forBlock['tables_2d_get'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if (blockVarName) {
            varName = javascriptGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        const at1 = javascriptGenerator.getAdjusted(block, 'LINE');
        const at2 = javascriptGenerator.getAdjusted(block, 'COL');
        const code = varName + '[' + at1 + '][' + at2 + ']';
        return [code, JavascriptOrder.MEMBER];
    }

    pythonGenerator.forBlock['tables_2d_get'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if (blockVarName) {
            varName = pythonGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        const at1 = pythonGenerator.getAdjustedInt(block, 'LINE');
        const at2 = pythonGenerator.getAdjustedInt(block, 'COL');
        const code = varName + '[' + at1 + '][' + at2 + ']';
        return [code, PythonOrder.MEMBER];
    }

    Blockly.Blocks['tables_3d_init'] = {
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['TABLES_3D_INIT'],
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": Blockly.Msg['TABLES_VAR_NAME']
                    },
                    {
                        "type": "input_value",
                        "name": "LAYERS",
                        "check": "Number"
                    },
                    {
                        "type": "input_value",
                        "name": "LINES"
                    },
                    {
                        "type": "input_value",
                        "name": "COLS"
                    },
                    {
                        "type": "input_value",
                        "name": "ITEM"
                    }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": defaultColors.categories['tables'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                return Blockly.Msg['TABLES_3D_INIT_TOOLTIP'].replace('%1',
                    thisBlock.getFieldValue('VAR'));
            });
        }
    };

    javascriptGenerator.forBlock['tables_3d_init'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if (blockVarName) {
            varName = javascriptGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        // Use a function to keep scope contained
        const functionName = javascriptGenerator.provideFunction_(
            'tables_3d_init', `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(x, y, z, a) {
    if(x > 1000000 || y > 1000000 || z > 1000000) { throw "${Blockly.Msg['TABLES_TOO_BIG']}"; }
    var table = [];
    var row = [];
    for(var i = 0; i < z; i++) {
        row[i] = a;
    }
    for(var i = 0; i < x; i++) {
        var layer = [];
        for(var j = 0; j < y; j++) {
            layer[j] = row.slice(0);
        }
        table[i] = layer;
    }
    return table;
}`);

        const at1 = javascriptGenerator.valueToCode(block, 'LAYERS', JavascriptOrder.COMMA) || '0';
        const at2 = javascriptGenerator.valueToCode(block, 'LINES', JavascriptOrder.COMMA) || '0';
        const at3 = javascriptGenerator.valueToCode(block, 'COLS', JavascriptOrder.COMMA) || '0';
        const value = javascriptGenerator.valueToCode(block, 'ITEM',
            JavascriptOrder.ASSIGNMENT) || 'null';

        return `var ${varName} = ${functionName}(${at1}, ${at2}, ${at3}, ${value});
reportBlockValue('${block.id}', ${varName}, '${varName}');
`;
    }

    pythonGenerator.forBlock['tables_3d_init'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if(blockVarName) {
            varName = pythonGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        // Use a function to keep scope contained
        const functionName = pythonGenerator.provideFunction_('tables_3d_init', `
def ${pythonGenerator.FUNCTION_NAME_PLACEHOLDER_}(x, y, z, a):
    if x > 1000000 or y > 1000000 or z > 1000000: raise IndexError("${Blockly.Msg['TABLES_TOO_BIG']}")
    return [[[a] * z for i in range(y)] for j in range(x)]`);

        const at1 = pythonGenerator.valueToCode(block, 'LAYERS', PythonOrder.NONE) || '0';
        const at2 = pythonGenerator.valueToCode(block, 'LINES', PythonOrder.NONE) || '0';
        const at3 = pythonGenerator.valueToCode(block, 'COLS', PythonOrder.NONE) || '0';
        const value = pythonGenerator.valueToCode(block, 'ITEM',
            PythonOrder.NONE) || 'null';

        return `${varName} = ${functionName}(${at1}, ${at2}, ${at3}, ${value});
`;
    }

    Blockly.Blocks['tables_3d_set'] = {
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['TABLES_3D_SET'],
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": Blockly.Msg['TABLES_VAR_NAME']
                    },
                    {
                        "type": "input_value",
                        "name": "LAYER"
                    },
                    {
                        "type": "input_value",
                        "name": "LINE"
                    },
                    {
                        "type": "input_value",
                        "name": "COL"
                    },
                    {
                        "type": "input_value",
                        "name": "ITEM"
                    }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": defaultColors.categories['tables'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                return Blockly.Msg['TABLES_3D_SET_TOOLTIP'].replace('%1',
                    thisBlock.getFieldValue('VAR'));
            });
        }
    };

    javascriptGenerator.forBlock['tables_3d_set'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if(blockVarName) {
            varName = javascriptGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        const at1 = javascriptGenerator.getAdjusted(block, 'LAYER');
        const at2 = javascriptGenerator.getAdjusted(block, 'LINE');
        const at3 = javascriptGenerator.getAdjusted(block, 'COL');
        const value = javascriptGenerator.valueToCode(block, 'ITEM',
            JavascriptOrder.ASSIGNMENT) || 'null';

        let code = "if(typeof " + varName + "[" + at1 + "] == 'undefined' || typeof " + varName + "[" + at1 + "][" + at2 + "] == 'undefined' || typeof " + varName + "[" + at1 + "][" + at2 + "][" + at3 + "] == 'undefined') { throw \"" + Blockly.Msg['TABLES_OUT_OF_BOUNDS'] + "\"; }\n";
        code += varName + '[' + at1 + '][' + at2 + '][' + at3 + '] = ' + value + ";\n";
        return code;
    }

    pythonGenerator.forBlock['tables_3d_set'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if(blockVarName) {
            varName = pythonGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        const at1 = pythonGenerator.getAdjustedInt(block, 'LAYER');
        const at2 = pythonGenerator.getAdjustedInt(block, 'LINE');
        const at3 = pythonGenerator.getAdjustedInt(block, 'COL');
        const value = pythonGenerator.valueToCode(block, 'ITEM',
            PythonOrder.NONE) || 'None';

        let code = '';
        // TODO :: set this as an option
        //  code += 'if ' + at1 + ' >= len(' + varName + ') or ' + at2 + ' >= len(' + varName + '[' + at1 + ']) or ' + at3 + ' >= len(' + varName + '[' + at1 + '][' + at2 + ']): raise IndexError("' + Blockly.Msg.TABLES_OUT_OF_BOUNDS + '")\n';
        code += varName + '[' + at1 + '][' + at2 + '][' + at3 + '] = ' + value + "\n";
        return code;
    }

    Blockly.Blocks['tables_3d_get'] = {
        init: function() {
            this.jsonInit({
                "message0": Blockly.Msg['TABLES_3D_GET'],
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": Blockly.Msg['TABLES_VAR_NAME']
                    },
                    {
                        "type": "input_value",
                        "name": "LAYER"
                    },
                    {
                        "type": "input_value",
                        "name": "LINE"
                    },
                    {
                        "type": "input_value",
                        "name": "COL"
                    }
                ],
                "inputsInline": true,
                "output": null,
                "colour": defaultColors.categories['tables'],
            });
            const thisBlock = this;
            this.setTooltip(function() {
                return Blockly.Msg['TABLES_3D_GET_TOOLTIP'].replace('%1',
                    thisBlock.getFieldValue('VAR'));
            });
        }
    };

    javascriptGenerator.forBlock['tables_3d_get'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if(blockVarName) {
            varName = javascriptGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }
        
        const at1 = javascriptGenerator.getAdjusted(block, 'LAYER');
        const at2 = javascriptGenerator.getAdjusted(block, 'LINE');
        const at3 = javascriptGenerator.getAdjusted(block, 'COL');
        const code = varName + '[' + at1 + '][' + at2 + '][' + at3 + ']';
        return [code, JavascriptOrder.MEMBER];
    }

    pythonGenerator.forBlock['tables_3d_get'] = function(block) {
        const blockVarName = block.getFieldValue('VAR');
        let varName = 'unnamed_variable';
        if(blockVarName) {
            varName = pythonGenerator.nameDB_.getName(
                block.getFieldValue('VAR'),
                Blockly.Names.NameType.VARIABLE
            );
        }

        const at1 = pythonGenerator.getAdjustedInt(block, 'LAYER');
        const at2 = pythonGenerator.getAdjustedInt(block, 'LINE');
        const at3 = pythonGenerator.getAdjustedInt(block, 'COL');
        const code = varName + '[' + at1 + '][' + at2 + '][' + at3 + ']';
        return [code, PythonOrder.MEMBER];
    }
}
