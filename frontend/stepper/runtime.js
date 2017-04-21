
import * as C from 'persistent-c';
import Immutable from 'immutable';
import {call} from 'redux-saga/effects';

import {TermBuffer} from './terminal';
import {puts, putchar, applyWriteEffect} from './write';
import {printf} from './printf';
import {heapInit, malloc, free} from './malloc';
import {scanf, applyScanfEffect} from './scanf';
import {getchar, applyGetcharEffect} from './getchar';
import {gets, applyGetsEffect} from './gets';

const builtins = {printf, scanf, malloc, free, getchar, putchar, gets, puts};

export const start = function (syntaxTree, options) {
  options = options || {};
  const decls = syntaxTree[2];
  // Core setup.
  const memorySize = 0x10000;
  const stackSize = 4096;
  const core = C.makeCore(memorySize);
  C.execDecls(core, decls, builtins);
  heapInit(core, stackSize);
  C.setupCall(core, 'main');
  const state = {core, oldCore: core};
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
  stepIntoUserCode(state);
  return state;
};

export function pureStep (state) {
  const effects = C.step(state);
  for (var effect of effects) {
    pureEffector(state, effect);
  }
};

export function* sagaStep (state, effector) {
  const effects = C.step(state);
  for (var effect of effects) {
    yield call(sagaEffector, state, effect);
  }
};

const pureEffectHandlers = {
  ...C.defaultEffectHandlers,
  write: applyWriteEffect,
  call: applyCallEffect,
  enter: applyEnterEffect,
  scanf: applyScanfEffect,
  getchar: applyGetcharEffect,
  gets: applyGetsEffect
};

function applyEnterEffect (state, effect) {
  C.defaultEffectHandlers.enter(state, effect);
  // XXX store directives in state.directives rather than state.core.scope.
  const node = effect[1];
  const scope = state.core.scope;
  scope.directives = node[1].directives || [];
};

/* Some 'leave' effects are omitted (in particular when a function returns
   from nested compound statements) which makes it harder to track directives
   going out of scope (there is currently no need for this, as we store
   directives inside scopes).
   Perhaps make persistent-c always generate all 'leave' effects?
   Alternatively, make 'leave' effects discard all directives that live in
   a scope whose key is greater than the new scope's key. */
function applyCallEffect (state, effect) {
  C.defaultEffectHandlers.call(state, effect);
  const node = effect[2][0].decl;
  const scope = state.core.scope;
  scope.directives = node[1].directives || [];
}

function pureEffector (state, effect) {
  const name = effect[0];
  if (name in pureEffectHandlers) {
    pureEffectHandlers[name](state, effect);
  }
}

function* sagaEffector (state, effect) {
  pureEffector(state, effect);
  const name = effect[0];
  if (name === 'delay') {
    yield call(delay, effect[1]);
    return;
  }
  if (name === 'iowait') {
    yield call(iowait);
    return;
  }
}

export const stepIntoUserCode = function (state) {
  while (!state.error && state.core.control && !state.core.control.node[1].begin) {
    pureStep(state, pureEffector);
  }
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
