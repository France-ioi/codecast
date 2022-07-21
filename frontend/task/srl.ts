import {Bundle} from "../linker";
import {put, select, takeEvery} from "typed-redux-saga";
import {ActionTypes} from "../common/actionTypes";
import {ActionTypes as StepperActionTypes, stepperDisplayError} from "../stepper/actionTypes";
import {Screen} from "../common/screens";
import {AppStore} from "../store";
import {StepperStepMode} from "../stepper";

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        // @ts-ignore
        yield* takeEvery(ActionTypes.AppSwitchToScreen, function* ({payload: {screen: screenName}}) {
            const environment = yield* select((state: AppStore) => state.environment);
            if (window.SrlLogger && 'main' === environment) {
                if (null === screenName) {
                    window.SrlLogger.navigation('Exercice');
                } else if (Screen.DocumentationBig === screenName || Screen.DocumentationSmall === screenName) {
                    window.SrlLogger.navigation('Aide');
                }
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.StepperExit, function* ({payload: {fromControls}}) {
            const environment = yield* select((state: AppStore) => state.environment);
            if (window.SrlLogger && 'main' === environment) {
                if (fromControls) {
                    const task = yield* select((state: AppStore) => state.task.currentTask);
                    window.SrlLogger.stepByStep(task, 'stop');
                }
            }
        });

        yield* takeEvery(StepperActionTypes.StepperRun, function* () {
            const environment = yield* select((state: AppStore) => state.environment);
            if (window.SrlLogger && 'main' === environment) {
                const task = yield* select((state: AppStore) => state.task.currentTask);
                window.SrlLogger.stepByStep(task, 'play');
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.StepperStep, function* ({payload: {mode, useSpeed}}) {
            const environment = yield* select((state: AppStore) => state.environment);
            if (window.SrlLogger && 'main' === environment) {
                if (useSpeed && StepperStepMode.Run !== mode) {
                    const task = yield* select((state: AppStore) => state.task.currentTask);
                    window.SrlLogger.stepByStep(task, 'step');
                }
            }
        });

        yield* takeEvery(StepperActionTypes.CompileFailed, function*() {
            const environment = yield* select((state: AppStore) => state.environment);
            if (window.SrlLogger && 'main' === environment) {
                window.SrlLogger.validation(0, 'code');
            }
        });

        yield* takeEvery(StepperActionTypes.StepperExecutionError, function*() {
            const environment = yield* select((state: AppStore) => state.environment);
            if (window.SrlLogger && 'main' === environment) {
                window.SrlLogger.validation(0, 'execution', 0);
            }
        });
    });
}
