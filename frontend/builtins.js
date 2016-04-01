
import {sprintf} from 'sprintf-js';

export const stepperOptions = {
  onEffect: function (state, effect) {
    switch (effect[0]) {
      case 'write':
        return {...state, terminal: state.terminal.write(effect[1])};
      default:
        console.log('unknown effect', effect);
        return state;
    }
  }
};

export const printf = function (state, cont, values) {
  // Unbox each argument's value.
  const args = values.slice(1).map(v => v[1]);
  const str = sprintf.apply(null, args);
  const result = str.length;
  return {control: cont, effects: [['write', str]], result, seq: 'expr'};
};
