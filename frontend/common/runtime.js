
import * as C from 'persistent-c';
import {TermBuffer} from 'epic-vt';
import {sprintf} from 'sprintf-js';

// Upon entering a CompoundStmt node, check if node[1].directives contains
// any directive.
// Directive example:
//   ["showArray",[["ident","a"]],{"cursors":[["ident","a"],["ident","b"]]}]

export const options = function (effects) {
  const applyWriteEffect = function (state, effect) {
    state.terminal = state.terminal.write(effect[1]);
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
      enter: enterEffect
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

export const builtins = {printf};

export const start = function (syntaxTree) {
  const decls = syntaxTree[2];
  const context = {decls, builtins: builtins};
  let state = C.start(context);
  state.terminal = new TermBuffer({width: 40});
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
