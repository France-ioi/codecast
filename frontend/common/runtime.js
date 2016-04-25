
import * as C from 'persistent-c';
import {TermBuffer} from 'epic-vt';
import {sprintf} from 'sprintf-js';
import Immutable from 'immutable';

export const options = function (effects) {
  const applyWriteEffect = function (state, effect) {
    state.terminal = state.terminal.write(effect[1]);
  };
  const applyScanfEffect = function (state, effect) {
    const args = effect[1];
    const format = unboxValue(args[1]);
    const ref = args[2];
    const valueType = ref.type.pointee;
    let result = 0;
    switch (format) {
      case '%d': {
        if (state.input.size !== 0) {
          const token = state.input.first();
          const value = new C.IntegralValue(valueType, parseInt(token));
          state.input = state.input.shift();
          state.memory = C.writeValue(state.memory, ref, value);
          result = 1;
        }
        break;
      }
    }
    state.direction = 'up';
    state.result = new C.IntegralValue(C.scalarTypes['int'], result);
  };
  const enterEffect = function (state, effect) {
    const node = effect[2];
    effects.enter(state, effect);
    const scope = state.scope;
    scope.directives = node[1].directives || [];
  };
  return {
    effectHandlers: {
      ...effects,
      write: applyWriteEffect,
      enter: enterEffect,
      scanf: applyScanfEffect
    }
  };
}(C.defaultEffects);

const unboxValue = function (v) {
  // XXX hack for strings
  if (v[0] === 'string') {
    return v[1];
  }
  // XXX this works only for IntegralValue, FloatingValue.
  return v.number;
};

const printf = function (state, cont, values) {
  // Unbox each argument's value.
  const args = values.slice(1).map(unboxValue);
  const str = sprintf.apply(null, args);
  const result = str.length;
  return {control: cont, effects: [['write', str]], result, seq: 'expr'};
};

const scanf = function (state, cont, values) {
  return {control: cont, effects: [['scanf', values]], seq: 'expr'};
};

export const builtins = {printf, scanf};

export const start = function (syntaxTree, options) {
  options = options || {};
  const decls = syntaxTree[2];
  const context = {decls, builtins: builtins};
  let state = C.start(context);
  state.terminal = new TermBuffer({width: 40});
  if ('input' in options) {
    const inputStr = options.input.trim();
    const input = inputStr.length === 0 ? [] : options.input.split(/[\s]+/);
    state.input = Immutable.List(input);
  }
  state = stepIntoUserCode(state);
  return state;
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
