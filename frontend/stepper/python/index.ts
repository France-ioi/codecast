import {channel} from 'redux-saga';
import {call, put, select, take, takeEvery} from 'redux-saga/effects';
import {writeString} from "../io/terminal";
import PythonInterpreter from "./python_interpreter";
import {ActionTypes} from './actionTypes';
import {ActionTypes as CompileActionTypes} from '../actionTypes';
import {ActionTypes as IoActionTypes} from '../io/actionTypes';
import {AppStore, AppStoreReplay} from "../../store";
import {ReplayContext} from "../../player/sagas";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {App} from "../../index";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_librairies";
import {taskSuccess} from "../../task/task_slice";

const pythonInterpreterChannel = channel();

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.PythonInput);

    function* waitForInputSaga() {
        /* Set the isWaitingOnInput flag on the state. */
        yield put({type: IoActionTypes.TerminalInputNeeded});
        /* Transfer focus to the terminal. */
        yield put({type: IoActionTypes.TerminalFocus});
        /* Wait for the user to enter a line. */
        yield take(IoActionTypes.TerminalInputEnter);
    }

    function* pythonInputSaga(app: App, action) {
        const state: AppStore = yield select();
        const stepperContext = state.stepper.currentStepperState;
        const isPlayerContext = (stepperContext == null);

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
                action.payload.resolve(futureInputValue);

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
        action.payload.resolve(line);
    }

    bundle.addSaga(function* pythonMainSaga(args) {
        yield takeEvery(ActionTypes.PythonInput, pythonInputSaga, args);
    });

    bundle.addSaga(function* watchPythonInterpreterChannel() {
        while (true) {
            const action = yield take(pythonInterpreterChannel);
            yield put(action);
        }
    });

    bundle.defineAction(ActionTypes.StackViewPathToggle);
    bundle.addReducer(ActionTypes.StackViewPathToggle, stackViewPathToggleReducer);

    function stackViewPathToggleReducer(state: AppStoreReplay, action): void {
        const {scopeIndex, path, isOpened} = action.payload;

        state.stepper.currentStepperState.analysis.functionCallStack[scopeIndex].openedPaths[path] = isOpened;
    }

    bundle.defer(function({recordApi, replayApi, stepperApi}: App) {
        recordApi.on(ActionTypes.StackViewPathToggle, function* (addEvent, action) {
            yield call(addEvent, 'stackview.path.toggle', action);
        });
        replayApi.on('stackview.path.toggle', function(replayContext: ReplayContext, event) {
            const action = event[2];

            stackViewPathToggleReducer(replayContext.state, action);
        });

        stepperApi.onInit(function(stepperState: StepperState, state: AppStore, replay: boolean = false) {
            const {platform} = state.options;
            const source = state.buffers['source'].model.document.toString();
            const currentTest = state.task.currentTest;

            const context = quickAlgoLibraries.getContext();
            context.reset(currentTest, state);

            if (platform === 'python') {
                context.onError = (diagnostics) => {
                    if (replay) {
                        return;
                    }

                    pythonInterpreterChannel.put({
                        type: CompileActionTypes.StepperInterrupting,
                    });

                    const response = {diagnostics};
                    pythonInterpreterChannel.put({
                        type: CompileActionTypes.CompileFailed,
                        response
                    });
                };
                context.onSuccess = (message) => {
                    if (replay) {
                        return;
                    }

                    pythonInterpreterChannel.put({
                        type: CompileActionTypes.StepperInterrupting,
                    });

                    pythonInterpreterChannel.put(taskSuccess(message));
                };
                context.onInput = () => {
                    return new Promise((resolve, reject) => {
                        pythonInterpreterChannel.put({
                            type: ActionTypes.PythonInput,
                            payload: {
                                resolve: resolve,
                                reject: reject
                            }
                        });
                    });
                }

                stepperState.directives = {
                    ordered: [],
                    functionCallStackMap: {},
                    functionCallStack: {}
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
