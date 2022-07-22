import {Bundle} from "../linker";
import {takeEvery} from "typed-redux-saga";
import {ActionTypes} from "../common/actionTypes";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {Screen} from "../common/screens";
import {StepperStepMode} from "../stepper";
import {App} from "../index";
import {quickAlgoLibraries} from "./libs/quickalgo_libraries";

export default function (bundle: Bundle) {
    bundle.addSaga(function* (app: App) {
        if ('main' !== app.environment) {
            return;
        }

        // @ts-ignore
        yield* takeEvery(ActionTypes.AppSwitchToScreen, function* ({payload: {screen: screenName}}) {
            if (window.SrlLogger) {
                if (null === screenName) {
                    window.SrlLogger.navigation('Exercice');
                } else if (Screen.DocumentationBig === screenName || Screen.DocumentationSmall === screenName) {
                    window.SrlLogger.navigation('Aide');
                }
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.StepperExit, function* ({payload}) {
            if (window.SrlLogger && payload?.fromControls) {
                const context = quickAlgoLibraries.getContext(null, 'main');
                window.SrlLogger.stepByStep({context}, 'stop');
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.StepperStep, function* ({payload: {mode, useSpeed}}) {
            if (window.SrlLogger) {
                const context = quickAlgoLibraries.getContext(null, 'main');
                if (useSpeed && StepperStepMode.Run !== mode) {
                    window.SrlLogger.stepByStep({context}, 'step');
                } else if (useSpeed && StepperStepMode.Run === mode) {
                    window.SrlLogger.stepByStep({context}, 'play');
                }
            }
        });

        yield* takeEvery(StepperActionTypes.CompileFailed, function*() {
            if (window.SrlLogger) {
                window.SrlLogger.validation(0, 'code');
            }
        });

        yield* takeEvery(StepperActionTypes.StepperExecutionError, function*() {
            if (window.SrlLogger) {
                window.SrlLogger.validation(0, 'execution', 0);
            }
        });
    });
}
