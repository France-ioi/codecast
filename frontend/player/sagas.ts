// An instant has shape {t, eventIndex, state},
// where state is an Immutable Map of shape {source, input, syntaxTree, stepper, stepperInitial}
// where source and input are buffer models (of shape {document, selection, firstVisibleRow}).

import {buffers, eventChannel} from 'redux-saga';
import {call, put, race, take, takeLatest, spawn} from 'typed-redux-saga';
import {findInstantIndex} from './utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {ActionTypes as LayoutActionTypes} from "../task/layout/actionTypes";
import {getPlayerState} from "./selectors";
import {AppStore, AppStoreReplay} from "../store";
import {PlayerInstant} from "./index";
import {Bundle} from "../linker";
import {makeContext, QuickalgoLibraryCall, StepperContext} from "../stepper/api";
import {ReplayApi} from "./replay";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {inputBufferLibTest, PrinterLibActionTypes} from "../task/libs/printer/printer_lib";
import {RECORDING_FORMAT_VERSION} from "../version";
import {createDraft, finishDraft} from "immer";
import {asyncGetJson} from "../utils/api";
import {currentTaskChangePredefined, taskLoaded} from "../task/task_slice";
import {isTaskPlatformLinked} from "../task/platform/platform";
import {createRunnerSaga} from "../stepper";
import {delay as delay$1} from 'typed-redux-saga';
import {platformTaskLink} from '../task/platform/actionTypes';
import log from 'loglevel';
import {appSelect} from '../hooks';
import {DeferredPromise} from '../utils/app';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {taskLoad} from '../task/task_actions';
import {App, Codecast} from '../app_types';
import {quickAlgoLibraries} from '../task/libs/quick_algo_libraries_model';
import {LayoutPlayerMode} from '../task/layout/layout_types';
import {StepperProgressParameters} from '../stepper/stepper_types';

export default function(bundle: Bundle) {
    bundle.addSaga(playerSaga);
};

export interface ReplayContext {
    state: AppStoreReplay,
    events: any[],
    recordingVersion?: string,
    instants: PlayerInstant[],
    instant: PlayerInstant,
    applyEvent: any,
    addSaga: Function,
    addQuickAlgoLibraryCall: (call: QuickalgoLibraryCall, result: unknown) => void,
    reportProgress: any,
    stepperDone: any,
    stepperContext: StepperContext
}

let timersStarted = 0;
let timersEnded = 0;
// /!\ Use this custom delay function and not the one from redux-saga
// Using this function, when we create a new delay in the code,
// during replay it will wait for this delay to be over
// before moving to the next event to replay
export function* delay<T = true>(
    ms: number,
    val?: T,
) {
    timersStarted++;

    let returned;
    try {
        returned = yield* delay$1(ms, val);
    } finally {
        timersEnded++;
    }

    return returned;
}


function* playerSaga(action) {
    yield* takeLatest(ActionTypes.PlayerPrepare, playerPrepare, action);

    /* Use redux-saga takeLatest to cancel any executing replay saga. */
    const anyReplayAction = [
        ActionTypes.PlayerStart,
        ActionTypes.PlayerPause,
        ActionTypes.PlayerSeek
    ];

    yield* takeLatest(anyReplayAction, replaySaga, action);

    yield* takeLatest(ActionTypes.PlayerApplyReplayEvent, playerReplayEvent, action);
}

