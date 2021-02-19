import {parse as P, text as PT} from 'bennu';
import {stream} from 'nu-stream';
import * as C from 'persistent-c';

/* Generator that iterates over the elements of the string argument. */
function* iterate(s) {
    while (!stream.isEmpty(s)) {
        yield stream.first(s);
        s = stream.rest(s);
    }
}

/* Join all elements from the stream argument into a string. */
function join(s) {
    return stream.toArray(s).join('');
}

/* format-string parsers */
const fp_placeholder =
    P.next(PT.character('%'),
        P.bind(P.optional(false, P.next(PT.character('*'), P.always(true))), noStore =>
            P.bind(P.many(PT.oneOf('0123456789')).map(join), width =>
                P.bind(P.many(PT.oneOf('Lhl')).map(join), size =>
                    P.choice(
                        P.bind(PT.oneOf('dxoiufcs%n'), type => {
                            width = width.length > 0 ? parseInt(width) : false;
                            if (type === '%') {
                                return P.always({kind: 'l', chars: '%'});
                            }
                            return P.always({kind: 'p', noStore, width, size, type})
                        }),
                        P.next(PT.character('['),
                            P.bind(P.optional(false, P.next(PT.character('^'), P.always(true))), negated =>
                                P.bind(fp_charset_tail, set =>
                                    P.always({kind: 'p', noStore, width, type: 'C', negated, set})))))))));
const fp_whitespace =
    P.next(P.many1(PT.space),
        P.always({kind: 'w'}));
const fp_literal =
    P.bind(P.many1(PT.noneOf('%\t\r\n ')).map(join), chars =>
        P.always({kind: 'l', chars}));
const fp_charset_tail =
    P.bind(P.optional('', PT.character(']')), sqB =>
        P.bind(P.many(PT.noneOf(']')), rest =>
            P.next(PT.character(']'),
                P.always(sqB + join(rest)))));
const fp_specifier = P.choice(fp_placeholder, fp_whitespace, fp_literal);
const fp_specifiers = P.many(fp_specifier);

function getSpecIntType(size) {
    switch (size) {
        case '':
            return 'int';
        case 'l':
            return 'long';
        case 'll':
            return 'long long';
        case 'h':
            return 'short';
        default:
            return 'int';
    }
}

function commonPrefixLength(s1, s2, p2) {
    const size = Math.min(s1.length, s2.length - p2);
    for (let pos = 0; pos < size; pos += 1) {
        if (s1[pos] != s2[p2 + pos]) {
            return pos;
        }
    }
    return size;
}

const typeRegexpMap = {
    d: /^[+-]?[0-9]+/,
    x: /^[+-]?[0-9A-Fa-f]+/,
    o: /^[+-]?[0-7]+/,
    f: /^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)?/,
    i: /^[+-]?([1-9][0-9]*|0[0-7]*|0[Xx][0-9A-Fa-f]+)/,
    u: /^[+-]?[0-9]+/,
    // p: /^(0[xX])?[0-9A-Fa-f]+/
};

