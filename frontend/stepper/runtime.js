
import * as C from 'persistent-c';
import Immutable from 'immutable';

import {TermBuffer, writeString} from './terminal';
import {sprintf} from './printf';
import applyScanfEffect from './scanf';

const applyWriteEffect = function (state, effect) {
  state.terminal = writeString(state.terminal, effect[1]);
};

export const options = function (effects) {
  const applyEnterEffect = function (state, effect) {
    const node = effect[2];
    effects.enter(state, effect);
    const scope = state.scope;
    scope.directives = node[1].directives || [];
  };
  return {
    effectHandlers: {
      ...effects,
      write: applyWriteEffect,
      enter: applyEnterEffect,
      scanf: applyScanfEffect
    }
  };
}(C.defaultEffects);

const printf = function (state, cont, values) {
  const str = sprintf(state, values);
  const result = str.length;
  return {control: cont, effects: [['write', str]], result, seq: 'expr'};
};

const scanf = function (state, cont, values) {
  return {control: cont, effects: [['scanf', values]], seq: 'expr'};
};

export const builtins = {printf, scanf};

export const start = function (syntaxTree, options) {
  try {
    options = options || {};
    const decls = syntaxTree[2];
    const context = {decls, builtins: builtins};
    let state = C.start(context);
    state.terminal = new TermBuffer({lines: 10, width: 60});
    if (typeof options.input === 'string') {
      const inputStr = options.input.trim();
      const input = inputStr.length === 0 ? [] : options.input.split(/[\s]+/);
      state.input = Immutable.List(input);
    }
    state = stepIntoUserCode(state);
    return state;
  } catch (ex) {
    return {error: ex};
  }
};

export const stepIntoUserCode = function (stepperState) {
  while (stepperState.control && !stepperState.control.node[1].begin) {
    stepperState = C.step(stepperState, options);
  }
  return stepperState;
};

export const getNodeRange = function (stepper) {
  if (!stepper) {
    return null;
  }
  const {control} = stepper;
  if (!control || !control.node) {
    return null;
  }
  return control.node[1].range;
};
