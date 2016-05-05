
import {takeLatest} from 'redux-saga';
import {take, put, call, select} from 'redux-saga/effects';
import * as C from 'persistent-c';

import Document from '../common/document';
import {asyncRequestJson} from '../common/api';

import {loadTranslated} from './translate';
import * as runtime from './runtime';

export default function (actions, selectors) {

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

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
    const source = yield select(selectors.getSource);
    const editor = source.get('editor');
    if (editor) {
      const stepper = yield select(selectors.getStepperState);
      const stepperState = stepper.get('display');
      const range = runtime.getNodeRange(stepperState);
      editor.setSelection(range);
    }
  }

  function* watchTranslate () {
    yield* takeLatest(actions.translate, translateSource);
  }

  function* translateSource (action) {
    const sourceState = yield select(selectors.getSource);
    const source = Document.toString(sourceState.get('document'));
    yield put({type: actions.translateStart, source});
    let response, result, error;
    try {
      response = yield call(asyncRequestJson, '/translate', {source});
      result = loadTranslated(source, response.ast);
    } catch (ex) {
      error = ex.toString();
    }
    let {diagnostics} = response;
    if (diagnostics) {
      // Sanitize the server-provided HTML.
      const el = document.createElement('div');
      el.innerHtml = `<pre>${diagnostics}</pre>`;
      diagnostics = {__html: el.innerHtml};
    }
    if (result) {
      yield put({type: actions.translateSucceeded, response, diagnostics});
    } else {
      yield put({type: actions.translateFailed, response, diagnostics, error});
      return;
    }
    try {
      const inputState = yield select(selectors.getInput);
      const input = Document.toString(inputState.get('document'));
      const stepperState = runtime.start(result.syntaxTree, {input});
      yield put({type: actions.stepperRestart, stepperState});
      yield call(updateSelection);
    } catch (error) {
      yield put({type: actions.error, source: 'translate', error});
    }
  }

  function* watchStepperStep () {
    while (true) {
      const action = yield take(actions.stepperStep);
      const stepper = yield select(selectors.getStepperState);
      if (stepper.get('state') === 'starting') {
        yield put({type: actions.stepperStart});
        const context = buildContext(stepper.get('current'));
        try {
          switch (action.mode) {
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
        yield put({type: actions.stepperIdle, context: viewContext(context)});
        yield call(updateSelection);
      }
    }
  }

  function* stepUntil (context, stopCond) {
    while (true) {
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
        yield put({type: actions.stepperProgress, context: viewContext(context)});
        yield call(updateSelection);
        // Yield until the next tick (XXX consider requestAnimationFrame).
        yield call(delay, 0);
        // Stop prematurely if interrupted.
        const interrupted = yield select(selectors.getStepperInterrupted);
        if (interrupted) {
          context.running = false;
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

  return [
    watchTranslate,
    watchStepperStep
  ];

};
