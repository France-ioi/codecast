
import {writeString} from '../stepper/terminal';
import {takeEvery, select} from 'redux-saga/effects';

export default function (bundle, deps) {

  bundle.defineAction('terminalInit', 'Terminal.Init');
  bundle.defineAction('terminalFocus', 'Terminal.Focus');
  bundle.defineAction('terminalInputNeeded', 'Terminal.Input.Needed');
  bundle.defineAction('terminalInputKey', 'Terminal.Input.Key');
  bundle.defineAction('terminalInputBackspace', 'Terminal.Input.Backspace');
  bundle.defineAction('terminalInputEnter', 'Terminal.Input.Enter');

  bundle.addReducer('terminalInit', function (state, action) {
    const {iface} = action;
    return state.set('terminal', iface);
  });

  bundle.addSaga(function* () {
    yield takeEvery(deps.terminalFocus, function* () {
      const iface = yield select(state => state.get('terminal'));
      if (iface) {
        iface.focus();
      }
    });
  });

  bundle.addReducer('terminalInputNeeded', function (state, action) {
    return state.update('stepper', st => terminalInputNeeded(st, action));
  })

  bundle.addReducer('terminalInputKey', function (state, action) {
    return state.update('stepper', st => terminalInputKey(st, action));
  });

  bundle.addReducer('terminalInputBackspace', function (state, action) {
    return state.update('stepper', st => terminalInputBackspace(st));
  });

  bundle.addReducer('terminalInputEnter', function (state, action) {
    return state.update('stepper', st => terminalInputEnter(st));
  });


  bundle.defer(function ({record, replay}) {

    record.on('terminalInputNeeded', function* (addEvent, action) {
      yield call(addEvent, 'terminal.wait');
    });
    replay.on('terminal.wait', function (context, event, instant) {
      context.state = context.state.update('stepper', st => terminalInputNeeded(st));
    });

    record.on('terminalInputKey', function* (addEvent, action) {
      yield call(addEvent, 'terminal.key', action.key);
    });
    replay.on('terminal.key', function (context, event, instant) {
      const key = event[2];
      context.state = context.state.update('stepper', st => terminalInputKey(st, {key}));
    });

    record.on('terminalInputBackspace', function* (addEvent, action) {
      yield call(addEvent, 'terminal.backspace');
    });
    replay.on('terminal.backspace', function (context, event, instant) {
      context.state = context.state.update('stepper', st => terminalInputBackspace(st));
    });

    record.on('terminalInputEnter', function* (addEvent, action) {
      yield call(addEvent, 'terminal.enter');
    });
    replay.on('terminal.enter', function (context, event, instant) {
      context.state = context.state.update('stepper', st => terminalInputEnter(st));
      if (context.run) {
        /* Update the run-context so that the step completes with the added input */
        /* TODO: is this still necessary? */
        context.run.state = context.state.getIn(['stepper', 'current']);
      }
    });

    replay.on(['stepper.restart', 'stepper.undo', 'stepper.redo'], function (context, event, instant) {
      if (context.state.get('ioPaneMode') === 'split') {
        context.state = syncOutputBuffer(context.state); /* TODO: avoid this by
          making sure the output buffer model is keyt consistent */
        instant.saga = syncOutputBufferSaga;
      }
    });

  });
  function syncOutputBuffer (state) {
    const model = deps.getOutputBufferModel(state);
    return state.setIn(['buffers', 'output', 'model'], model);
  }
  function* syncOutputBufferSaga (instant) {
    const model = instant.state.getIn(['buffers', 'output', 'model']);
    yield put({type: deps.bufferReset, buffer: 'output', model});
  }

};

function terminalInputNeeded (state, action) {
  return state.update('current', function (stepper) {
    return {...stepper, isWaitingOnInput: true};
  });
};

function terminalInputKey (state, action) {
  const {key} = action;
  return state.update('current', function (stepper) {
    return {...stepper, inputBuffer: stepper.inputBuffer + key};
  });
};

function terminalInputBackspace (state) {
  return state.update('current', function (stepper) {
    return {...stepper, inputBuffer: stepper.inputBuffer.slice(0, -1)};
  });
};

function terminalInputEnter (state) {
  return state.update('current', function (stepper) {
    const inputLine = stepper.inputBuffer + '\n';
    return {...stepper,
      inputBuffer: "",
      input: stepper.input + inputLine,
      terminal: writeString(stepper.terminal, inputLine),
      isWaitingOnInput: false
    };
  });
};