function* playerPrepare(app: App, action) {
    const {replayApi} = app;

    /*
      baseDataUrl is forwarded to playerReady (stored in its reducer) in order
        to serve as the base URL for subtitle files (in the player & editor).
      audioUrl, eventsUrl need to be able to be passed independently by the
        recorder, where they are "blob:" URLs.
    */
    const {baseDataUrl, audioUrl, resetTo} = action.payload;

    // Check that the player is idle.
    let state = yield* appSelect();
    const player = getPlayerState(state);
    if (player.isPlaying) {
        return;
    }

    // Emit a Preparing action.
    yield* put({type: ActionTypes.PlayerPreparing});

    /* Load the audio. */
    const audio = player.audio;
    audio.src = audioUrl;
    audio.load();

    if (navigator && navigator.mediaSession) {
        navigator.mediaSession.setActionHandler('play', function(ev) {
            log.getLogger('player').debug('[media session] made play');
            audio.pause();
            app.dispatch({type: LayoutActionTypes.LayoutPlayerModeBackToReplay, payload: {resumeImmediately: true}});
        });

        navigator.mediaSession.setActionHandler('pause', function(ev) {
            log.getLogger('player').debug('[media session] made pause', ev);
            app.dispatch({type: ActionTypes.PlayerPause});
        });
    }

    /* Load the events. */
    let data;
    if (action.payload.data) {
        data = action.payload.data;
    } else {
        data = yield* call(asyncGetJson, action.payload.eventsUrl);
    }
    data = Object.freeze(data);

    if (Array.isArray(data)) {
        yield* put({
            type: ActionTypes.PlayerPrepareFailure,
            payload: {message: "recording is incompatible with this player"}
        });

        return;
    }

    if (data.selectedTask) {
        yield* put(currentTaskChangePredefined(data.selectedTask));
    }

    /* Compute the future state after every event. */
    const chan = yield* call(requestAnimationFrames, 50);

    let platform = CodecastPlatform.Cpp;
    if (data.options) {
        platform = data.options.platform;
    }

    if (platform !== state.options.platform) {
        yield* put({
            type: CommonActionTypes.PlatformChanged,
            payload: {
                platform,
                reloadTask: false,
            },
        });
    }

    if (!isTaskPlatformLinked()) {
        yield* put(platformTaskLink());
        yield* take(taskLoaded.type);
    }

    state = yield* appSelect();

    const replayState = {
        task: {
            currentTask: state.task.currentTask,
            currentLevel: state.task.currentLevel,
            currentTestId: state.task.currentTestId,
        },
        options: {
            platform,
            audioUrl: null,
            task: null,
        },
    };

    if (data.options) {
        replayState.options = data.options;
    }
    replayState.options.audioUrl = audioUrl;
    replayState.options.task = state.task.currentTask;

    const replayContext: ReplayContext = {
        state: replayState as AppStore,
        events: data.events,
        recordingVersion: data.version,
        instants: [],
        instant: null,
        stepperContext: null,
        stepperDone: null,
        applyEvent: replayApi.applyEvent,
        addSaga,
        addQuickAlgoLibraryCall,
        reportProgress,
    };

    try {
        // setTaskEventsEnvironment('replay');
        yield* call(computeInstants, replayApi, replayContext);
        // setTaskEventsEnvironment('main');

        /* The duration of the recording is the timestamp of the last event. */
        const instants = replayContext.instants;
        const duration = instants[instants.length - 1].t;
        yield* put({type: ActionTypes.PlayerReady, payload: {baseDataUrl, duration, data, instants}});
        yield* put({type: LayoutActionTypes.LayoutPlayerModeChanged, payload: {playerMode: LayoutPlayerMode.Replay}});

        if ('end' === resetTo) {
            yield* call(resetToAudioTime, app, duration);
        } else {
            yield* call(resetToAudioTime, app, 0);
        }
    } catch (ex) {
        console.error(ex);

        yield* put({
            type: ActionTypes.PlayerPrepareFailure,
            payload: {message: `${ex.toString()}`, context: replayContext}
        });

        return null;
    } finally {
        chan.close();
    }

    function addSaga(saga) {
        let {sagas} = replayContext.instant;
        if (!sagas) {
            sagas = replayContext.instant.sagas = [];
        }

        sagas.push(saga);
    }

    function addQuickAlgoLibraryCall(quickalgoLibraryCall: QuickalgoLibraryCall, result: unknown) {
        let {quickalgoLibraryCalls} = replayContext.instant;
        if (!quickalgoLibraryCalls) {
            quickalgoLibraryCalls = replayContext.instant.quickalgoLibraryCalls = [];
        }

        quickalgoLibraryCalls.push({call: quickalgoLibraryCall, result});
    }

    function* reportProgress(progress) {
        yield* put({type: ActionTypes.PlayerPrepareProgress, payload: {progress}});

        /* Allow the display to refresh. */
        yield* take(chan);
    }
}

