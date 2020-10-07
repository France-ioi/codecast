/*

  Extensibility API for the C stepper.

  CONSIDER: The only remaining distinction between effects and builtins is that
  they live in different namespaces.  They could be merged.

*/

import * as C from 'persistent-c';
import {all, call, put} from 'redux-saga/effects';
import sleep from '../utils/sleep';
import {getNewOutput, getNewTerminal} from "./python";

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
  const { platform } = globalState.get('options');

  /*
   * Call all the init callbacks. Pass the global state so the player can
   * build stepper states without having to install the pre-computed state
   * into the store.
   */
  const stepperState = {
    platform
  };
  for (var callback of initCallbacks) {
    callback(stepperState, globalState);
  }
  /* Run until in user code */
  const stepperContext = {
    state: stepperState,
    interact
  };

  switch (platform) {
    case 'python':
      return stepperContext.state;

    default:
      while (!inUserCode(stepperContext.state)) {
        /* Mutate the stepper context to advance execution by a single step. */
        const effects = C.step(stepperContext.state.programState);
        if (effects) {
          await executeEffects(stepperContext, effects[Symbol.iterator]());
        }
      }
      return stepperContext.state;
  }

  function interact ({saga}) {
    console.log('int5');
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

/* An effect is a generator that may alter the stepperContext/state/programState, and
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

function getNodeStartRow (state) {
  if (!state) {
    return undefined;
  }
  const {control} = state.programState;
  if (!control || !control.node) {
    return undefined;
  }
  const {range} = control.node[1];
  return range && range.start.row;
}

export function makeContext (state, interact) {
  console.log('**********  MAKE CONTEXT  **********', state);

  switch (state.platform) {
    case 'python':
      return {
        state: {
          ...state,
          lastAnalysis: state.analysis,
          controls: resetControls(state.controls)
        },
        interact,
        position: getNodeStartRow(state),
        lineCounter: 0
      };
    default:
      return {
        state: {
          ...state,
          programState: C.clearMemoryLog(state.programState),
          lastProgramState: state.programState,
          controls: resetControls(state.controls)
        },
        interact,
        position: getNodeStartRow(state),
        lineCounter: 0
      };
  }
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
      lastResult = await stepperContext.interact(value[1] || {});
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
  if (isStuck(stepperContext.state)) {
    throw new StepperError('stuck', 'execution cannot proceed');
  }

  if (stepperContext.state.platform === 'python') {
    console.log('EXECUTE STEP HERE', stepperContext.state);

    window.currentPythonRunner._input = stepperContext.state.input;
    window.currentPythonRunner._inputPos = stepperContext.state.inputPos;
    window.currentPythonRunner._terminal = stepperContext.state.terminal;
    window.currentPythonRunner._interact = stepperContext.interact;

    await window.currentPythonRunner.runStep();

    /**
     * In player mode, empty _futureInputValue after it has been used.
     */
    if (window.currentPythonRunner._futureInputValue && window.currentPythonRunner._futureInputValue.value) {
      window.currentPythonRunner._futureInputValue = null;
    }

    const newOutput = getNewOutput(stepperContext.state, window.currentPythonRunner._printedDuringStep);
    const newInput = window.currentPythonRunner._input;
    const newInputPos = window.currentPythonRunner._inputPos;

    // Warning : The interact event retrieves the state from the global state again.
    // It means : we need to pass the changes so it can update it.
    await stepperContext.interact({
      position: 0, // TODO: Need real position ?
      output: newOutput,
      //terminal: newTerminal,
      inputPos: newInputPos,
      input: newInput
    });

    const newTerminal = getNewTerminal(window.currentPythonRunner._terminal, window.currentPythonRunner._printedDuringStep);
    window.currentPythonRunner._terminal = newTerminal;

    // Put the output and terminal again so it works with the replay too.
    stepperContext.state.output = newOutput;
    stepperContext.state.inputPos = window.currentPythonRunner._inputPos;

    stepperContext.state.terminal = newTerminal;
  } else {
    const effects = C.step(stepperContext.state.programState);
    await executeEffects(stepperContext, effects[Symbol.iterator]());

    /* Update the current position in source code. */
    const position = getNodeStartRow(stepperContext.state);
    if (position !== undefined && position !== stepperContext.position) {
      stepperContext.position = position;
      stepperContext.lineCounter += 1;

      if (stepperContext.lineCounter === 20) {
        await stepperContext.interact({
          position
        });

        stepperContext.lineCounter = 0;
      }
    }
  }
}

