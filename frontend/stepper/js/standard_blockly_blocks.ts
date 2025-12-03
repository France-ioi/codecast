function getPlaceholderBlock(placeholderBlocks: boolean, name: string): string {
    return placeholderBlocks ? "<statement name='" + name + "'><shadow type='placeholder_statement'></shadow></statement>" : '';
}

export function getStandardBlocklyBlocks(placeholderBlocks: boolean, showIfMutator: boolean = false) {
    return {
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
        logic: [
            {
                name: "controls_if",
                blocklyXml: "<block type='controls_if'>" +
                    getPlaceholderBlock(placeholderBlocks, 'DO0') +
                    "</block>"
            },
            {
                name: "controls_if_else",
                blocklyXml: "<block type='controls_if'><mutation else='1'></mutation>" +
                    getPlaceholderBlock(placeholderBlocks, 'DO0') +
                    getPlaceholderBlock(placeholderBlocks, 'ELSE') +
                    "</block>",
                excludedByDefault: showIfMutator,
            },
            {
                name: "logic_compare",
                blocklyXml: "<block type='logic_compare'></block>"
            },
            {
                name: "logic_operation",
                blocklyXml: "<block type='logic_operation' inline='false'></block>"
            },
            {
                name: "logic_negate",
                blocklyXml: "<block type='logic_negate'></block>"
            },
            {
                name: "logic_boolean",
                blocklyXml: "<block type='logic_boolean'></block>"
            },
            {
                name: "logic_null",
                blocklyXml: "<block type='logic_null'></block>",
                excludedByDefault: true
            },
            {
                name: "logic_ternary",
                blocklyXml: "<block type='logic_ternary'></block>",
                excludedByDefault: true
            }
        ],
        loops: [
            {
                name: "controls_loop",
                blocklyXml: "<block type='controls_loop'></block>",
                excludedByDefault: true
            },
            {
                name: "controls_repeat",
                blocklyXml: "<block type='controls_repeat'>" +
                    getPlaceholderBlock(placeholderBlocks, 'DO') +
                    "</block>",
                excludedByDefault: true
            },
            {
                name: "controls_repeat_ext",
                blocklyXml: "<block type='controls_repeat_ext'>" +
                    "  <value name='TIMES'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>10</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    getPlaceholderBlock(placeholderBlocks, 'DO') +
                    "</block>"
            },
            {
                name: "controls_repeat_ext_noShadow",
                blocklyXml: "<block type='controls_repeat_ext'></block>",
                excludedByDefault: true
            },
            {
                name: "controls_whileUntil",
                blocklyXml: "<block type='controls_whileUntil'></block>"
            },
            {
                name: "controls_untilWhile",
                blocklyXml: "<block type='controls_whileUntil'><field name='MODE'>UNTIL</field></block>",
                excludedByDefault: true
            },
            {
                name: "controls_for",
                blocklyXml: "<block type='controls_for'>" +
                    "  <value name='FROM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='TO'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>10</field>" +
                    "     </shadow>" +
                    "  </value>" +
                    "  <value name='BY'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "controls_for_noShadow",
                blocklyXml: "<block type='controls_for'></block>",
                excludedByDefault: true
            },
            {
                name: "controls_for_fillShadow",
                blocklyXml: "<block type='controls_for'>" +
                    "  <value name='FROM'>" +
                    "    <block type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </block>" +
                    "  </value>" +
                    "  <value name='TO'>" +
                    "    <block type='math_number'>" +
                    "      <field name='NUM'>10</field>" +
                    "     </block>" +
                    "  </value>" +
                    "  <value name='BY'>" +
                    "    <block type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </block>" +
                    "  </value>" +
                    "</block>",
                excludedByDefault: true
            },
            {
                name: "controls_forEach",
                blocklyXml: "<block type='controls_forEach'></block>",
                excludedByDefault: true
            },
            {
                name: "controls_flow_statements",
                blocklyXml: "<block type='controls_flow_statements'></block>"
            },
            {
                name: "controls_infiniteloop",
                blocklyXml: "<block type='controls_infiniteloop'></block>",
                excludedByDefault: true
            },
        ],
        math: [
            {
                name: "math_number",
                blocklyXml: "<block type='math_number' gap='32'></block>"
            },
            {
                name: "math_arithmetic",
                blocklyXml: "<block type='math_arithmetic'>" +
                    "  <value name='A'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='B'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "math_arithmetic_noShadow",
                blocklyXml: "<block type='math_arithmetic'></block>",
                excludedByDefault: true
            },
            {
                name: "math_single",
                blocklyXml: "<block type='math_single'>" +
                    "  <value name='NUM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>9</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "math_single_noShadow",
                blocklyXml: "<block type='math_single'></block>",
                excludedByDefault: true
            },
            {
                name: "math_extra_single",
                blocklyXml: "<block type='math_extra_single'>" +
                    "  <value name='NUM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>9</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>",
                excludedByDefault: true
            },
            {
                name: "math_extra_single_noShadow",
                blocklyXml: "<block type='math_extra_single'></block>",
                excludedByDefault: true
            },
            {
                name: "math_extra_double",
                blocklyXml: "<block type='math_extra_double'>" +
                    "  <value name='A'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='B'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>",
                excludedByDefault: true
            },
            {
                name: "math_extra_double",
                blocklyXml: "<block type='math_extra_double'></block>",
                excludedByDefault: true
            },
            {
                name: "math_trig",
                blocklyXml: "<block type='math_trig'>" +
                    "  <value name='NUM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>45</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>",
                excludedByDefault: true
            },
            {
                name: "math_trig_noShadow",
                blocklyXml: "<block type='math_trig'></block>",
                excludedByDefault: true
            },
            {
                name: "math_constant",
                blocklyXml: "<block type='math_constant'></block>",
                excludedByDefault: true
            },
            {
                name: "math_number_property",
                blocklyXml: "<block type='math_number_property'>" +
                    "  <value name='NUMBER_TO_CHECK'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>0</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "math_number_property_noShadow",
                blocklyXml: "<block type='math_number_property'></block>",
                excludedByDefault: true
            },
            {
                name: "math_round",
                blocklyXml: "<block type='math_round'>" +
                    "  <value name='NUM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>3.1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "math_round_noShadow",
                blocklyXml: "<block type='math_round'></block>",
                excludedByDefault: true
            },
            {
                name: "math_on_list",
                blocklyXml: "<block type='math_on_list'></block>",
                excludedByDefault: true
            },
            {
                name: "math_modulo",
                blocklyXml: "<block type='math_modulo'>" +
                    "  <value name='DIVIDEND'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>64</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='DIVISOR'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>10</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "math_modulo_noShadow",
                blocklyXml: "<block type='math_modulo'></block>",
                excludedByDefault: true
            },
            {
                name: "math_constrain",
                blocklyXml: "<block type='math_constrain'>" +
                    "  <value name='VALUE'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>50</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='LOW'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='HIGH'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>100</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>",
                excludedByDefault: true
            },
            {
                name: "math_constrain_noShadow",
                blocklyXml: "<block type='math_constrain'></block>",
                excludedByDefault: true
            },
            {
                name: "math_random_int",
                blocklyXml: "<block type='math_random_int'>" +
                    "  <value name='FROM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>1</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='TO'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>100</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>",
                excludedByDefault: true
            },
            {
                name: "math_random_int_noShadow",
                blocklyXml: "<block type='math_random_int'></block>",
                excludedByDefault: true
            },
            {
                name: "math_random_float",
                blocklyXml: "<block type='math_random_float'></block>",
                excludedByDefault: true
            }
        ],
        texts: [
            {
                name: "text",
                blocklyXml: "<block type='text'></block>"
            },
            {
                name: "text_eval",
                blocklyXml: "<block type='text_eval'></block>"
            },
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
                name: "text_join",
                blocklyXml: "<block type='text_join'></block>"
            },
            {
                name: "text_append",
                blocklyXml: "<block type='text_append'></block>"
            },
            {
                name: "text_length",
                blocklyXml: "<block type='text_length'>" +
                    "  <value name='VALUE'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'>abc</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_length_noShadow",
                blocklyXml: "<block type='text_length'></block>",
                excludedByDefault: true
            },
            {
                name: "text_isEmpty",
                blocklyXml: "<block type='text_isEmpty'>" +
                    "  <value name='VALUE'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'></field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_isEmpty_noShadow",
                blocklyXml: "<block type='text_isEmpty'></block>",
                excludedByDefault: true
            },
            {
                name: "text_indexOf",
                blocklyXml: "<block type='text_indexOf'>" +
                    "  <value name='VALUE'>" +
                    "    <block type='variables_get'>" +
                    "      <field name='VAR'>{textVariable}</field>" +
                    "    </block>" +
                    "  </value>" +
                    "  <value name='FIND'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'>abc</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_indexOf_noShadow",
                blocklyXml: "<block type='text_indexOf'></block>",
                excludedByDefault: true
            },
            {
                name: "text_charAt",
                blocklyXml: "<block type='text_charAt'>" +
                    "  <value name='VALUE'>" +
                    "    <block type='variables_get'>" +
                    "      <field name='VAR'>{textVariable}</field>" +
                    "    </block>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_charAt_noShadow",
                blocklyXml: "<block type='text_charAt'></block>",
                excludedByDefault: true

            },
            {
                name: "text_getSubstring",
                blocklyXml: "<block type='text_getSubstring'>" +
                    "  <value name='STRING'>" +
                    "    <block type='variables_get'>" +
                    "      <field name='VAR'>{textVariable}</field>" +
                    "    </block>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_getSubstring_noShadow",
                blocklyXml: "<block type='text_getSubstring'></block>",
                excludedByDefault: true
            },
            {
                name: "text_changeCase",
                blocklyXml: "<block type='text_changeCase'>" +
                    "  <value name='TEXT'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'>abc</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_changeCase_noShadow",
                blocklyXml: "<block type='text_changeCase'></block>",
                excludedByDefault: true
            },
            {
                name: "text_trim",
                blocklyXml: "<block type='text_trim'>" +
                    "  <value name='TEXT'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'>abc</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "text_trim_noShadow",
                blocklyXml: "<block type='text_trim'></block>",
                excludedByDefault: true
            },
            {
                name: "text_print_noShadow",
                blocklyXml: "<block type='text_print'></block>",
                excludedByDefault: true
            },
            {
                name: "text_prompt_ext",
                blocklyXml: "<block type='text_prompt_ext'>" +
                    "  <value name='TEXT'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'>abc</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>",
                excludedByDefault: true
            },
            {
                name: "text_prompt_ext_noShadow",
                blocklyXml: "<block type='text_prompt_ext'></block>",
                excludedByDefault: true
            },

            {
                name: "text_str",
                blocklyXml: "<block type='text_str'></block>"
            }
        ],
        lists: [
            {
                name: "lists_create_with_empty",
                blocklyXml: "<block type='lists_create_with'>" +
                    "  <mutation items='0'></mutation>" +
                    "</block>"
            },
            {
                name: "lists_create_with",
                blocklyXml: "<block type='lists_create_with'></block>"
            },
            {
                name: "lists_repeat",
                blocklyXml: "<block type='lists_repeat'>" +
                    "  <value name='NUM'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>5</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "lists_length",
                blocklyXml: "<block type='lists_length'></block>"
            },
            {
                name: "lists_isEmpty",
                blocklyXml: "<block type='lists_isEmpty'></block>"
            },
            {
                name: "lists_indexOf",
                blocklyXml: "<block type='lists_indexOf'>" +
                    "  <value name='VALUE'>" +
                    "    <block type='variables_get'>" +
                    "      <field name='VAR'>{listVariable}</field>" +
                    "    </block>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "lists_getIndex",
                blocklyXml: "<block type='lists_getIndex'>" +
                    "  <value name='VALUE'>" +
                    "    <block type='variables_get'>" +
                    "      <field name='VAR'>{listVariable}</field>" +
                    "    </block>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "lists_setIndex",
                blocklyXml: "<block type='lists_setIndex'>" +
                    "  <value name='LIST'>" +
                    "    <block type='variables_get'>" +
                    "      <field name='VAR'>{listVariable}</field>" +
                    "    </block>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "lists_getSublist",
                blocklyXml: "<block type='lists_getSublist'>" +
                    "  <value name='LIST'>" +
                    "    <block type='variables_get'>" +
                    "      <field name='VAR'>{listVariable}</field>" +
                    "    </block>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "lists_sort_place",
                blocklyXml: "<block type='lists_sort_place'><field name='VAR'>{listVariable}</field></block>"
            },
            {
                name: "lists_sort",
                blocklyXml: "<block type='lists_sort'></block>"
            },
            {
                name: "lists_split",
                blocklyXml: "<block type='lists_split'>" +
                    "  <value name='DELIM'>" +
                    "    <shadow type='text'>" +
                    "      <field name='TEXT'>,</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "lists_append",
                blocklyXml: "<block type='lists_append'><field name='VAR'>{listVariable}</field></block>"
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
        // Note :: this category is not enabled unless explicitly specified
        colour: [
            {
                name: "colour_picker",
                blocklyXml: "<block type='colour_picker'></block>"
            },
            {
                name: "colour_random",
                blocklyXml: "<block type='colour_random'></block>"
            },
            {
                name: "colour_rgb",
                blocklyXml: "<block type='colour_rgb'>" +
                    "  <value name='RED'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>100</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='GREEN'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>50</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='BLUE'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>0</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "colour_rgb_noShadow",
                blocklyXml: "<block type='colour_rgb'></block>",
                excludedByDefault: true
            },
            {
                name: "colour_blend",
                blocklyXml: "<block type='colour_blend'>" +
                    "  <value name='COLOUR1'>" +
                    "    <shadow type='colour_picker'>" +
                    "      <field name='COLOUR'>#ff0000</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='COLOUR2'>" +
                    "    <shadow type='colour_picker'>" +
                    "      <field name='COLOUR'>#3333ff</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "  <value name='RATIO'>" +
                    "    <shadow type='math_number'>" +
                    "      <field name='NUM'>0.5</field>" +
                    "    </shadow>" +
                    "  </value>" +
                    "</block>"
            },
            {
                name: "colour_blend_noShadow",
                blocklyXml: "<block type='colour_blend'></block>",
                excludedByDefault: true
            }
        ],
        dicts: [
            {
                name: "dicts_create_with",
                blocklyXml: "<block type='dicts_create_with'></block>"
            },
            {
                name: "dict_get_literal",
                blocklyXml: "<block type='dict_get_literal'></block>"
            },
            {
                name: "dict_set_literal",
                blocklyXml: "<block type='dict_set_literal'></block>"
            },
            {
                name: "dict_keys",
                blocklyXml: "<block type='dict_keys'></block>"
            }
        ],
        variables: [],
        functions: []
    };
}