function ensureBackwardsCompatibility(events: any[][], version?: string) {
    let transformedEvents = [];
    let versionComponents = (version ? version : RECORDING_FORMAT_VERSION).split('.').map(Number);

    for (let event of events) {
        let [t, key, ...params] = event;

        /**
         * For version < 6, the translate.success action, now renamed to compile.success used to contain :
         * {
         *   ast,
         *   diagnostics
         * }
         *
         * Now it should contain :
         * {
         *   response: {
         *     ast,
         *     diagnotics,
         *     platform: CodecastPlatform.Unix,
         *   }
         * }
         */
        if (key === 'translate.success') {
            params[0] = {
                response: {
                    ...params[0],
                    platform: CodecastPlatform.Cpp,
                }
            };
        }

        /**
         * Get the action name.
         * Note : translate.* actions have been replaced by compile.* actions from version 6.
         */
        key = key.replace('translate.', 'compile.');

        if (key === 'terminal.key') {
            key = PrinterLibActionTypes.PrinterLibTerminalInputKey;
        }
        if (key === 'terminal.backspace') {
            key = PrinterLibActionTypes.PrinterLibTerminalInputBackSpace;
        }
        if (key === 'terminal.enter') {
            key = PrinterLibActionTypes.PrinterLibTerminalInputEnter;
        }

        if ((key === 'stepper.step' || key === 'stepper.progress') && versionComponents[0] < 7) {
            // Special mode to ensure backwards compatibility, we didn't have timeouts between each step in previous versions
            params.push('immediate');
        }

        if (key.split('.')[0] === 'buffer' && params[0] === 'input') {
            params[0] = inputBufferLibTest;
        }
        if (key === 'start' && params.length && params[0].buffers && 'input' in params[0].buffers) {
            params[0].buffers[inputBufferLibTest] = params[0].buffers.input;
            delete params[0].buffers.input;
        }
        if (key.split('.')[0] === 'buffer' && params[0] === 'output' && versionComponents[0] < 7) {
            // There was no such thing as expected output before v7
            continue;
        }

        if ('stepper.progress' === key && (versionComponents[0] < 7 || (versionComponents[0] === 7 && versionComponents[1] < 5))) {
            // Since Codecast 7.5, stepper.progress only accepts an object as the 3rd parameter: time, 'stepper.progress', {range, steps, delayToWait}
            // Before, it was a list of parameters: time, 'stepper.progress', range, steps, delayToWait
            const stepperProgressParameters: StepperProgressParameters = {};
            if (1 <= params.length) {
                stepperProgressParameters.range = params[0];
            }
            if (2 <= params.length) {
                stepperProgressParameters.steps = params[1];
            }
            if (3 <= params.length) {
                stepperProgressParameters.delay = params[2];
            }

            params = [stepperProgressParameters];
        }

        transformedEvents.push([t, key, ...params]);

        if (key === 'stepper.step' && params[0] === 'run' && versionComponents[0] < 7) {
            transformedEvents.push([t, 'stepper.progress', {}]);
        }
    }

    return transformedEvents;
}

