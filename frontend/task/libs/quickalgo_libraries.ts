import {Bundle} from "../../linker";
import {apply, call, put, spawn, takeEvery} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes} from "../../stepper/actionTypes";
import {getCurrentImmerState} from "../utils";
import {selectCurrentTestData, taskUpdateState} from "../task_slice";
import {makeContext, QuickalgoLibraryCall} from "../../stepper/api";
import {createRunnerSaga} from "../../stepper";
import log from 'loglevel';
import {appSelect} from '../../hooks';
import {DefaultQuickalgoLibrary} from './default_quickalgo_library';
import {App, Codecast} from '../../app_types';
import {quickAlgoLibraries} from './quick_algo_libraries_model';
import {mainQuickAlgoLogger} from './quick_algo_logger';

export enum QuickAlgoLibrariesActionType {
    QuickAlgoLibrariesRedrawDisplay = 'quickalgoLibraries/redrawDisplay',
}

window.quickAlgoContext = function (display: boolean, infos: any) {
    return new DefaultQuickalgoLibrary(display, infos);
}

export function* quickAlgoLibraryResetAndReloadStateSaga(innerState = null) {
    const state = yield* appSelect();
    const currentTest = selectCurrentTestData(state);

    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context) {
        log.getLogger('libraries').debug('quickalgo reset and reload state', state.environment, context, innerState, currentTest);
        context.resetAndReloadState(currentTest, state, innerState);

        const contextState = getCurrentImmerState(context.getInnerState());
        log.getLogger('libraries').debug('get new state without instant', contextState);
        yield* put(taskUpdateState(contextState));
    }
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
    if (!Codecast.runner) {
        Codecast.runner = yield* call(createRunnerSaga);
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
        yield* takeEvery(QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay, function* ({payload}) {
            log.getLogger('libraries').debug('ici redraw display');
            const state = yield* appSelect();
            const context = quickAlgoLibraries.getContext(null, state.environment);
            if (context) {
                context.needsRedrawDisplay = false;
                const contextState = getCurrentImmerState(context.getInnerState());
                if ('main' === app.environment){
                    context.display = true;
                }
                // For libs like barcode where we need to call context.reset to recreate context
                yield* call(quickAlgoLibraryResetAndReloadStateSaga, contextState);

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
