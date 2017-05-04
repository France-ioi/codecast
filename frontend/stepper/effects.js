/*
  C.step(core) returns a list of effects.
  An effect is an array whose first element is a string.
  An effect is interpreted by a saga that take a context and the effect's arguments.
  A builtin is a generator that yields effects.
*/

import * as C from 'persistent-c';
import {delay} from 'redux-saga'
import {take, put, call, race} from 'redux-saga/effects';

import {TermBuffer, writeString} from './terminal';
import builtins from './builtins/index';
import {heapInit} from './builtins/heap';

export default function (bundle, deps) {

  bundle.use(
    'stepperInterrupt', 'stepperProgress',
    'terminalFocus', 'terminalInputNeeded', 'terminalInputEnter'
  );

  bundle.defineValue('runEffects', runEffects);

  function* runEffects (context, iterator) {
    while (!(context.interrupted || context.retry)) {
      /* Pull the next effect from the builtin's iterator. */
      const {done, value} = iterator.next(context.arg);
      if (done) {
        return;
      }
      /* Call the effect handler, feed the result back into the iterator. */
      console.log('effect', value);
      const name = value[0];
      if (!effectHandlers.has(name)) {
        throw new Error(`unhandled effect ${name}`);
      }
      context.arg = yield call(effectHandlers.get(name), context, ...value.slice(1));
    }
  }

  const effectHandlers = new Map([
    /* core effects */
    ['control', controlHandler],
    ['result', resultHandler],
    ['load', loadHandler],
    ['store', storeHandler],
    ['enter', enterHandler],
    ['leave', leaveHandler],
    ['call', callHandler],
    ['return', returnHandler],
    ['vardecl', vardeclHandler],
    /* utils and builtins */
    ['progress', progressHandler],
    ['delay', delayHandler],
    ['write', writeHandler],
    ['gets', getsHandler],
    ['ungets', ungetsHandler],
    ['builtin', builtinHandler],
  ]);

  /* core effect handlers */

  function* controlHandler (context, control) {
    C.effects.doControl(context.state.core, control);
  }
  function* resultHandler (context, result) {
    C.effects.doResult(context.state.core, result);
  }
  function* loadHandler (context, ref) {
    C.effects.doLoad(context.state.core, ref);
  }
  function* storeHandler (context, ref, value) {
    C.effects.doStore(context.state.core, ref, value);
  }
  function* enterHandler (context, blockNode) {
    C.effects.doEnter(context.state.core, blockNode);
    context.state.core.scope.directives = blockNode[1].directives || [];
  }
  function* leaveHandler (context, blockNode) {
    C.effects.doLeave(context.state.core, blockNode);
  }
  function* callHandler (context, cont, values) {
    C.effects.doCall(context.state.core, cont, values);
    /* XXX disable this code and leave directives in block */
    const bodyNode = values[0].decl;
    context.state.core.scope.directives = bodyNode[1].directives || [];
    /* --- */
  }
  function* returnHandler (context, result) {
    C.effects.doReturn(context.state.core, result);
  }
  function* vardeclHandler (context, name, type, init) {
    C.effects.doVardecl(context.state.core, name, type, init);
  }

  function* progressHandler (context) {
    yield put({type: deps.stepperProgress, context});
  }

  function* delayHandler (context, millis) {
    const {interrupted} = yield (race({
      completed: call(delay, millis),
      interrupted: take(deps.stepperInterrupt)
    }));
    if (interrupted) {
      throw 'interrupted';
    }
  }

  function* writeHandler (context, text) {
    const {state} = context;
    if (state.terminal) {
      state.terminal = writeString(state.terminal, text);
    } else {
      state.output = state.output + text;
    }
  }

  function* getsHandler (context) {
    const {state} = context;
    const {input, inputPos} = state;
    var nextNL = input.indexOf('\n', inputPos);
    if (-1 === nextNL) {
      if (!state.terminal) {
        /* non-interactive, end of input */
        return null;
      }
      /* Set the isWaitingOnInput flag on the state. */
      yield put({type: deps.terminalInputNeeded});
      /* Transfer focus to the terminal. */
      yield put({type: deps.terminalFocus});
      const {interrupted} = yield (race({
        completed: take(deps.terminalInputEnter),
        interrupted: take(deps.stepperInterrupt)
      }));
      if (interrupted) {
        throw 'interrupted';
      }
      throw 'retry';
    }
    const line = input.substring(inputPos, nextNL);
    state.inputPos = nextNL + 1;
    return line;
  }

  function* ungetsHandler (context, count) {
    context.state.inputPos -= count;
  }

  function* builtinHandler (context, name, ...args) {
    if (!(name in builtins)) {
      throw new Error(`unknown builtin ${name}`);
    }
    const iterator = builtins[name](context, ...args);
    yield call(runEffects, context, iterator);
  }

  /*

  export function beginStep (state) {
    return {
      state: {
        ...state,
        core: C.clearMemoryLog(state.core)
      },
      stepCounter: 0
    };
  }

  export function runToStep (context, targetStepCounter) {
    let {state, stepCounter} = context;
    while (stepCounter < targetStepCounter) {
      for (var effect of C.step(state)) {
        pureEffector(state, effect);
      }
      stepCounter += 1;
    }
    return {state, stepCounter};
  };
  */

};