function* computeInstants(replayApi: ReplayApi, replayContext: ReplayContext) {
    /* CONSIDER: create a redux store, use the replayApi to convert each event
       to an action that is dispatched to the store (which must have an
       appropriate reducer) plus an optional saga to be called during playback. */
    let pos, progress, lastProgress = 0, range = null;
    const recordingEvents = replayContext.events;
    const events = ensureBackwardsCompatibility(recordingEvents, replayContext.recordingVersion);
    log.getLogger('player').debug('Backward protected events', events);
    const duration = events[events.length - 1][0];
    const replayStore = Codecast.environments['replay'].store;

    yield* call(replayStore.dispatch, {type: AppActionTypes.AppInit, payload: {options: {...replayContext.state.options}, environment: 'replay'}});

    const deferredPromise = new DeferredPromise();
    yield* call(replayStore.dispatch, taskLoad({callback: deferredPromise.resolve}));
    yield deferredPromise.promise;

    for (pos = 0; pos < events.length; pos += 1) {
        const event = events[pos];
        const t = event[0];
        const key = event[1];

        const instant: PlayerInstant = {t, pos, event} as PlayerInstant;
        replayContext.instant = instant;

        log.getLogger('player').debug('-------- REPLAY ---- EVENT ----', key, event);
        yield new Promise(resolve => {
            replayStore.dispatch({type: PlayerActionTypes.PlayerApplyReplayEvent, payload: {replayApi, key, replayContext, event, resolve}});
        });
        log.getLogger('player').debug('END REPLAY EVENT (computeInstants)');

        // Get Redux state and context state and store them
        const instantState = createDraft(replayStore.getState());
        instantState.task.state = quickAlgoLibraries.getLibrariesInnerState('replay');
        instant.state = finishDraft(instantState);

        Object.freeze(instant);
        log.getLogger('player').debug('new instant', instant.state);

        replayContext.instants.push(instant);
        progress = Math.round(pos * 50 / events.length + t * 50 / duration) / 100;
        if (progress !== lastProgress) {
            lastProgress = progress;
            yield* call(replayContext.reportProgress, progress);
        }
    }
}

/**
 * This redux saga has been dispatched in the replay store and occurs in this store
 */
function* playerReplayEvent(app: App, {type, payload}) {
    const {replayApi, key, replayContext, event, resolve} = payload;
    const environment = app.environment;
    log.getLogger('replay').debug('START REPLAY EVENT (playerReplayEvent)', type, payload, environment);

    const triggeredEffects = {};

    Codecast.environments[environment].monitoring.clearListeners();
    Codecast.environments[environment].monitoring.effectTriggered(({effectId}) => {
        triggeredEffects[effectId] = false;
    });
    Codecast.environments[environment].monitoring.effectResolved((effectId) => {
        triggeredEffects[effectId] = true;
    });
    Codecast.environments[environment].monitoring.effectRejected((effectId) => {
        triggeredEffects[effectId] = true;
    });
    Codecast.environments[environment].monitoring.effectCancelled((effectId) => {
        triggeredEffects[effectId] = true;
    });

    // Play event, except if we need an input: in this case, end the event execution and continue
    // playing events until we get the input
    yield* race({
        event: call(replayApi.applyEvent, key, replayContext, event),
        inputNeeded: take('task/taskInputNeeded'),
    });

    let remainingEffects = null;
    let steps = 0;
    while (true) {
        let newRemainingEffects = JSON.stringify(Object.keys(triggeredEffects).filter(effectId => !triggeredEffects[effectId]));
        log.getLogger('replay').debug('new remaining effects', newRemainingEffects, timersStarted, timersEnded);
        if (newRemainingEffects === remainingEffects && timersStarted === timersEnded) {
            break;
        }

        remainingEffects = newRemainingEffects;
        log.getLogger('replay').debug('PLAY REPLAY, before yield', steps);
        yield* delay(0);
        log.getLogger('replay').debug('after wait delay', steps);
        steps++;
    }

    log.getLogger('replay').debug('END REPLAY EVENT (playerReplayEvent)');
    resolve();
}

