
import * as C from 'persistent-c';

const voidPtr = C.pointerType(C.builtinTypes['void']);
const nullPointer = new C.PointerValue(voidPtr, 0);

export const applyGetsEffect = function (state, effect) {
  const {core, input, inputPos} = state;
  const nextNL = input.indexOf('\n', inputPos);
  if (nextNL === -1) {
    if (state.terminal) {
      /* Interactive input */
      state.isWaitingOnInput = true;
    } else {
      /* End of input */
      core.result = nullPointer;
      core.direction = 'up';
    }
    return;
  }
  const line = input.substring(inputPos, nextNL);
  state.inputPos = nextNL + 1;
  const ref = effect[1];
  const value = new C.stringValue(line);
  state.core.memory = C.writeValue(core.memory, ref, value);
  state.core.memoryLog = state.core.memoryLog.push(['store', ref, value]);
  core.result = ref;
  core.direction = 'up';
};

export const gets = function (state, cont, values) {
  const ref = values[1];
  return {control: cont, effects: [['gets', ref]], seq: 'expr'};
};
