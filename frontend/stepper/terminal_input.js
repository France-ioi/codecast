
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

};

export function terminalInputNeeded (state, action) {
  return state.update('current', function (stepper) {
    return {...stepper, isWaitingOnInput: true};
  });
};

export function terminalInputKey (state, action) {
  const {key} = action;
  return state.update('current', function (stepper) {
    return {...stepper, inputBuffer: stepper.inputBuffer + key};
  });
};

export function terminalInputBackspace (state) {
  return state.update('current', function (stepper) {
    return {...stepper, inputBuffer: stepper.inputBuffer.slice(0, -1)};
  });
};

export function terminalInputEnter (state) {
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
