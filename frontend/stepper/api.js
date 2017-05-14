
import * as C from 'persistent-c';
import {delay} from 'redux-saga'
import {call, fork, put} from 'redux-saga/effects';

export default function (bundle, deps) {

  const stepperApi = {
    addOptions, /* (callback) */
    collectOptions, /* (options, state) */
    onInit, /* (callback) */
    onEffect, /* (name, handler) */
    addBuiltin, /* (name, handler) */
    addSaga, /* (saga) */
    buildState, /* (syntaxTree, options) */
    rootSaga, /* () */
    runEffects, /* (context, iterator) */
    runBuiltin, /* (context, name, ...args) */
    stepUntil, /* (runContext, stopCond) */
    singleStep, /* (runContext, stopCond) */
    stepExpr, /* (runContext) */
    stepInto, /* (runContext) */
    stepOut, /* (runContext) */
    stepOver, /* (runContext) */
  };
  bundle.defineValue('stepperApi', stepperApi);

  bundle.use('stepperProgress', 'getStepperDisplay');

  const optionCallbacks = [];
  const initCallbacks = [];
  const stepperSagas = [];
  const effectHandlers = new Map();
  const builtinHandlers = new Map();

  /* Register a function to collect configuration data from the state when the
     stepper starts. */
  function addOptions (callback) {
    optionCallbacks.push(callback);
  }

  /* Run all the registered configuration collection functions. */
  function collectOptions (options, state) {
    for (var callback of optionCallbacks) {
      callback(options, state);
    }
  }

  /* Register a function to collect configuration data from the state when the
     stepper starts. */
  function onInit (callback) {
    initCallbacks.push(callback);
  }

  /* Build a stepper state from the given init data. */
  function* buildState (syntaxTree, options) {
    /* Set up the core. */
    const core0 = C.makeCore(options.memorySize);
    /* Execute declarations and copy strings into memory */
    const core1 = {...core0};
    const decls = syntaxTree[2];
    C.execDecls(core1, decls);
    /* Set up the call to the main function. */
    C.setupCall(core1, options.entry);
    const state = {core: core1, oldCore: core0, options};
    /* Call all the init callbacks. */
    for (var callback of initCallbacks) {
      callback(state);
    }
    /* Run until in user code */
    const runContext = {state};
    while (true) {
      if (!(yield call(singleStep, runContext, inUserCode))) {
        break;
      }
    }
    return runContext.state;
  }

  /* Register a saga to run inside the stepper task. */
  function addSaga (saga) {
    stepperSagas.push(saga);
  }

  /* Run all stepper sagas in subtasks. */
  function* rootSaga (options) {
    for (var saga of stepperSagas) {
      yield call(saga, options);
    }
  }

  /* Register a saga that implements an effect. */
  function onEffect (name, handler) {
    /* TODO: guard against duplicate effects? allow multiple handlers for a
             single effect? */
    effectHandlers.set(name, handler);
  }

  /* Run all effects produced by a given iterator. */
  function* runEffects (context, iterator) {
    while (true) {
      /* Pull the next effect from the builtin's iterator. */
      const {done, value} = iterator.next(context.arg);
      if (done) {
        return;
      }
      /* Call the effect handler, feed the result back into the iterator. */
      const name = value[0];
      if (!effectHandlers.has(name)) {
        throw new Error(`unhandled effect ${name}`);
      }
      context.arg = yield call(effectHandlers.get(name), context, ...value.slice(1));
    }
  }

  /* Register a builtin. A builtin is a generator that yields effects. */
  function addBuiltin (name, handler) {
    /* TODO: guard against duplicate builtins */
    builtinHandlers.set(name, handler);
  }

  /* Run a builtin and all the effects it yields. */
  function* runBuiltin (context, name, ...args) {
    if (!builtinHandlers.has(name)) {
      throw new Error(`unknown builtin ${name}`);
    }
    const iterator = builtinHandlers.get(name)(context, ...args);
    yield call(stepperApi.runEffects, context, iterator);
  };

  function* stepUntil (runContext, stopCond) {
    while (true) {
      /* Execute up to 100 steps (until the stop condition is met, the end of
         the program, an error condition, or an interrupted effect) */
      for (let stepCount = 100; stepCount !== 0; stepCount -= 1) {
        if (!(yield call(singleStep, runContext, stopCond))) {
          return;
        }
      }
      /* TODO: return if Interrupt button clicked. */
      // Has the time limit for the current run passed?
      if (runContext.interactive) {
        const now = window.performance.now();
        if (now >= runContext.timeLimit) {
          // Reset the time limit and put a Progress event.
          runContext.timeLimit = window.performance.now() + 20;
          yield put({type: deps.stepperProgress, context: runContext}); // XXX
          // Yield until the next tick (XXX consider requestAnimationFrame).
          yield call(delay, 0);
        }
      }
    }
  }

  function* singleStep (runContext, stopCond) {
    let {state} = runContext;
    if (!state.core.control) {
      return false;
    }
    if (stopCond && stopCond(state.core)) {
      return false;
    }
    const effects = C.step(state.core);
    while (true) {
      /* Make a mutable step-context. */
      const stepContext = {
        state: {...state, core: {...state.core}},
        interactive: runContext.interactive
      };
      try {
        /* Run the effects to update the step-context. */
        yield call (stepperApi.runEffects, stepContext, effects[Symbol.iterator]());
      } catch (ex) {
        if (runContext.interactive) {
          if (ex === 'interrupted') {
            /* When interrupted, all effects are discarded. */
            runContext.interrupted = true;
            return false;
          }
          if (ex === 'retry') {
            /* Retry the effects on the updated state. */
            stepContext.state = yield select(deps.getStepperDisplay);
            continue;
          }
        }
        throw ex; /* TODO: handle error */
      }
      /* Commit the changes to the state. */
      runContext.state = stepContext.state;
      runContext.stepCounter += 1;
      return true;
    }
  }

  function* stepExpr (runContext) {
    // Take a first step.
    if (yield call(singleStep, runContext)) {
      // then stop when we enter the next expression.
      yield call(stepUntil, runContext, core => C.intoNextExpr(core));
    }
  }

  function* stepInto (runContext) {
    // Take a first step.
    if (yield call(singleStep, runContext)) {
      // Step out of the current statement.
      yield call(stepUntil, runContext, C.outOfCurrentStmt);
      // Step into the next statement.
      yield call(stepUntil, runContext, C.intoNextStmt);
    }
  }

  function* stepOut (runContext) {
    // The program must be running.
    if (!runContext.state.core.control) {
      return;
    }
    // Find the closest function scope.
    const refScope = runContext.state.core.scope;
    const funcScope = C.findClosestFunctionScope(refScope);
    // Step until execution reach that scope's parent.
    yield call(stepUntil, runContext, core => core.scope === funcScope.parent);
  }

  function* stepOver (runContext) {
    // Remember the current scope.
    const refScope = runContext.state.core.scope;
    // Take a first step.
    if (yield call(singleStep, runContext)) {
      // Step until out of the current statement but not inside a nested
      // function call.
      yield call(stepUntil, runContext, core =>
        C.outOfCurrentStmt(core) && C.notInNestedCall(core.scope, refScope));
      // Step into the next statement.
      yield call(stepUntil, runContext, C.intoNextStmt);
    }
  }

};

function inUserCode (core) {
  return !!core.control.node[1].begin;
}
