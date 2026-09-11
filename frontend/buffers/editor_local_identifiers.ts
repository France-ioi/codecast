export interface LocalIdentifier {
    name: string,
    isFunction: boolean,
    params?: string[], // for functions, the names of the declared parameters
    scopeStart: number, // first row on which the identifier is visible
    scopeEnd: number, // last row on which the identifier is visible
}

// Identifiers that a declaration-looking pattern may capture but that are never
// user definitions.
const reservedWords = new Set([
    // Python
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif  ', 'else',
    'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None',
    'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield', 'self',
    // C / C++ / Java / Arduino
    'auto', 'bool', 'boolean', 'case', 'catch', 'char', 'const', 'default', 'do', 'double', 'enum',
    'extern', 'final', 'float', 'function', 'goto', 'int', 'let', 'long', 'new', 'null', 'private',
    'protected', 'public', 'short', 'signed', 'sizeof', 'static', 'string', 'String', 'struct', 'switch',
    'this', 'typedef', 'union', 'unsigned', 'var', 'void', 'volatile',
]);

/**
 * Replaces the content of string literals and comments by spaces, keeping every other
 * character at its position, so that the declaration patterns below cannot match inside
 * a string or a comment.
 */
function blankStringsAndComments(code: string, isPython: boolean): string {
    const result = code.split('');
    let index = 0;

    const blankUntil = (end: number) => {
        for (; index < end && index < code.length; index++) {
            if ('\n' !== code[index]) {
                result[index] = ' ';
            }
        }
    };

    while (index < code.length) {
        const character = code[index];
        const rest = code.substring(index, index + 3);

        if (isPython && ('"""' === rest || "'''" === rest)) {
            const end = code.indexOf(rest, index + 3);
            index += 3;
            blankUntil(-1 === end ? code.length : end);
            index += 3;
        } else if ('"' === character || "'" === character) {
            index++;
            const contentStart = index;
            while (index < code.length && code[index] !== character && '\n' !== code[index]) {
                // Skip escaped characters
                index += '\\' === code[index] ? 2 : 1;
            }
            const contentEnd = index;
            index = contentStart;
            blankUntil(contentEnd);
            // Skip the closing quote
            index++;
        } else if (isPython && '#' === character) {
            const end = code.indexOf('\n', index);
            blankUntil(-1 === end ? code.length : end);
        } else if (!isPython && '//' === code.substring(index, index + 2)) {
            const end = code.indexOf('\n', index);
            blankUntil(-1 === end ? code.length : end);
        } else if (!isPython && '/*' === code.substring(index, index + 2)) {
            const end = code.indexOf('*/', index + 2);
            blankUntil(-1 === end ? code.length : end + 2);
        } else {
            index++;
        }
    }

    return result.join('');
}

function makeIdentifier(name: string, isFunction: boolean, scopeStart: number, params?: string[]): LocalIdentifier {
    return {name, isFunction, scopeStart, scopeEnd: -1, ...(params ? {params} : {})};
}

interface Scope {
    indent: number, // indentation of the def / class line, -1 for the module itself
    startRow: number,
    identifiers: LocalIdentifier[],
}

function pushInScope(scope: Scope, name: string, isFunction: boolean, params?: string[]) {
    if (!name || reservedWords.has(name)) {
        return;
    }

    scope.identifiers.push(makeIdentifier(name, isFunction, scope.startRow, params));
}

function pushNameList(scope: Scope, nameList: string) {
    for (let name of nameList.split(',')) {
        pushInScope(scope, name.trim(), false);
    }
}

/**
 * Python scopes follow the indentation: the body of a def or a class is made of the
 * following lines that are more indented than it.
 */