async function stepUntil(stepperContext, stopCond = undefined) {
  let stop = false;
  while (true) {
    if (isStuck(stepperContext.state)) {
      return;
    }
    if (!stop && stopCond) {
      if (stepperContext.state.platform === 'python') {
        if (stopCond(stepperContext.state)) {
          stop = true;
        }
      } else {
          if (stopCond(stepperContext.state.programState)) {
            stop = true;
          }
        }
    }

    if (stop && inUserCode(stepperContext.state)) {
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

  if (stepperContext.state.platform === 'unix' || stepperContext.state.platform === 'arduino') {
    // Step out of the current statement.
    await stepUntil(stepperContext, C.outOfCurrentStmt);
    // Step into the next statement.
    await stepUntil(stepperContext, C.intoNextStmt);
  }
}

async function stepOut (stepperContext) {
  // The program must be running.
  if (!isStuck(stepperContext.state)) {
    if (stepperContext.state.platform === 'python') {
      const nbSuspensions = stepperContext.state.suspensions.length;

      // Take a first step.
      await executeSingleStep(stepperContext);

      // The number of suspensions represents the number of layers of functions called.
      // We want it to be less, which means be got out of at least one level of function.
      await stepUntil(stepperContext, curState => {
        console.log(curState.suspensions.length, nbSuspensions);
        return (curState.suspensions.length < nbSuspensions);
      });
    } else {
      // Find the closest function scope.
      const refScope = stepperContext.state.programState.scope;
      const funcScope = C.findClosestFunctionScope(refScope);
      // Step until execution reach that scope's parent.
      await stepUntil(stepperContext, programState => programState.scope === funcScope.parent);
    }
  }

  return stepperContext;
}

async function stepOver (stepperContext) {
  if (stepperContext.state.platform === 'python') {
    if (stepperContext.state.suspensions) {
      const nbSuspensions = stepperContext.state.suspensions.length;

      // Take a first step.
      await executeSingleStep(stepperContext);

      // The number of suspensions represents the number of layers of functions called.
      // We want to be at the same number or less, not inside a new function.
      await stepUntil(stepperContext, curState => {
        return (curState.suspensions.length <= nbSuspensions);
      });
    } else {
      // The program hasn't started yet, just execute a step.
      await executeSingleStep(stepperContext);
    }
  } else {
    // Remember the current scope.
    const refCurrentScope = stepperContext.state.programState.scope;

    // Take a first step.
    await executeSingleStep(stepperContext);

    // Step until out of the current statement but not inside a nested
    // function call.
    await stepUntil(stepperContext, programState =>
        C.outOfCurrentStmt(programState) && C.notInNestedCall(programState.scope, refCurrentScope));

    // Step into the next statement.
    await stepUntil(stepperContext, C.intoNextStmt);
  }
}

export async function performStep (stepperContext, mode) {
  switch (mode) {
    case 'run':
      await stepUntil(stepperContext);
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


function isStuck (state) {
  if (state.platform === 'python') {
    return state.analysis.isFinished;
  } else {
    return !state.programState.control;
  }
}

function inUserCode (state) {
  if (state.platform === 'python') {
    return true;
  } else {
    return !!state.programState.control.node[1].begin;
  }
}

export class StepperError extends Error {
  constructor (condition, message) {
    super(message);
    this.name = this.constructor.name;
    this.condition = condition;
  }
}
