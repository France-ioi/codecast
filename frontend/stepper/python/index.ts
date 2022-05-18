import {channel} from 'redux-saga';
import {put, take} from 'typed-redux-saga';
import {ActionTypes as CompileActionTypes, stepperExecutionError} from '../actionTypes';
import {AppStore, CodecastPlatform} from "../../store";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {App, Codecast} from "../../index";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_libraries";
import {Action} from "redux";
import {getContextBlocksDataSelector} from "../../task/blocks/blocks";
import {selectAnswer} from "../../task/selectors";

export default function(bundle: Bundle) {
    const pythonInterpreterChannel = channel<Action>();

    bundle.addSaga(function* watchPythonInterpreterChannel() {
        while (true) {
            const action = yield* take<Action>(pythonInterpreterChannel);
            yield* put(action);
        }
    });

    bundle.defer(function({stepperApi}: App) {
        stepperApi.onInit(function(stepperState: StepperState, state: AppStore, environment: string) {
            const {platform} = state.options;
            const source = selectAnswer(state);
            const context = quickAlgoLibraries.getContext(null, environment);

            console.log('init stepper', environment);
            if (platform === CodecastPlatform.Python) {
                let channel = pythonInterpreterChannel;

                context.onError = (diagnostics) => {
                    console.log('context error', diagnostics);
                    channel.put({
                        type: CompileActionTypes.StepperInterrupting,
                    });
                    channel.put(stepperExecutionError(diagnostics));
                };

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

                const blocksData = getContextBlocksDataSelector(state, context);

                const pythonInterpreter = Codecast.runner;
                pythonInterpreter.initCodes([pythonSource], blocksData);
            }
        });
    })
};