function extractPythonIdentifiers(code: string): LocalIdentifier[] {
    const lines = blankStringsAndComments(code, true).split('\n');
    const identifiers: LocalIdentifier[] = [];
    const scopes: Scope[] = [{indent: -1, startRow: 0, identifiers: []}];

    const closeScopesUpTo = (indent: number, endRow: number) => {
        while (scopes.length > 1 && scopes[scopes.length - 1].indent >= indent) {
            for (let identifier of scopes.pop().identifiers) {
                identifier.scopeEnd = endRow;
                identifiers.push(identifier);
            }
        }
    };

    for (let row = 0; row < lines.length; row++) {
        const line = lines[row];
        if ('' === line.trim()) {
            // A blank line does not close a scope, the body may continue below
            continue;
        }

        const indent = line.length - line.replace(/^[ \t]*/, '').length;
        closeScopesUpTo(indent, row - 1);
        const scope = scopes[scopes.length - 1];

        // def name(params):
        const functionMatch = line.match(/^[ \t]*(?:async[ \t]+)?def[ \t]+([A-Za-z_]\w*)[ \t]*\(([^)]*)\)/);
        if (functionMatch) {
            const params = [];
            const bodyScope: Scope = {indent, startRow: row, identifiers: []};
            for (let param of functionMatch[2].split(',')) {
                // Drop default values, annotations and the * / ** prefixes
                const name = param.split('=')[0].split(':')[0].replace(/^[ \t*]+/, '').trim();
                pushInScope(bodyScope, name, false);
                // The instance is provided by the caller, it is not an argument of the call,
                // and *args / **kwargs are not parameters we can propose to fill in
                if ('' !== name && 'self' !== name && 'cls' !== name && !param.trim().startsWith('*')) {
                    params.push(name);
                }
            }
            // The function itself belongs to the scope that contains it
            pushInScope(scope, functionMatch[1], true, params);
            scopes.push(bodyScope);
            continue;
        }

        // class Name:
        const classMatch = line.match(/^[ \t]*class[ \t]+([A-Za-z_]\w*)/);
        if (classMatch) {
            pushInScope(scope, classMatch[1], true);
            scopes.push({indent, startRow: row, identifiers: []});
            continue;
        }

        // a = ..., a, b = ..., a: int = ...
        const assignmentMatch = line.match(/^[ \t]*([A-Za-z_]\w*(?:[ \t]*,[ \t]*[A-Za-z_]\w*)*)[ \t]*(?::[^=\n]+)?=(?!=)/);
        if (assignmentMatch) {
            pushNameList(scope, assignmentMatch[1]);
        }

        // a += ...
        const augmentedMatch = line.match(/^[ \t]*([A-Za-z_]\w*)[ \t]*(?:\/\/|\*\*|>>|<<|[-+*/%&|^@])=(?!=)/);
        if (augmentedMatch) {
            pushInScope(scope, augmentedMatch[1], false);
        }

        // for a in ..., including comprehensions
        for (let match of line.matchAll(/\bfor[ \t]+([A-Za-z_]\w*(?:[ \t]*,[ \t]*[A-Za-z_]\w*)*)[ \t]+in\b/g)) {
            pushNameList(scope, match[1]);
        }

        // with ... as a, except ... as a, import ... as a
        for (let match of line.matchAll(/\bas[ \t]+([A-Za-z_]\w*)/g)) {
            pushInScope(scope, match[1], false);
        }

        // walrus operator
        for (let match of line.matchAll(/([A-Za-z_]\w*)[ \t]*:=/g)) {
            pushInScope(scope, match[1], false);
        }
    }

    closeScopesUpTo(-1, lines.length - 1);
    for (let identifier of scopes[0].identifiers) {
        identifier.scopeEnd = lines.length - 1;
        identifiers.push(identifier);
    }

    return identifiers;
}

const cTypeKeywords = '(?:const|static|final|unsigned|signed|long|short|struct)';
const cBaseTypes = '(?:int|long|short|char|float|double|bool|boolean|void|auto|size_t|String|string|var|let|const)';

interface Block {
    startRow: number,
    endRow: number,
    startOffset: number,
}

/**
 * C-like scopes follow the braces: a declaration is visible from its block to the
 * matching closing brace.
 */
