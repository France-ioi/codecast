const PR = require('packrattle');

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
g.ampersand = lexeme(PR('&'));
g.coma = lexeme(PR(','));
g.ident = lexeme(PR(/[a-zA-Z_-][a-zA-Z0-9_-]*/));
g.number = lexeme(PR(/(-?\d*\.?\d*)|(0[Xx][0-9a-fA-F]+)/));

g.numberExpr = g.number.map(function (match) {
    if (/^0[Xx]/.test(match)) {
        return parseInt(match);
    }
    return parseFloat(match);
});
g.identExpr = g.ident.map(function (match) {
    return match;
});
g.parensExpr = PR.seq(g.lparen, () => g.expr, g.rparen).map(function (match) {
    return match[1];
});
g.subscriptExpr = PR.seq(() => g.expr1, g.lbrack, () => g.expr, g.rbrack).map(function (match) {
    return [match[0], match[2]];
});
g.expr1 = PR.alt(g.numberExpr, g.identExpr, g.parensExpr, g.subscriptExpr);

g.listExpr = PR.seq(g.lbrack, PR.repeatSeparated(() => g.expr, g.coma, {min:0}).optional(), g.rbrack).map(function (match) {
    return match[1] || [];
});
g.derefExpr = PR.seq(g.star, () => g.expr).map(function (match) {
    return match[1];
});
g.addrOfExpr = PR.seq(g.ampersand, () => g.expr).map(function (match) {
    return match[1];
});
g.expr = PR.alt(g.listExpr, g.derefExpr, g.addrOfExpr, g.expr1);

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

export const parseDirectives = function (analysis) {
    /**
     * To find directives in the current scope, we look at all lines preceding the current one
     * where the ident level must always be constant or decreasing as an increase would mean
     * a different scope.
     */

    const {lines, functionCallStack} = analysis;
    const currentLine = functionCallStack.get(0).currentLine;
    let curLineIdx = (currentLine - 1); // currentLine is 1-indexed.
    let lastNbTabs = getIndentLevel(lines[curLineIdx]);
    let nextId = 1;
    let directives = [];

    curLineIdx--;
    while (curLineIdx >= 0) {
        const line = lines[curLineIdx];

        const curNbTabs = getIndentLevel(lines[curLineIdx]);
        if (curNbTabs > lastNbTabs) {
            continue;
        } else {
            lastNbTabs = curNbTabs;
        }

        if (isDirective(line)) {
            const directive = parseDirective(line);
            if (!directive.key) {
                directive.key = `view${nextId}`;
                nextId += 1;
            }

            directives.push(directive);
        }

        curLineIdx--;
    }

    return directives;
};

const isDirective = function (line) {
    return (/^\s*#!/).test(line);
};

const parseDirective = function (line) {
    const str = /^\s*#!\s*(.*)\s*$/.exec(line)[1];

    return g.directive.run(str);
};

/**
 * Gets the ident level of a line.
 *
 * @param {string} line The line.
 *
 * @return {int}
 */
const getIndentLevel = function(line) {
    let nbTabs = 0;
    const length = line.length;
    for (let i = 0; i < length; i++) {
        if (line[i] === '\t') {
            nbTabs++;
        } else {
            break;
        }
    }

    return nbTabs;
};
