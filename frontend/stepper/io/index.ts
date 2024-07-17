import {call, put} from 'typed-redux-saga';
import * as C from '@france-ioi/persistent-c';
import {printfBuiltin} from './printf';
import {scanfBuiltin} from './scanf';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../../common/actionTypes";
import {ActionTypes as AppActionTypes} from "../../actionTypes";
import {AppStore} from "../../store";
import {ReplayContext} from "../../player/sagas";
import {StepperContext} from "../api";
import {Bundle} from "../../linker";
import log from 'loglevel';
import {appSelect} from '../../hooks';
import {PlayerInstant} from '../../player';
import {CodecastPlatform} from '../codecast_platform';
import {App} from '../../app_types';
import {PrinterLibAction} from '../../task/libs/printer/printer_lib';

export enum IoMode {
    Terminal = 'terminal',
    Split = 'split',
}
export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        updateIoPaneState(state);
    });
    bundle.addReducer(CommonActionTypes.PlatformChanged, (state: AppStore) => {
        updateIoPaneState(state);
    });

    function updateIoPaneState(state: AppStore) {
        const {platform} = state.options;

        if (platform === CodecastPlatform.Arduino) {
            /* Arduino is forced to terminal mode. */
            state.options.ioMode = IoMode.Terminal;
        }
    }

    /* Options view */
    bundle.defineAction(ActionTypes.IoPaneModeChanged);
    bundle.addReducer(ActionTypes.IoPaneModeChanged, ioPaneModeChangedReducer);

    function ioPaneModeChangedReducer(state: AppStore, {payload: {mode}}): void {
        state.options.ioMode = mode;
    }

    bundle.defer(function({recordApi, replayApi, stepperApi}: App) {
        recordApi.onStart(function* (init) {
            const state = yield* appSelect();

            init.ioPaneMode = state.options.ioMode;
        });
        replayApi.on('start', function* (replayContext: ReplayContext, event) {
            const {ioPaneMode} = event[2];

            if (ioPaneMode) {
                yield* put({type: ActionTypes.IoPaneModeChanged, payload: {mode: ioPaneMode}});
            }
        });

        replayApi.onReset(function* (instant: PlayerInstant) {
            const mode = instant.state.options.ioMode;

            yield* put({type: ActionTypes.IoPaneModeChanged, payload: {mode}});
        });

        recordApi.on(ActionTypes.IoPaneModeChanged, function* (addEvent, {payload: {mode}}) {
            yield* call(addEvent, 'ioPane.mode', mode);
        });
        replayApi.on('ioPane.mode', function* (replayContext: ReplayContext, event) {
            const mode = event[2];

            yield* put({type: ActionTypes.IoPaneModeChanged, payload: {mode}});
        });

        stepperApi.addBuiltin('printf', printfBuiltin);

        stepperApi.addBuiltin('putchar', function* putcharBuiltin(stepperContext: StepperContext, charCode) {
            const ch = String.fromCharCode(charCode.toInteger());

            yield ['write', ch];
            yield ['result', charCode];
        });

        stepperApi.addBuiltin('puts', function* putsBuiltin(stepperContext: StepperContext, strRef) {
            const str = C.readString(stepperContext.state.programState.memory, strRef) + '\n';
            yield ['write', str];

            const result = new C.IntegralValue(C.builtinTypes['int'], 0);
            yield ['result', result];
        });

        stepperApi.addBuiltin('scanf', scanfBuiltin);

        stepperApi.onEffect('write', function* writeEffect(stepperContext: StepperContext, text) {
            const executor = stepperContext.quickAlgoCallsExecutor;
            const executorPromise = executor('printer', 'print_end', [text]);
            yield ['promise', executorPromise];
        });

        stepperApi.addBuiltin('gets', function* getsBuiltin(stepperContext: StepperContext, ref) {
            const line = yield ['gets'];
            let result = C.nullPointer;
            if (line !== null) {
                const value = new C.stringValue(line);
                yield ['store', ref, value];
                result = ref;
            }

            yield ['result', result];
        });

        stepperApi.addBuiltin('getchar', function* getcharBuiltin() {
            const line = yield ['gets'];
            let result;
            if (line === null) {
                result = -1;
            } else {
                result = line.charCodeAt(0);
                yield ['ungets', line.length - 1];
            }

            yield ['result', new C.IntegralValue(C.builtinTypes['int'], result)];
        });

        stepperApi.onEffect('gets', function* getsEffect(stepperContext: StepperContext) {
            const executor = stepperContext.quickAlgoCallsExecutor;

            let result;
            const executorPromise = executor('printer', 'read', [PrinterLibAction.readLineWithNewLine], (res) => {
                log.getLogger('printer_lib').debug('callback', res);
                result = res;
            });

            yield ['promise', executorPromise];
            log.getLogger('printer_lib').debug('the result', executorPromise, result, result.split('').map(function (char) {
                return char.charCodeAt(0);
            }).join('/'));

            return result;
        });

        stepperApi.onEffect('ungets', function* ungetsHandler(stepperContext: StepperContext, count) {
            const executor = stepperContext.quickAlgoCallsExecutor;
            const executorPromise = executor('printer', 'ungets', [count]);
            yield ['promise', executorPromise];
        });
    });
}
