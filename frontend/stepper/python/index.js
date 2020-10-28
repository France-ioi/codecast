import { channel } from 'redux-saga';
import {take, put, takeEvery, call, select} from 'redux-saga/effects';

import { writeString } from "../io/terminal";
import PythonInterpreter from "./python_interpreter";

const pythonInterpreterChannel = channel();

export default function (bundle, deps) {
  bundle.defineAction('pythonInput', 'Python.Input');

  function* waitForInputSaga() {
    /* Set the isWaitingOnInput flag on the state. */
    yield put({type: 'Terminal.Input.Needed'});
    /* Transfer focus to the terminal. */
    yield put({type: 'Terminal.Focus'});
    /* Wait for the user to enter a line. */
    yield take('Terminal.Input.Enter');
  }

  function* pythonInputSaga({actionTypes, dispatch}, {payload: {resolve}}) {
    const stepperContext = yield select(state => state.get('stepper').get('currentStepperState'));
    const isPlayerContext = (typeof stepperContext === 'undefined');

    let terminal = window.currentPythonRunner._terminal;
    let input = window.currentPythonRunner._input;
    let inputPos = window.currentPythonRunner._inputPos;

    let nextNL = input.indexOf('\n', inputPos);
    while (-1 === nextNL) {
      if (!terminal || !window.currentPythonRunner._interact) {
        /* non-interactive, end of input */
        return null;
      }

      if (isPlayerContext || window.currentPythonRunner._synchronizingAnalysis) {
        /**
         * During replay, we resolve the Promise with an object that will later be filled
         * with the real value when the terminal inputs are provided.
         */
        const futureInputValue = {
          type: 'future_value',
          value: ''
        }

        window.currentPythonRunner._futureInputValue = futureInputValue;
        resolve(futureInputValue);

        return;
      } else {
        yield call(waitForInputSaga);
      }

      /* Parse the next line from updated input and inputPos. */

      input = window.currentPythonRunner._input;
      inputPos = window.currentPythonRunner._inputPos;

      nextNL = input.indexOf('\n', inputPos);
    }

    const line = input.substring(inputPos, nextNL);
    window.currentPythonRunner._inputPos = nextNL + 1;

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

  bundle.defineAction('stackViewPathToggle', 'StackView.Path.Toggle');
  bundle.addReducer('stackViewPathToggle', stackViewPathToggle);

  function stackViewPathToggle (state, action) {
    const { scopeIndex, path, isOpened } = action.payload;

    const newState = state.updateIn(['stepper', 'currentStepperState'], currentStepperState => {
      return {
        ...currentStepperState,
        analysis: {
          ...currentStepperState.analysis,
          functionCallStack: currentStepperState.analysis.functionCallStack.update(scopeIndex, curFunctionCallStack => {
            return {
              ...curFunctionCallStack,
              openedPaths: curFunctionCallStack.openedPaths.set(path, isOpened)
            };
          })
        }
      }
    });

    return newState;
  }

  bundle.defer(function ({recordApi, replayApi, stepperApi}) {
    recordApi.on('StackView.Path.Toggle', function* (addEvent, action) {
      yield call(addEvent, 'stackview.path.toggle', action);
    });
    replayApi.on('stackview.path.toggle', function (replayContext, event) {
      const action = event[2];
      replayContext.state = stackViewPathToggle(replayContext.state, action);
    });

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

        stepperState.directives = {
          ordered: [],
          functionCallStackMap: {}
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

export function getNewTerminal(terminal, message) {
  if (terminal) {
    if (message) {
      return writeString(terminal, message);
    }

    return terminal;
  }

  return null;
}

export function getNewOutput(stepperState, message) {
  if (message) {
    return stepperState.output + message;
  }

  return stepperState.output;
}
