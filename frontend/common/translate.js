
export const loadTranslated = function (source, syntaxTree) {
  // Compute line offsets.
  const lineOffsets = [];
  let offset = 0;
  source.split('\n').forEach(function (line) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  });
  lineOffsets.push(source.length);
  // Compute each node's range.
  (function traverse (node) {
    const attrs = node[1];
    node[1].range = {
      start: getPositionFromOffset(lineOffsets, attrs.begin),
      end: getPositionFromOffset(lineOffsets, attrs.end)
    };
    const children = node[2];
    children.forEach(traverse);
  })(syntaxTree);
  return {
    source,
    lineOffsets,
    syntaxTree,
  };
};

const getPositionFromOffset = function (lineOffsets, offset) {
  if (typeof offset !== 'number') {
    return null;
  }
  let iLeft = 0, iRight = lineOffsets.length;
  while (iLeft + 1 < iRight) {
    const iMiddle = (iLeft + iRight) / 2 |0;
    const middle = lineOffsets[iMiddle];
    if (offset < middle)
      iRight = iMiddle;
    if (middle <= offset)
      iLeft = iMiddle;
  }
  return {row: iLeft, column: offset - lineOffsets[iLeft]};
};
