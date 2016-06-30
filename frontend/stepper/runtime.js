
import * as C from 'persistent-c';
import Immutable from 'immutable';

import {TermBuffer, writeString} from './terminal';
import {sprintf} from './printf';
import applyScanfEffect from './scanf';

const applyWriteEffect = function (state, effect) {
  state.terminal = writeString(state.terminal, effect[1]);
};

const stepperOptions = function (effects) {
  const applyEnterEffect = function (state, effect) {
    effects.enter(state, effect);
    // XXX store directives in state.directives rather than state.core.scope.
    const node = effect[1];
    const scope = state.core.scope;
    scope.directives = node[1].directives || [];
  };
  // Some 'leave' effects are omitted (in particular when a function returns
  // from nested compound statements) which unfortunately makes it useless for
  // tracking directives going out of scope.
  // Perhaps make persistent-c always generate all 'leave' effects?
  // Alternatively, make 'leave' effects discard all directives that lives in
  // a scope whose key is greater than the new scope's key.
  const applyCallEffect = function (state, effect) {
    effects.call(state, effect);
    const node = effect[2][0].decl;
    const scope = state.core.scope;
    scope.directives = node[1].directives || [];
  };
  return {
    effectHandlers: {
      ...effects,
      write: applyWriteEffect,
      call: applyCallEffect,
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

const builtins = {printf, scanf};

export const start = function (syntaxTree, options) {
  try {
    options = options || {};
    const decls = syntaxTree[2];
    // Core setup.
    const state = {core: C.start({decls, builtins})};
    // Terminal setup.
    state.terminal = new TermBuffer({lines: 10, width: 60});
    // Input setup.
    if (typeof options.input === 'string') {
      const inputStr = options.input.trim();
      const input = inputStr.length === 0 ? [] : options.input.split(/[\s]+/);
      state.input = Immutable.List(input);
    }
    return stepIntoUserCode(state);
  } catch (ex) {
    return {error: ex};
  }
};

export const step = function (state) {
  return C.step(state, stepperOptions);
};

export const stepIntoUserCode = function (state) {
  while (state.core.control && !state.core.control.node[1].begin) {
    state = step(state);
  }
  return state;
};

export const getNodeRange = function (state) {
  if (!state) {
    return null;
  }
  const {control} = state.core;
  if (!control || !control.node) {
    return null;
  }
  const focusDepth = state.controls.getIn(['stack','focusDepth']);
  if (focusDepth === 0) {
    return control.node[1].range;
  } else {
    const {frames} = state.analysis;
    const frame = frames.get(frames.size - focusDepth);
    return frame.get('scope').cont.node[1].range;
  }
};
