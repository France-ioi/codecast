
import * as C from 'persistent-c';
import {parse as P, text as PT} from 'bennu';
import {stream} from 'nu-stream';

function parsePrefixedUint (str) {
  if (/^0[Xx]/.test(str)) {
    return parseInt(str.substr(2), 16);
  }
  if (/^0[Bb]/.test(str)) {
    return parseInt(str.substr(2), 2);
  }
  if (/^0/.test(str)) {
    return parseInt(str.substr(1), 8);
  }
  return parseInt(str, 10);
}

function applySign (sign, value) {
  return sign === '-' ? (-value) : value;
}

/* Join all elements from the stream argument into a string. */
function join (s) {
  return stream.toArray(s).join('');
}

/* Parse p then q, return only the result of q. */
function P_first (p, q) {
  return P.bind(p, v => P.next(q, P.always(v)));
}

const p_whitespace = P.many(PT.space);
const p_sign = P.optional('+', PT.oneOf('+-'));
const p_decdigits = P.many1(PT.digit).map(join);
const p_hexdigits = P.many1(PT.oneOf('0123456789ABCDEFabcdef')).map(join);
const p_octdigits = P.many1(PT.oneOf('012345678')).map(join);
const p_bindigits = P.many1(PT.oneOf('01')).map(join);
const p_prefixedInt = P.choice(
  P.enumeration(PT.oneOf('123456789'), p_decdigits).map(join),
  P.enumeration(PT.character('0'), p_octdigits).map(join),
  P.enumeration(PT.character('0'), PT.oneOf('Xx'), p_hexdigits).map(join),
  P.enumeration(PT.character('0'), PT.oneOf('Bb'), p_bindigits).map(join));
const p_fpart = P.optional('', P.next(PT.character('.'), p_decdigits));
const p_epart = P.optional('0', P.next(PT.oneOf('eE'), p_decdigits));
const p_fmt_d =
  P.bind(p_sign, sign =>
  P.bind(p_decdigits, digits =>
  P.always(applySign(sign, parseInt(digits, 10)))));
const p_fmt_x =
  P.bind(p_sign, sign =>
  P.bind(p_hexdigits, digits =>
  P.always(applySign(sign, parseInt(digits, 16)))));
const p_fmt_o =
  P.bind(p_sign, sign =>
  P.bind(p_octdigits, digits =>
  P.always(applySign(sign, parseInt(digits, 8)))));
const p_fmt_f =
  P.bind(p_sign, sign =>
  P.bind(p_decdigits, ip =>
  P.bind(p_fpart, fp =>
  P.bind(p_epart, exp =>
  P.always(applySign(sign, parseFloat(`${ip}.${fp}e${exp}`)))))));
const p_fmt_i =
  P.bind(p_sign, sign =>
  P.bind(p_prefixedInt, digits =>
  P.always(applySign(sign, parsePrefixedUint(digits)))));
const p_fmt_u =
  P.bind(p_prefixedInt, digits =>
  P.always(parsePrefixedUint(digits)));
const p_fmt_s =
  P.many1(PT.noneOf("\t\r\n ")).map(join);
const p_fmt_c = P.anyToken

const p_nextArg = (
  P.bind(P.getState, state =>
    state.argPos >= state.args.length
      ? P.fail('insufficient arguments')
      : P.next(P.setState({...state, argPos: state.argPos + 1}),
          P.always(state.args[state.argPos]))));

function p_integral (typeName, parser) {
  return (
    P.bind(parser, rawValue =>
    P.bind(p_nextArg, ref =>
    P.always(function* (context) {
      yield ['store', ref, new C.IntegralValue(C.builtinTypes[typeName], rawValue)];
    }))));
}

function p_floating (typeName, parser) {
  return (
    P.bind(parser, rawValue =>
    P.bind(p_nextArg, ref =>
    P.always(function* (context) {
      yield ['store', ref, new C.FloatingValue(C.builtinTypes[typeName], rawValue)];
    }))));
}

const p_string =
  P.bind(p_fmt_s, string =>
  P.bind(p_nextArg, ref =>
  P.always(function* (context) {
    yield ['store', ref, new C.stringValue(string)];
  })));

const p_char =
  P.bind(p_fmt_c, char =>
  P.bind(p_nextArg, ref =>
  P.always(function* (context) {
    const charCode = char.charCodeAt(0) & 0xff;
    yield ['store', ref, new C.IntegralValue(C.builtinTypes["char"], charCode)];
  })));

function getFormatParser (format) {
  switch (format) {
  case '%d':
    return P.next(p_whitespace, p_integral('int', p_fmt_d));
  case '%x':
    return P.next(p_whitespace, p_integral('int', p_fmt_x));
  case '%o':
    return P.next(p_whitespace, p_integral('int', p_fmt_o));
  case '%i':
    return P.next(p_whitespace, p_integral('int', p_fmt_i));
  case '%u':
    return P.next(p_whitespace, p_integral('unsigned int', p_fmt_u));
  case '%f':
    return P.next(p_whitespace, p_floating('float', p_fmt_f));
  case '%lf':
    return P.next(p_whitespace, p_floating('double', p_fmt_f));
  case '%c':
    return p_char;
  case '%s':
    return P.next(p_whitespace, p_string);
  default:
    throw new Error(`bad format specifier ${format}`);
  }
}

export function* scanf (context, fmtRef, ...args) {
  const {core} = context.state;
  const line = yield ['gets'];
  if (line === null) {
    yield ['result', new C.IntegralValue(C.builtinTypes['int'], -1)];
    return;
  }
  const formats = C.readString(core.memory, fmtRef).split(/[\s]+/);
  const parsers = formats.map(getFormatParser);
  const p_actions = P_first(P.enumerationa(parsers), p_whitespace);
  const parser =
    P.bind(p_actions, actions =>
    P.bind(P.getPosition, position =>
    P.always({actions, position})));
  // XXX
  const inputStream = stream.from(line);
  try {
    /* Run the parser on the input stream. */
    var {actions, position} = P.runStream(parser, inputStream, {args, argPos: 0});
    /* /!\ bennu returns the position as a string. */
    position = parseInt(position);
  } catch (ex) {
    console.log('TODO — scanf exception', ex);
  }
  /* Update the position in the input stream. */
  if (line.length > position) {
    yield ['ungets', line.length - position + 1]; /* +1 to unget the \n */
  }
  /* Perform the actions returned by parsing. */
  let result = 0;
  if (stream) {
    while (!stream.isEmpty(actions)) {
      const gen = stream.first(actions);
      yield* gen(context);
      result += 1;
      actions = stream.rest(actions);
    }
  }
  yield ['result', new C.IntegralValue(C.builtinTypes['int'], result)];
};
