
import {take, put, call, select} from 'redux-saga/effects';
import * as C from 'persistent-c';

import {use, addSaga} from '../utils/linker';

import * as runtime from './runtime';

function delay(ms) {  // XXX move to utils
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

export default function* (deps) {

  yield use(
    'getStepperState', 'getStepperInterrupted', 'stepperInterrupted',
    'stepperRestart', 'stepperStep', 'stepperStart', 'stepperProgress', 'stepperIdle',
    'getSource', 'getInput', 'translateSucceeded'
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
      state: C.clearMemoryLog(state),
      startTime,
      timeLimit: startTime + 20,
      stepCounter: 0,
      running: true,
      effects: []
    };
  }

  function viewContext (context) {
    // Returns a persistent view of the context.
    const {state, startTime, stepCounter, running, effects} = context;
    const elapsed = window.performance.now() - context.startTime;
    return {state, elapsed, stepCounter, effects};
  }

  function singleStep (context, stopCond) {
    const {running, state} = context;
    if (!running || state.error || !state.control) {
      context.running = false;
      return false;
    }
    if (stopCond && stopCond(state)) {
      return false;
    }
    context.state = C.step(state, runtime.options);
    context.stepCounter += 1;
    return true;
  }

  function* updateSelection () {
    const source = yield select(deps.getSource);
    const editor = source.get('editor');
    if (editor) {
      const stepper = yield select(deps.getStepperState);
      const stepperState = stepper.get('display');
      const range = runtime.getNodeRange(stepperState);
      editor.setSelection(range);
    }
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
        if (!singleStep(context, stopCond)) {
          return;
        }
      }
      // Has the time limit for the current run passed?
      const now = window.performance.now();
      if (now >= context.timeLimit) {
        // Reset the time limit and put a Progress event.
        context.timeLimit = window.performance.now() + 20;
        yield put({type: deps.stepperProgress, context: viewContext(context)});
        yield call(updateSelection);
        // Yield until the next tick (XXX consider requestAnimationFrame).
        yield call(delay, 0);
        // Stop prematurely if interrupted.
        const interrupted = yield select(deps.getStepperInterrupted);
        if (interrupted) {
          yield put({type: deps.stepperInterrupted});
          context.interrupted = true;
          return;
        }
      }
    }
  }

  function* stepInto (context) {
    // Take a first step.
    if (singleStep(context)) {
      // Step out of the current statement.
      yield call(stepUntil, context, C.outOfCurrentStmt);
      // Step into the next statement.
      yield call(stepUntil, context, C.intoNextStmt);
    }
  }

  function* stepExpr (context) {
    // Take a first step.
    if (singleStep(context)) {
      // then stop when we enter the next expression.
      yield call(stepUntil, context, state => (
        C.intoNextExpr(state) || state.control.return));
    }
  }

  function* stepOut (context) {
    // The program must be running.
    if (!context.state.control) {
      return;
    }
    // If stopped on a return, take a single step.
    if (context.state.control.return) {
      if (!singleStep(context)) {
        return;
      }
    }
    // Find the closest return continuation.
    const refReturn = findNextReturn(context);
    // Step until that continuation is reached.
    yield call(stepUntil, context, state => state.control === refReturn);
  }

  function findNextReturn (context) {
    let control = context.state.control;
    while (control && !control.return) {
      control = control.cont;
    }
    return control;
  }

  function* stepOver (context) {
    // Remember the current scope.
    const refScope = context.state.scope;
    // Take a first step.
    if (singleStep(context)) {
      // Step until out of the current statement but not inside a nested
      // function call.
      yield call(stepUntil, context, state =>
        notInNestedCall(state.scope, refScope) && C.outOfCurrentStmt(state));
      // Step into the next statement.
      yield call(stepUntil, context, C.intoNextStmt);
    }
  }

  function notInNestedCall (scope, refScope) {
    while (scope.key >= refScope.key) {
      if (scope.kind === 'function') {
        return false;
      }
      scope = scope.parent;
    }
    return true;
  }

  function* startStepper (mode) {
    const stepper = yield select(deps.getStepperState);
    if (stepper.get('state') === 'starting') {
      yield put({type: deps.stepperStart});
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
      yield call(updateSelection);
    }
  }

  yield addSaga(function* watchTranslateSucceeded () {
    while (true) {
      const {syntaxTree} = yield take(deps.translateSucceeded);
      try {
        const inputState = yield select(deps.getInput);
        const input = Document.toString(inputState.get('document'));
        const stepperState = runtime.start(syntaxTree, {input});
        yield put({type: deps.stepperRestart, stepperState});
        yield call(updateSelection);
      } catch (error) {
        yield put({type: deps.error, source: 'translate', error});
      }
    }
  });

  yield addSaga(function* watchStepperStep () {
    while (true) {
      const {mode} = yield take(deps.stepperStep);
      yield call(startStepper, mode);
    }
  });

};
