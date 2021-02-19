import {SkulptAnalysis} from "./analysis/analysis";

export const VIEW_DIRECTIVE_PREFIX = '_VIEW_';

const PR = require('packrattle');

const g: any = {};

g.whitespace = PR(/[ \t]+/).optional().drop();

function lexeme(p) {
    return PR.seq(p, g.whitespace).map(function(match) {
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

g.numberExpr = g.number.map(function(match) {
    if (/^0[Xx]/.test(match)) {
        return parseInt(match);
    }
    return parseFloat(match);
});
g.identExpr = g.ident.map(function(match) {
    return match;
});
g.parensExpr = PR.seq(g.lparen, () => g.expr, g.rparen).map(function(match) {
    return match[1];
});
g.subscriptExpr = PR.seq(() => g.expr1, g.lbrack, () => g.expr, g.rbrack).map(function(match) {
    return [match[0], match[2]];
});
g.expr1 = PR.alt(g.numberExpr, g.identExpr, g.parensExpr, g.subscriptExpr);

g.listExpr = PR.seq(g.lbrack, PR.repeatSeparated(() => g.expr, g.coma, {min: 0}).optional(), g.rbrack).map(function(match) {
    return match[1] || [];
});
g.derefExpr = PR.seq(g.star, () => g.expr).map(function(match) {
    return match[1];
});
g.addrOfExpr = PR.seq(g.ampersand, () => g.expr).map(function(match) {
    return match[1];
});
g.expr = PR.alt(g.listExpr, g.derefExpr, g.addrOfExpr, g.expr1);

g.directiveArgByPos = g.expr.map(function(match) {
    return {value: match};
});
g.directiveArgByName = PR.seq(g.ident, g.equals, g.expr).map(function(match) {
    return {name: match[0], value: match[2]};
});
g.directiveArg = PR.alt(g.directiveArgByName, g.directiveArgByPos);
g.directiveArgs = PR.repeatSeparated(g.directiveArg, g.coma, {min: 0}).map(function(match) {
    const byPos = [], byName = {};
    match.forEach(function(arg) {
        if ('name' in arg) {
            byName[arg.name] = arg.value;
        } else {
            byPos.push(arg.value);
        }
    });
    return {byName, byPos};
});
g.directiveAssignment = PR.seq(g.ident, g.equals).map(function(match) {
    return match[0];
});
g.directive = PR.seq(g.directiveAssignment.optional(), g.ident, g.lparen, g.directiveArgs.optional(), g.rparen).map(function(match) {
    const key = match[0];
    const kind = match[1];
    const args = match[3] || {byPos: [], byName: {}};

    return {key: key, kind: kind, byPos: args.byPos, byName: args.byName};
});

/**
 * Gets the currently active directives.
 *
 * @param analysis
 *
 * @returns {[]}
 */
export const parseDirectives = function(analysis: SkulptAnalysis) {
    /**
     * Search for directives in the current and in the global callstack.
     * Put the current first so it overrides directives in the global scope.
     */
    const activeFunctionCallStacks = [];
    if (analysis.functionCallStack.length > 1) {
        activeFunctionCallStacks.push(analysis.functionCallStack[analysis.functionCallStack.length - 1]); // Active.
    }
    activeFunctionCallStacks.push(analysis.functionCallStack[0]); // Global.

    let nextId = 1;
    let directives = [];
    let directiveKeyExists = {};
    for (let functionCallStack of activeFunctionCallStacks) {
        for (let directiveString of functionCallStack.directives) {
            const directive = parseDirective(directiveString);
            if (directive.key) {
                if (directiveKeyExists.hasOwnProperty(directive.key)) {
                    // When a directive exists in both the current and global scopes, we use only the former.
                    continue;
                }
            } else {
                // Default key if it's not specified in the directive declaration.
                directive.key = `view${nextId}`;
                nextId += 1;
            }

            directives.push(directive);

            directiveKeyExists[directive.key] = true;
        }
    }

    return directives;
};

/**
 * Gets a directive object from the directive declaration.
 *
 * @param {string} directiveDeclaration The directive declaration.
 *
 * @returns {key, kind, byPos, byName}
 */
const parseDirective = function(directiveDeclaration) {
    return g.directive.run(directiveDeclaration);
};
