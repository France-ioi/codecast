
import {defineAction, addReducer, addSaga} from '../utils/linker';
import {writeString} from '../stepper/terminal';
import {takeEvery, select} from 'redux-saga/effects';

export default function* (deps) {

  yield defineAction('terminalInit', 'Terminal.Init');
  yield defineAction('terminalFocus', 'Terminal.Focus');
  yield defineAction('terminalInputKey', 'Terminal.Input.Key');
  yield defineAction('terminalInputBackspace', 'Terminal.Input.Backspace');
  yield defineAction('terminalInputEnter', 'Terminal.Input.Enter');

  yield addReducer('terminalInit', function (state, action) {
    const {iface} = action;
    return state.set('terminal', iface);
  });

  yield addSaga(function* () {
    yield takeEvery(deps.terminalFocus, function* () {
      const iface = yield select(state => state.get('terminal'));
      if (iface) {
        iface.focus();
      }
    });
  });

  yield addReducer('terminalInputKey', function (state, action) {
    return state.update('stepper', st => terminalInputKey(st, action));
  });

  yield addReducer('terminalInputBackspace', function (state, action) {
    return state.update('stepper', st => terminalInputBackspace(st));
  });

  yield addReducer('terminalInputEnter', function (state, action) {
    return state.update('stepper', st => terminalInputEnter(st));
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
      terminal: writeString(stepper.terminal, inputLine)
    };
  });
};
