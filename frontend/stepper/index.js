/*

The stepper's state has the following shape:

  {
    status: /clear|idle|starting|running/,
    mode: /expr|into|out|over/,
    initial: StepperState,
    current: StepperState,
    undo: List<StepperState>,
    redo: List<StepperState>,
  }

  The 'initial' state is the one restored by a 'restart' action.
  The 'current' state is the state from which the step* actions start,
  and also the state to be displayed to the user.

*/

import {delay} from 'redux-saga';
import {takeEvery, takeLatest, take, put, call, select, cancel, fork, race} from 'redux-saga/effects';
import Immutable from 'immutable';
import * as C from 'persistent-c';

import {default as ApiBundle, buildState, makeContext, rootStepperSaga, performStep, StepperError} from './api';
import ControlsBundle from './controls';
import TranslateBundle from './translate';
import EffectsBundle from './effects';

import DelayBundle from './delay';
import HeapBundle from './heap';
import IoBundle from './io/index';
import ViewsBundle from './views/index';

/* TODO: clean-up */
import {analyseState, collectDirectives} from './analysis';

export default function (bundle) {

  bundle.include(ApiBundle);
  bundle.include(ControlsBundle);
  bundle.include(TranslateBundle);
  bundle.include(EffectsBundle);
  bundle.include(DelayBundle);
  bundle.include(HeapBundle);
  bundle.include(IoBundle);
  bundle.include(ViewsBundle);

  bundle.addReducer('init', initReducer);

  /* Sent when the stepper task is started */
  bundle.defineAction('stepperTaskStarted', 'Stepper.Task.Started');
  bundle.addReducer('stepperTaskStarted', stepperTaskStartedReducer);

  /* Sent when the stepper task is cancelled */
  bundle.defineAction('stepperTaskCancelled', 'Stepper.Task.Cancelled');
  bundle.addReducer('stepperTaskCancelled', stepperTaskCancelledReducer);

  // Sent when the stepper's state is initialized.
  bundle.defineAction('stepperRestart', 'Stepper.Restart');
  bundle.addReducer('stepperRestart', stepperRestartReducer);

  // Restore a saved or computed state.
  bundle.defineAction('stepperReset', 'Stepper.Reset');
  bundle.addReducer('stepperReset', stepperResetReducer);

  // Sent when the user requested stepping in a given mode.
  bundle.defineAction('stepperStep', 'Stepper.Step');
  bundle.addReducer('stepperStep', stepperStepReducer);

  // Sent when the stepper has started evaluating a step.
  bundle.defineAction('stepperStarted', 'Stepper.Start');
  bundle.addReducer('stepperStarted', stepperStartedReducer);

  bundle.defineAction('stepperInteract', 'Stepper.Interact');

  // Sent when the stepper has been evaluating for a while without completing a step.
  bundle.defineAction('stepperProgress', 'Stepper.Progress');
  bundle.addReducer('stepperProgress', stepperProgressReducer);

  // Sent when the stepper has completed a step and is idle again.
  bundle.defineAction('stepperIdle', 'Stepper.Idle');
  bundle.addReducer('stepperIdle', stepperIdleReducer);

  // Sent when the user exits the stepper.
  bundle.defineAction('stepperExit', 'Stepper.Exit');
  bundle.addReducer('stepperExit', stepperExitReducer);

  // Sent when the user interrupts the stepper.
  bundle.defineAction('stepperInterrupt', 'Stepper.Interrupt');
  bundle.addReducer('stepperInterrupt', stepperInterruptReducer);

  bundle.defineAction('stepperInterrupted', 'Stepper.Interrupted');
  bundle.addReducer('stepperInterrupted', stepperInterruptedReducer);

  bundle.defineSelector('isStepperInterrupting', function (state) {
    return state.getIn(['stepper', 'interrupting'], false);
  });

  bundle.defineAction('stepperUndo', 'Stepper.Undo');
  bundle.addReducer('stepperUndo', stepperUndoReducer);

  bundle.defineAction('stepperRedo', 'Stepper.Redo');
  bundle.addReducer('stepperRedo', stepperRedoReducer);

  bundle.defineAction('stepperConfigure', 'Stepper.Configure');
  bundle.addReducer('stepperConfigure', stepperConfigureReducer);

  /* BEGIN view stuff to move out of here */

  bundle.defineAction('stepperStackUp', 'Stepper.Stack.Up');
  bundle.addReducer('stepperStackUp', stepperStackUpReducer);

  bundle.defineAction('stepperStackDown', 'Stepper.Stack.Down');
  bundle.addReducer('stepperStackDown', stepperStackDownReducer);

  bundle.defineAction('stepperViewControlsChanged', 'Stepper.View.ControlsChanged');
  bundle.addReducer('stepperViewControlsChanged', stepperViewControlsChangedReducer);

  /* END view stuff to move out of here */

  bundle.defineSelector('getStepperState', getStepperState);
  bundle.defineSelector('getStepperDisplay', getStepperDisplay);

  bundle.defineAction('stepperEnabled', 'Stepper.Enabled');
  bundle.defineAction('stepperDisabled', 'Stepper.Disabled');

  bundle.addSaga(stepperSaga);

  bundle.defer(postLink);

};

