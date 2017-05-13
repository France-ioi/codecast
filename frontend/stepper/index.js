
import actions from './actions';
import selectors from './selectors';
import reducers from './reducers';
import sagas from './sagas';
import translate from './translate';
import StepperControls from './controls';
import views from '../views/index';
import IOPaneBundle from './io_pane';
import TerminalInputBundle from './terminal_input';
import EffectsBundle from './effects';

export default function (bundle) {

  /* TODO: reorganize */
  /* TODO: review properties of stepperStarted, stepperProgress, stepperIdle actions */

  bundle.include(actions);
  bundle.include(selectors);
  bundle.include(reducers);
  bundle.include(sagas);
  bundle.include(translate);
  bundle.include(StepperControls);
  bundle.include(views);
  bundle.include(IOPaneBundle);
  bundle.include(TerminalInputBundle);
  bundle.include(EffectsBundle);

  bundle.defer(function ({record, replay}) {

    record.onStart(function* (init) {
      /* TODO: store stepper options, if any, in init */
    });
    replay.on('start', function (context, event, instant) {
      context.state = context.state.set({stepper: stepperClear()});
    });

    record.on('stepperExit', function* (addEvent, action) {
      yield call(addEvent, 'stepper.exit');
    });
    replay.on('stepper.exit', function (context, event, instant) {
      context.state = context.state.update('stepper', stepperClear);
    });

  /*


  export function runToStep (context, targetStepCounter) {
    let {state, stepCounter} = context;
    while (stepCounter < targetStepCounter) {
      for (var effect of C.step(state)) {
        pureEffector(state, effect);
      }
      stepCounter += 1;
    }
    return {state, stepCounter};
  };
  */

    replay.on('stepper.restart', function (context, event, instant) {
      const {syntaxTree, options} = deps.getStepperInit(context.state);
      const stepperState = deps.buildStepperState(syntaxTree, options);
      context.state = context.state.update('stepper', st => stepperRestart(st, {stepperState}));
    });
    record.on('stepperRestart', function* (addEvent, action) {
      yield call(addEvent, 'stepper.restart');
    });

    record.on('stepperStarted', function* (addEvent, action) {
      const {mode} = action;
      yield call(addEvent, 'stepper.step', mode);
    });
    replay.on('stepper.step', function (context, event, instant) {
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

    record.on('stepperIdle', function* (addEvent, action) {
      const {context} = action;
      // CONSIDER: record control node id and step
      yield call(addEvent, 'stepper.idle', context.stepCounter);
    });
    replay.on('stepper.idle', function (context, event, instant) {
      context.run = runtime.runToStep(context.run, event[2]);
      context.state = context.state.update('stepper', st => stepperIdle(st, {context: context.run}));
    });

    record.on('stepperProgress', function* (addEvent, action) {
      const {context} = action;
      // CONSIDER: record control node id and step
      yield call(addEvent, 'stepper.progress', context.stepCounter);
    });
    replay.on('stepper.progress', function (context, event, instant) {
      context.run = runtime.runToStep(context.run, event[2]);
      context.state = context.state.update('stepper', st => stepperProgress(st, {context: context.run}));
    });

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

    record.on('stepperUndo', function* (addEvent, action) {
      yield call(addEvent, 'stepper.undo');
    });
    replay.on('stepper.undo', function (context, event, instant) {
      context.state = context.state.update('stepper', st => stepperUndo(st));
    });

    record.on('stepperRedo', function* (addEvent, action) {
      yield call(addEvent, 'stepper.redo');
    });
    replay.on('stepper.redo', function (context, event, instant) {
      context.state = context.state.update('stepper', st => stepperRedo(st));
    });

    record.on('stepperStackUp', function* (addEvent, action) {
      yield call(addEvent, 'stepper.stack.up');
    });
    replay.on('stepper.stack.up', function (context, event, instant) {
      context.state = context.state.update('stepper', st => stepperStackUp(st));
    });

    record.on('stepperStackDown', function* (addEvent, action) {
      yield call(addEvent, 'stepper.stack.down');
    });
    replay.on('stepper.stack.down', function (context, event, instant) {
      context.state = context.state.update('stepper', st => stepperStackDown(st));
    });

    record.on('stepperViewControlsChanged', function* (addEvent, action) {
      const {key, update} = action;
      yield call(addEvent, 'stepper.view.update', key, update);
    });
    replay.on('stepper.view.update', function (context, event, instant) {
      const key = event[2];
      const update = event[3];
      context.state = context.state.update('stepper', st => stepperViewControlsChanged(st, {key, update}));
    });

    replay.onReset(function* (instant) {
      const stepperState = instant.state.get('stepper');
      yield put({type: deps.stepperReset, state: stepperState});
    });

    record.on('stepperInterrupt', function* (addEvent, action) {
      yield call(addEvent, 'stepper.interrupt');
    });
    /* stepper.interrupt does nothing during replay. */

  });

};