function* replaySaga(app: App, {type, payload}) {
    const state = yield* appSelect();
    const player = getPlayerState(state);
    const isPlaying = player.isPlaying;
    const audio = player.audio;
    const instants = player.instants;
    let audioTime = player.audioTime;
    let instant = player.current;

    if (type === ActionTypes.PlayerStart && !player.isReady) {
        /* Prevent starting playback until ready.  Should perhaps wait until
           preparation is done, for autoplay. */
        return;
    }
    if (type === ActionTypes.PlayerStart) {
        /* If at end of stream, restart automatically. */
        if (instant.isEnd) {
            audioTime = 0;
            audio.currentTime = 0;
        }
        /* The player was started (or resumed), reset to the current instant to
           clear any possible changes to the state prior to entering the update
           loop. */
        yield* call(resetToAudioTime, app, audioTime);

        /* Disable the stepper during playback, its states are pre-computed. */
        yield* put({type: StepperActionTypes.StepperDisabled});

        /* Play the audio now that an accurate state is displayed. */
        audio.play();

        yield* put({type: ActionTypes.PlayerStarted});
    }

    if (type === ActionTypes.PlayerPause) {
        /* The player is being paused.  The audio is paused first, then the
           audio time is used to reset the state accurately. */
        audio.pause();

        const audioTime = Math.round(audio.currentTime * 1000);
        if (!payload || false !== payload.reset) {
            yield* call(resetToAudioTime, app, audioTime);
        }

        yield* call(restartStepper);
        yield* put({type: ActionTypes.PlayerPaused});

        return;
    }

    if (type === ActionTypes.PlayerSeek) {
        let start = window.performance.now();

        if (!isPlaying) {
            /* The stepper is disabled before a seek-while-paused, as it could be
               waiting on I/O. */
            yield* put({type: StepperActionTypes.StepperDisabled});
        }
        /* Refreshing the display first then make the jump in the audio should
           make a cleaner jump, as audio will not start playing at the new
           position until the new state has been rendered. */
        const audioTime = Math.max(0, Math.min(player.duration, payload.audioTime));
        yield* call(resetToAudioTime, app, audioTime);
        if (!isPlaying) {
            /* The stepper is restarted after a seek-while-paused, in case it is
               waiting on I/O. */
            yield* call(restartStepper);
        }

        yield* put({type: ActionTypes.PlayerSeeked, seekTo: audioTime});

        audio.currentTime = audioTime / 1000;
        if (!isPlaying) {
            return;
        }

        /* fall-through for seek-during-playback, which is handled by the
           periodic update loop */
    }

    /* The periodic update loop runs until cancelled by another replay action. */
    const chan = yield* call(requestAnimationFrames, 50);
    try {
        while (!(yield* appSelect(state => state.player.current.isEnd))) {
            /* Use the audio time as reference. */
            let endTime = Math.round(audio.currentTime * 1000);
            if (audio.ended) {
                /* Extend a short audio to the timestamp of the last event. */
                endTime = instants[instants.length - 1].t;
            }

            if (endTime < audioTime || audioTime + 2000 < endTime) {
                /* Audio time has jumped. */
                yield* call(resetToAudioTime, app, endTime);
            } else {
                /* Continuous playback. */
                yield* call(replayToAudioTime, app, instants, audioTime, endTime);
            }

            audioTime = endTime;

            yield* take(chan);
        }
    } finally {
        chan.close();
    }

    /* Pause when the end event is reached. */
    yield* put({type: ActionTypes.PlayerPause});
}

