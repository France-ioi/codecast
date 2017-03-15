
import * as C from 'persistent-c';

import {writeString} from './terminal';

export const applyWriteEffect = function (state, effect) {
  const text = effect[1];
  if (state.terminal) {
    state.terminal = writeString(state.terminal, text);
  } else {
    state.output = state.output + text;
  }
};

export const putchar = function (state, cont, values) {
  const ch = String.fromCharCode(values[1].number);
  return {control: cont, effects: [['write', ch]], result: values[1], seq: 'expr'};
};

export const puts = function (state, cont, values) {
  const str = C.readString(state.memory, values[1]) + '\n';
  const result = new C.IntegralValue(C.scalarTypes['int'], 0);
  return {control: cont, effects: [['write', str]], result, seq: 'expr'};
};