function getStepperState (state) {
  return state.get('stepper')
}

function getStepperDisplay (state) {
  return state.getIn(['stepper', 'current']);
}

function enrichStepperState (stepperState) {
  stepperState = {...stepperState};
  if (!('controls' in stepperState)) {
    stepperState.controls = Immutable.Map();
  }
  const {core, controls} = stepperState;
  if (!core) {
    return stepperState;
  }
  /* TODO: extend stepper API to add enrichers that run here */
  const analysis = stepperState.analysis = analyseState(core);
  const focusDepth = controls.getIn(['stack', 'focusDepth'], 0);
  stepperState.directives = collectDirectives(analysis.frames, focusDepth);
  // TODO? initialize controls for each directive added,
  //       clear controls for each directive removed (except 'stack').
  return stepperState;
};

function stepperClear (state) {
  return Immutable.Map({
    status: 'clear',
    undo: Immutable.List(),
    redo: Immutable.List()
  });
}

function getNodeRange (state) {
  if (!state) {
    return null;
  }
  const {control} = state.core;
  if (!control || !control.node) {
    return null;
  }
  const focusDepth = state.controls.getIn(['stack','focusDepth'], 0);
  if (focusDepth === 0) {
    return control.node[1].range;
  } else {
    const {frames} = state.analysis;
    const frame = frames.get(frames.size - focusDepth);
    return frame.get('scope').cont.node[1].range;
  }
}

function stringifyError (error) {
  if (process.env.NODE_ENV === 'production') {
    return error.toString();
  }
  if (error.stack) {
    return error.stack.toString();
  }
  return JSON.stringify(error);
}

/* Reducers */

function initReducer (state, _action) {
  return state.set('stepper', stepperClear());
}

function stepperRestartReducer (state, action) {
  let stepperState = action.stepperState;
  if (stepperState) {
    stepperState = enrichStepperState(stepperState);
  } else {
    stepperState = state.getIn(['stepper', 'initial']);
  }
  return state.set('stepper', Immutable.Map({
    status: 'idle',
    initial: stepperState,
    current: stepperState,
    undo: state.getIn(['stepper', 'undo']), /* preserve undo stack */
    redo: Immutable.List()
  }));
}

function stepperTaskStartedReducer (state, {payload: {task}}) {
  return state.set('stepperTask', task);
}

function stepperTaskCancelledReducer (state, _action) {
  return state.set('stepperTask', null);
}

function stepperResetReducer (state, {payload: {stepperState}}) {
  return state.set('stepper', stepperState);
}

function stepperStepReducer (state, action) {
  /* No check for 'idle' status, the player must be able to step while
     the status is 'running'. */
  return state.setIn(['stepper', 'status'], 'starting');
}

function stepperStartedReducer (state, action) {
  return state.update('stepper', stepper => stepper
    .set('status', 'running')
    .set('mode', action.mode)
    .set('redo', Immutable.List())
    .update('undo', undo => undo.unshift(stepper.get('current'))));
}

