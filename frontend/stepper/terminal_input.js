
import {defineAction, addReducer} from '../utils/linker';
import {writeString} from '../stepper/terminal';

export default function* (deps) {

  yield defineAction('terminalInputKey', 'Terminal.Input.Key');
  yield defineAction('terminalInputBackspace', 'Terminal.Input.Backspace');
  yield defineAction('terminalInputEnter', 'Terminal.Input.Enter');

  yield addReducer('terminalInputKey', function (state, action) {
    const {key} = action;
    return state.update('stepper', stepper => stepper.update('current', function (stepper) {
      return {...stepper, inputBuffer: stepper.inputBuffer + key};
    }));
  });

  yield addReducer('terminalInputBackspace', function (state, action) {
    const {key} = action;
    return state.update('stepper', stepper => stepper.update('current', function (stepper) {
      return {...stepper, inputBuffer: stepper.inputBuffer.slice(0, -1)};
    }));
  });

  yield addReducer('terminalInputEnter', function (state, action) {
    return state.update('stepper', stepper => stepper.update('current', function (stepper) {
      const values = stepper.inputBuffer.split(/[\s]+/);
      return {...stepper,
        inputBuffer: "",
        input: stepper.input.push(...values),
        terminal: writeString(stepper.terminal, stepper.inputBuffer + '\n')
      };
    }));
  });

};
