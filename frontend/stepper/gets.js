
import * as C from 'persistent-c';

export const applyGetsEffect = function (state, effect) {
  const {core, input, inputPos} = state;
  const nextNL = input.indexOf('\n', inputPos);
  console.log("next", input, inputPos, nextNL);
  if (nextNL === -1) {
    state.isWaitingOnInput = true;
    return;
  }
  const line = input.substring(inputPos, nextNL);
  state.inputPos = nextNL + 1;
  const ref = effect[1];
  const value = new C.stringValue(line);
  console.log('ref', ref, value);
  state.core.memory = C.writeValue(core.memory, ref, value);
  state.core.memoryLog = state.core.memoryLog.push(['store', ref, value]);
  core.result = ref;
  core.direction = 'up';
};

export const gets = function (state, cont, values) {
  const ref = values[1];
  return {control: cont, effects: [['gets', ref]], seq: 'expr'};
};
