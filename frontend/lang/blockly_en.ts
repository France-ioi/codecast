const Blockly: any = {Msg: {}};

Blockly.Msg.VARIABLES_DEFAULT_NAME = "element";
Blockly.Msg.CONTROLS_REPEAT_INPUT_DO = "";

Blockly.Msg.DICTS_CREATE_EMPTY_TITLE = "empty dictionary";
Blockly.Msg.DICTS_CREATE_WITH_CONTAINER_TITLE_ADD = "Create a dictionary";
Blockly.Msg.DICTS_CREATE_WITH_CONTAINER_TOOLTIP = "";
Blockly.Msg.DICTS_CREATE_WITH_INPUT_WITH = "create a dictionary :";
Blockly.Msg.DICTS_CREATE_WITH_ITEM_KEY = "ckey";
Blockly.Msg.DICTS_CREATE_WITH_ITEM_MAPPING = ":";
Blockly.Msg.DICTS_CREATE_WITH_ITEM_TITLE = "key/value";
Blockly.Msg.DICTS_CREATE_WITH_ITEM_TOOLTIP = "";
Blockly.Msg.DICTS_CREATE_WITH_TOOLTIP = "";
Blockly.Msg.DICT_GET = "get the key";
Blockly.Msg.DICT_GET_TO = "from";
Blockly.Msg.DICT_KEYS = "list of the keys of";
Blockly.Msg.DICT_SET_TITLE = "assign to key";
Blockly.Msg.DICT_SET_OF = "of dictionary";
Blockly.Msg.DICT_SET_TO = "to";

Blockly.Msg.TEXT_PRINT_TITLE = "print line %1";
Blockly.Msg.TEXT_PRINT_TOOLTIP = "Print the text, number or other value, with a newline after.";
Blockly.Msg.TEXT_PRINT_NOEND_TITLE = "print %1";
Blockly.Msg.TEXT_PRINT_NOEND_TOOLTIP = "Print the text, number or other value, without newline.";

Blockly.Msg.TEXT_STR_TITLE = "convert to text %1";
Blockly.Msg.TEXT_STR_TOOLTIP = "Convert a value to text.";

Blockly.Msg.LISTS_APPEND_MSG = "to the list %1 add the element %2";
Blockly.Msg.LISTS_APPEND_TOOLTIP = "Add an element to the list '%1'";
Blockly.Msg.LISTS_GET_INDEX_FIRST = "at the beginning";
Blockly.Msg.LISTS_GET_INDEX_FROM_END = "at the index from the end";
Blockly.Msg.LISTS_GET_INDEX_FROM_START = "at the index";
Blockly.Msg.LISTS_GET_INDEX_GET = "get value";
Blockly.Msg.LISTS_GET_INDEX_GET_REMOVE = "get and remove value";
Blockly.Msg.LISTS_GET_INDEX_LAST = "at the end";
Blockly.Msg.LISTS_GET_INDEX_RANDOM = "at a random index";
Blockly.Msg.LISTS_GET_INDEX_REMOVE = "remove value";
Blockly.Msg.LISTS_SET_INDEX_INSERT = "insert";
Blockly.Msg.LISTS_SORT_TITLE = "return the sort %1 %2 of list %3"
Blockly.Msg.LISTS_SORT_PLACE_MSG = "sort list %1 in place";
Blockly.Msg.LISTS_SORT_PLACE_TOOLTIP = "Sorts list '%1' and modifies it directly.";

Blockly.Msg.INPUT_NUM = "read a single number on the whole line";
Blockly.Msg.INPUT_NUM_TOOLTIP = "Reads a single number on a line, on the program input.";
Blockly.Msg.INPUT_NUM_LIST = "read a list of numbers on a line";
Blockly.Msg.INPUT_NUM_LIST_TOOLTIP = "Reads a list of numbers on a line, on the program input.";
Blockly.Msg.INPUT_NUM_NEXT = "read a number";
Blockly.Msg.INPUT_NUM_NEXT_TOOLTIP = "Reads the next number on the program input.";
Blockly.Msg.INPUT_CHAR = "read a character";
Blockly.Msg.INPUT_CHAR_TOOLTIP = "Reads a character on the program input.";
Blockly.Msg.INPUT_WORD = "read a word";
Blockly.Msg.INPUT_WORD_TOOLTIP = "Reads a word on the program input.";
Blockly.Msg.INPUT_LINE = "read a line";
Blockly.Msg.INPUT_LINE_TOOLTIP = "Reads a line on the program input.";

Blockly.Msg.CANNOT_DELETE_VARIABLE_PROCEDURE = "Cannot delete variable '%1', used by procedure '%2'.";

Blockly.Msg.DATA_REPLACEITEMOFLIST_TITLE = "replace element %1 of list %2 with %3";
Blockly.Msg.DATA_ITEMOFLIST_TITLE = "element %1 in %2";
Blockly.Msg.DATA_LISTREPEAT_TITLE = "initialize list %1 with %2 repeated %3 times";

Blockly.Msg.INVALID_NAME = "Invalid name, please only use letters, some letters with accents, digits (except as first character), and underscore '_'.";

Blockly.Msg.MATH_DIVISIONFLOOR_SYMBOL = ' // ';
Blockly.Msg.MATH_ARITHMETIC_TOOLTIP_DIVIDEFLOOR = "Return the whole part of the division of the two numbers.";

export default Blockly;
