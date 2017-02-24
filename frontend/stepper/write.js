
import {writeString} from './terminal';

export const applyWriteEffect = function (state, effect) {
  state.terminal = writeString(state.terminal, effect[1]);
};

export const putchar = function (state, cont, values) {
  const ch = String.fromCharCode(values[1].number);
  return {control: cont, effects: [['write', ch]], result: values[1], seq: 'expr'};
};