function* replayToAudioTime(app: App, instants: PlayerInstant[], startTime: number, endTime: number) {
    let instantIndex = findInstantIndex(instants, startTime);
    const nextInstantIndex = findInstantIndex(instants, endTime);
    if (instantIndex === nextInstantIndex) {
        /* Fast path: audio time has advanced but we are still at the same
           instant, just emit a tick event to update the audio time. */
        yield* put({type: ActionTypes.PlayerTick, payload: {audioTime: endTime}});

        return;
    }

    log.getLogger('player').debug('replay, new instants', instantIndex, nextInstantIndex);

    /* Update the DOM by replaying incremental events between (immediately
       after) `instant` and up to (including) `nextInstant`. */
    instantIndex += 1;
    while (instantIndex <= nextInstantIndex) {
        log.getLogger('player').debug('upgrade instant');
        let instant = instants[instantIndex];
        if (instant.hasOwnProperty('mute')) {
            yield* put({type: ActionTypes.PlayerEditorMutedChanged, payload: {isMuted: instant.mute}});
        }
        if (instant.hasOwnProperty('jump')) {
            // @ts-ignore
            yield* call(jumpToAudioTime, app, instant.jump);

            return;
        }

        if (instant.sagas) {
            /* Keep in mind that the instant's saga runs *prior* to the call
               to resetToAudioTime below, and should not rely on the global
               state being accurate.  Instead, it should use `instant.state`. */
            for (let saga of instant.sagas) {
                yield* call(saga, instant);
            }
        }

        if (instant.quickalgoLibraryCalls && instant.quickalgoLibraryCalls.length) {
            log.getLogger('player').debug('replay quickalgo library call', instant.quickalgoLibraryCalls.map(element => element.call.action).join(','));
            const context = quickAlgoLibraries.getContext(null, 'main');
            // We start from the end state of the last instant, and apply the calls that happened during this instant
            const stepperState = instants[instantIndex-1].state.stepper;
            if (context) {
                if (!Codecast.runner) {
                    Codecast.runner = yield* call(createRunnerSaga, stepperState?.currentStepperState?.platform);
                }
                context.runner = Codecast.runner;

                const stepperContext = makeContext(stepperState, {
                    interactAfter: (arg) => {
                        return new Promise((resolve, reject) => {
                            app.dispatch({
                                type: StepperActionTypes.StepperInteract,
                                payload: {stepperContext, arg},
                                meta: {resolve, reject}
                            });
                        });
                    },
                    dispatch: app.dispatch,
                    environment: app.environment,
                    // waitPreviousAnimations: false,
                });

                // Context.changeDelay is done in a replay saga in stepper/replay.ts
                const executor = stepperContext.quickAlgoCallsExecutor;
                log.getLogger('player').debug('Replay call with speed', stepperContext.speed, context.infos.actionDelay);
                for (let quickalgoCall of instant.quickalgoLibraryCalls) {
                    const {module, action, args} = quickalgoCall.call;
                    log.getLogger('player').debug('start call execution', quickalgoCall);

                    if (undefined !== quickalgoCall.result) {
                        // Avoid re-making the call, use directly the result
                        stepperContext.libraryCallsLog = [{
                            call: quickalgoCall.call,
                            result: quickalgoCall.result,
                        }];
                    }

                    // @ts-ignore
                    yield* spawn(executor, module, action, args);
                }
            }
        }
        if (instant.isEnd) {
            /* Stop a long audio at the timestamp of the last event. */
            endTime = instant.t;
            break;
        }

        instantIndex += 1;
    }

    /* Perform a quick reset to update the editor models without pushing
       the new state to the editors instances (they are assumed to have
       been synchronized by replaying individual events).
    */
    yield* call(resetToAudioTime, app, endTime, true);
}

/* A quick reset avoids disabling and re-enabling the stepper (which restarts
   the stepper task). */
function* resetToAudioTime(app: App, audioTime: number, quick?: boolean) {
    const {replayApi} = app;

    /* Call playerTick to store the current audio time and to install the
       current instant's state as state.player.current */
    yield* put({type: ActionTypes.PlayerTick, payload: {audioTime}});

    /* Call the registered reset-sagas to update any part of the state not
       handled by playerTick. */
    const state = yield* appSelect();
    const instant = state.player.current;

    yield* call(replayApi.reset, instant, quick);
}

function* restartStepper() {
    /* Re-enable the stepper to allow the user to interact with it. */
    log.getLogger('player').debug('restart stepper');
    yield* put({type: StepperActionTypes.StepperEnabled});
}

function* jumpToAudioTime(app: App, audioTime: number) {
    /* Jump and full reset to the specified audioTime. */
    const state = yield* appSelect();
    const player = getPlayerState(state);
    audioTime = Math.max(0, Math.min(player.duration, audioTime));
    const audio = player.audio;
    audio.currentTime = audioTime / 1000;

    yield* call(resetToAudioTime, app, audioTime);
}

function requestAnimationFrames(maxDelta) {
    let shutdown = false;
    let lastTimestamp = 0;
    return eventChannel(function(emitter) {
        function onAnimationFrame(timestamp) {
            if (timestamp >= lastTimestamp + maxDelta) {
                lastTimestamp = timestamp;
                emitter(timestamp);
            }
            if (!shutdown) {
                window.requestAnimationFrame(onAnimationFrame);
            }
        }

        window.requestAnimationFrame(onAnimationFrame);
        return function() {
            shutdown = true;
        };
    }, buffers.sliding(1));
}
