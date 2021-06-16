import {channel} from 'redux-saga';
import {call, put, take} from 'redux-saga/effects';
import {writeString} from "../io/terminal";
import PythonInterpreter from "./python_interpreter";
import {ActionTypes} from './actionTypes';
import {ActionTypes as StepperActionTypes, ActionTypes as CompileActionTypes} from '../actionTypes';
import {AppStore, AppStoreReplay} from "../../store";
import {ReplayContext} from "../../player/sagas";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {App} from "../../index";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_librairies";
import {taskSuccess} from "../../task/task_slice";

const pythonInterpreterChannel = channel();

export default function(bundle: Bundle) {
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
                context.onSuccess = () => {
                    console.error('Success should be handled at an upper level');
                };
                context.onInput = () => {
                    console.error('Input should go to the printer lib');
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
