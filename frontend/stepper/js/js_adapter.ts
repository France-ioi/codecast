import { javascriptGenerator, Order as JavascriptOrder } from 'blockly/javascript';

export function adaptJsBlocks() {
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
}
