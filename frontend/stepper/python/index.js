import { channel } from 'redux-saga';
import {take, put, takeEvery, select} from 'redux-saga/effects';

import { writeString } from "../io/terminal";
import PythonInterpreter from "./python_interpreter";
import {isEmptyObject} from "../../utils/javascript";

const pythonInterpreterChannel = channel();

export default function (bundle, deps) {
  bundle.defineAction('pythonInput', 'Python.Input');

  function* waitForInputSaga() {
    /* Set the isWaitingOnInput flag on the state. */
    yield put({type: deps.terminalInputNeeded});
    /* Transfer focus to the terminal. */
    yield put({type: deps.terminalFocus});
    /* Wait for the user to enter a line. */
    yield take(deps.terminalInputEnter);
  }

  function* pythonInputSaga({actionTypes, dispatch}, {payload: {resolve}}) {
    //let stepperContext = yield select(state => state.get('stepper').get('currentStepperState'));

    let terminal = window.currentPythonRunner._terminal;
    let input = window.currentPythonRunner._input;
    let inputPos = window.currentPythonRunner._inputPos;

    console.log('input', input, inputPos);

    let nextNL = input.indexOf('\n', inputPos);
    console.log('found at ', nextNL);
    while (-1 === nextNL) {
      if (!terminal /*|| !stepperContext.interact*/) {
        /* non-interactive, end of input */
        return null;
      }

      /* During replay no action is needed, the stepper will suspended until
         input events supply the necessary input. */
      //yield ['interact', {saga: waitForInputSaga}];

      // TODO: Handle terminal too.

      /* Parse the next line from updated stepper state. */
      //stepperContext = yield select(state => state.get('stepper').get('currentStepperState'));

      //input = stepperContext.input;
      //inputPos = stepperContext.inputPos;

      nextNL = input.indexOf('\n', inputPos);
    }

    const line = input.substring(inputPos, nextNL);
    window.currentPythonRunner._inputPos = nextNL + 1;

    console.log(window.currentPythonRunner._inputPos, 'pythoninputsaga');

    // Resolve the promise of the input that was passed in the action.
    resolve(line);
  }

  bundle.addSaga(function* pythonMainSaga(args) {
    yield takeEvery(deps.pythonInput, pythonInputSaga, args);
  });

  bundle.addSaga(function* watchPythonInterpreterChannel() {
    while (true) {
      const action = yield take(pythonInterpreterChannel);
      yield put(action);
    }
  });

  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

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
              pythonInterpreterChannel.put({
                type: 'Python.Input',
                payload: {
                  resolve: resolve,
                  reject: reject
                }
              });
            });
          }
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

export function getNewTerminal(stepperState, message) {
  const { terminal } = stepperState;

  return terminal;

  if (stepperState.terminal) {
    if (message) {
      return writeString(terminal, message);
    }

    return terminal;
  }

  return null;
}

export function getNewOutput(stepperState, message) {
  if (stepperState.terminal && !isEmptyObject(stepperState.terminal)) {
    return null;
  }

  if (message) {
    return stepperState.output + message;
  }

  return stepperState.output;
}
