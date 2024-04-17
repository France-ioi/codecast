import {channel} from 'redux-saga';
import {put, select, take} from 'typed-redux-saga';
import {
    ActionTypes,
    stepperExecutionError
} from '../actionTypes';
import {AppStore} from "../../store";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {Action} from "redux";
import {getContextBlocksDataSelector} from "../../task/blocks/blocks";
import {selectAnswer} from "../../task/selectors";
import {delay} from "../../player/sagas";
import log from 'loglevel';
import {appSelect} from '../../hooks';
import {LibraryTestResult} from '../../task/libs/library_test_result';
import {CodecastPlatform} from '../codecast_platform';
import {App, Codecast} from '../../app_types';
import {quickAlgoLibraries} from '../../task/libs/quick_algo_libraries_model';
import {documentToString} from '../../buffers/document';

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
            const context = quickAlgoLibraries.getContext(null, environment);
            const answer = selectAnswer(state);

            log.getLogger('python_runner').debug('init stepper python', environment);
            if (CodecastPlatform.Python === answer.platform) {
                let channel = pythonInterpreterChannel;

                context.onError = (diagnostics) => {
                    log.getLogger('python_runner').debug('context error', diagnostics);
                    channel.put(stepperExecutionError(LibraryTestResult.fromString(diagnostics)));
                };

                stepperState.directives = [];

                // Currently in replay we don't compile Python code.
                // TODO: compile Python code so we don't need this
                const source = documentToString(answer.document);
                const pythonSource = source + "\npass";

                const blocksData = getContextBlocksDataSelector({state, context});

                const pythonInterpreter = Codecast.runner;
                pythonInterpreter.initCodes([pythonSource], blocksData);
            }
        });
    })
};
