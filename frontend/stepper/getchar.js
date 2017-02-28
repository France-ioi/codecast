import * as C from 'persistent-c';

export const applyGetcharEffect = function (state, effect) {
  const {core, input, inputPos} = state;
  if (inputPos === input.length) {
    state.isWaitingOnInput = true;
    return;
  }
  state.inputPos += 1;
  core.result = new C.IntegralValue(C.scalarTypes['int'], input.charCodeAt(inputPos));
  core.direction = 'up';
};

export const getchar = function (state, cont, values) {
  return {control: cont, effects: [['getchar', values]], seq: 'expr'};
};
