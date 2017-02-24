
import * as C from 'persistent-c';
import {parse as P, text as PT} from 'bennu';
import {stream} from 'nu-stream';

function writeValue(state, ref, value) {
  state.core.memory = C.writeValue(state.core.memory, ref, value);
  state.core.memoryLog = state.core.memoryLog.push(['store', ref, value]);
}

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

function parseChar (str) {
  return str[0].charCodeAt(0) & 0xff;
}

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
    P.always(function (state) {
      writeValue(state, ref, new C.IntegralValue(C.scalarTypes[typeName], rawValue));
    }))));
}

function p_floating (typeName, parser) {
  return (
    P.bind(parser, rawValue =>
    P.bind(p_nextArg, ref =>
    P.always(function (state) {
      writeValue(state, ref, new C.FloatingValue(C.scalarTypes[typeName], rawValue));
    }))));
}

const scanString = function (state, ref) {
  if (state.input.size === 0) {
    return false;
  }
  const string = state.input.first();
  state.input = state.input.shift();
  const value = C.stringValue(string);
  state.core.memory = C.writeValue(state.core.memory, ref, value);
  return true;
};

/* Join all elements from the stream argument into a string. */
function join (s) {
  return stream.toArray(s).join('');
}

/* Parse p then q, return only the result of q. */
function P_first (p, q) {
  return P.bind(p, v => P.next(q, P.always(v)));
}

const p_beginSpace = P.many(PT.space);
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

function getFormatParser (format) {
  switch (format) {
  case '%d':
    return p_integral('int', p_fmt_d);
  case '%x':
    return p_integral('int', p_fmt_x);
  case '%o':
    return p_integral('int', p_fmt_o);
  case '%i':
    return p_integral('int', p_fmt_i);
  case '%u':
    return p_integral('unsigned int', p_fmt_u);
  case '%f':
    return p_floating('float', p_fmt_f);
  case '%lf':
    return p_floating('double', p_fmt_f);
  // case '%c': return scanIntegralValue(context, 'char', parseChar);
  // case '%s': return scanString(context);
  default:
    throw new Error(`bad format specifier ${format}`);
  }
}

export const applyScanfEffect = function (state, effect) {
  const {core, input, inputPos} = state;
  const args = effect[1];
  const formats = C.readString(core.memory, args[1]).split(/[\s]+/);
  const parsers = formats.map(getFormatParser);
  const p_actions = P.next(p_beginSpace, P.enumerationa(parsers.map(p => P_first(p, p_beginSpace))));
  const parser =
    P.bind(p_actions, actions =>
    P.bind(P.getPosition, position =>
    P.always({actions, position})));
  const inputStream = stream.from(input.slice(inputPos)); // XXX start stream at offset inputPos
  const context = {args: args.slice(2), argPos: 0};
  try {
    /* Run the parser on the input stream. */
    var {actions, position} = P.runStream(parser, inputStream, context);
  } catch (ex) {
    if (ex.expected !== undefined && ex.position.index === input.length) {
      state.iowait = true;
      return;
    } else {
      console.log('TODO — scanf exception', ex);
    }
  }
  /* Update the position in the input stream. */
  state.inputPos += position;
  /* Perform the actions returned by parsing. */
  let result = 0;
  if (actions) {
    stream.forEach(function (action) {
      result += 1;
      action(state);
    }, actions);
  }
  core.direction = 'up';
  core.result = new C.IntegralValue(C.scalarTypes['int'], result);
};

export const scanf = function (state, cont, values) {
  return {control: cont, effects: [['scanf', values]], seq: 'expr'};
};
