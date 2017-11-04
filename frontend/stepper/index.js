/*

The stepper's state has the following shape:

  {
    status: /clear|idle|starting|running/,
    mode: /expr|into|out|over/,
    initial: {...},
    current: {...}
  }

  The 'initial' state is the one restored by a 'restart' action.
  The 'current' state is the state from which the step* actions start,
  and also the state to be displayed to the user.

*/

import {delay} from 'redux-saga';
import {takeEvery, takeLatest, take, put, call, select, cancel, fork, race} from 'redux-saga/effects';
import Immutable from 'immutable';
import * as C from 'persistent-c';

import ApiBundle from './api';
import ControlsBundle from './controls';
import TranslateBundle from './translate';
import EffectsBundle from './effects';

import DelayBundle from './delay';
import HeapBundle from './heap';
import IoBundle from './io/index';
import ViewsBundle from './views/index';

/* TODO: clean-up */
import {analyseState, collectDirectives} from './analysis';

export default function (bundle, deps) {

  bundle.include(ApiBundle);
  bundle.include(ControlsBundle);
  bundle.include(TranslateBundle);
  bundle.include(EffectsBundle);
  bundle.include(DelayBundle);
  bundle.include(HeapBundle);
  bundle.include(IoBundle);
  bundle.include(ViewsBundle);

  bundle.use(
    'error', 'stepperApi',
    'translateSucceeded', 'getSyntaxTree', 'translateClear', 'bufferHighlight',
    'recorderStopping'
  );

  bundle.addReducer('init', function (state, action) {
    return state.set('stepper', stepperClear());
  });

  /* Sent when the stepper task is started */
  bundle.defineAction('stepperTaskStarted', 'Stepper.Task.Started');
  bundle.addReducer('stepperTaskStarted', function (state, action) {
    return state.set('stepperTask', action.task);
  });

  /* Sent when the stepper task is cancelled */
  bundle.defineAction('stepperTaskCancelled', 'Stepper.Task.Cancelled');
  bundle.addReducer('stepperTaskCancelled', function (state, action) {
    return state.set('stepperTask', null);
  });

  // Sent when the stepper's state is initialized.
  bundle.defineAction('stepperRestart', 'Stepper.Restart');
  bundle.addReducer('stepperRestart', stepperRestart);
  function stepperRestart (state, action) {
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

  // Restore a saved or computed state.
  bundle.defineAction('stepperReset', 'Stepper.Reset');
  bundle.addReducer('stepperReset', stepperReset);
  function stepperReset (state, action) {
    return state.set('stepper', action.state);
  }

  // Sent when the user requested stepping in a given mode.
  bundle.defineAction('stepperStep', 'Stepper.Step');
  bundle.addReducer('stepperStep', function (state, action) {
    /* No check for 'idle' status, the player must be able to step while
       the status is 'running'. */
    return state.setIn(['stepper', 'status'], 'starting');
  });

  // Sent when the stepper has started evaluating a step.
  bundle.defineAction('stepperStarted', 'Stepper.Start');
  bundle.addReducer('stepperStarted', stepperStarted);
  function stepperStarted (state, action) {
    return state.update('stepper', stepper => stepper
      .set('status', 'running')
      .set('mode', action.mode)
      .set('redo', Immutable.List())
      .update('undo', undo => undo.unshift(stepper.get('current'))));
  }

  // Sent when the stepper has been evaluating for a while without completing a step.
  bundle.defineAction('stepperProgress', 'Stepper.Progress');
  bundle.addReducer('stepperProgress', stepperProgress);
  function stepperProgress (state, action) {
    // Set new current state and go back to idle.
    const stepperState = enrichStepperState(action.context.state);
    return state.update('stepper', stepper => stepper
      .set('current', stepperState));
  }

  // Sent when the stepper has completed a step and is idle again.
  bundle.defineAction('stepperIdle', 'Stepper.Idle');
  bundle.addReducer('stepperIdle', stepperIdle);
  function stepperIdle (state, action) {
    // Set new current state and go back to idle.
    /* XXX Call enrichStepperState prior to calling the reducer. */
    const stepperState = enrichStepperState(action.context.state);
    return state.update('stepper', stepper => stepper
      .set('current', stepperState)
      .set('status', 'idle')
      .delete('mode'));
  }

  // Sent when the user exits the stepper.
  bundle.defineAction('stepperExit', 'Stepper.Exit');
  bundle.addReducer('stepperExit', stepperExit);
  function stepperExit (state, action) {
    return state.update('stepper', st => stepperClear());
  }

  // Sent when the user interrupts the stepper.
  bundle.defineAction('stepperInterrupt', 'Stepper.Interrupt');
  bundle.addReducer('stepperInterrupt', function (state, action) {
    // Cannot interrupt while idle.
    if (state.getIn(['stepper', 'status']) === 'idle') {
      return state;
    }
    return state.setIn(['stepper', 'interrupting'], true);
  });

  bundle.defineAction('stepperInterrupted', 'Stepper.Interrupted');
  bundle.addReducer('stepperInterrupted', function (state, action) {
    return state.setIn(['stepper', 'interrupting'], false);
  });

  bundle.defineSelector('isStepperInterrupting', function (state) {
    return state.getIn(['stepper', 'interrupting'], false);
  });

  bundle.defineAction('stepperUndo', 'Stepper.Undo');
  bundle.addReducer('stepperUndo', stepperUndo);
  function stepperUndo (state, action) {
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

  bundle.defineAction('stepperRedo', 'Stepper.Redo');
  bundle.addReducer('stepperRedo', stepperRedo);
  function stepperRedo (state, action) {
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

  bundle.defineAction('stepperConfigure', 'Stepper.Configure');
  bundle.addReducer('stepperConfigure', function (state, action) {
    const {options} = action;
    return state.set('stepper.options', Immutable.Map(options));
  });

  /* BEGIN view stuff to move out of here */

  bundle.defineAction('stepperStackUp', 'Stepper.Stack.Up');
  bundle.addReducer('stepperStackUp', stepperStackUp);
  function stepperStackUp (state, action) {
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

  bundle.defineAction('stepperStackDown', 'Stepper.Stack.Down');
  bundle.addReducer('stepperStackDown', stepperStackDown);
  function stepperStackDown (state, action) {
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

  bundle.defineAction('stepperViewControlsChanged', 'Stepper.View.ControlsChanged');
  bundle.addReducer('stepperViewControlsChanged', stepperViewControlsChanged);
  function stepperViewControlsChanged (state, action) {
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

  /* END view stuff to move out of here */

  bundle.defineSelector('getStepperState', state =>
    state.get('stepper')
  );

  bundle.defineSelector('getStepperOptions', state =>
    state.get('stepper.options')
  );

  bundle.defineSelector('getStepperDisplay', state =>
    state.getIn(['stepper', 'current'])
  );

  /* Start the stepper when source code has been translated successfully. */
  bundle.addSaga(function* watchTranslateSucceeded () {
    yield takeLatest(deps.translateSucceeded, function* () {
      try {
        yield put({type: deps.stepperDisabled});
        /* Build the stepper state. This automatically runs into user source code. */
        const globalState = yield select(st => st);
        const stepperState = yield call(deps.stepperApi.buildState, globalState);
        /* Enable the stepper */
        yield put({type: deps.stepperEnabled});
        yield put({type: deps.stepperRestart, stepperState});
      } catch (error) {
        yield put({type: deps.error, source: 'stepper', error});
      }
    });
  });

  bundle.defineAction('stepperEnabled', 'Stepper.Enabled');
  bundle.addSaga(function* () {
    yield takeLatest(deps.stepperEnabled, function* enableStepper (action) {
      /* Start the new stepper task. */
      const newTask = yield fork(deps.stepperApi.rootSaga, action.options);
      yield put({type: deps.stepperTaskStarted, task: newTask});
    });
  });

  bundle.defineAction('stepperDisabled', 'Stepper.Disabled');
  bundle.addSaga(function* () {
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

  bundle.addSaga(function* () {
    /* Disable the stepper when recording stops. */
    yield takeEvery(deps.recorderStopping, function* () {
      yield put({type: deps.stepperInterrupt});
      yield put({type: deps.stepperDisabled});
    });
  });

  function* onStepperStep (action) {
    const {mode} = action;
    const stepper = yield select(deps.getStepperState);
    if (stepper.get('status') === 'starting') {
      yield put({type: deps.stepperStarted, mode});
      let context = makeContext(stepper.get('current'));
      try {
        switch (mode) {
          case 'run':
            context = yield call(deps.stepperApi.run, context);
            break;
          case 'into':
            context = yield call(deps.stepperApi.stepInto, context);
            break;
          case 'expr':
            context = yield call(deps.stepperApi.stepExpr, context);
            break;
          case 'out':
            context = yield call(deps.stepperApi.stepOut, context);
            break;
          case 'over':
            context = yield call(deps.stepperApi.stepOver, context);
            break;
        }
      } catch (ex) {
        console.log('caught', ex);
        if (ex.context) {
          context = ex.context;
        }
        if (ex.condition === 'interrupted') {
          yield put({type: deps.stepperInterrupted});
        }
        if (ex.condition === 'error') {
          context.state.error = stringifyError(ex.details);
        }
      }
      yield put({type: deps.stepperIdle, context});
    }
  }
  function makeContext (state) {
    const context = deps.stepperApi.makeContext(state)
    context.state.controls = resetControls(state.controls);
    return context;
  }

  function* onStepperExit () {
    /* Disabled the stepper. */
    yield put({type: deps.stepperDisabled});
    /* Clear the translate state. */
    yield put({type: deps.translateClear});
  }

  function resetControls (controls) {
    // Reset the controls before a step is started.
    return controls.setIn(['stack', 'focusDepth'], 0);
  }

  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

    recordApi.onStart(function* (init) {
      /* TODO: store stepper options in init */
    });
    replayApi.on('start', function (context, event, instant) {
      /* TODO: restore stepper options from event[2] */
      const state = stepperClear();
      context.state = stepperReset(context.state, {state});
    });
    replayApi.onReset(function* (instant) {
      const stepperState = instant.state.get('stepper');
      yield put({type: deps.stepperReset, state: stepperState});
      yield put({type: deps.bufferHighlight, buffer: 'source', range: instant.range});
    });

    recordApi.on(deps.stepperExit, function* (addEvent, action) {
      yield call(addEvent, 'stepper.exit');
    });
    replayApi.on('stepper.exit', function (context, event, instant) {
      context.state = stepperExit(context.state);
    });

    recordApi.on(deps.stepperRestart, function* (addEvent, action) {
      yield call(addEvent, 'stepper.restart');
    });
    replayApi.on('stepper.restart', function (context, event, instant) {
      const stepperState = deps.stepperApi.buildState(context.state);
      context.state = stepperRestart(context.state, {stepperState});
    });

    recordApi.on(deps.stepperStarted, function* (addEvent, action) {
      const {mode} = action;
      yield call(addEvent, 'stepper.step', mode);
    });
    replayApi.on('stepper.step', function (context, event, instant) {
      const mode = event[2];
      context.state = stepperStarted(context.state, {mode});
      const stepperState = deps.getStepperDisplay(context.state);
      context.run = stepperApi.makeContext(stepperState);
    });

    recordApi.on(deps.stepperIdle, function* (addEvent, action) {
      const {context} = action;
      yield call(addEvent, 'stepper.idle', context.stepCounter);
    });
    replayApi.on('stepper.idle', function (context, event, instant) {
      /* Update the state with the current displayed state, to make user
         interactions observable by the stepper. */
      context.run.state = deps.getStepperDisplay(context.state);
      context.run = stepperApi.runToStep(context.run, event[2]);
      context.state = stepperIdle(context.state, {context: context.run});
      instant.range = getNodeRange(deps.getStepperDisplay(context.state));
    });

    recordApi.on(deps.stepperProgress, function* (addEvent, action) {
      const {context} = action;
      yield call(addEvent, 'stepper.progress', context.stepCounter);
    });
    replayApi.on('stepper.progress', function (context, event, instant) {
      /* Update the state with the current displayed state, to make user
         interactions observable by the stepper. */
      context.run.state = deps.getStepperDisplay(context.state);
      context.run = stepperApi.runToStep(context.run, event[2]);
      context.state = stepperProgress(context.state, {context: context.run});
      instant.range = getNodeRange(deps.getStepperDisplay(context.state));
    });

    recordApi.on(deps.stepperUndo, function* (addEvent, action) {
      yield call(addEvent, 'stepper.undo');
    });
    replayApi.on('stepper.undo', function (context, event, instant) {
      context.state = stepperUndo(context.state);
      instant.range = getNodeRange(deps.getStepperDisplay(context.state));
    });

    recordApi.on(deps.stepperRedo, function* (addEvent, action) {
      yield call(addEvent, 'stepper.redo');
    });
    replayApi.on('stepper.redo', function (context, event, instant) {
      context.state = stepperRedo(context.state);
      instant.range = getNodeRange(deps.getStepperDisplay(context.state));
    });

    recordApi.on(deps.stepperStackUp, function* (addEvent, action) {
      yield call(addEvent, 'stepper.stack.up');
    });
    replayApi.on('stepper.stack.up', function (context, event, instant) {
      context.state = stepperStackUp(context.state);
      instant.range = getNodeRange(deps.getStepperDisplay(context.state));
    });

    recordApi.on(deps.stepperStackDown, function* (addEvent, action) {
      yield call(addEvent, 'stepper.stack.down');
    });
    replayApi.on('stepper.stack.down', function (context, event, instant) {
      context.state = stepperStackDown(context.state);
      instant.range = getNodeRange(deps.getStepperDisplay(context.state));
    });

    /* TODO: move out of here */
    recordApi.on(deps.stepperViewControlsChanged, function* (addEvent, action) {
      const {key, update} = action;
      yield call(addEvent, 'stepper.view.update', key, update);
    });
    replayApi.on('stepper.view.update', function (context, event, instant) {
      const key = event[2];
      const update = event[3];
      context.state = stepperViewControlsChanged(context.state, {key, update});
    });

    recordApi.on(deps.stepperInterrupt, function* (addEvent, action) {
      yield call(addEvent, 'stepper.interrupt');
    });
    replayApi.on('stepper.interrupt', function (context, event, instant) {
      /* stepper.interrupt does nothing during replayApi. */
    });

    stepperApi.onInit(function (stepperState, globalState) {
      const syntaxTree = deps.getSyntaxTree(globalState);
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

    stepperApi.addSaga(function* () {
      yield takeEvery(deps.stepperStep, onStepperStep);
      yield takeEvery(deps.stepperExit, onStepperExit);
      /* Highlight the range of the current source fragment. */
      yield takeLatest([
        deps.stepperProgress, deps.stepperIdle, deps.stepperRestart,
        deps.stepperUndo, deps.stepperRedo,
        deps.stepperStackUp, deps.stepperStackDown
      ], updateSourceHighlight);
    });

  });

  function* updateSourceHighlight () {
    const stepperState = yield select(deps.getStepperDisplay);
    const range = getNodeRange(stepperState);
    yield put({type: deps.bufferHighlight, buffer: 'source', range});
  }

};

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
