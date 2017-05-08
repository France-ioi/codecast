
import * as C from 'persistent-c';
import Immutable from 'immutable';

import {TermBuffer} from './terminal';
import {heapInit} from './builtins/heap';

export function buildStepperState (syntaxTree, options) {
  options = {
    memorySize: 0x10000,
    stackSize: 4096,
    ...options
  };
  /* Set up the core. */
  const core0 = C.makeCore(options.memorySize);
  /* Execute declarations and copy strings into memory */
  const core1 = {...core0};
  const decls = syntaxTree[2];
  C.execDecls(core1, decls);
  /* Set up the heap */
  heapInit(core1, options.stackSize);
  /* Set up the call to the main function. */
  C.setupCall(core1, 'main');
  const state = {core: core1, oldCore: core0};
  /* Set up the terminal or input. */
  if (options.terminal) {
    state.inputPos = 0;
    state.input = "";
    state.terminal = new TermBuffer({lines: 10, width: 80});
  } else {
    let input = (options.input || "").trimRight();
    if (input.length !== 0) {
      input = input + "\n";
    }
    state.inputPos = 0;
    state.input = input;
    state.output = "";
  }
  state.inputBuffer = "";
  /* Arduino */
  if (options.arduino) {
    state.ports = options.arduino.ports;
  }
  /* Add UI controls. */
  state.controls = Immutable.Map({
    stack: Immutable.Map({focusDepth: 0})
  });
  return state;
};
