import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';
import {addGeneratorDefinition} from './utils';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';

// The JavaScript generators of these blocks live in `js_adapter.ts`: they read
// from the interpreter's `input()` rather than from a `readline()` global, so
// they can't be shared with the original FioiBlockly implementation.

export function addInputBlocks(defaultColors: BlocklyColours) {
    Blockly.Blocks['input_num'] = {
        // Read a number.
        init: function() {
            this.setColour(defaultColors.categories['input']);
            this.appendDummyInput()
                .appendField(Blockly.Msg['INPUT_NUM']);
            this.setOutput(true, 'Number');
            this.setTooltip(Blockly.Msg['INPUT_NUM_TOOLTIP']);
        }
    };

    javascriptGenerator.forBlock['input_num'] = function () {
        const readStdinName = javascriptGenerator.provideFunction_(
            'readStdin',
            `
var stdinBuffer = '';
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  if (stdinBuffer == '')
      return input();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  return stdinBuffer;
}
        `);

        const code = `parseInt(${readStdinName}())`;

        return [code, JavascriptOrder.ATOMIC];
    };

    pythonGenerator.forBlock['input_num'] = function() {
        return ['int(input())', PythonOrder.ATOMIC];
    }

    Blockly.Blocks['input_num_next'] = {
        // Read a number.
        init: function() {
            this.setColour(defaultColors.categories['input']);
            this.appendDummyInput()
                .appendField(Blockly.Msg['INPUT_NUM_NEXT']);
            this.setOutput(true, 'Number');
            this.setTooltip(Blockly.Msg['INPUT_NUM_NEXT_TOOLTIP']);
        }
    };

    javascriptGenerator.forBlock['input_num_next'] = function () {
        const readStdinName = javascriptGenerator.provideFunction_(
            'readStdin',
            `
var stdinBuffer = '';
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  if (stdinBuffer == '')
      return input();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  return stdinBuffer;
}
        `);

        const inputWordName = javascriptGenerator.provideFunction_(
            'input_word',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  while (!stdinBuffer || stdinBuffer.trim() == '')
      stdinBuffer = ${readStdinName}();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  var re = /\\S+\\s*/;
  var w = re.exec(stdinBuffer);
  stdinBuffer = stdinBuffer.substr(w[0].length);
  return w[0];
}
        `);

        const code = `parseInt(${inputWordName}())`;

        return [code, JavascriptOrder.ATOMIC];
    };

    pythonGenerator.forBlock['input_num_next'] = function() {
        // TODO :: make a more optimized version of this
        const functionName = providePythonInputWord();

        return [`int(${functionName}())`, PythonOrder.ATOMIC];
    }

    Blockly.Blocks['input_char'] = {
        // Read a character.
        init: function() {
            this.setColour(defaultColors.categories['input']);
            this.appendDummyInput()
                .appendField(Blockly.Msg['INPUT_CHAR']);
            this.setOutput(true, 'String');
            this.setTooltip(Blockly.Msg['INPUT_CHAR_TOOLTIP']);
        }
    };

    javascriptGenerator.forBlock['input_char'] = function () {
        const readStdinName = javascriptGenerator.provideFunction_(
            'readStdin',
            `
var stdinBuffer = '';
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  if (stdinBuffer == '')
      return input();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  return stdinBuffer;
}
        `);

        const inputCharName = javascriptGenerator.provideFunction_(
            'input_char',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var buf = ${readStdinName}();
  stdinBuffer = buf.substr(1);
  return buf.substr(0, 1);
}
        `);

        const code = `${inputCharName}()`;

        return [code, JavascriptOrder.ATOMIC];
    };

    pythonGenerator.forBlock['input_char'] = function() {
        addGeneratorDefinition(pythonGenerator, 'import_sys', 'import sys');

        return ['sys.stdin.read(1)', PythonOrder.ATOMIC];
    }

    Blockly.Blocks['input_word'] = {
        // Read a word.
        init: function() {
            this.setColour(defaultColors.categories['input']);
            this.appendDummyInput()
                .appendField(Blockly.Msg['INPUT_WORD']);
            this.setOutput(true, 'String');
            this.setTooltip(Blockly.Msg['INPUT_WORD_TOOLTIP']);
        }
    };

    javascriptGenerator.forBlock['input_word'] = function () {
        const readStdinName = javascriptGenerator.provideFunction_(
            'readStdin',
            `
var stdinBuffer = '';
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  if (stdinBuffer == '')
      return input();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  return stdinBuffer;
}
        `);

        const inputWordName = javascriptGenerator.provideFunction_(
            'input_word',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  while (!stdinBuffer || stdinBuffer.trim() == '')
      stdinBuffer = ${readStdinName}();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  var re = /\\S+\\s*/;
  var w = re.exec(stdinBuffer);
  stdinBuffer = stdinBuffer.substr(w[0].length);
  return w[0];
}
        `);

        const code = `${inputWordName}()`;

        return [code, JavascriptOrder.ATOMIC];
    };

    pythonGenerator.forBlock['input_word'] = function() {
        const functionName = providePythonInputWord();

        return [`${functionName}()`, PythonOrder.ATOMIC];
    }

    Blockly.Blocks['input_line'] = {
        // Read a line.
        init: function() {
            this.setColour(defaultColors.categories['input']);
            this.appendDummyInput()
                .appendField(Blockly.Msg['INPUT_LINE']);
            this.setOutput(true, 'String');
            this.setTooltip(Blockly.Msg['INPUT_LINE_TOOLTIP']);
        }
    };

    javascriptGenerator.forBlock['input_line'] = function () {
        const readStdinName = javascriptGenerator.provideFunction_(
            'readStdin',
            `
var stdinBuffer = '';
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  if (stdinBuffer == '')
      return input();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  return stdinBuffer;
}
        `);

        const code = `${readStdinName}()`;

        return [code, JavascriptOrder.ATOMIC];
    };

    pythonGenerator.forBlock['input_line'] = function() {
        addGeneratorDefinition(pythonGenerator, 'import_sys', 'import sys');

        return ['sys.stdin.readline()[:-1]', PythonOrder.ATOMIC];
    }

    Blockly.Blocks['input_num_list'] = {
        // Read a list of numbers.
        init: function() {
            this.setColour(defaultColors.categories['input']);
            this.appendDummyInput()
                .appendField(Blockly.Msg['INPUT_NUM_LIST']);
            this.setOutput(true, 'Array');
            this.setTooltip(Blockly.Msg['INPUT_NUM_LIST_TOOLTIP']);
        }
    };

    javascriptGenerator.forBlock['input_num_list'] = function () {
        const readStdinName = javascriptGenerator.provideFunction_(
            'readStdin',
            `
var stdinBuffer = '';
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  if (stdinBuffer == '')
      return input();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  return stdinBuffer;
}
        `);

        const inputNumListName = javascriptGenerator.provideFunction_(
            'input_num_list',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var parts = ${readStdinName}().split(/\\s+/);
  for(var i=0; i<parts.length; i++) {
      parts[i] = parseInt(parts[i]);
  }
  return parts;
}
        `);

        const code = `${inputNumListName}()`;

        return [code, JavascriptOrder.ATOMIC];
    };

    pythonGenerator.forBlock['input_num_list'] = function() {
        return ['list(map(int, input().split()))', PythonOrder.ATOMIC];
    }
}

function providePythonInputWord(): string {
    addGeneratorDefinition(pythonGenerator, 'import_sys', 'import sys');
    addGeneratorDefinition(pythonGenerator, 'from_string_import_whitespace', 'from string import whitespace');

    return pythonGenerator.provideFunction_(
        'input_word',
        `
def ${pythonGenerator.FUNCTION_NAME_PLACEHOLDER_}():
    buffer = ''
    newchar = 'c'
    while newchar:
        newchar = sys.stdin.read(1)
        if newchar in whitespace:
            if buffer: break
        else:
            buffer += newchar
    return buffer`);
}