function stepperProgressReducer (state, action) {
  // Set new current state and go back to idle.
  const stepperState = enrichStepperState(action.context.state);
  return state.update('stepper', stepper => stepper
    .set('current', stepperState));
}

function stepperIdleReducer (state, action) {
  // Set new current state and go back to idle.
  /* XXX Call enrichStepperState prior to calling the reducer. */
  const stepperState = enrichStepperState(action.context.state);
  return state.update('stepper', stepper => stepper
    .set('current', stepperState)
    .set('status', 'idle')
    .delete('mode'));
}

function stepperExitReducer (state, action) {
  return state.update('stepper', st => stepperClear());
}

function stepperInterruptReducer (state, action) {
  // Cannot interrupt while idle.
  if (state.getIn(['stepper', 'status']) === 'idle') {
    return state;
  }
  return state.setIn(['stepper', 'interrupting'], true);
}

function stepperInterruptedReducer (state, action) {
  return state.setIn(['stepper', 'interrupting'], false);
}

function stepperUndoReducer (state, action) {
  return state.update('stepper', function (stepper) {
    const undo = stepper.get('undo');
    if (undo.isEmpty()) {
      return state;
    }
    const current = stepper.get('current');
    const stepperState = undo.first();
    return stepper
      .set('current', stepperState)
      .set('undo', undo.shift())
      .set('redo', stepper.get('redo').unshift(current));
  });
}

function stepperRedoReducer (state, action) {
  return state.update('stepper', function (stepper) {
    const redo = stepper.get('redo');
    if (redo.isEmpty()) {
      return stepper;
    }
    const stepperState = redo.first();
    const current = stepper.get('current');
    return stepper
      .set('current', stepperState)
      .set('redo', redo.shift())
      .set('undo', stepper.get('undo').unshift(current));
  });
}

function stepperConfigureReducer (state, action) {
  const {options} = action;
  return state.set('stepper.options', Immutable.Map(options));
}

function stepperStackUpReducer (state, action) {
  return state.updateIn(['stepper', 'current'], function (stepperState) {
    let {controls, analysis} = stepperState;
    let focusDepth = controls.getIn(['stack', 'focusDepth']);
    if (focusDepth > 0) {
      focusDepth -= 1;
      controls = controls.setIn(['stack', 'focusDepth'], focusDepth);
      const directives = collectDirectives(analysis.frames, focusDepth);
      stepperState = {...stepperState, controls, directives};
    }
    return stepperState;
  });
}

function stepperStackDownReducer (state, action) {
  return state.updateIn(['stepper', 'current'], function (stepperState) {
    let {controls, analysis} = stepperState;
    const stackDepth = analysis.frames.size;
    let focusDepth = controls.getIn(['stack', 'focusDepth']);
    if (focusDepth + 1 < stackDepth) {
      focusDepth += 1;
      controls = controls.setIn(['stack', 'focusDepth'], focusDepth);
      const directives = collectDirectives(analysis.frames, focusDepth);
      stepperState = {...stepperState, controls, directives};
    }
    return stepperState;
  });
}

function stepperViewControlsChangedReducer (state, action) {
  const {key, update} = action;
  return state.updateIn(['stepper', 'current'], function (stepperState) {
    let {controls} = stepperState;
    if (controls.has(key)) {
      controls = controls.update(key, function (viewControls) {
        // Do not use viewControls.merge as it applies Immutable.fromJS
        // to all values.
        Object.keys(update).forEach(function (name) {
          viewControls = viewControls.set(name, update[name]);
        });
        return viewControls;
      });
    } else {
      controls = controls.set(key, Immutable.Map(update));
    }
    return {...stepperState, controls};
  });
}

/* saga */

function* translateSucceededSaga () {
  const actionTypes = yield select(state => state.get('actionTypes'));
  try {
    yield put({type: actionTypes.stepperDisabled});
    /* Build the stepper state. This automatically runs into user source code. */
    const globalState = yield select(st => st);
    const stepperState = yield call(buildState, globalState);
    /* Enable the stepper */
    yield put({type: actionTypes.stepperEnabled});
    yield put({type: actionTypes.stepperRestart, stepperState});
  } catch (error) {
    yield put({type: actionTypes.error, payload: {source: 'stepper', error}});
  }
}

