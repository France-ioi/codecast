import {Bundle} from "../../linker";
import {apply, call, put, spawn, takeEvery} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes} from "../../stepper/actionTypes";
import {selectCurrentTestData, taskUpdateState} from "../task_slice";
import {makeContext, QuickalgoLibraryCall} from "../../stepper/api";
import {createRunnerSaga} from "../../stepper";
import log from 'loglevel';
import {appSelect} from '../../hooks';
import {DefaultQuickalgoLibrary} from './default_quickalgo_library';
import {App, Codecast} from '../../app_types';
import {quickAlgoLibraries} from './quick_algo_libraries_model';
import {mainQuickAlgoLogger} from './quick_algo_logger';
import {selectActiveBufferPlatform} from '../../buffers/buffer_selectors';

export enum QuickAlgoLibrariesActionType {
    QuickAlgoLibrariesRedrawDisplay = 'quickalgoLibraries/redrawDisplay',
}

window.quickAlgoContext = function (display: boolean, infos: any) {
    return new DefaultQuickalgoLibrary(display, infos);
}

export function* quickAlgoLibraryResetAndReloadStateSaga(innerState = null) {
    const state = yield* appSelect();
    const currentTest = selectCurrentTestData(state);

    for (let [name, library] of Object.entries(quickAlgoLibraries.getAllLibrariesByName(state.environment))) {
        log.getLogger('libraries').debug('quickalgo reset and reload state', state.environment, library, innerState, currentTest);
        const libraryInnerState = 'object' === typeof innerState && innerState && name in innerState ? innerState[name] : null;
        library.resetAndReloadState(currentTest, state, libraryInnerState);
    }

    const contextState = quickAlgoLibraries.getLibrariesInnerState(state.environment);
    log.getLogger('libraries').debug('get new state without instant', contextState);
    yield* put(taskUpdateState(contextState));
}

export function* quickAlgoLibraryRedrawDisplaySaga(app: App) {
    const state = yield* appSelect();

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context && 'main' === state.environment && !context.implementsInnerState()) {
        const callsToReplay = mainQuickAlgoLogger.getQuickAlgoLibraryCalls();
        log.getLogger('libraries').debug('calls to replay', callsToReplay);
        yield* call(contextReplayPreviousQuickalgoCalls, app, callsToReplay);
    }
}

export function* contextReplayPreviousQuickalgoCalls(app: App, quickAlgoCalls: QuickalgoLibraryCall[]) {
    yield* call(quickAlgoLibraryResetAndReloadStateSaga);

    log.getLogger('libraries').debug('replay previous quickalgo calls', quickAlgoCalls);
    const platform = yield* appSelect(selectActiveBufferPlatform);
    if (!Codecast.runner) {
        Codecast.runner = yield* call(createRunnerSaga, platform);
    }
    const environment = yield* appSelect(state => state.environment);
    const context = quickAlgoLibraries.getContext(null, environment);
    if (context) {
        context.runner = Codecast.runner;
    }

    const stepperContext = makeContext(null, {
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
        // Don't re-log already logged calls
        quickAlgoCallsLogger: () => {},
    });

    const executor = stepperContext.quickAlgoCallsExecutor;

    log.getLogger('libraries').debug('our executor', executor);

    for (let quickalgoCall of quickAlgoCalls) {
        const {module, action, args} = quickalgoCall;
        log.getLogger('libraries').debug('start call execution', quickalgoCall);

        // @ts-ignore
        yield* spawn(executor, module, action, args);
    }

    mainQuickAlgoLogger.setQuickAlgoLibraryCalls(quickAlgoCalls);
}

export default function(bundle: Bundle) {
    bundle.addSaga(function* (app: App) {
        // @ts-ignore
        yield* takeEvery(QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay, function* () {
            log.getLogger('libraries').debug('ici redraw display');
            const state = yield* appSelect();
            const context = quickAlgoLibraries.getContext(null, state.environment);
            if (context) {
                context.needsRedrawDisplay = false;
                if ('main' === app.environment) {
                    context.display = true;
                }
            }

            const contextState = quickAlgoLibraries.getLibrariesInnerState(state.environment);
            yield* call(quickAlgoLibraryResetAndReloadStateSaga, contextState);

            if (context) {
                // @ts-ignore
                if (context.redrawDisplay) {
                    // @ts-ignore
                    yield* apply(context, context.redrawDisplay);
                    log.getLogger('libraries').debug('redraw display done it');
                } else {
                    yield* call(quickAlgoLibraryRedrawDisplaySaga, app);
                }
            }
        });
    });
};
