import {Bundle} from "../linker";
import {call, delay, put, race, take, takeEvery} from "typed-redux-saga";
import {ActionTypes} from "../common/actionTypes";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {Screen} from "../common/screens";
import {TaskActionTypes, taskSetMenuHelpsOpen} from "./task_slice";
import {appSelect} from '../hooks';
import {App} from '../app_types';

const MENU_HELPS_MINIMUM_EXECUTION_ERRORS = 3;
const MENU_HELPS_MINIMUM_TIME = 15 * 60; // sec

export default function (bundle: Bundle) {
    bundle.addSaga(function* (app: App) {
        if ('main' !== app.environment) {
            return;
        }

        let hasOpenDocumentation;
        let hasOpenHints;
        let hasOpenHelps;
        let stepperExecutionErrorsCount;

        function resetState() {
            hasOpenDocumentation = false;
            hasOpenHints = false;
            hasOpenHelps = false;
            stepperExecutionErrorsCount = 0;
        }

        function* showMenuHelps() {
            if (hasOpenHints || hasOpenDocumentation || hasOpenHelps) {
                return;
            }

            hasOpenHelps = true;
            yield* put(taskSetMenuHelpsOpen(true));
        }

        function* hideMenuHelps() {
            const menuHelpsOpen = yield* appSelect(state => state.task.menuHelpsOpen);
            if (menuHelpsOpen) {
                yield* put(taskSetMenuHelpsOpen(false));
            }
        }

        yield* takeEvery(TaskActionTypes.TaskLoad, function* () {
            resetState();

            const result = yield* race({
                delay: delay(MENU_HELPS_MINIMUM_TIME * 1000),
                newTask: take(TaskActionTypes.TaskLoad),
            });

            if (result.delay) {
                yield* call(showMenuHelps);
            }
        });

        // @ts-ignore
        yield* takeEvery(ActionTypes.AppSwitchToScreen, function* ({payload: {screen: screenName}}) {
            if (window.SrlLogger) {
                if (Screen.DocumentationBig === screenName || Screen.DocumentationSmall === screenName) {
                    hasOpenDocumentation = true;
                    yield* call(hideMenuHelps);
                } else if (Screen.Hints === screenName) {
                    hasOpenHints = true;
                    yield* call(hideMenuHelps);
                }
            }
        });

        yield* takeEvery(StepperActionTypes.StepperExecutionError, function*() {
            stepperExecutionErrorsCount++;

            if (stepperExecutionErrorsCount >= MENU_HELPS_MINIMUM_EXECUTION_ERRORS) {
                yield* call(showMenuHelps);
            }
        });
    });
}
