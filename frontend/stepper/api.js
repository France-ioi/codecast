/*

  Extensibility API for the C stepper.

  CONSIDER: The only remaining distinction between effects and builtins is that
  they live in different namespaces.  They could be merged.

*/

import * as C from 'persistent-c';
import {all, call} from 'redux-saga/effects';

export default function (bundle) {

  bundle.defineValue('stepperApi', {
    onInit, /* (stepperState, globalState) -- add an init callback */
    addSaga, /* (saga) -- add a stepper saga */
    onEffect, /* (name, handler: function* (stepperContext, …args)) -- register an effect */
    addBuiltin, /* (name, handler: function* (stepperContext, …args)) -- register a builtin */
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
  const stepperContext = {
    state: stepperState,
    stepCounter: 0,
    interact
  };
  while (!inUserCode(stepperContext.state.core)) {
    /* Mutate the stepper context to advance execution by a single step. */
    const effects = C.step(stepperContext.state.core);
    if (effects) {
      await executeEffects(stepperContext, effects[Symbol.iterator]());
    }
    stepperContext.stepCounter += 1;
  }
  return stepperContext.state;
  function interact (saga, ...args) {
    return new Promise((resolve, reject) => {
      if (saga) {
        return reject(new StepperError('error', 'cannot interact in buildState'));
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

/* An effect is a generator that may alter the stepperContext/state/core, and
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

async function executeEffects (stepperContext, iterator) {
  let lastResult;
  while (true) {
    /* Pull the next effect from the builtin's iterator. */
    const {done, value} = iterator.next(lastResult);
    if (done) {
      return value;
    }
    const name = value[0];
    if (name === 'interact') {
      lastResult = await stepperContext.interact(...value.slice(1));
    } else if (name === 'builtin') {
      const builtin = value[1];
      if (!builtinHandlers.has(builtin)) {
        throw new StepperError('error', `unknown builtin ${builtin}`);
      }
      lastResult = await executeEffects(stepperContext,
        builtinHandlers.get(builtin)(stepperContext, ...value.slice(2)));
    } else {
      /* Call the effect handler, feed the result back into the iterator. */
      if (!effectHandlers.has(name)) {
        throw new StepperError('error', `unhandled effect ${name}`);
      }
      lastResult = await executeEffects(stepperContext,
        effectHandlers.get(name)(stepperContext, ...value.slice(1)));
    }
  }
}

async function executeSingleStep (stepperContext) {
  if (isStuck(stepperContext.state.core)) {
    throw new StepperError('stuck', 'execution cannot proceed');
  }
  const effects = C.step(stepperContext.state.core);
  await executeEffects(stepperContext, effects[Symbol.iterator]());
  stepperContext.stepCounter += 1;
}

async function stepUntil (stepperContext, stopCond) {
  let core;
  let stop = false;
  while (true) {
    core = stepperContext.state.core;
    if (isStuck(core)) {
      return;
    }
    if (!stop && stopCond(core)) {
      stop = true;
    }
    if (stop && inUserCode(core)) {
      return;
    }
    await executeSingleStep(stepperContext);
  }
}

async function stepExpr (stepperContext) {
  // Take a first step.
  await executeSingleStep(stepperContext);
  // Step into the next expression.
  await stepUntil(stepperContext, C.intoNextExpr);
}

async function stepInto (stepperContext) {
  // Take a first step.
  await executeSingleStep(stepperContext);
  // Step out of the current statement.
  await stepUntil(stepperContext, C.outOfCurrentStmt);
  // Step into the next statement.
  await stepUntil(stepperContext, C.intoNextStmt);
}

async function stepOut (stepperContext) {
  // The program must be running.
  if (!isStuck(stepperContext.state.core)) {
    // Find the closest function scope.
    const refScope = stepperContext.state.core.scope;
    const funcScope = C.findClosestFunctionScope(refScope);
    // Step until execution reach that scope's parent.
    await stepUntil(stepperContext, core => core.scope === funcScope.parent);
  }
  return stepperContext;
}

async function stepOver (stepperContext) {
  // Remember the current scope.
  const refScope = stepperContext.state.core.scope;
  // Take a first step.
  await executeSingleStep(stepperContext);
  // Step until out of the current statement but not inside a nested
  // function call.
  await stepUntil(stepperContext, core =>
    C.outOfCurrentStmt(core) && C.notInNestedCall(core.scope, refScope));
  // Step into the next statement.
  await stepUntil(stepperContext, C.intoNextStmt);
}

export async function performStep (stepperContext, mode) {
  switch (mode) {
    case 'run':
      await stepUntil(stepperContext, isStuck);
      break;
    case 'into':
      await stepInto(stepperContext);
      break;
    case 'expr':
      await stepExpr(stepperContext);
      break;
    case 'out':
      await stepOut(stepperContext);
      break;
    case 'over':
      await stepOver(stepperContext);
      break;
  }
}


function isStuck (core) {
  return !core.control;
}

function inUserCode (core) {
  return !!core.control.node[1].begin;
}

export class StepperError extends Error {
  constructor (condition, message) {
    super(message);
    this.name = this.constructor.name;
    this.condition = condition;
  }
}
