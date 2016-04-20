
var computeLineOffsets = function (lines) {
  var lineOffsets = [];
  var offset = 0;
  lines.forEach(function (line) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  });
  lineOffsets.push(offset);
  return lineOffsets;
};

var getPositionFromOffset = function (lineOffsets, offset) {
  if (typeof offset !== 'number') {
    return null;
  }
  // console.log(JSON.stringify(lineOffsets));
  var iLeft = 0, iRight = lineOffsets.length - 1;
  var nRounds = 0;
  while (iLeft + 1 < iRight) {
    var iMiddle = ((iLeft + iRight) / 2) |0;
    var middle = lineOffsets[iMiddle];
    // console.log("indexes ", iLeft, iMiddle, iRight);
    // console.log("offsets ", offset, lineOffsets[iLeft], lineOffsets[iMiddle], lineOffsets[iRight]);
    if (offset < middle) {
      // console.log('adjust right');
      iRight = iMiddle;
    }
    if (middle <= offset) {
      // console.log('adjust left');
      iLeft = iMiddle;
    }
    nRounds += 1;
    if (nRounds === 16) {
      throw 'bug';
    }
  }
  return {line: iLeft, column: offset - lineOffsets[iLeft]};
};

var isDirective = function (line) {
  return (/^\s*\/\/!/).test(line);
};

var parseDirective = function (line) {
  return line;
};

module.exports.enrichSyntaxTree = function (source, ast) {
  var lines = source.split('\n');
  var lineOffsets = computeLineOffsets(lines);
  var findBlocks = function (node) {
    if (node[0] === 'CompoundStmt') {
      // console.log('found block', node);
      var blockPos = getPositionFromOffset(lineOffsets, node[1].begin);
      if (blockPos) {
        var lineNo = blockPos.line + 1;
        // console.log(`found block at line ${lineNo}`);
        var directives = [];
        while (lineNo < lines.length && isDirective(lines[lineNo])) {
          // console.log(`found directive at line ${lineNo}`)
          directives.push(parseDirective(lines[lineNo]))
          lineNo += 1;
        }
        node[1].directives = directives;
      }
    }
    node[2].forEach(findBlocks);
  };
  findBlocks(ast);
};
