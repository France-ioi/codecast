
import * as C from 'persistent-c';
import Immutable from 'immutable';

import {TermBuffer} from './terminal';
import {puts, putchar, applyWriteEffect} from './write';
import {printf} from './printf';
import {heapInit, malloc, free} from './malloc';
import {scanf, applyScanfEffect} from './scanf';
import {getchar, applyGetcharEffect} from './getchar';
import {gets, applyGetsEffect} from './gets';

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
      scanf: applyScanfEffect,
      getchar: applyGetcharEffect,
      gets: applyGetsEffect
    }
  };
}(C.defaultEffects);

const builtins = {printf, scanf, malloc, free, getchar, putchar, gets, puts};

export const start = function (syntaxTree, options) {
  options = options || {};
  const decls = syntaxTree[2];
  // Core setup.
  const stackSize = 4096;
  const state = C.start({decls, builtins, options: stepperOptions});
  state.core = C.clearMemoryLog(state.core);
  state.core = heapInit(state.core, stackSize);
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
  return stepIntoUserCode(state);
};

export const step = C.step;

export const stepIntoUserCode = function (state) {
  while (!state.error && state.core.control && !state.core.control.node[1].begin) {
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
  const focusDepth = state.controls.getIn(['stack','focusDepth'], 0);
  if (focusDepth === 0) {
    return control.node[1].range;
  } else {
    const {frames} = state.analysis;
    const frame = frames.get(frames.size - focusDepth);
    return frame.get('scope').cont.node[1].range;
  }
};
