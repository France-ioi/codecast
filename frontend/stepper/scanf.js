
import * as C from 'persistent-c';

const unboxValue = function (v) {
  // XXX hack for strings
  if (v[0] === 'string') {
    return v[1];
  }
  // XXX this works only for IntegralValue, FloatingValue.
  return v.number;
};

const parsePrefixedInt = function (str) {
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
};

const parseChar = function (str) {
  return str[0].charCodeAt(0) & 0xff;
};

const scanIntegralValue = function (state, ref, typeName, func) {
  if (state.input.size === 0) {
    return false;
  }
  const token = state.input.first();
  const rawValue = func(token);
  const value = new C.IntegralValue(C.scalarTypes[typeName], rawValue);
  if (isNaN(rawValue)) {
    return false;
  }
  state.input = state.input.shift();
  state.core.memory = C.writeValue(state.core.memory, ref, value);
  state.core.memoryLog = state.core.memoryLog.push(['store', ref, value]);
  return true;
};

const scanFloatingValue = function (state, ref, typeName) {
  if (state.input.size === 0) {
    return false;
  }
  const token = state.input.first();
  const rawValue = parseFloat(token);
  if (isNaN(rawValue)) {
    return false;
  }
  const value = new C.FloatingValue(C.scalarTypes[typeName], rawValue);
  state.input = state.input.shift();
  state.core.memory = C.writeValue(state.core.memory, ref, value);
  return true;
};

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

const scanValue = function (state, format, ref) {
  switch (format) {
    case '%d':
      return scanIntegralValue(state, ref, 'int', token => parseInt(token, 10));
    case '%x':
      return scanIntegralValue(state, ref, 'int', token => parseInt(token, 16));
    case '%o':
      return scanIntegralValue(state, ref, 'int', token => parseInt(token, 8));
    case '%i':
      return scanIntegralValue(state, ref, 'int', parsePrefixedInt);
    case '%u':
      return scanIntegralValue(state, ref, 'unsigned int', parsePrefixedInt);
    case '%c':
      // TODO: if the token contains more than 1 character (possibly after
      //       UTF-8 encoding), push back the remaining characters onto the
      //       input.
      return scanIntegralValue(state, ref, 'char', parseChar);
    case '%f':
      return scanFloatingValue(state, ref, 'float');
    case '%lf':
      return scanFloatingValue(state, ref, 'double');
    case '%s':
      return scanString(state, ref);
  }
  return false;
};

export default function (state, effect) {
  const {core, input} = state;
  let pos = 0;
  if (input) {
    const args = effect[1];
    const formats = C.readString(core.memory, args[1]).split(/[\s]+/);
    const refs = args.slice(2);
    while (pos < formats.length && pos < refs.length && input.size !== 0) {
      if (!scanValue(state, formats[pos], refs[pos]))
        break;
      pos += 1;
    }
  }
  core.direction = 'up';
  core.result = new C.IntegralValue(C.scalarTypes['int'], pos);
};
