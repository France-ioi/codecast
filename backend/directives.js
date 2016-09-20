var PR = require('packrattle');

const g = module.exports.grammar = {};

g.whitespace = PR(/[ \t]+/).optional().drop();

function lexeme(p) {
  return PR.seq(p, g.whitespace).map(function (match) {
    return match[0][0];
  });
}

g.lparen = lexeme(PR('('));
g.rparen = lexeme(PR(')'));
g.lbrack = lexeme(PR('['));
g.rbrack = lexeme(PR(']'));
g.equals = lexeme(PR('='));
g.star = lexeme(PR('*'));
g.coma = lexeme(PR(','));
g.ident = lexeme(PR(/[a-zA-Z_-][a-zA-Z0-9_-]*/));
g.number = lexeme(PR(/(-?\d*\.?\d+?)|(0[Xx][0-9a-fA-F]+)/));
g.identExpr = g.ident.map(function (match) {
  return ['ident', match];
});
g.numberExpr = g.number.map(function (match) {
  if (/^0[Xx]/.test(match)) {
    return ['number', parseInt(match)];
  }
  return ['number', parseFloat(match)];
});
g.listExpr = PR.seq(g.lbrack, PR.repeatSeparated(() => g.expr, g.coma, {min:0}).optional(), g.rbrack).map(function (match) {
  return ['list', match[1] || []];
});
g.derefExpr = PR.seq(g.star, () => g.expr).map(function (match) {
  return ['deref', match[1]];
});
g.expr = PR.alt(g.identExpr, g.numberExpr, g.listExpr, g.derefExpr);
g.directiveArgByPos = g.expr.map(function (match) {
  return {value: match};
});
g.directiveArgByName = PR.seq(g.ident, g.equals, g.expr).map(function (match) {
  return {name: match[0], value: match[2]};
});
g.directiveArg = PR.alt(g.directiveArgByName, g.directiveArgByPos);
g.directiveArgs = PR.repeatSeparated(g.directiveArg, g.coma, {min:0}).map(function (match) {
  var byPos = [], byName = {};
  match.forEach(function (arg) {
    if ('name' in arg) {
      byName[arg.name] = arg.value;
    } else {
      byPos.push(arg.value);
    }
  });
  return {byName, byPos};
});
g.directiveAssignment = PR.seq(g.ident, g.equals).map(function (match) {
  return match[0];
});
g.directive = PR.seq(g.directiveAssignment.optional(), g.ident, g.lparen, g.directiveArgs.optional(), g.rparen).map(function (match) {
  var key = match[0];
  var kind = match[1];
  var args = match[3] || {byPos: [], byName: {}};
  return {key: key, kind: kind, byPos: args.byPos, byName: args.byName};
});

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
  var str = /^\s*\/\/!\s*(.*)\s*$/.exec(line)[1];
  return g.directive.run(str);
};

module.exports.enrichSyntaxTree = function (source, ast) {
  var lines = source.split('\n');
  var lineOffsets = computeLineOffsets(lines);
  var functionNode;
  var nextId = 1;
  var findBlocks = function (node) {
    if (node[0] === 'FunctionDecl') {
      functionNode = node;
    } else if (node[0] === 'CompoundStmt') {
      // console.log('found block', node);
      var blockPos = getPositionFromOffset(lineOffsets, node[1].begin);
      if (blockPos) {
        var lineNo = blockPos.line + 1;
        // console.log(`found block at line ${lineNo}`);
        var directives = [];
        while (lineNo < lines.length && isDirective(lines[lineNo])) {
          // console.log(`found directive at line ${lineNo}`)
          try {
            var directive = parseDirective(lines[lineNo]);
            if (!directive.key) {
              directive.key = `view${nextId}`;
              nextId += 1;
            }
            directives.push(directive);
            // console.log(JSON.stringify(directive));
          } catch (error) {
            directives.push(["error", error]);
          }
          lineNo += 1;
        }
        if (functionNode) {
          // For the first block inside a function, attach the directives
          // to the function instead of the block.  This is to allow the
          // directives to inspect arguments.
          functionNode[1].directives = directives;
          functionNode = undefined;
        } else {
          node[1].directives = directives;
        }
      }
    }
    node[2].forEach(findBlocks);
  };
  findBlocks(ast);
};
