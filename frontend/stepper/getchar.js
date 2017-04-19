import * as C from 'persistent-c';

export const applyGetcharEffect = function (state, effect) {
  const {core, input, inputPos} = state;
  if (inputPos < input.length) {
    if (state.terminal) {
      /* Interactive input */
      state.isWaitingOnInput = true;
    } else {
      /* End of input */
      core.result = new C.IntegralValue(C.builtinTypes['int'], -1);
      core.direction = 'up';
    }
    return;
  }
  state.inputPos += 1;
  core.result = new C.IntegralValue(C.builtinTypes['int'], input.charCodeAt(inputPos));
  core.direction = 'up';
};

export const getchar = function (state, cont, values) {
  return {control: cont, effects: [['getchar']], seq: 'expr'};
};
