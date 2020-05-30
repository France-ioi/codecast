import { channel } from 'redux-saga';
import { take, put } from 'redux-saga/effects';

import { writeString } from "../io/terminal";
import PythonInterpreter from "./python_interpreter";

const pythonInterpreterChannel = channel();

export default function (bundle, deps) {
  bundle.defineAction('pythonInput', 'Python.Input');
  bundle.addReducer('pythonInput', (state, action) => {
    const { message } = action;
    const { terminal, input, inputPos } = state.getIn(['stepper', 'currentStepperState']);

    if (terminal) {
      // No interactive terminal for python.
      return state;
    } else {
      // Read from the current cursor to the next new line.
      let newInputPos = input.substring(inputPos).indexOf("\n");
      if (newInputPos === -1) {
        // Position the cursor after the end of the input if no newline found.
        newInputPos = input.length();
      } else {
        // New position of the cursor : just after the new line.
        newInputPos++;
      }

      return state.updateIn(['stepper', 'currentStepperState'], (currentStepperState) => {
        return {
          ...currentStepperState,
          inputPos: newInputPos
        }
      });
    }
  });

  bundle.addSaga(function* watchPythonInterpreterChannel() {
    while (true) {
      const action = yield take(pythonInterpreterChannel);
      yield put(action);
    }
  });

  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

    /*
    recordApi.onStart(function* (init) {
      const {platform} = yield select(state => state.get('options'));
      if (platform === 'arduino') {
        init.arduino = yield select(state => state.get('arduino'));
      }
    });
    */

    /*
    replayApi.on('start', function (replayContext, event) {
      const {arduino} = event[2];
      if (arduino) {
        replayContext.state = arduinoReset(replayContext.state, {state: arduino});
      }
    });
    replayApi.onReset(function* (instant) {
      const arduinoState = instant.state.get('arduino');
      if (arduinoState) {
        yield put({type: deps.arduinoReset, state: arduinoState});
      }
    });
     */

    stepperApi.onInit(function (stepperState, globalState) {
      const { platform } = globalState.get('options');
      const sourceModel = globalState.getIn(['buffers', 'source', 'model']);
      const source = sourceModel.get('document').toString();

      if (platform === 'python') {
        const context = {
          infos: {},
          aceEditor: null,
          onError: (diagnostics) => {
            const response = {diagnostics};

            pythonInterpreterChannel.put({
              type: 'Compile.Failed',
              response
            });
          },
          onInput: (prompt) => {
            return new Promise((resolve, reject) => {
              console.log('PYTHON ASKED FOR INPUT');
              console.log(prompt);

              // var inputLines = $("#programInputField").val().split("\n");
              // resolve(inputLines[0]);
              // inputLines.shift();
              // $("#programInputField").val("");
              // for (let i = 0; i < inputLines.length; i++) {
              //     let currentInputFieldVal = $("#programInputField").val();
              //     $("#programInputField").val(currentInputFieldVal + ((i != 0)? "\n" : "")  + inputLines[i]);
              // }

              // ToDo: output prompt
              // ToDo: get input string

              resolve('Hello this is a test... !');
            });
          }
          // onInput: (prompt) => {
            // if (prompt) {
            //   pythonInterpreterChannel.put({
            //     type: 'Python.Output',
            //     message
            //   });
            // }
            //
            // pythonInterpreterChannel.put({
            //   type: 'Python.Input',
            //   message
            // });

            // let {state} = stepperContext;
            // let {input, inputPos} = state;
            // let nextNL = input.indexOf('\n', inputPos);
            // while (-1 === nextNL) {
            //   if (!state.terminal || !stepperContext.interact) {
            //     /* non-interactive, end of input */
            //     return null;
            //   }
            //   /* During replay no action is needed, the stepper will suspended until
            //      input events supply the necessary input. */
            //   yield ['interact', {saga: waitForInputSaga}];
            //   /* Parse the next line from updated stepper state. */
            //   state = stepperContext.state;
            //   input = state.input;
            //   inputPos = state.inputPos;
            //   nextNL = input.indexOf('\n', inputPos);
            // }
            // const line = input.substring(inputPos, nextNL);
            // state.inputPos = nextNL + 1;
            // return line;
          // }
        };

        /**
         * Add a last instruction at the end of the code so Skupt will generate a Suspension state
         * for after the user's last instruction. Otherwise it would be impossible to retrieve the
         * modifications made by the last user's line.
         *
         * @type {string} pythonSource
         */
        const pythonSource = source + "\npass";

        const pythonInterpreter = new PythonInterpreter(context);
        pythonInterpreter.initCodes([pythonSource]);
      }
    });
  })
};

export function addStepOutput(stepperState, message) {
  const {terminal, output} = stepperState;

  if (terminal) {
    const newTerminal = writeString(terminal, message);

    return {
      ...stepperState,
      terminal: newTerminal
    };
  } else {
    return {
      ...stepperState,
      output: output + message
    }
  }
}