function* recorderStoppingSaga () {
  const actionTypes = yield select(state => state.get('actionTypes'));
  /* Disable the stepper when recording stops. */
  yield put({type: actionTypes.stepperInterrupt});
  yield put({type: actionTypes.stepperDisabled});
}

function* stepperEnabledSaga ({dispatch}, action) {
  const actionTypes = yield select(state => state.get('actionTypes'));
  /* Start the new stepper task. */
  const newTask = yield fork(rootStepperSaga, dispatch);
  yield put({type: actionTypes.stepperTaskStarted, payload: {task: newTask}});
}

function* stepperDisabledSaga () {
  const actionTypes = yield select(state => state.get('actionTypes'));
  /* Cancel the stepper task if still running. */
  const oldTask = yield select(state => state.stepperTask);
  if (oldTask) {
    yield cancel(oldTask);
    yield put({type: actionTypes.stepperTaskCancelled});
  }
  /* Clear source highlighting. */
  const startPos = {row: 0, column: 0};
  yield put({type: actionTypes.bufferHighlight, buffer: 'source', range: {start: startPos, end: startPos}});
}

function* stepperInteractSaga ({payload: {context, saga, args}, meta: {resolve, reject}}) {
  const {stepperProgress, stepperInterrupt} = yield select(state => state.get('actionTypes'));
  /* Has the stepper been interrupted? */
  if (yield select(state => state.get('scope').isStepperInterrupting(state))) {
    yield call(reject, new StepperError(context, 'interrupt', 'interrupted'));
    return;
  }
  /* Emit a progress action so that an up-to-date state gets displayed. */
  yield put({type: stepperProgress, context});
  /* Run the provided saga if any, or wait until next animation frame. */
  const {completed, interrupted} = yield (race({
    completed: call(saga || stepperWaitSaga, context, ...args),
    interrupted: take(stepperInterrupt)
  }));
  /* Update context.state from the global state to avoid discarding the effects
     of user interaction. */
  context.state = yield select(state => state.get('scope').getStepperDisplay(state));
  /* Check whether to interrupt or resume the stepper. */
  if (interrupted) {
    yield call(reject, new StepperError(context, 'interrupt', 'interrupted'));
  } else {
    /* Continue stepper execution, passing the saga's return value as the
       result of yielding the interact effect. */
    yield call(resolve, completed);
  }
}

function* stepperWaitSaga () {
  // Yield until the next tick (XXX use requestAnimationFrame through channel).
  yield call(delay, 0);
}

function* stepperStepSaga (dispatch, action) {
  const actionTypes = yield select(state => state.get('actionTypes'));
  const {mode} = action;
  const stepper = yield select(getStepperState);
  if (stepper.get('status') === 'starting') {
    yield put({type: actionTypes.stepperStarted, mode});
    let context = makeContext(stepper.get('current'), interact);
    try {
      context = yield call(performStep, context, mode);
    } catch (ex) {
      if (!(ex instanceof StepperError)) {
        ex = new StepperError(context, 'error', stringifyError(ex));
      }
      context = ex.context;
      if (ex.condition === 'interrupt') {
        context.interrupted = true;
        yield put({type: actionTypes.stepperInterrupted});
      }
      if (ex.condition === 'error') {
        context.state.error = ex.message;
      }
    }
    yield put({type: actionTypes.stepperIdle, context});
  }
  function interact (saga, ...args) {
    return new Promise((resolve, reject) => {
      dispatch({
        type: actionTypes.stepperInteract,
        payload: {context: this, saga, args},
        meta: {resolve, reject}
      });
    });
  }
}

function* stepperExitSaga () {
  const actionTypes = yield select(state => state.get('actionTypes'));
  /* Disabled the stepper. */
  yield put({type: actionTypes.stepperDisabled});
  /* Clear the translate state. */
  yield put({type: actionTypes.translateClear});
}

