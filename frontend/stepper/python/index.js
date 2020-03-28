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

  bundle.defineAction('pythonOutput', 'Python.Output');
  bundle.addReducer('pythonOutput', (state, action) => {
    const { message } = action;
    const { terminal, output } = state.getIn(['stepper', 'currentStepperState']);

    if (terminal) {
      const newTerminal = writeString(terminal, message);

      return state.updateIn(['stepper', 'currentStepperState'], (currentStepperState) => {
        return {
          ...currentStepperState,
          terminal: newTerminal
        };
      });
    } else {
      return state.updateIn(['stepper', 'currentStepperState'], (currentStepperState) => {
        return {
          ...currentStepperState,
          output: output + message
        }
      });
    }
  });

  bundle.defineAction('pythonStepped', 'Python.Stepped');
  bundle.addReducer('pythonStepped', (state, action) => {
    console.log('CURRENT SUSPENSION', action.suspensions);

    return state;
  });

  bundle.addSaga(function* watchPythonInterpreterChannel() {
    while (true) {
      const action = yield take(pythonInterpreterChannel);
      console.log('Got in channel');
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
          onPrint: (message) => {
            console.log('PRINT RECEIVED', message);

            pythonInterpreterChannel.put({
              type: 'Python.Output',
              message
            });
          },
          onError: (diagnostics) => {
            const response = {diagnostics};

            console.log('ERROR RECEIVED', diagnostics);

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

        const pythonInterpreter = new PythonInterpreter(context);
        pythonInterpreter.initCodes([source]);
      }
    });
  })
};