export function* scanf(fmt, ...args) {
    /* TODO: behavior if format specifier does not parse? */
    const specifiers = P.run(fp_specifiers, fmt);

    let nRead = 0; /* number of characters read from input */
    let nStored = 0; /* number of values stored in args */
    let buffer = ""; /* buffer */
    let line; /* next line of input temp */
    let match; /* regexp match temp. */
    let skip; /* number of characters skipped temp. */
    let rawValue; /* raw (string) value temp */

    scanning: for (let spec of iterate(specifiers)) {

        if (spec.kind === 'l') {
            /* Litteral chars.  Skip matching part, get more input until all chars matched. */
            const {chars} = spec;
            let matchPos = 0;
            while (true) {
                skip = commonPrefixLength(buffer, chars, matchPos);
                buffer = buffer.slice(skip);
                nRead += skip;
                matchPos += skip;
                if (chars.length === matchPos) continue scanning;
                if (buffer.length !== 0) break scanning;
                line = yield ['gets'];
                if (typeof line !== 'string') break scanning;
                buffer = buffer + line + '\n';
            }
        }

        if (!(spec.kind === 'p' && spec.type === 'c')) {
            /* Except for %c, skip whitespace until the buffer starts with non-whitespace chars. */
            eating_ws: while (true) {
                match = /^[ \t\r\n]*/.exec(buffer);
                skip = match ? match[0].length : 0;
                nRead += skip;
                buffer = buffer.slice(skip);
                if (buffer.length !== 0) break;
                line = yield ['gets'];
                if (typeof line !== 'string') break scanning;
                buffer = buffer + line + '\n';
            }
        }

        if (spec.kind === 'w') {
            continue;
        }

        /* Handle placeholders. */
        let {width} = spec;

        if (spec.type === 'n') {
            yield ['store', args[nStored], 'int', nRead];
            nStored += 1;
            continue;
        }

        if (spec.type === 'c') {
            /* %c matches (width) characters, or 1 if unspecified */
            if (typeof width !== 'number') {
                width = 1;
            }
            /* Read more input until the number of chars requested is available. */
            more_input: while (buffer.length < width) {
                line = yield ['gets'];
                if (typeof line !== 'string') break;
                buffer = buffer + line + '\n';
            }
            skip = Math.min(buffer.length, width);
            nRead += skip;
            rawValue = buffer.slice(0, skip);
            buffer = buffer.slice(skip);
            if (!spec.noStore) {
                yield ['store', args[nStored], 'char[]', rawValue];
                nStored += 1;
            }
            /* A short read means we ran out of input */
            if (skip !== width) break;
            continue;
        }

        if (spec.type === 'C') {
            const re = new RegExp("^[" + (spec.negated ? '^' : '') + spec.set.replace(']', '\]') + ']*');
            rawValue = '';
            /* Except for %c, skip whitespace until the buffer starts with non-whitespace chars. */
            match_charset: while (true) {
                const target = typeof width === 'number' ? buffer.slice(0, width) : buffer;
                match = re.exec(buffer);
                if (!match || match[0].length === 0) break;
                skip = match[0].length;
                nRead += skip;
                width -= skip;
                rawValue = rawValue + buffer.slice(0, skip);
                buffer = buffer.slice(skip);
                if (width === 0) {
                    break;
                }
                if (buffer.length === 0) {
                    line = yield ['gets'];
                    if (typeof line !== 'string') break scanning;
                    buffer = buffer + line + '\n';

                }
            }
            if (!spec.noStore) {
                yield ['store', args[nStored], 'char[]', rawValue];
                nStored += 1;
            }
            continue;
        }

        if (spec.type === 's') {
            /* %s matches until next whitespace */
            match = /^[^ \t\r\n]+/.exec(buffer);
            skip = match ? match[0].length : 0;
            if (typeof width === 'number') {
                skip = Math.min(skip, width);
            }
            nRead += skip;
            rawValue = buffer.slice(0, skip);
            buffer = buffer.slice(skip);
            if (!spec.noStore) {
                yield ['store', args[nStored], 'char*', rawValue];
                nStored += 1;
            }
            continue;
        }

        const re = typeRegexpMap[spec.type];
        const target = typeof width === 'number' ? buffer.slice(0, width) : buffer;
        match = re.exec(target);
        if (!match) {
            /* Regexp did not apply. */
            break;
        }
        skip = match[0].length;
        nRead += skip;
        rawValue = buffer.slice(0, skip);
        buffer = buffer.slice(skip);
        if (!spec.noStore) {
            let type;
            if (/[dxoi]/.test(spec.type)) {
                type = getSpecIntType(spec.size);
                switch (spec.type) {
                    case 'd':
                        rawValue = parseInt(rawValue, 10);
                        break;
                    case 'x':
                        rawValue = parseInt(rawValue, 16);
                        break;
                    case 'o':
                        rawValue = parseInt(rawValue, 8);
                        break;
                    case 'i':
                        if (/^0[bB]/.test(rawValue)) rawValue = parseInt(rawValue, 2);
                        else if (/^0[xX]/.test(rawValue)) rawValue = parseInt(rawValue, 16);
                        else if (/^0/.test(rawValue)) rawValue = parseInt(rawValue, 8);
                        else rawValue = parseInt(rawValue, 10);
                        break;
                }
            } else if ('u' === spec.type) {
                type = 'unsigned ' + getSpecIntType(spec.size);
                rawValue = parseInt(rawValue, 10);
            } else if ('f' === spec.type) {
                type = spec.size === 'l' ? 'double' : 'float';
                rawValue = parseFloat(rawValue);
            }
            yield ['store', args[nStored], type, rawValue];
            nStored += 1;
        }

    }

    /* Return unread characters to the input stream. */
    if (buffer.length) {
        yield ['ungets', buffer];
    }

    /* Write result of scanf call. */
    yield ['result', nRead === 0 ? -1 : nStored];
}

/// XXXX ///

function unterminatedStringValue(string) {
    // @ts-ignore
    const encoder = new TextEncoder('utf-8');
    const bytesArray = encoder.encode(string);
    const charType = C.builtinTypes['char'];
    const charLen = bytesArray.length;
    const chars = [];
    for (let charPos = 0; charPos < charLen; charPos++) {
        chars.push(new C.IntegralValue(charType, bytesArray[charPos]));
    }
    const lenValue = new C.IntegralValue(C.builtinTypes['int'], chars.length);
    return new C.ArrayValue(C.arrayType(charType, lenValue), chars);
}

export function* scanfBuiltin(stepperContext, fmtRef, ...args) {
    const {programState} = stepperContext.state;
    const fmt = C.readString(programState.memory, fmtRef);
    let it = scanf(fmt, ...args), step, nextVal;
    while ((step = it.next(nextVal)) && !step.done) {
        nextVal = null;
        const effect = step.value;
        if (effect[0] === 'store') {
            const type = effect[2];
            const rawValue = effect[3];
            let value;
            if (type === 'char[]') {
                value = unterminatedStringValue(rawValue);
            } else if (type === 'char*') {
                value = C.stringValue(rawValue);
            } else if (/double|float/.test(type)) {
                value = new C.FloatingValue(C.builtinTypes[type], rawValue);
            } else if (/int$/.test(type)) {
                value = new C.IntegralValue(C.builtinTypes[type], rawValue);
            } else {
                throw new Error(`unhandled value type ${type}`);
            }
            yield ['store', effect[1], value];
        } else if (effect[0] === 'result') {
            yield ['result', new C.IntegralValue(C.builtinTypes['int'], effect[1])];
        } else if (effect[0] === 'ungets') {
            yield ['ungets', effect[1].length];
        } else {
            nextVal = yield effect;
        }
    }
}
