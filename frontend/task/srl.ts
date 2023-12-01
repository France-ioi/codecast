import {Bundle} from "../linker";
import {call, put, select, takeEvery} from "typed-redux-saga";
import {ActionTypes} from "../common/actionTypes";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {Screen} from "../common/screens";
import {StepperStepMode} from "../stepper";
import {taskReloadStateEvent} from "./platform/actionTypes";
import {hintUnlocked} from "./hints/hints_slice";
import {AppStore} from "../store";
import {taskSetBlocksUsage, taskSuccess} from "./task_slice";
import log from 'loglevel';
import {appSelect} from '../hooks';

import {callPlatformValidate} from '../submission/submission_actions';
import {App} from '../app_types';
import {quickAlgoLibraries} from './libs/quick_algo_libraries_model';

export interface StatsState {
    timeSpentSeconds?: number,
    incorrectSubmissionsCount: number,
    blocksUsed: number,
    hintsTaken: number,
    documentationOpened: boolean,
}

let timeSpentStartDate = new Date();

let currentState: StatsState = {
    timeSpentSeconds: 0,
    incorrectSubmissionsCount: 0,
    blocksUsed: 0,
    hintsTaken: 0,
    documentationOpened: false,
}

export function* statsGetStateSaga(): Generator<any, StatsState, any> {
    const state = yield* appSelect();

    const context = quickAlgoLibraries.getContext(null, state.environment);

    return {
        ...currentState,
        timeSpentSeconds: currentState.timeSpentSeconds + Math.round(((new Date()).getTime() - timeSpentStartDate.getTime()) / 1000),
        ...(context.infos.usedSkills ? {usedSkills: context.infos.usedSkills} : {}),
        ...(context.infos.targetNbInstructions ? {targetNbInstructions: context.infos.targetNbInstructions} : {}),
    };
}

function* statsReloadStateSaga({payload: {state}}: ReturnType<typeof taskReloadStateEvent>) {
    log.getLogger('task').debug('receive new state from platform', state);
    if (state && state.stats) {
        currentState = {
            ...currentState,
            ...state.stats,
        };
        timeSpentStartDate = new Date();
    }
}

function* onValidationErrorSaga() {
    currentState.incorrectSubmissionsCount++;
    const state = yield* appSelect();
    const context = quickAlgoLibraries.getContext(null, 'main');
    if (context && context.addSound && 'tralalere' === state.options.app) {
        context.addSound('validationError');
    }
}

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
                    currentState.documentationOpened = true;
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
        yield* takeEvery(StepperActionTypes.StepperStepFromControls, function* ({payload: {mode, useSpeed}}) {
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (useSpeed && StepperStepMode.Run !== mode) {
                if (window.SrlLogger) {
                    window.SrlLogger.stepByStep({context}, 'step');
                }
            } else if (useSpeed && StepperStepMode.Run === mode) {
                if (window.SrlLogger) {
                    window.SrlLogger.stepByStep({context}, 'play');
                }
            }
        });

        // @ts-ignore
        yield* takeEvery(StepperActionTypes.Compile, function* ({payload: {fromControls}}) {
            if (fromControls) {
                const logAttempts = yield* appSelect(state => state.options.logAttempts);
                if (logAttempts) {
                    yield* put(callPlatformValidate('log'));
                }
            }
        });

        yield* takeEvery(StepperActionTypes.CompileFailed, function*() {
            yield* call(onValidationErrorSaga);
            if (window.SrlLogger) {
                window.SrlLogger.validation(0, 'code');
            }
        });

        yield* takeEvery(StepperActionTypes.StepperExecutionError, function*() {
            yield* call(onValidationErrorSaga);
            if (window.SrlLogger) {
                window.SrlLogger.validation(0, 'execution', 0);
            }
        });

        yield* takeEvery(taskSuccess, function*() {
            const state = yield* appSelect();
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context && context.addSound && 'tralalere' === state.options.app) {
                context.addSound('validationSuccess');
            }
        });

        yield* takeEvery(taskReloadStateEvent, statsReloadStateSaga);

        yield* takeEvery(hintUnlocked, function*() {
            const hintsUnlocked = yield* appSelect(state => state.hints.unlockedHintIds.length);
            currentState.hintsTaken = Math.max(currentState.hintsTaken, hintsUnlocked);
        });

        yield* takeEvery(taskSetBlocksUsage, function*() {
            const blockUsage = yield* appSelect(state => state.task.blocksUsage);
            if (blockUsage && null !== blockUsage.blocksCurrent) {
                currentState.blocksUsed = blockUsage.blocksCurrent;
            }
        });
    });
}
