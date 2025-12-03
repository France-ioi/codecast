function getPlaceholderBlock(placeholderBlocks: boolean, name: string): string {
    return placeholderBlocks ? "<statement name='" + name + "'><shadow type='placeholder_statement'></shadow></statement>" : '';
}

export function getStandardScratchBlocks(placeholderBlocks: boolean, strings) {
    return {
        control: [
            {
                name: "control_if",
                blocklyXml: "<block type='control_if'>" +
                    getPlaceholderBlock(placeholderBlocks, 'SUBSTACK') +
                    "</block>"
            },
            {
                name: "control_if_else",
                blocklyXml: "<block type='control_if_else'>" +
                    getPlaceholderBlock(placeholderBlocks, 'SUBSTACK') +
                    getPlaceholderBlock(placeholderBlocks, 'SUBSTACK2') +
                    "</block>"
            },
            {
                name: "control_repeat",
                blocklyXml: "<block type='control_repeat'>" +
                    "  <value name='TIMES'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>10</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    getPlaceholderBlock(placeholderBlocks, 'SUBSTACK') +
                    "</block>"
            },
            {
                name: "control_repeat_until",
                blocklyXml: "<block type='control_repeat_until'>" +
                    getPlaceholderBlock(placeholderBlocks, 'SUBSTACK') +
                    "</block>"
            },
            {
                name: "control_forever",
                blocklyXml: "<block type='control_forever'></block>",
                excludedByDefault: true
            }
        ],
        input: [
            {
                name: "input_num",
                blocklyXml: "<block type='input_num'></block>"
            },
            {
                name: "input_num_list",
                blocklyXml: "<block type='input_num_list'></block>"
            },
            {
                name: "input_line",
                blocklyXml: "<block type='input_line'></block>"
            },
            {
                name: "input_num_next",
                blocklyXml: "<block type='input_num_next'></block>"
            },
            {
                name: "input_char",
                blocklyXml: "<block type='input_char'></block>"
            },
            {
                name: "input_word",
                blocklyXml: "<block type='input_word'></block>"
            }
        ],
        lists: [
            {
                name: "data_listrepeat",
                blocklyXml: "<block type='data_listrepeat'>" +
                    "  <field name='LIST'>" + (strings ? strings.listVariable : 'list') + "</field>" +
                    "  <value name='ITEM'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'></field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='TIMES'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "data_itemoflist",
                blocklyXml: "<block type='data_itemoflist'>" +
                    "  <field name='LIST'>" + (strings ? strings.listVariable : 'list') + "</field>" +
                    "  <value name='INDEX'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "data_replaceitemoflist",
                blocklyXml: "<block type='data_replaceitemoflist'>" +
                    "  <field name='LIST'>" + (strings ? strings.listVariable : 'list') + "</field>" +
                    "  <value name='INDEX'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='ITEM'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'></field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "lists_sort_place",
                blocklyXml: "<block type='lists_sort_place'><field name='VAR'>{listVariable}</field></block>"
            }
        ],
        math: [
            {
                name: "math_number",
                blocklyXml: "<block type='math_number' gap='32'></block>"
            }
        ],
        operator: [
            {
                name: "operator_add",
                blocklyXml: "<block type='operator_add'>" +
                    "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_subtract",
                blocklyXml: "<block type='operator_subtract'>" +
                    "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_multiply",
                blocklyXml: "<block type='operator_multiply'>" +
                    "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_divide",
                blocklyXml: "<block type='operator_divide'>" +
                    "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_dividefloor",
                blocklyXml: "<block type='operator_dividefloor'>" +
                    "  <value name='NUM1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='NUM2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_equals",
                blocklyXml: "<block type='operator_equals'>" +
                    "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_gt",
                blocklyXml: "<block type='operator_gt'>" +
                    "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_gte",
                blocklyXml: "<block type='operator_gte'>" +
                    "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_lt",
                blocklyXml: "<block type='operator_lt'>" +
                    "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_lte",
                blocklyXml: "<block type='operator_lte'>" +
                    "  <value name='OPERAND1'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "  <value name='OPERAND2'><shadow type='math_number'><field name='NUM'></field></shadow></value>" +
                    "</block>"
            },
            {
                name: "operator_and",
                blocklyXml: "<block type='operator_and'></block>"
            },
            {
                name: "operator_or",
                blocklyXml: "<block type='operator_or'></block>"
            },
            {
                name: "operator_not",
                blocklyXml: "<block type='operator_not'></block>"
            },
            {
                name: "operator_join",
                blocklyXml: "<block type='operator_join'>" +
                    "  <value name='STRING1'><shadow type='text'><field name='TEXT'></field></shadow></value>" +
                    "  <value name='STRING2'><shadow type='text'><field name='TEXT'></field></shadow></value>" +
                    "</block>"
            }
        ],
        tables: [
            {
                name: "tables_2d_init",
                blocklyXml: "<block type='tables_2d_init'>" +
                    "  <value name='LINES'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>2</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='COLS'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>2</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='ITEM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>0</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "tables_2d_set",
                blocklyXml: "<block type='tables_2d_set'>" +
                    "  <value name='LINE'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='COL'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='ITEM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>0</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "tables_2d_get",
                blocklyXml: "<block type='tables_2d_get'>" +
                    "  <value name='LINE'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='COL'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "tables_3d_init",
                blocklyXml: "<block type='tables_3d_init'>" +
                    "  <value name='LAYERS'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>2</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='LINES'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>2</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='COLS'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>2</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='ITEM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>0</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "tables_3d_set",
                blocklyXml: "<block type='tables_3d_set'>" +
                    "  <value name='LAYER'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>2</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='LINE'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='COL'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='ITEM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>0</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "tables_3d_get",
                blocklyXml: "<block type='tables_3d_get'>" +
                    "  <value name='LAYER'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>2</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='LINE'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='COL'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            }
        ],
        texts: [
            {
                name: "text_print",
                blocklyXml: "<block type='text_print'>" +
                    "  <value name='TEXT'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'>abc</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_print_noend",
                blocklyXml: "<block type='text_print_noend'>" +
                    "  <value name='TEXT'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'>abc</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_eval",
                blocklyXml: "<block type='text_eval'></block>"
            }
        ],
        variables: [],
        functions: []
    };
}
