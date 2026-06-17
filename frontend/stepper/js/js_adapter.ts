import { javascriptGenerator, Order as JavascriptOrder } from 'blockly/javascript';

export function adaptJsBlocks() {
    javascriptGenerator.forBlock['input_num'] = function () {
        javascriptGenerator.provideFunction_(
            'readStdin',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var stdinBuffer = '';
  function readStdin() {
      if (stdinBuffer == '')
          return input();
      if (typeof stdinBuffer === 'undefined')
          stdinBuffer = '';
      return stdinBuffer;
  };
}
        `);

        const code = 'parseInt(readStdin())';

        return [code, JavascriptOrder.ATOMIC];
    };

    javascriptGenerator.forBlock['input_num_next'] = function () {
        javascriptGenerator.provideFunction_(
            'readStdin',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var stdinBuffer = '';
  function readStdin() {
      if (stdinBuffer == '')
          return input();
      if (typeof stdinBuffer === 'undefined')
          stdinBuffer = '';
      return stdinBuffer;
  };
}
        `);

        javascriptGenerator.provideFunction_(
            'input_word',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  while (!stdinBuffer || stdinBuffer.trim() == '')
      stdinBuffer = readStdin();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  var re = /\\S+\\s*/;
  var w = re.exec(stdinBuffer);
  stdinBuffer = stdinBuffer.substr(w[0].length);
  return w[0];
}
        `);

        var code = 'parseInt(input_word())';
        return [code, JavascriptOrder.ATOMIC];
    };

    javascriptGenerator.forBlock['input_char'] = function () {
        javascriptGenerator.provideFunction_(
            'readStdin',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var stdinBuffer = '';
  function readStdin() {
      if (stdinBuffer == '')
          return input();
      if (typeof stdinBuffer === 'undefined')
          stdinBuffer = '';
      return stdinBuffer;
  };
}
        `);

        javascriptGenerator.provideFunction_(
            'input_char',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var buf = readStdin();
  stdinBuffer = buf.substr(1);
  return buf.substr(0, 1);
}
        `);

        var code = 'input_char()';
        return [code, JavascriptOrder.ATOMIC];
    };

    javascriptGenerator.forBlock['input_word'] = function () {
        javascriptGenerator.provideFunction_(
            'readStdin',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var stdinBuffer = '';
  function readStdin() {
      if (stdinBuffer == '')
          return input();
      if (typeof stdinBuffer === 'undefined')
          stdinBuffer = '';
      return stdinBuffer;
  };
}
        `);

        javascriptGenerator.provideFunction_(
            'input_word',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  while (!stdinBuffer || stdinBuffer.trim() == '')
      stdinBuffer = readStdin();
  if (typeof stdinBuffer === 'undefined')
      stdinBuffer = '';
  var re = /\\S+\\s*/;
  var w = re.exec(stdinBuffer);
  stdinBuffer = stdinBuffer.substr(w[0].length);
  return w[0];
}
        `);

        var code = 'input_word()';
        return [code, JavascriptOrder.ATOMIC];
    };

    javascriptGenerator.forBlock['input_line'] = function () {
        javascriptGenerator.provideFunction_(
            'readStdin',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var stdinBuffer = '';
  function readStdin() {
      if (stdinBuffer == '')
          return input();
      if (typeof stdinBuffer === 'undefined')
          stdinBuffer = '';
      return stdinBuffer;
  };
}
        `);

        var code = 'readStdin()';
        return [code, JavascriptOrder.ATOMIC];
    };

    javascriptGenerator.forBlock['input_num_list'] = function () {
        javascriptGenerator.provideFunction_(
            'readStdin',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var stdinBuffer = '';
  function readStdin() {
      if (stdinBuffer == '')
          return input();
      if (typeof stdinBuffer === 'undefined')
          stdinBuffer = '';
      return stdinBuffer;
  };
}
        `);

        javascriptGenerator.provideFunction_(
            'input_num_list',
            `
function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  var parts = readStdin().split(/\\s+/);
  for(var i=0; i<parts.length; i++) {
      parts[i] = parseInt(parts[i]);
  }
  return parts;
}
        `);

        var code = 'input_num_list()';
        return [code, JavascriptOrder.ATOMIC];
    };


    javascriptGenerator.forBlock['text_print'] = function (block) {
        return "print(" + (javascriptGenerator.valueToCode(block, "TEXT", JavascriptOrder.NONE) || "''") + ");\n";
    };
    javascriptGenerator.forBlock['text_print_noend'] = function (block) {
        return "print(" + (javascriptGenerator.valueToCode(block, "TEXT", JavascriptOrder.NONE) || "''") + ", '');\n";
    };
}
