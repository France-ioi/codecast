
export const loadTranslated = function (source, syntaxTree) {
  const lineOffsets = [];
  let offset = 0;
  source.split('\n').forEach(function (line) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  });
  lineOffsets.push(source.length);
  // TODO: compute and store the range for every node.
  return {
    source,
    lineOffsets,
    syntaxTree,
  };
};

const getPositionFromOffset = function (lineOffsets, offset) {
  let iLeft = 0, iRight = lineOffsets.length;
  while (iLeft + 1 !== iRight) {
    const iMiddle = (iLeft + iRight) / 2 |0;
    const middle = lineOffsets[iMiddle];
    if (offset < middle)
      iRight = iMiddle;
    if (middle <= offset)
      iLeft = iMiddle;
  }
  return {row: iLeft, column: offset - lineOffsets[iLeft]};
};

export const getRangeFromOffsets = function (text, start, end) {
  if (!start || !end)
    return null;
  return {
    start: getPositionFromOffset(text.lineOffsets, start),
    end: getPositionFromOffset(text.lineOffsets, end)
  };
};
