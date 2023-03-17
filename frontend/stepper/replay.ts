import {AppStore} from '../store';
import {call, put, select} from 'typed-redux-saga';
import {ReplayContext} from '../player/sagas';
import {ActionTypes as PlayerActionTypes} from '../player/actionTypes';
import {ActionTypes, stepperRunBackgroundFinished} from './actionTypes';
import {PlayerInstant} from '../player';
import log from 'loglevel';
import {mainQuickAlgoLogger, quickAlgoLibraries} from '../task/libs/quickalgo_libraries';
import {selectCurrentTest} from '../task/task_slice';
import {getCurrentStepperState, isStepperInterrupting} from './selectors';
import {App, Codecast} from '../index';
import {StepperContext} from './api';
import {getNodeRange, initialStateStepper, stepperMaxSpeed, StepperStatus} from './index';
import {appSelect} from '../hooks';

export function addStepperRecordAndReplayHooks(app: App) {
    const {recordApi, replayApi} = app;

    recordApi.onStart(function* (init) {
        const state = yield* appSelect();
        const stepperState = state.stepper;
        if (stepperState) {
            init.speed = stepperState.speed;
        }
    });
    replayApi.on('start', function*(replayContext: ReplayContext, event) {
        const options = event[2];
        yield* put({type: PlayerActionTypes.PlayerReset, payload: {sliceName: 'stepper', state: {...initialStateStepper}}});
        if (options.speed) {
            yield* put({type: ActionTypes.StepperSpeedChanged, payload: {speed: options.speed}});
        }
    });
    replayApi.onReset(function* (instant: PlayerInstant) {
        const stepperState = instant.state.stepper;

        yield* put({type: ActionTypes.StepperReset, payload: {stepperState}});
    });

    recordApi.on(ActionTypes.StepperExit, function* (addEvent) {
        yield* call(addEvent, 'stepper.exit');
    });
    replayApi.on('stepper.exit', function* (replayContext: ReplayContext) {
        yield* put({type: ActionTypes.StepperExit});
        replayContext.addSaga(function* () {
            log.getLogger('stepper').debug('make reset saga');
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context) {
                const state = yield* appSelect();
                context.resetAndReloadState(selectCurrentTest(state), state);
            }
        })
    });

    recordApi.on(ActionTypes.StepperRunBackgroundFinished, function* (addEvent, {payload}) {
        yield* call(addEvent, 'stepper.run_background_finished', payload.backgroundRunData);
    });
    replayApi.on('stepper.run_background_finished', function* (replayContext: ReplayContext, event) {
        const backgroundRunData = event[2];

        yield* put(stepperRunBackgroundFinished(backgroundRunData));
    });

    recordApi.on(ActionTypes.StepperStarted, function* (addEvent, action) {
        const {mode, useSpeed} = action;

        yield* call(addEvent, 'stepper.step', mode, useSpeed);
    });
    replayApi.on('stepper.step', function* (replayContext: ReplayContext, event) {
        const mode = event[2];
        const useSpeed = event[3];

        let promiseResolve;
        const promise = new Promise((resolve) => {
            promiseResolve = resolve;
        });

        const immediate = -1 !== event.indexOf('immediate');

        const waitForProgress = (stepperContext) => {
            return new Promise((cont) => {
                log.getLogger('stepper').debug('[stepper.step] stepper suspend', cont);
                stepperSuspend(stepperContext, cont);
                promiseResolve();
            });
        }

        const setStepperContext = (stepperContext) => {
            log.getLogger('stepper').debug('[stepper.step] set stepper context', stepperContext, promiseResolve);
            replayContext.stepperContext = stepperContext;
            replayContext.stepperContext.onStepperDone = promiseResolve;
        };


        log.getLogger('stepper').debug('[stepper.step] before put step', immediate);
        yield* put({
            type: ActionTypes.StepperStep,
            payload: {
                mode,
                waitForProgress,
                immediate,
                useSpeed,
                setStepperContext,
                quickAlgoCallsLogger: (call) => {
                    mainQuickAlgoLogger.logQuickAlgoLibraryCall(call);
                    replayContext.addQuickAlgoLibraryCall(call);
                },
            },
        });

        log.getLogger('stepper').debug('[stepper.step] before yield promise', promise);
        yield promise;
        log.getLogger('stepper').debug('[stepper.step] after yield promise', promise);

        replayContext.addSaga(function* () {
            const speed = yield* appSelect(state => state.stepper.speed);
            log.getLogger('stepper').debug('[stepper.step] set speed', speed);
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context && context.changeDelay) {
                context.changeDelay(stepperMaxSpeed - speed);
            }
        });
    });

    recordApi.on(ActionTypes.StepperInteractBefore, function* (addEvent, {payload}) {
        const state = yield* appSelect();
        if (isStepperInterrupting(state) || StepperStatus.Clear === state.stepper.status) {
            log.getLogger('stepper').debug('stepper is still interrupting, not logging progress');
            return;
        }

        const range = getNodeRange(getCurrentStepperState(state));
        yield* call(addEvent, 'stepper.progress', range ? range.start : null, Codecast.runner._steps, payload.stepperContext.delayToWait);
    });

    replayApi.on('stepper.progress', function* (replayContext: ReplayContext, event) {
        const delayToWait = event[4];
        log.getLogger('replay').debug('[stepper.progress] start', {delayToWait});

        const promise = new Promise((resolve) => {
            log.getLogger('replay').debug('[stepper.progress] set onStepperDone', resolve);
            replayContext.stepperContext.waitForProgress = (stepperContext) => {
                return new Promise((cont) => {
                    log.getLogger('replay').debug('[stepper.progress] stepper suspend', cont);
                    stepperSuspend(stepperContext, cont);
                    resolve(true);
                });
            };

            replayContext.stepperContext.onStepperDone = resolve;
        });

        const {resume} = replayContext.stepperContext;
        log.getLogger('replay').debug('[stepper.progress] resume', resume);
        if (resume) {
            try {
                log.getLogger('replay').debug('[stepper.progress] do resume');
                replayContext.stepperContext.delayToWait = delayToWait;
                replayContext.stepperContext.resume = null;
                resume();
                yield promise;
                log.getLogger('replay').debug('[stepper.progress] end resume');
            } catch (e) {
                console.error('exception', e);
            }
        } else {
            console.warn('There is no resume function for the stepper.progress event, skipping the event');
        }

        if (null !== delayToWait) {
            replayContext.addSaga(function* () {
                log.getLogger('replay').debug('[stepper.step] set delay to wait', delayToWait);
                const context = quickAlgoLibraries.getContext(null, 'main');
                if (context && context.changeDelay) {
                    // Apply a factor to avoid taking more time than during recording and being always laggy behind the recording
                    context.changeDelay(delayToWait * 0.9);
                }
            });
        }
    });

    recordApi.on(ActionTypes.StepperInterrupting, function* (addEvent) {
        yield* call(addEvent, 'stepper.interrupt');
    });
    replayApi.on('stepper.interrupt', function* (replayContext: ReplayContext) {
        const stepperContext = replayContext.stepperContext;

        yield* put({type: ActionTypes.StepperInterrupting, payload: {stepperContext}});
    });

    replayApi.on('stepper.restart', function* () {
        const state = yield* appSelect();
        const stepperState = yield* call(app.stepperApi.buildState, state, state.environment);

        yield* put({type: ActionTypes.StepperEnabled});
        yield* put({type: ActionTypes.StepperRestart, payload: {stepperState}});
    });

    function stepperSuspend(stepperContext: StepperContext, cont) {
        log.getLogger('stepper').debug('[stepper.suspend]');
        stepperContext.resume = cont;
    }

    recordApi.on(ActionTypes.StepperUndo, function* (addEvent) {
        yield* call(addEvent, 'stepper.undo');
    });
    replayApi.on('stepper.undo', function* () {
        yield* put({type: ActionTypes.StepperUndo});
    });

    recordApi.on(ActionTypes.StepperRedo, function* (addEvent) {
        yield* call(addEvent, 'stepper.redo');
    });
    replayApi.on('stepper.redo', function* () {
        yield* put({type: ActionTypes.StepperRedo});
    });

    recordApi.on(ActionTypes.StepperStackUp, function* (addEvent) {
        yield* call(addEvent, 'stepper.stack.up');
    });
    replayApi.on('stepper.stack.up', function* () {
        yield* put({type: ActionTypes.StepperStackUp});
    });

    recordApi.on(ActionTypes.StepperStackDown, function* (addEvent) {
        yield* call(addEvent, 'stepper.stack.down');
    });
    replayApi.on('stepper.stack.down', function* () {
        yield* put({type: ActionTypes.StepperStackDown});
    });

    recordApi.on(ActionTypes.StepperViewControlsChanged, function* (addEvent, action) {
        const {key, update} = action;

        yield* call(addEvent, 'stepper.view.update', key, update);
    });
    replayApi.on('stepper.view.update', function* (replayContext: ReplayContext, event) {
        const key = event[2];
        const update = event[3];

        yield* put({type: ActionTypes.StepperViewControlsChanged, key, update});
    });

    recordApi.on(ActionTypes.StepperSpeedChanged, function* (addEvent, action) {
        const {payload: {speed}} = action;

        yield* call(addEvent, 'stepper.speed.changed', speed);
    });
    replayApi.on('stepper.speed.changed', function* (replayContext: ReplayContext, event) {
        const speed = event[2];

        yield* put({type: ActionTypes.StepperSpeedChanged, payload: {speed}});

        replayContext.addSaga(function* () {
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context && context.changeDelay) {
                context.changeDelay(stepperMaxSpeed - speed);
            }
        });
    });

    recordApi.on(ActionTypes.StepperControlsChanged, function* (addEvent, action) {
        const {payload: {controls}} = action;

        yield* call(addEvent, 'stepper.controls.changed', controls);
    });
    replayApi.on('stepper.controls.changed', function* (replayContext: ReplayContext, event) {
        const controls = event[2];

        yield* put({type: ActionTypes.StepperControlsChanged, payload: {controls}});
    });

    recordApi.on(ActionTypes.StepperClearError, function* (addEvent) {
        yield* call(addEvent, 'stepper.clear_error');
    });
    replayApi.on(['compile.clearDiagnostics', 'stepper.clear_error'], function* () {
        yield* put({type: ActionTypes.StepperClearError});
    });

}
