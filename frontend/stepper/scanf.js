
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
  const token = state.input.first();
  const rawValue = func(token);
  const value = new C.IntegralValue(C.scalarTypes[typeName], rawValue);
  if (isNaN(rawValue)) {
    return 0;
  } else {
    state.input = state.input.shift();
    state.memory = C.writeValue(state.memory, ref, value);
    return 1;
  }
};

const scanFloatingValue = function (state, ref, typeName) {
  const token = state.input.first();
  const rawValue = parseFloat(token);
  if (isNaN(rawValue)) {
    return 0;
  } else {
    const value = new C.FloatingValue(C.scalarTypes[typeName], rawValue);
    state.input = state.input.shift();
    state.memory = C.writeValue(state.memory, ref, value);
    return 1;
  }
};

export default function (state, effect) {
  const args = effect[1];
  const format = unboxValue(args[1]);  // XXX
  const ref = args[2];
  const valueType = ref.type.pointee;
  let result = 0;
  if (state.input && state.input.size !== 0) {
    switch (format) {
      case '%d':
        result = scanIntegralValue(state, ref, 'int', token => parseInt(token, 10));
        break;
      case '%x':
        result = scanIntegralValue(state, ref, 'int', token => parseInt(token, 16));
        break;
      case '%o':
        result = scanIntegralValue(state, ref, 'int', token => parseInt(token, 8));
        break;
      case '%i':
        result = scanIntegralValue(state, ref, 'int', parsePrefixedInt);
        break;
      case '%u':
        result = scanIntegralValue(state, ref, 'unsigned int', parsePrefixedInt);
        break;
      case '%c':
        // TODO: if the token contains more than 1 character (possibly after
        //       UTF-8 encoding), push back the remaining characters onto the
        //       input.
        result = scanIntegralValue(state, ref, 'char', parseChar);
        break;
      case '%f':
        result = scanFloatingValue(state, ref, 'float');
        break;
      case '%g':
        result = scanFloatingValue(state, ref, 'double');
        break;
      case '%s':
        // TODO: write the string to memory
        break;
    }
  }
  state.direction = 'up';
  state.result = new C.IntegralValue(C.scalarTypes['int'], result);
};
