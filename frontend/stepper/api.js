
import * as C from 'persistent-c';
import {delay} from 'redux-saga'
import {call, fork, put, race, select, take} from 'redux-saga/effects';

export default function (bundle, deps) {

  const stepperApi = {
    onInit, /* add a (stepperState, globalState) init callback */
    buildState, /* build (globalState) */
    addSaga, /* (saga) */
    onEffect, /* (name, handler) */
    addBuiltin, /* (name, handler) */
    makeContext, /* state → context */
    runToStep, /* function (context, stepCounter) → context */
    rootSaga, /* function* (options) */
    run, /* function* (context) → context */
    stepExpr, /* function* (context) → context */
    stepInto, /* function* (context) → context */
    stepOut, /* function* (context) → context */
    stepOver, /* function* (context) → context */
  };
  bundle.defineValue('stepperApi', stepperApi);

  bundle.use('stepperProgress', 'stepperInterrupt', 'getStepperDisplay');

  const optionCallbacks = [];
  const initCallbacks = [];
  const stepperSagas = [];
  const effectHandlers = new Map();
  const builtinHandlers = new Map();

  /* Register a setup callback for the stepper's initial state. */
  function onInit (callback) {
    initCallbacks.push(callback);
  }

  /* Build a stepper state from the given init data. */
  function buildState (globalState) {
    /* Call all the init callbacks. Pass the global state so the player can
       build stepper states without having to install the pre-computed state
       into the store. */
    const stepperState = {};
    for (var callback of initCallbacks) {
      callback(stepperState, globalState);
    }
    /* Run until in user code */
    const context = {
      state: stepperState,
      interactive: false,
      stepCounter: 0
    };
    while (!inUserCode(context.state.core)) {
      computeSingleStep(context);
    }
    return context.state;
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

  /* An effect is a generator that may alter the context/state/core, and
     yield further effects. */
  function onEffect (name, handler) {
    /* TODO: guard against duplicate effects? allow multiple handlers for a
             single effect? */
    effectHandlers.set(name, handler);
  }

  /* Register a builtin. A builtin is a generator that yields effects. */
  function addBuiltin (name, handler) {
    /* TODO: guard against duplicate builtins */
    builtinHandlers.set(name, handler);
  }

  function makeContext (state) {
    return {
      state: {
        ...state,
        core: C.clearMemoryLog(state.core),
        oldCore: state.core
      },
      stepCounter: 0
    };
  }

  function copyContext (context) {
    const {state} = context;
    const {core} = state;
    return {
      ...context,
      state: {...state, core: {...core}}
    };
  }

/*
  // This could be a good idea:
  function freezeContext (context) {
    Object.freeze(context.state.core);
    Object.freeze(context.state);
    Object.freeze(context);
  }
*/

  function computeEffects (context, iterator) {
    let lastResult;
    while (true) {
      /* Pull the next effect from the builtin's iterator. */
      const {done, value} = iterator.next(lastResult);
      if (done) {
        return value;
      }
      /* Call the effect handler, feed the result back into the iterator. */
      const name = value[0];
      if (name === 'interact') {
        lastResult = false;
      } else if (name === 'builtin') {
        const builtin = value[1];
        if (!builtinHandlers.has(builtin)) {
          throw new Error(`unknown builtin ${builtin}`);
        }
        lastResult = computeEffects(context, builtinHandlers.get(builtin)(context, ...value.slice(2)));
      } else {
        if (!effectHandlers.has(name)) {
          throw new Error(`unhandled effect ${name}`);
        }
        lastResult = computeEffects(context, effectHandlers.get(name)(context, ...value.slice(1)));
      }
    }
  }

  /* Mutate the context to advance execution by a single step. */
  function computeSingleStep (context) {
    const effects = C.step(context.state.core);
    if (effects) {
      computeEffects(context, effects[Symbol.iterator]());
    }
    context.stepCounter += 1;
  }

  function runToStep (context, targetStepCounter) {
    if (context.stepCounter === targetStepCounter) {
      return context;
    }
    if (targetStepCounter < context.stepCounter) {
      // TODO: throw new Error(`runToStep cannot go from step ${context.stepCounter} to ${targetStepCounter}`);
      return context;
    }
    context = copyContext(context);
    while (context.stepCounter < targetStepCounter) {
      computeSingleStep(context);
    }
    return context;
  }

  function* executeEffects (context, iterator) {
    let lastResult;
    while (true) {
      /* Pull the next effect from the builtin's iterator. */
      const {done, value} = iterator.next(lastResult);
      if (done) {
        return value;
      }
      const name = value[0];
      if (name === 'interact') {
        /* Interact effects run an interruptible saga. A progress action is
           emitted first so that an up-to-date state gets displayed. */
        yield put({type: deps.stepperProgress, context});
        const {completed, interrupted} = yield (race({
          completed: call(value[1], context, ...value.slice(2)),
          interrupted: take(deps.stepperInterrupt)
        }));
        if (interrupted) {
          throw 'interrupted';
        }
        /* TODO: update context.state from the global state to avoid discarding
           the effects of user interaction */
        context.state = yield select(deps.getStepperDisplay);
        lastResult = completed;
      } else if (name === 'builtin') {
        const builtin = value[1];
        if (!builtinHandlers.has(builtin)) {
          throw new Error(`unknown builtin ${builtin}`);
        }
        lastResult = yield* executeEffects(context,
          builtinHandlers.get(builtin)(context, ...value.slice(2)));
      } else {
        /* Call the effect handler, feed the result back into the iterator. */
        if (!effectHandlers.has(name)) {
          throw new Error(`unhandled effect ${name}`);
        }
        lastResult = yield* executeEffects(context,
          effectHandlers.get(name)(context, ...value.slice(1)));
      }
    }
  }

  function* executeSingleStep (context) {
    if (isStuck(context.state.core)) {
      return;
    }
    const effects = C.step(context.state.core);
    while (true) {
      try {
        const newContext = copyContext(context);
        yield* executeEffects(newContext, effects[Symbol.iterator]());
        newContext.stepCounter += 1;
        return newContext;
      } catch (ex) {
        if (ex === 'retry') {
          /* Retry the effects on the updated state. */
          context.state = yield select(deps.getStepperDisplay);
          continue;
        }
        if (ex === 'interrupt') {
          throw {condition: 'interrupted', context};
        }
        throw {condition: 'error', details: ex, context: newContext};
      }
    }
  }

  function* stepUntil (context, stopCond) {
    var timeLimit = window.performance.now();
    while (true) {
      /* Execute up to 100 steps (until the stop condition is met, the end of
         the program, an error condition, or an interrupted effect) */
      for (var stepCount = 100; stepCount !== 0; stepCount -= 1) {
        if (isStuck(context.state.core) || stopCond(context.state.core)) {
          return context;
        }
        var newContext = yield* executeSingleStep(context);
        if (!newContext) {
          return context;
        }
        context = newContext;
      }
      /* Has the time limit for the current run passed? */
      var now = window.performance.now();
      if (now >= timeLimit) {
        // Reset the time limit and put a Progress event.
        timeLimit = window.performance.now() + 20;
        yield put({type: deps.stepperProgress, context});
        // Yield until the next tick (XXX consider requestAnimationFrame).
        yield call(delay, 0);
      }
    }
  }

  function* run (context) {
    context = yield call(stepUntil, context, isStuck);
    return context;
  }

  function* stepExpr (context) {
    // Take a first step.
    let newContext = yield call(executeSingleStep, context);
    if (newContext) {
      context = newContext;
      // Step into the next expression.
      context = yield call(stepUntil, context, C.intoNextExpr);
    }
    return context;
  }

  function* stepInto (context) {
    // Take a first step.
    let newContext = yield call(executeSingleStep, context);
    if (newContext) {
      context = newContext;
      // Step out of the current statement.
      context = yield call(stepUntil, context, C.outOfCurrentStmt);
      // Step into the next statement.
      context = yield call(stepUntil, context, C.intoNextStmt);
    }
    return context;
  }

  function* stepOut (context) {
    // The program must be running.
    if (!isStuck(context.state.core)) {
      // Find the closest function scope.
      const refScope = context.state.core.scope;
      const funcScope = C.findClosestFunctionScope(refScope);
      // Step until execution reach that scope's parent.
      context = yield call(stepUntil, context, core => core.scope === funcScope.parent);
    }
    return context;
  }

  function* stepOver (context) {
    // Remember the current scope.
    const refScope = context.state.core.scope;
    // Take a first step.
    let newContext = yield call(executeSingleStep, context);
    if (newContext) {
      newContext = context;
      // Step until out of the current statement but not inside a nested
      // function call.
      context = yield call(stepUntil, context, core =>
        C.outOfCurrentStmt(core) && C.notInNestedCall(core.scope, refScope));
      // Step into the next statement.
      context = yield call(stepUntil, context, C.intoNextStmt);
    }
    return context;
  }

};

function isStuck (core) {
  return !core.control;
}

function inUserCode (core) {
  return !!core.control.node[1].begin;
}
