
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';
import Immutable from 'immutable';

/*
  Line buffering.
  Input: handle special characters, echo normal characters.

icanon mode:
  lf     0x0D (^M): insert LF and flush input
  erase  0x7F (BS): erase character
  eof    0x04 (^D): flush input

  intr   0x03 (^C): send SIGINT
  quit   0x1C (^\): send SIGQUIT
  kill   0x15 (^U): erase line
  start  0x11 (^Q): XON
  stop   0x13 (^S): XOFF
  susp   0x1A (^Z): send SIGTSTP
  cr     0x0A (^J): insert LF and flush input
  tab    0x09 (^I): tab
  lnext  0x16 (^V): literal next
  werase 0x17 (^W): erase word
  rprnt  ^R ???
  flush  ^O ???

*/

export const TermView = EpicComponent(self => {
  self.render = function () {
    const {buffer} = self.props;
    const cursor = buffer.get('cursor');
    const ci = cursor.get('line'), cj = cursor.get('column');
    return (
      <div className="terminal">
        {buffer.get('lines').map(function (line, i) {
          return (
            <div key={i} className="terminal-line">
              {line.map(function (cell, j) {
                if (i == ci && j == cj) {
                  return <span key={j} className="terminal-cursor">{cell.get('char')}</span>;
                }
                return <span key={j}>{cell.get('char')}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };
});

export const TermBuffer = function (options) {
  options = options || {};
  const width = options.width || 80;
  const height = options.lines || 24;
  const cursor = Immutable.Map({line: 0, column: 0});
  const attrs = Immutable.Map();
  const blankCell = Immutable.Map({char: ' ', attrs});
  const blankLine = Immutable.List(Array(width).fill(blankCell));
  const lines = Immutable.List(Array(height).fill(blankLine));
  return Immutable.Map({width, height, cursor, attrs, lines});
};

export const writeString = function (buffer, str) {
  for (let i = 0; i < str.length; i += 1) {
    buffer = writeChar(buffer, str[i]);
  }
  return buffer;
};

export const writeChar = function (buffer, char) {

  if (char === '\n') {
    return writeNewline(buffer);
  }

  if (char === '\r') {
    // Move the cursor to the beginning of the current line.
    return buffer.setIn(['cursor', 'column'], 0);
  }

  // Write the caracter using the current attributes and
  // move the cursor.
  let cursor = buffer.get('cursor');
  const line = cursor.get('line');
  let column = cursor.get('column');
  const attrs = buffer.get('attrs');
  const cell = Immutable.Map({char, attrs});
  buffer = buffer.setIn(['lines', line, column], cell);

  column += 1;
  if (column < buffer.get('width')) {
    cursor = cursor.set('column', column);
    return buffer.set('cursor', cursor);
  }

  return writeNewline(buffer);
};

export const writeNewline = function (buffer) {
  // Move the cursor to the beginning of the next line.
  const height = buffer.get('height');
  let cursor = buffer.get('cursor').set('column', 0);
  let line = cursor.get('line') + 1;
  // Scroll by one line if needed.
  if (line === height) {
    const width = buffer.get('width');
    const attrs = buffer.get('attrs');
    const blankCell = Immutable.Map({char: ' ', attrs});
    const blankLine = Immutable.List(Array(this.width).fill(blankCell));
    buffer = buffer.update('lines', lines => lines.shift().push(blankLine));
    line = height - 1;
  }
  cursor = cursor.set('line', line);
  buffer = buffer.set('cursor', cursor);
  return buffer;
};

export default TermBuffer;
