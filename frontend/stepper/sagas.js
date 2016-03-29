
import {takeEvery} from 'redux-saga';
import {take, put, call, fork, select} from 'redux-saga/effects';
import * as C from 'persistent-c';

import {getStepperMode, getStepperState} from '../selectors';

export default function (actions) {

  function buildContext (state) {
    const startTime = window.performance.now();
    return {
      state,
      startTime,
      timeLimit: startTime + 20,
      stepCounter: 0,
      running: true,
      progress: false
    };
  }

  function viewContext (context) {
    // Returns a persistent view of the context.
    const {state, startTime, stepCounter, running} = context;
    const elapsed = window.performance.now() - context.startTime;
    return {state, elapsed, stepCounter};
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
    context.state = C.stepMicro(state);
    context.stepCounter += 1;
    return true;
  }

  function* stepUntil (context, stopCond) {
    while (singleStep(context, stopCond)) {
      if (context.progress) {
        context.progress = false;
        context.timeLimit = window.performance.now() + 20;
        yield put({type: actions.recordingScreenStepperProgress, context: viewContext(context)});
        const interrupted = yield select(getStepperInterrupted);
        if (interrupted) {
          context.running = false;
          break;
        }
      }
    }
  }

  function outOfCurrentStmt (state) {
    return state.direction === 'down' && state.control.seq === 'stmt';
  };

  function intoNextStmt (state) {
    return !/^(CompoundStmt|IfStmt|WhileStmt|DoStmt|ForStmt)$/.test(state.control.node[0]);
  };

  function intoNextExpr (state) {
    return state.direction === 'down' && state.control.seq;
  };

  function* watchStepperStep () {
    while (true) {
      const action = yield take(actions.recordingScreenStepperStep);
      const mode = yield select(getStepperMode);
      if (mode === 'starting') {
        yield put({type: actions.recordingScreenStepperStart});
        const stepperState = yield select(getStepperState);
        const context = buildContext(stepperState);
        switch (action.mode) {
          case 'into':
            // Step out of the current statement.
            yield call(stepUntil, context, outOfCurrentStmt);
            // Step into the next statement.
            yield call(stepUntil, context, intoNextStmt);
            break;
          case 'expr':
            // Take a single step unconditionally,
            context.state = C.stepMicro(context.state);
            // then stop when we enter the next expression.
            yield call(stepUntil, context, intoNextExpr);
            break;
        }
        yield put({type: actions.recordingScreenStepperIdle, context: viewContext(context)});
      }
    }
  }

  return [watchStepperStep];

};
