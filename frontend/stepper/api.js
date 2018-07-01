/* Extensibility API for the C stepper. */

import * as C from 'persistent-c';
import {all, call} from 'redux-saga/effects';

export default function (bundle) {

  bundle.defineValue('stepperApi', {
    onInit, /* (stepperState, globalState) -- add an init callback */
    addSaga, /* (saga) -- add a stepper saga */
    onEffect, /* (name, handler) -- register an effect */
    addBuiltin, /* (name, handler) -- register a builtin */
  });

}

const initCallbacks = [];
const stepperSagas = [];
const effectHandlers = new Map();
const builtinHandlers = new Map();

/* Register a setup callback for the stepper's initial state. */
function onInit (callback) {
  initCallbacks.push(callback);
}

/* Build a stepper state from the given init data. */
export async function buildState (globalState) {
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
    stepCounter: 0,
    interact
  };
  while (!inUserCode(context.state.core)) {
    /* Mutate the context to advance execution by a single step. */
    const effects = C.step(context.state.core);
    if (effects) {
      await executeEffects(context, effects[Symbol.iterator]());
    }
    context.stepCounter += 1;
  }
  return context.state;
  function interact (saga, ...args) {
    return new Promise((resolve, reject) => {
      if (saga) {
        return reject(new StepperError(context, 'error', 'cannot interact in buildState'));
      }
      resolve();
    });
  }
}

/* Register a saga to run inside the stepper task. */
function addSaga (saga) {
  stepperSagas.push(saga);
}

/* The root stepper saga does a parallel call of registered stepper sagas. */
export function* rootStepperSaga (...args) {
  yield all(stepperSagas.map(saga => call(saga, ...args)));
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

export function makeContext (state, interact) {
  return {
    state: {
      ...state,
      core: C.clearMemoryLog(state.core),
      oldCore: state.core,
      controls: resetControls(state.controls)
    },
    interact,
    stepCounter: 0
  };
}

function resetControls (controls) {
  /* Reset the controls before a step is started. */
  return controls.setIn(['stack', 'focusDepth'], 0);
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

async function executeEffects (context, iterator) {
  let lastResult;
  while (true) {
    /* Pull the next effect from the builtin's iterator. */
    const {done, value} = iterator.next(lastResult);
    if (done) {
      return value;
    }
    const name = value[0];
    if (name === 'interact') {
      lastResult = await context.interact(...value.slice(1));
    } else if (name === 'builtin') {
      const builtin = value[1];
      if (!builtinHandlers.has(builtin)) {
        throw new StepperError(context, 'error', `unknown builtin ${builtin}`);
      }
      lastResult = await executeEffects(context,
        builtinHandlers.get(builtin)(context, ...value.slice(2)));
    } else {
      /* Call the effect handler, feed the result back into the iterator. */
      if (!effectHandlers.has(name)) {
        throw new StepperError(context, 'error', `unhandled effect ${name}`);
      }
      lastResult = await executeEffects(context,
        effectHandlers.get(name)(context, ...value.slice(1)));
    }
  }
}

async function executeSingleStep (context) {
  if (isStuck(context.state.core)) {
    return;
  }
  const effects = C.step(context.state.core);
  while (true) {
    const newContext = copyContext(context);
    await executeEffects(newContext, effects[Symbol.iterator]());
    newContext.stepCounter += 1;
    return newContext;
  }
}

async function stepUntil (context, stopCond) {
  var timeLimit = window.performance.now() + 20, now;
  var core;
  var stop = false;
  var stepCount; // TODO: clean up using context.stepCounter
  var newContext;
  while (true) {
    /* Execute up to 100 steps (until the stop condition is met, the end of
       the program, an error condition, or an interrupted effect) */
    for (stepCount = 100; stepCount !== 0; stepCount -= 1) {
      core = context.state.core;
      if (isStuck(core)) {
        return context;
      }
      if (!stop && stopCond(core)) {
        stop = true;
      }
      if (inUserCode(core) && stop) {
        return context;
      }
      newContext = await executeSingleStep(context);
      if (!newContext) {
        return context;
      }
      context = newContext;
    }
    /* Has the time limit for the current run passed? */
    now = window.performance.now();
    if (now >= timeLimit) {
      /* Indicate progress to the controlling routine by calling interact()
         with no argument.  This also allows interrupting a tight loop. */
      await context.interact();
      /* Reset the time limit and put a Progress event. */
      timeLimit = window.performance.now() + 20;
    }
  }
}

async function stepExpr (context) {
  // Take a first step.
  let newContext = await executeSingleStep(context);
  if (newContext) {
    context = newContext;
    // Step into the next expression.
    context = await stepUntil(context, C.intoNextExpr);
  }
  return context;
}

async function stepInto (context) {
  // Take a first step.
  let newContext = await executeSingleStep(context);
  if (newContext) {
    context = newContext;
    // Step out of the current statement.
    context = await stepUntil(context, C.outOfCurrentStmt);
    // Step into the next statement.
    context = await stepUntil(context, C.intoNextStmt);
  }
  return context;
}

async function stepOut (context) {
  // The program must be running.
  if (!isStuck(context.state.core)) {
    // Find the closest function scope.
    const refScope = context.state.core.scope;
    const funcScope = C.findClosestFunctionScope(refScope);
    // Step until execution reach that scope's parent.
    context = await stepUntil(context, core => core.scope === funcScope.parent);
  }
  return context;
}

async function stepOver (context) {
  // Remember the current scope.
  const refScope = context.state.core.scope;
  // Take a first step.
  let newContext = await executeSingleStep(context);
  if (newContext) {
    context = newContext;
    // Step until out of the current statement but not inside a nested
    // function call.
    context = await stepUntil(context, core =>
      C.outOfCurrentStmt(core) && C.notInNestedCall(core.scope, refScope));
    // Step into the next statement.
    context = await stepUntil(context, C.intoNextStmt);
  }
  return context;
}

export async function performStep (context, mode) {
  switch (mode) {
    case 'run':
      context = await stepUntil(context, isStuck);
      break;
    case 'into':
      context = await stepInto(context);
      break;
    case 'expr':
      context = await stepExpr(context);
      break;
    case 'out':
      context = await stepOut(context);
      break;
    case 'over':
      context = await stepOver(context);
      break;
  }
  return context;
}


function isStuck (core) {
  return !core.control;
}

function inUserCode (core) {
  return !!core.control.node[1].begin;
}

export class StepperError extends Error {
  constructor (context, condition, message) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.condition = condition;
  }
}