function* updateSourceHighlightSaga () {
  const actionTypes = yield select(state => state.get('actionTypes'));
  const stepperState = yield select(getStepperDisplay);
  const range = getNodeRange(stepperState);
  yield put({type: actionTypes.bufferHighlight, buffer: 'source', range});
}

function* stepperSaga (args) {
  const actionTypes = yield select(state => state.get('actionTypes'));
  yield takeLatest(actionTypes.translateSucceeded, translateSucceededSaga);
  yield takeLatest(actionTypes.recorderStopping, recorderStoppingSaga);
  yield takeLatest(actionTypes.stepperEnabled, stepperEnabledSaga, args);
  yield takeLatest(actionTypes.stepperDisabled, stepperDisabledSaga);
}

/* Post-link, register record and replay hooks. */

function postLink (scope, actionTypes) {
  const {recordApi, replayApi, stepperApi, getSyntaxTree} = scope;

  recordApi.onStart(function* (init) {
    /* TODO: store stepper options in init */
  });
  replayApi.on('start', function (context, event, instant) {
    /* TODO: restore stepper options from event[2] */
    const stepperState = stepperClear();
    context.state = stepperResetReducer(context.state, {payload: {stepperState}});
  });
  replayApi.onReset(function* (instant) {
    const stepperState = instant.state.get('stepper');
    yield put({type: actionTypes.stepperReset, payload: {stepperState}});
    yield put({type: actionTypes.bufferHighlight, buffer: 'source', range: instant.range});
  });

  recordApi.on(actionTypes.stepperExit, function* (addEvent, action) {
    yield call(addEvent, 'stepper.exit');
  });
  replayApi.on('stepper.exit', function (context, event, instant) {
    context.state = stepperExitReducer(context.state);
    /* Clear the highlighted range when the stepper terminates. */
    instant.range = null;
  });

  recordApi.on(actionTypes.stepperRestart, function* (addEvent, action) {
    yield call(addEvent, 'stepper.restart');
  });
  replayApi.on('stepper.restart', function* (context, event, instant) {
    const stepperState = yield call(buildState, context.state);
    context.state = stepperRestartReducer(context.state, {stepperState});
  });

  recordApi.on(actionTypes.stepperStarted, function* (addEvent, action) {
    const {mode} = action;
    yield call(addEvent, 'stepper.step', mode);
  });
  replayApi.on('stepper.step', function* (context, event, instant) {
    const mode = event[2];
    context.state = stepperStartedReducer(context.state, {mode});
    const stepperState = getStepperDisplay(context.state);
    context.run = makeContext(stepperState, interact);
    /* XXX This skips over progress/interact event, which is wrong; the
       pre-computed step must be broken down to sync with progress events and
       events causing user interaction.
       To achieve this, create an event channel and store it in the context;
       have future events post to the channel, and the interact function
       below pull from the channel; run the try block in a forked task.
     */
    try {
      context.run = yield call(performStep, context.run, mode);
    } catch (ex) {
      if (!(ex instanceof StepperError)) {
        ex = new StepperError(context, 'error', stringifyError(ex));
      }
      context.run = ex.context;
      if (ex.condition === 'interrupt') {
        context.run.interrupted = true;
        yield put({type: actionTypes.stepperInterrupted});
      }
      if (ex.condition === 'error') {
        context.run.state.error = ex.message;
      }
    }
    context.state = stepperIdleReducer(context.state, {context: context.run});
    instant.range = getNodeRange(getStepperDisplay(context.state));
    /* XXX reflectToOutput saga is not running, a mechanism is needed to
       update the computed global state (context.state).
       CONSIDER: generalize interact to take a global-state reducer, used
       when running non-interactively.
     */
    function interact (saga, ...args) {
      return new Promise((resolve, reject) => {
        /* REPLACE */
        resolve();
      });
    }
  });

  recordApi.on(actionTypes.stepperIdle, function* (addEvent, action) {
    const {context} = action;
    yield call(addEvent, 'stepper.idle', context.stepCounter);
  });
  replayApi.on('stepper.idle', function (context, event, instant) {
    /* REPLACE:
    context.run.state = getStepperDisplay(context.state);
    context.run = runToStep(context.run, event[2]);
    context.state = stepperIdleReducer(context.state, {context: context.run});
    instant.range = getNodeRange(getStepperDisplay(context.state));
    */
  });

  recordApi.on(actionTypes.stepperProgress, function* (addEvent, action) {
    const {context} = action;
    yield call(addEvent, 'stepper.progress', context.stepCounter);
  });
  replayApi.on('stepper.progress', function (context, event, instant) {
    /* REPLACE:
    context.run.state = getStepperDisplay(context.state);
    context.run = runToStep(context.run, event[2]);
    context.state = stepperProgressReducer(context.state, {context: context.run});
    instant.range = getNodeRange(getStepperDisplay(context.state));
    */
  });

  recordApi.on(actionTypes.stepperInterrupt, function* (addEvent, action) {
    yield call(addEvent, 'stepper.interrupt');
  });
  replayApi.on('stepper.interrupt', function (context, event, instant) {
    /* REPLACE: stepper.interrupt does nothing during replayApi. */
  });

  recordApi.on(actionTypes.stepperUndo, function* (addEvent, action) {
    yield call(addEvent, 'stepper.undo');
  });
  replayApi.on('stepper.undo', function (context, event, instant) {
    context.state = stepperUndoReducer(context.state);
    instant.range = getNodeRange(getStepperDisplay(context.state));
  });

  recordApi.on(actionTypes.stepperRedo, function* (addEvent, action) {
    yield call(addEvent, 'stepper.redo');
  });
  replayApi.on('stepper.redo', function (context, event, instant) {
    context.state = stepperRedoReducer(context.state);
    instant.range = getNodeRange(getStepperDisplay(context.state));
  });

  recordApi.on(actionTypes.stepperStackUp, function* (addEvent, action) {
    yield call(addEvent, 'stepper.stack.up');
  });
  replayApi.on('stepper.stack.up', function (context, event, instant) {
    context.state = stepperStackUpReducer(context.state);
    instant.range = getNodeRange(getStepperDisplay(context.state));
  });

  recordApi.on(actionTypes.stepperStackDown, function* (addEvent, action) {
    yield call(addEvent, 'stepper.stack.down');
  });
  replayApi.on('stepper.stack.down', function (context, event, instant) {
    context.state = stepperStackDownReducer(context.state);
    instant.range = getNodeRange(getStepperDisplay(context.state));
  });

  /* TODO: move out of here? */
  recordApi.on(actionTypes.stepperViewControlsChanged, function* (addEvent, action) {
    const {key, update} = action;
    yield call(addEvent, 'stepper.view.update', key, update);
  });
  replayApi.on('stepper.view.update', function (context, event, instant) {
    const key = event[2];
    const update = event[3];
    context.state = stepperViewControlsChangedReducer(context.state, {key, update});
  });

  stepperApi.onInit(function (stepperState, globalState) {
    const syntaxTree = getSyntaxTree(globalState);
    const entry = 'main';
    const options = stepperState.options = {
      memorySize: 0x10000,
      stackSize: 4096,
    };
    /* Set up the core. */
    const core0 = stepperState.oldCore = C.makeCore(options.memorySize);
    /* Execute declarations and copy strings into memory */
    const core1 = stepperState.core = {...core0};
    const decls = syntaxTree[2];
    C.execDecls(core1, decls);
    /* Set up the call to the main function. */
    C.setupCall(core1, 'main');
  });

  stepperApi.addSaga(function* mainStepperSaga (dispatch) {
    yield takeEvery(actionTypes.stepperInteract, stepperInteractSaga);
    yield takeEvery(actionTypes.stepperStep, stepperStepSaga, dispatch);
    yield takeEvery(actionTypes.stepperExit, stepperExitSaga);
    /* Highlight the range of the current source fragment. */
    yield takeLatest([
      actionTypes.stepperProgress,
      actionTypes.stepperIdle,
      actionTypes.stepperRestart,
      actionTypes.stepperUndo,
      actionTypes.stepperRedo,
      actionTypes.stepperStackUp,
      actionTypes.stepperStackDown
    ], updateSourceHighlightSaga);
  });

}