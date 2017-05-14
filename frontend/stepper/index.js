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
    'translateSucceeded', 'getSyntaxTree', 'translateClear', 'bufferHighlight'
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
  bundle.addReducer('stepperRestart', function (state, action) {
    return state.update('stepper', st => stepperRestart(st, action));
  });

  // Restore a saved or computed state.
  bundle.defineAction('stepperReset', 'Stepper.Reset');
  bundle.addReducer('stepperReset', function (state, action) {
    return state.set('stepper', action.state);
  });

  // Sent when the user requested stepping in a given mode.
  bundle.defineAction('stepperStep', 'Stepper.Step');
  bundle.addReducer('stepperStep', function (state, action) {
    /* No check for 'idle' status, the player must be able to step while
       the status is 'running'. */
    return state.setIn(['stepper', 'status'], 'starting');
  });

  // Sent when the stepper has started evaluating a step.
  bundle.defineAction('stepperStarted', 'Stepper.Start');
  bundle.addReducer('stepperStarted', function (state, action) {
    return state.update('stepper', st => stepperStarted(st, action));
  });

  // Sent when the stepper has been evaluating for a while without completing a step.
  bundle.defineAction('stepperProgress', 'Stepper.Progress');
  bundle.addReducer('stepperProgress', function (state, action) {
    return state.update('stepper', st => stepperProgress(st, action));
  });

  // Sent when the stepper has completed a step and is idle again.
  bundle.defineAction('stepperIdle', 'Stepper.Idle');
  bundle.addReducer('stepperIdle', function (state, action) {
    return state.update('stepper', st => stepperIdle(st, action));
  });

  // Sent when the user exits the stepper.
  bundle.defineAction('stepperExit', 'Stepper.Exit');
  bundle.addReducer('stepperExit', function (state, action) {
    return state.update('stepper', st => stepperClear(st));
  });

  // Sent when the user interrupts the stepper.
  bundle.defineAction('stepperInterrupt', 'Stepper.Interrupt');
  bundle.addReducer('stepperInterrupt', function (state, action) {
    // Cannot interrupt while idle.
    if (state.getIn(['stepper', 'status']) === 'idle') {
      return state;
    }
    return state.setIn(['stepper', 'interrupt'], true);
  });

  bundle.defineAction('stepperInterrupted', 'Stepper.Interrupted');
  bundle.addReducer('stepperInterrupted', function (state, action) {
    return state.setIn(['stepper', 'interrupt'], false);
  });

  bundle.defineAction('stepperUndo', 'Stepper.Undo');
  bundle.addReducer('stepperUndo', function (state, action) {
    return state.update('stepper', st => stepperUndo(st, action));
  });

  bundle.defineAction('stepperRedo', 'Stepper.Redo');
  bundle.addReducer('stepperRedo', function (state, action) {
    return state.update('stepper', st => stepperRedo(st, action));
  });

  bundle.defineAction('stepperConfigure', 'Stepper.Configure');
  bundle.addReducer('stepperConfigure', function (state, action) {
    const {options} = action;
    return state.set('stepper.options', Immutable.Map(options));
  });

  /* BEGIN view stuff to move out of here */

  bundle.defineAction('stepperStackUp', 'Stepper.Stack.Up');
  bundle.addReducer('stepperStackUp', function (state, action) {
    return state.update('stepper', st => stepperStackUp(st, action));
  });

  bundle.defineAction('stepperStackDown', 'Stepper.Stack.Down');
  bundle.addReducer('stepperStackDown', function (state, action) {
    return state.update('stepper', st => stepperStackDown(st, action));
  });

  bundle.defineAction('stepperViewControlsChanged', 'Stepper.View.ControlsChanged');
  bundle.addReducer('stepperViewControlsChanged', function (state, action) {
    return state.update('stepper', st => stepperViewControlsChanged(st, action));
  });

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

  bundle.defineSelector('getStepperInterrupted', state =>
    state.getIn(['stepper', 'interrupt'])
  );

  /* Start the stepper when source code has been translated successfully. */
  bundle.addSaga(function* watchTranslateSucceeded () {
    yield takeLatest(deps.translateSucceeded, function* () {
      try {
        yield put({type: deps.stepperDisabled});
        /* Get the syntax tree from the store (not the action) to get ranges. */
        const syntaxTree = yield select(deps.getSyntaxTree);
        /* Pass the whole state to runInit to collect the options. */
        const options = {};
        deps.stepperApi.collectOptions(options, yield select(state => state));
        console.log('options', options);
        /* Build the stepper state. This automatically runs into user source code. */
        const stepperState = yield call(deps.stepperApi.buildState, syntaxTree, options);
        console.log('stepperState', stepperState);
        /* Enable the stepper */
        yield put({type: deps.stepperEnabled, options});
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

  function* onStepperStep (action) {
    const {mode} = action;
    const stepper = yield select(deps.getStepperState);
    if (stepper.get('status') === 'starting') {
      yield put({type: deps.stepperStarted, mode});
      const runContext = buildRunContext(stepper.get('current'));
      try {
        switch (mode) {
          case 'into':
            yield call(deps.stepperApi.stepInto, runContext);
            break;
          case 'expr':
            yield call(deps.stepperApi.stepExpr, runContext);
            break;
          case 'out':
            yield call(deps.stepperApi.stepOut, runContext);
            break;
          case 'over':
            yield call(deps.stepperApi.stepOver, runContext);
            break;
        }
      } catch (error) {
        console.log(error); // XXX
      }
      yield put({type: deps.stepperIdle, context: runContext});
      console.log('idle');
    }
  }

  function* onStepperExit () {
    /* Disabled the stepper. */
    yield put({type: deps.stepperDisabled});
    /* Clear the translate state. */
    yield put({type: deps.translateClear});
  }

  /* A run-context is an object that is mutated as a saga steps through nodes. */
  function buildRunContext (state) {
    const startTime = window.performance.now();
    return {
      state: {
        ...state,
        core: C.clearMemoryLog(state.core),
        oldCore: state.core,
        controls: resetControls(state.controls)
      },
      interactive: true,
      startTime,
      timeLimit: startTime + 20,
      stepCounter: 0
    };
  }

  function resetControls (controls) {
    // Reset the controls before a step is started.
    return controls.setIn(['stack', 'focusDepth'], 0);
  }

  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

    recordApi.onStart(function* (init) {
      /* TODO: store stepper options, if any, in init */
    });
    replayApi.on('start', function (context, event, instant) {
      context.state = context.state.set({stepper: stepperClear()});
    });

    recordApi.on(deps.stepperExit, function* (addEvent, action) {
      yield call(addEvent, 'stepper.exit');
    });
    replayApi.on('stepper.exit', function (context, event, instant) {
      context.state = context.state.update('stepper', stepperClear());
    });

    recordApi.on(deps.stepperRestart, function* (addEvent, action) {
      yield call(addEvent, 'stepper.restart');
    });
    replayApi.on('stepper.restart', function (context, event, instant) {
      const {syntaxTree, options} = deps.getStepperInit(context.state);
      const stepperState = deps.buildStepperState(syntaxTree, options);
      context.state = context.state.update('stepper', st => stepperRestart(st, {stepperState}));
    });

    recordApi.on(deps.stepperStarted, function* (addEvent, action) {
      const {mode} = action;
      yield call(addEvent, 'stepper.step', mode);
    });
    replayApi.on('stepper.step', function (context, event, instant) {
      const mode = event[2];
      context.run = beginStep(context.state.getIn(['stepper', 'current']));
      context.state = state.update('stepper', st => stepperStarted(st, {mode}));
    });
    function beginStep (state) {
      return {
        state: {
          ...state,
          core: C.clearMemoryLog(state.core)
        },
        stepCounter: 0
      };
    }

    recordApi.on(deps.stepperIdle, function* (addEvent, action) {
      const {context} = action;
      // CONSIDER: recordApi.control node id and step
      yield call(addEvent, 'stepper.idle', context.stepCounter);
    });
    replayApi.on('stepper.idle', function (context, event, instant) {
      context.run = runToStep(context.run, event[2]);
      context.state = context.state.update('stepper', st => stepperIdle(st, {context: context.run}));
      instant.range = getNodeRange(deps.getStepperDisplay(context.state));
    });


    recordApi.on(deps.stepperProgress, function* (addEvent, action) {
      const {context} = action;
      // CONSIDER: recordApi.control node id and step
      yield call(addEvent, 'stepper.progress', context.stepCounter);
    });
    replayApi.on('stepper.progress', function (context, event, instant) {
      context.run = runToStep(context.run, event[2]);
      context.state = context.state.update('stepper', st => stepperProgress(st, {context: context.run}));
    });

    /* FIXME this needs to be adapted to use stepperApi.runEffects */
    function runToStep (context, targetStepCounter) {
      let {state, stepCounter} = context;
      while (stepCounter < targetStepCounter) {
        for (var effect of C.step(state)) {
          pureEffector(state, effect);
        }
        stepCounter += 1;
      }
      return {state, stepCounter};
    };

    recordApi.on(deps.stepperUndo, function* (addEvent, action) {
      yield call(addEvent, 'stepper.undo');
    });
    replayApi.on('stepper.undo', function (context, event, instant) {
      context.state = context.state.update('stepper', st => stepperUndo(st));
    });

    recordApi.on(deps.stepperRedo, function* (addEvent, action) {
      yield call(addEvent, 'stepper.redo');
    });
    replayApi.on('stepper.redo', function (context, event, instant) {
      context.state = context.state.update('stepper', st => stepperRedo(st));
    });

    recordApi.on(deps.stepperStackUp, function* (addEvent, action) {
      yield call(addEvent, 'stepper.stack.up');
    });
    replayApi.on('stepper.stack.up', function (context, event, instant) {
      context.state = context.state.update('stepper', st => stepperStackUp(st));
    });

    recordApi.on(deps.stepperStackDown, function* (addEvent, action) {
      yield call(addEvent, 'stepper.stack.down');
    });
    replayApi.on('stepper.stack.down', function (context, event, instant) {
      context.state = context.state.update('stepper', st => stepperStackDown(st));
    });

    /* TODO: move out of here */
    recordApi.on(deps.stepperViewControlsChanged, function* (addEvent, action) {
      const {key, update} = action;
      yield call(addEvent, 'stepper.view.update', key, update);
    });
    replayApi.on('stepper.view.update', function (context, event, instant) {
      const key = event[2];
      const update = event[3];
      context.state = context.state.update('stepper', st => stepperViewControlsChanged(st, {key, update}));
    });

    replayApi.onReset(function* (instant) {
      const stepperState = instant.state.get('stepper');
      yield put({type: deps.stepperReset, state: stepperState});
      yield put({type: deps.bufferHighlight, buffer: 'source', range: instant.range});
    });

    recordApi.on(deps.stepperInterrupt, function* (addEvent, action) {
      yield call(addEvent, 'stepper.interrupt');
    });
    /* stepper.interrupt does nothing during replayApi. */

    stepperApi.addOptions(function (options, state) {
      options.entry = 'main';
      options.memorySize = 0x10000;
      options.stackSize = 4096;
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

function stepperStarted (state, action) {
  return state
    .set('status', 'running')
    .set('mode', action.mode)
    .set('redo', Immutable.List())
    .update('undo', undo => undo.unshift(state.get('current')));
}

function stepperRestart (state, action) {
  let stepperState = action.stepperState;
  if (stepperState) {
    stepperState = enrichStepperState(stepperState);
  } else {
    stepperState = state.get('initial');
  }
  return Immutable.Map({
    status: 'idle',
    initial: stepperState,
    current: stepperState,
    undo: state.get('undo'),
    redo: Immutable.List()
  });
}

function stepperIdle (state, action) {
  // Set new current state and go back to idle.
  const stepperState = enrichStepperState(action.context.state);
  return state
    .set('current', stepperState)
    .set('status', 'idle')
    .delete('mode');
}

function stepperProgress (state, action) {
  // Set new current state and go back to idle.
  const stepperState = enrichStepperState(action.context.state);
  return state.set('current', stepperState);
}

function stepperUndo (state, action) {
  const undo = state.get('undo');
  if (undo.isEmpty()) {
    return state;
  }
  const current = state.get('current');
  const stepperState = undo.first();
  return state
    .set('current', stepperState)
    .set('undo', undo.shift())
    .set('redo', state.get('redo').unshift(current));
}

function stepperRedo (state, action) {
  const redo = state.get('redo');
  if (redo.isEmpty()) {
    return state;
  }
  const stepperState = redo.first();
  const current = state.get('current');
  return state
    .set('current', stepperState)
    .set('redo', redo.shift())
    .set('undo', state.get('undo').unshift(current));
}

function stepperStackUp (state, action) {
  return state.update('current', function (stepperState) {
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

function stepperStackDown (state, action) {
  return state.update('current', function (stepperState) {
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

function stepperViewControlsChanged (state, action) {
  const {key, update} = action;
  return state.update('current', function (stepperState) {
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
