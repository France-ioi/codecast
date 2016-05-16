
import Immutable from 'immutable';

export const blank = new Immutable.List();

export const fromString = function (text) {
  return new Immutable.List(text.split('\n'));
};

export const toString = function (docLines) {
  return docLines.toJS().join('\n');
};

export const applyDelta = function (docLines, delta) {
  const row = delta.start.row;
  const startColumn = delta.start.column;
  const line = docLines.get(row, "");
  if (delta.action === 'insert') {
    const lines = delta.lines;
    const nLines = lines.length;
    if (nLines === 1) {
      return docLines.set(row, line.substring(0, startColumn) + lines[0] + line.substring(startColumn));
    } else {
      const args = [row, 1].concat(lines);
            var args = [row, 1].concat(delta.lines);
            docLines.splice.apply(docLines, args);
            docLines[row] = line.substring(0, startColumn) + docLines[row];
            docLines[row + delta.lines.length - 1] += line.substring(startColumn);

      return docLines.splice.apply(docLines, args)
                     .update(row, firstLine => line.substring(0, startColumn) + firstLine)
                     .update(row + nLines - 1, lastLine => lastLine + line.substring(startColumn));
    }
  }
  if (delta.action === "remove") {
    const endColumn = delta.end.column;
    const endRow = delta.end.row;
    if (row === endRow) {
      return docLines.set(row, line.substring(0, startColumn) + line.substring(endColumn));
    } else {
      return docLines.splice(row, endRow - row + 1,
        line.substring(0, startColumn) + docLines.get(endRow).substring(endColumn));
    }
  }
  return docLines;
};


export const compressRange = function (range) {
  const {start, end} = range;
  if (start.row === end.row && start.column === end.column) {
    return [start.row, start.column];
  } else {
    return [start.row, start.column, end.row, end.column];
  }
};

export const expandRange = function (range) {
  if (range.length === 2) {
    const pos = {row: range[0], column: range[1]};
    return {start: pos, end: pos};
  } else {
    const start = {row: range[0], column: range[1]};
    const end = {row: range[2], column: range[3]};
    return {start, end};
  }
};

export default {
  blank, fromString, toString, applyDelta, compressRange, expandRange
};