function extractCLikeIdentifiers(code: string): LocalIdentifier[] {
    const sanitized = blankStringsAndComments(code, false);
    const identifiers: LocalIdentifier[] = [];

    // Row of each offset of the document
    const rowOfOffset: number[] = new Array(sanitized.length + 1);
    let row = 0;
    for (let offset = 0; offset <= sanitized.length; offset++) {
        rowOfOffset[offset] = row;
        if ('\n' === sanitized[offset]) {
            row++;
        }
    }
    const lastRow = row;

    // Every braced block of the document, with the rows it spans
    const blocks: Block[] = [];
    const openBlocks: Block[] = [];
    for (let offset = 0; offset < sanitized.length; offset++) {
        if ('{' === sanitized[offset]) {
            const block = {startOffset: offset, startRow: rowOfOffset[offset], endRow: lastRow};
            openBlocks.push(block);
            blocks.push(block);
        } else if ('}' === sanitized[offset] && openBlocks.length) {
            openBlocks.pop().endRow = rowOfOffset[offset];
        }
    }

    const fileScope = (): Scope => ({indent: -1, startRow: 0, identifiers: []});
    const scopeOfBlock = (block?: Block): Scope => block
        ? {indent: 0, startRow: block.startRow, identifiers: []}
        : fileScope();

    // The innermost block that contains this offset
    const enclosingBlock = (offset: number): Block|undefined => {
        let found: Block|undefined;
        for (let block of blocks) {
            if (block.startOffset < offset && rowOfOffset[offset] <= block.endRow
                && (!found || block.startOffset > found.startOffset)) {
                found = block;
            }
        }

        return found;
    };

    const collect = (scope: Scope, endRow: number) => {
        for (let identifier of scope.identifiers) {
            identifier.scopeEnd = endRow;
            identifiers.push(identifier);
        }
    };

    // A return type, a name, a parameter list without any ; and an opening brace, which
    // may be on the next line: this excludes if/while/switch headers, which have no type
    // before them.
    const functionRegexp = new RegExp(
        `^[ \\t]*(?:[A-Za-z_][\\w:<>]*[ \\t*&]+)+([A-Za-z_]\\w*)[ \\t]*\\(([^;{)]*)\\)[ \\t]*(?:const[ \\t]*)?(?:\\r?\\n[ \\t]*)?\\{`,
        'gm'
    );
    for (let match of sanitized.matchAll(functionRegexp)) {
        // "else if (...)" and the like look like a definition, their parameters are not ones
        if (reservedWords.has(match[1])) {
            continue;
        }

        const bodyBlock = blocks.find(block => block.startOffset === match.index + match[0].length - 1);
        const bodyScope = scopeOfBlock(bodyBlock);
        const params = [];
        for (let param of match[2].split(',')) {
            // In "int count" the parameter name is the last identifier of the piece
            const name = param.match(/([A-Za-z_]\w*)[^A-Za-z_0-9]*$/);
            if (name && !reservedWords.has(name[1])) {
                pushInScope(bodyScope, name[1], false);
                params.push(name[1]);
            }
        }
        collect(bodyScope, bodyBlock ? bodyBlock.endRow : lastRow);

        // The function itself belongs to the scope that contains its definition
        const outerBlock = enclosingBlock(match.index);
        const outerScope = scopeOfBlock(outerBlock);
        pushInScope(outerScope, match[1], true, params);
        collect(outerScope, outerBlock ? outerBlock.endRow : lastRow);
    }

    // function name(...) for javascript
    for (let match of sanitized.matchAll(/\bfunction[ \t]+([A-Za-z_]\w*)/g)) {
        const block = enclosingBlock(match.index);
        const scope = scopeOfBlock(block);
        pushInScope(scope, match[1], true);
        collect(scope, block ? block.endRow : lastRow);
    }

    // int a, b = 2, c[10];
    const declarationRegexp = new RegExp(`^[ \\t]*(?:${cTypeKeywords}[ \\t]+)*${cBaseTypes}\\b([^;\\n]*);`, 'gm');
    for (let match of sanitized.matchAll(declarationRegexp)) {
        const block = enclosingBlock(match.index);
        const scope = scopeOfBlock(block);
        for (let declarator of match[1].split(',')) {
            // Skip the tail of a multi-argument call inside an initializer
            if ((declarator.match(/\)/g) || []).length > (declarator.match(/\(/g) || []).length) {
                continue;
            }
            const name = declarator.match(/^[ \t*&]*([A-Za-z_]\w*)/);
            if (name) {
                pushInScope(scope, name[1], false);
            }
        }
        collect(scope, block ? block.endRow : lastRow);
    }

    // for (int i = 0; ...), the variable belongs to the body of the loop
    const forRegexp = new RegExp(`\\bfor[ \\t]*\\([ \\t]*(?:${cTypeKeywords}[ \\t]+)*${cBaseTypes}\\b([^;)\\n]*)`, 'g');
    for (let match of sanitized.matchAll(forRegexp)) {
        const name = match[1].match(/^[ \t*&]*([A-Za-z_]\w*)/);
        if (!name) {
            continue;
        }
        const bodyBlock = blocks.find(block => block.startOffset > match.index) ?? enclosingBlock(match.index);
        const scope = scopeOfBlock(bodyBlock);
        pushInScope(scope, name[1], false);
        collect(scope, bodyBlock ? bodyBlock.endRow : lastRow);
    }

    return identifiers;
}

/**
 * Extracts the variables and functions defined by the user in the given source code,
 * keeping only those that are visible from the given row. Purely lexical: the scopes
 * are deduced from the indentation in Python and from the braces in the C-like modes.
 * Returns an empty list for the modes we have no extractor for.
 */
export function getLocalIdentifiers(code: string, aceMode: string, row: number = null): LocalIdentifier[] {
    let identifiers: LocalIdentifier[];

    switch (aceMode) {
        case 'python':
            identifiers = extractPythonIdentifiers(code);
            break;
        case 'c_cpp':
        case 'arduino':
        case 'java':
        case 'javascript':
            identifiers = extractCLikeIdentifiers(code);
            break;
        default:
            return [];
    }

    if (null !== row) {
        identifiers = identifiers.filter(identifier => identifier.scopeStart <= row && row <= identifier.scopeEnd);
    }

    // Keep the first occurrence of each name, a function definition winning over a variable
    const byName = new Map<string, LocalIdentifier>();
    for (let identifier of identifiers) {
        const previous = byName.get(identifier.name);
        const isBetter = !previous
            || (identifier.isFunction && !previous.isFunction)
            || (identifier.isFunction === previous.isFunction && identifier.params && !previous.params);
        if (isBetter) {
            byName.set(identifier.name, identifier);
        }
    }

    return [...byName.values()];
}
