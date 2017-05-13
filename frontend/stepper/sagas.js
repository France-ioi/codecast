
import {delay} from 'redux-saga';
import {takeEvery, takeLatest, take, put, call, select, cancel, fork, race} from 'redux-saga/effects';
import * as C from 'persistent-c';
import Immutable from 'immutable';

import {buildStepperState} from './start';

export default function (bundle, deps) {

  bundle.use(
    'getStepperState', 'getStepperDisplay',
    'stepperTaskStarted', 'stepperTaskCancelled',
    'stepperRestart', 'stepperStep', 'stepperStarted', 'stepperProgress', 'stepperIdle', 'stepperExit', 'stepperUndo', 'stepperRedo',
    'stepperStackUp', 'stepperStackDown',
    'translateSucceeded', 'getTranslateState', 'translateClear',
    'getBufferModel', 'bufferHighlight', 'bufferReset', 'bufferEdit', 'bufferModelEdit', 'bufferModelSelect',
    'getOutputBufferModel', 'getNodeRange',
    'error', 'runEffects',
    'getArduinoInitialState'
  );

  bundle.addSaga(function* watchTranslateSucceeded () {
    /* Start the stepper when source code has been translated successfully. */
    yield takeLatest(deps.translateSucceeded, function* () {
      try {
        yield put({type: deps.stepperDisabled});
        const {syntaxTree, options} = yield select(deps.getStepperInit);
        options.arduino = yield select(deps.getArduinoInitialState);
        const stepperState = buildStepperState(syntaxTree, options);
        const runContext = {state: stepperState};
        yield call(stepIntoUserCode, runContext);
        yield put({type: deps.stepperEnabled, options});
        yield put({type: deps.stepperRestart, stepperState: runContext.state});
      } catch (error) {
        yield put({type: deps.error, source: 'stepper', error});
      }
    });
  });
  function* stepIntoUserCode (runContext) {
    while (true) {
      if (!(yield call(singleStep, runContext, inUserCode))) {
        break;
      }
    }
  }
  function inUserCode (core) {
    return !!core.control.node[1].begin;
  }

  /* The getStepperInit selector is also called in the player while computing
     all states. */
  bundle.defineSelector('getStepperInit', function (state) {
    const options = {};
    const ioPaneMode = state.get('ioPaneMode');
    if (ioPaneMode === 'terminal') {
      options.terminal = true;
    } else {
      const inputModel = deps.getBufferModel(state, 'input');
      options.input = inputModel.get('document').toString();
    }
    const syntaxTree = deps.getTranslateState(state).get('syntaxTree');
    return {syntaxTree, options};
  });

  bundle.defineAction('stepperEnabled', 'Stepper.Enabled');
  bundle.defineAction('stepperDisabled', 'Stepper.Disabled');
  bundle.addSaga(function* () {
    yield takeLatest(deps.stepperEnabled, function* enableStepper (action) {
      /* Start the new stepper task. */
      const newTask = yield fork(function* stepperRootSaga () {
        yield takeEvery(deps.stepperStep, onStepperStep);
        yield takeEvery(deps.stepperExit, onStepperExit);
        yield fork(reflectToSource);
        if (!action.options.terminal) {
          yield fork(reflectToOutput);
        }
      });
      yield put({type: deps.stepperTaskStarted, task: newTask});
    });
    yield takeLatest(deps.stepperDisabled, function* disableStepper () {
      /* Cancel the stepper task if still running. */
      const oldTask = yield select(state => state.stepperTask);
      if (oldTask) {
        yield cancel(oldTask);
        yield put({type: deps.stepperTaskCancelled});
      }
      /* Clear source highlighting. */
      const startPos = {row: 0, column: 0};
      yield put({type: deps.bufferHighlight, buffer: 'source', range: {start: startPos, end: startPos}});
    });
  });

  function* onStepperStep (action) {
    const {mode} = action;
    const stepper = yield select(deps.getStepperState);
    if (stepper.get('status') === 'starting') {
      yield put({type: deps.stepperStarted, mode});
      const runContext = buildRunContext(stepper.get('current'));
      try {
        switch (mode) {
          case 'into':
            yield call(stepInto, runContext);
            break;
          case 'expr':
            yield call(stepExpr, runContext);
            break;
          case 'out':
            yield call(stepOut, runContext);
            break;
          case 'over':
            yield call(stepOver, runContext);
            break;
        }
      } catch (error) {
        console.log(error); // XXX
      }
      yield put({type: deps.stepperIdle, context: viewRunContext(runContext)});
      console.log('idle');
    }
  }

  function* onStepperExit () {
    /* Disabled the stepper. */
    yield put({type: deps.stepperDisabled});
    /* Clear the translate state. */
    yield put({type: deps.translateClear});
  }

  function* reflectToSource () {
    /* Highlight the range of the current source fragment. */
    yield takeLatest([
      deps.stepperProgress, deps.stepperIdle, deps.stepperRestart,
      deps.stepperUndo, deps.stepperRedo,
      deps.stepperStackUp, deps.stepperStackDown
    ], function* (action) {
      const stepperState = yield select(deps.getStepperDisplay);
      const range = deps.getNodeRange(stepperState);
      yield put({type: deps.bufferHighlight, buffer: 'source', range});
    });
  }

  function* reflectToOutput () {
    /* Incrementally text produced by the stepper to the output buffer. */
    yield takeLatest([deps.stepperProgress, deps.stepperIdle], function* (action) {
      const stepperState = yield select(deps.getStepperDisplay);
      const outputModel = yield select(deps.getBufferModel, 'output');
      const oldSize = outputModel.get('document').size();
      const newSize = stepperState.output.length;
      if (oldSize !== newSize) {
        const outputDoc = outputModel.get('document');
        const endCursor = outputDoc.endCursor();
        const delta = {
          action: 'insert',
          start: endCursor,
          end: endCursor,
          lines: stepperState.output.substr(oldSize).split('\n')
        };
        /* Update the model to maintain length, new end cursor. */
        yield put({type: deps.bufferEdit, buffer: 'output', delta});
        const newEndCursor = yield select(state => deps.getBufferModel(state, 'output').get('document').endCursor());
        /* Send the delta to the editor to add the new output. */
        yield put({type: deps.bufferModelEdit, buffer: 'output', delta});
        /* Move the cursor to the end of the buffer. */
        yield put({type: deps.bufferModelSelect, buffer: 'output', selection: {start: newEndCursor, end: newEndCursor}});
      }
    });
    /* Reset the output document. */
    yield takeEvery([deps.stepperRestart, deps.stepperUndo, deps.stepperRedo], function* () {
      const model = yield select(deps.getOutputBufferModel);
      yield put({type: deps.bufferReset, buffer: 'output', model});
    });
  }

  /* A run-context is an object that is mutated as a saga steps through nodes.
     The context must never escape the saga, use viewRunContext to export the
     persistent bits.
   */
  function buildRunContext (state) {
    const startTime = window.performance.now();
    return {
      state: {
        ...state,
        core: C.clearMemoryLog(state.core),
        oldCore: state.core,
        controls: resetControls(state.controls)
      },
      startTime,
      timeLimit: startTime + 20,
      stepCounter: 0
    };
  }

  function viewRunContext (runContext) {
    // Returns a persistent view of the run-context.
    const {state, stepCounter} = runContext;
    return {state, stepCounter};
  }

  function resetControls (controls) {
    // Reset the controls before a step is started.
    return controls.setIn(['stack', 'focusDepth'], 0);
  }

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
      const now = window.performance.now();
      if (now >= runContext.timeLimit) {
        // Reset the time limit and put a Progress event.
        runContext.timeLimit = window.performance.now() + 20;
        yield put({type: deps.stepperProgress, context: viewRunContext(runContext)});
        // Yield until the next tick (XXX consider requestAnimationFrame).
        yield call(delay, 0);
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
        interrupted: false,
        retry: false
      };
      /* Run the effects to update the step-context. */
      yield call (deps.runEffects, stepContext, effects[Symbol.iterator]());
      if (stepContext.interrupted) {
        /* When interrupted, the effects are ignored. */
        runContext.interrupted = true;
        return false;
      }
      if (stepContext.retry) {
        /* Effects are retried on the updated state. */
        state = yield select(deps.getStepperDisplay);
        continue;
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
