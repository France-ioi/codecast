
import {delay} from 'redux-saga';
import {takeEvery, takeLatest, take, put, call, select, cancel, fork, race} from 'redux-saga/effects';
import * as C from 'persistent-c';
import Immutable from 'immutable';

import Document from '../buffers/document';
import * as runtime from './runtime';

export default function (bundle, deps) {

  bundle.use(
    'getStepperState', 'getStepperDisplay', 'getStepperInterrupted',
    'stepperTaskStarted', 'stepperTaskCancelled',
    'stepperInterrupted',
    'stepperRestart', 'stepperStep', 'stepperStarted', 'stepperProgress', 'stepperIdle', 'stepperExit', 'stepperUndo', 'stepperRedo',
    'stepperStackUp', 'stepperStackDown', 'stepperInterrupt',
    'translateSucceeded', 'getTranslateState', 'translateClear',
    'getInputModel', 'sourceHighlight', 'terminalFocus', 'terminalInputNeeded',
    'error'
  );

  /* XXX Use a different terminology for the stepper context (just below)
         and the recorder context ({audioContext, worker, scriptProcessor}).
     A context is an object that is mutated as a saga steps through nodes.
     The context must never escape the saga, use viewContext to export the
     persistent bits.
   */
  function buildContext (state) {
    const startTime = window.performance.now();
    return {
      state: {
        ...state,
        core: C.clearMemoryLog(state.core),
        controls: resetControls(state.controls)
      },
      startTime,
      timeLimit: startTime + 20,
      stepCounter: 0,
      running: true
    };
  }

  function resetControls (controls) {
    // Reset the controls before a step is started.
    return controls.setIn(['stack', 'focusDepth'], 0);
  }

  function viewContext (context) {
    // Returns a persistent view of the context.
    const {state, stepCounter} = context;
    return {state, stepCounter};
  }

  function* singleStep (context, stopCond) {
    let {running, state} = context;
    if (!running || state.error || !state.core.control) {
      return false;
    }
    if (stopCond && stopCond(state.core)) {
      return false;
    }
    let newState = runtime.step(state);
    if (newState.isWaitingOnInput) {
      /* Execution of the step could not complete and newState must not be used. */
      newState = null;
      /* Dispatch a progress action so the display shows the blocking step. */
      yield put({type: deps.stepperProgress, context: viewContext(context)});
      do {
        /* Block until more input is made available before retrying. */
        yield call(waitForInput, context);
        if (context.interrupted) {
          /* If interrupted while waiting, abort the step.
             Interactive input (added to context.state) is preserved. */
          return false;
        }
        /* Retry the blocking step using the updated state. */
        newState = runtime.step(context.state);
      } while (newState.isWaitingOnInput);
    }
    context.state = newState;
    context.stepCounter += 1;
    return true;
  }

  function* stepUntil (context, stopCond) {
    while (true) {
      // If interrupted, override the stop condition.
      if (context.interrupted) {
        stopCond = C.intoNextExpr;
      }
      // Execute up to 100 steps, or until the stop condition (or end of the
      // program, or an error condition) is met.
      for (let stepCount = 100; stepCount !== 0; stepCount -= 1) {
        if (!(yield call(singleStep, context, stopCond))) {
          context.running = false;
          return;
        }
      }
      // Has the time limit for the current run passed?
      const now = window.performance.now();
      if (now >= context.timeLimit) {
        // Reset the time limit and put a Progress event.
        context.timeLimit = window.performance.now() + 20;
        yield put({type: deps.stepperProgress, context: viewContext(context)});
        // Yield until the next tick (XXX consider requestAnimationFrame).
        yield call(delay, 0);
        // Stop prematurely if interrupted.
        const interrupted = yield select(deps.getStepperInterrupted);
        if (interrupted) {
          yield put({type: deps.stepperInterrupted});
          context.running = false;
          context.interrupted = true;
          return;
        }
      }
    }
  }

  function* stepExpr (context) {
    // Take a first step.
    if (yield call(singleStep, context)) {
      // then stop when we enter the next expression.
      yield call(stepUntil, context, core => C.intoNextExpr(core));
    }
  }

  function* stepInto (context) {
    // Take a first step.
    if (yield call(singleStep, context)) {
      // Step out of the current statement.
      yield call(stepUntil, context, C.outOfCurrentStmt);
      // Step into the next statement.
      yield call(stepUntil, context, C.intoNextStmt);
    }
  }

  function* stepOut (context) {
    // The program must be running.
    if (!context.state.core.control) {
      return;
    }
    // Find the closest function scope.
    const refScope = context.state.core.scope;
    const funcScope = C.findClosestFunctionScope(refScope);
    // Step until execution reach that scope's parent.
    yield call(stepUntil, context, core => core.scope === funcScope.parent);
  }

  function* stepOver (context) {
    // Remember the current scope.
    const refScope = context.state.core.scope;
    // Take a first step.
    if (yield call(singleStep, context)) {
      // Step until out of the current statement but not inside a nested
      // function call.
      yield call(stepUntil, context, core =>
        C.outOfCurrentStmt(core) && C.notInNestedCall(core.scope, refScope));
      // Step into the next statement.
      yield call(stepUntil, context, C.intoNextStmt);
    }
  }

  function* startStepper (mode) {
    const stepper = yield select(deps.getStepperState);
    if (stepper.get('status') === 'starting') {
      yield put({type: deps.stepperStarted, mode});
      const context = buildContext(stepper.get('current'));
      try {
        switch (mode) {
          case 'into':
            yield call(stepInto, context);
            break;
          case 'expr':
            yield call(stepExpr, context);
            break;
          case 'out':
            yield call(stepOut, context);
            break;
          case 'over':
            yield call(stepOver, context);
            break;
        }
      } catch (error) {
        console.log(error); // XXX
      }
      yield put({type: deps.stepperIdle, context: viewContext(context)});
    }
  }

  bundle.use('terminalInputEnter');
  function* waitForInput (context) {
    /* Set the isWaitingOnInput flag on the state. */
    yield put({type: deps.terminalInputNeeded});
    /* Transfer focus to the terminal. */
    yield put({type: deps.terminalFocus});
    const {inputEntered, interrupted} = yield (race({
      inputEntered: take(deps.terminalInputEnter),
      interrupted: take(deps.stepperInterrupt)
    }));
    if (inputEntered) {
      /* Use selector to update context.state from stepper state */
      context.state = yield select(deps.getStepperDisplay);
    } else {
      yield put({type: deps.stepperInterrupted});
      context.interrupted = true;
    }
  }

  bundle.addSaga(function* watchTranslateSucceeded () {
    // Start the stepper when source code has been translated successfully.
    yield takeLatest(deps.translateSucceeded, function* () {
      try {
        yield put({type: deps.stepperDisabled});
        // Get the syntax tree from the store so that we get the version where
        // each node has a range attribute.
        const translate = yield select(deps.getTranslateState);
        const inputModel = yield select(deps.getInputModel);
        const input = Document.toString(inputModel.get('document'));
        const stepperState = runtime.start(translate.get('syntaxTree'), {input});
        stepperState.controls = Immutable.Map({stack: Immutable.Map({focusDepth: 0})});
        yield put({type: deps.stepperRestart, stepperState});
        yield put({type: deps.stepperEnabled});
      } catch (error) {
        yield put({type: deps.error, source: 'stepper', error});
      }
    });
  });

  bundle.defineAction('stepperEnabled', 'Stepper.Enabled');
  bundle.defineAction('stepperDisabled', 'Stepper.Disabled');
  bundle.addSaga(function* () {
    yield takeLatest(deps.stepperEnabled, enableStepper);
    yield takeLatest(deps.stepperDisabled, disableStepper);
  });
  function* enableStepper () {
    /* Start the new stepper task. */
    const newTask = yield fork(function* stepperRootSaga () {
      yield takeEvery(deps.stepperStep, onStepperStep);
      yield takeEvery(deps.stepperExit, onStepperExit);
    });
    yield put({type: deps.stepperTaskStarted, task: newTask});
  }
  function* disableStepper () {
    /* Cancel the stepper task if still running. */
    const oldTask = yield select(state => state.stepperTask);
    if (oldTask) {
      yield cancel(oldTask);
      yield put({type: deps.stepperTaskCancelled});
    }
  }

  bundle.addSaga(function* watchStepperActions () {
    // This saga updates the highlighting of the active source code.
    while (true) {
      yield take([
        deps.stepperProgress, deps.stepperIdle, deps.stepperRestart,
        deps.stepperUndo, deps.stepperRedo,
        deps.stepperStackUp, deps.stepperStackDown,
        deps.translateClear
      ]);
      const stepperState = yield select(deps.getStepperDisplay);
      const range = runtime.getNodeRange(stepperState);
      yield put({type: deps.sourceHighlight, range});
    }
  });


  function* onStepperStep (action) {
    yield call(startStepper, action.mode);
  }

  function* onStepperExit () {
    /* Cancel the stepper task. */
    const stepperTask = yield select(state => state.get('stepperTask'));
    yield cancel(stepperTask);
    yield put({type: deps.stepperTaskCancelled});
    /* Clear the translate state when the stepper is exited. */
    yield put({type: deps.translateClear});
  }

};
