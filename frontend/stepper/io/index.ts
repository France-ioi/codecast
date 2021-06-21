import {call, put, select} from 'redux-saga/effects';
import * as C from 'persistent-c';
import {printfBuiltin} from './printf';
import {scanfBuiltin} from './scanf';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../../common/actionTypes";
import {ActionTypes as AppActionTypes} from "../../actionTypes";
import {getBufferModel} from "../../buffers/selectors";
import {AppStore, AppStoreReplay} from "../../store";
import {PlayerInstant} from "../../player";
import {ReplayContext} from "../../player/sagas";
import {StepperContext} from "../api";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {App} from "../../index";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_librairies";
import {PrinterLib} from "../../task/libs/printer/printer_lib";
import {TermBuffer} from "./terminal";

export enum IoMode {
    Terminal = 'terminal',
    Split = 'split',
}

export const initialStateIoPane = {
    mode: IoMode.Terminal,
    modeSelect: false
};

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.ioPane = initialStateIoPane;

        updateIoPaneState(state);
    });
    bundle.addReducer(CommonActionTypes.PlatformChanged, (state: AppStore) => {
        updateIoPaneState(state);
    });

    function updateIoPaneState(state: AppStore) {
        const {platform} = state.options;

        if (platform === 'arduino') {
            /* Arduino is forced to terminal mode. */
            state.ioPane.mode = IoMode.Terminal;
            state.ioPane.modeSelect = false;
        } else {
            state.ioPane.modeSelect = true;
        }
    }

    /* Options view */
    bundle.defineAction(ActionTypes.IoPaneModeChanged);
    bundle.addReducer(ActionTypes.IoPaneModeChanged, ioPaneModeChangedReducer);

    function ioPaneModeChangedReducer(state: AppStoreReplay, {payload: {mode}}): void {
        state.ioPane.mode = mode;
    }

    bundle.defer(function({recordApi, replayApi, stepperApi}: App) {
        recordApi.onStart(function* (init) {
            const state: AppStore = yield select();

            init.ioPaneMode = state.ioPane.mode;
        });
        replayApi.on('start', function(replayContext: ReplayContext, event) {
            const {ioPaneMode} = event[2];

            replayContext.state.ioPane = initialStateIoPane;
            ioPaneModeChangedReducer(replayContext.state, {payload: {mode: ioPaneMode}});
        });

        replayApi.onReset(function* (instant: PlayerInstant) {
            const {mode} = instant.state.ioPane;

            yield put({type: ActionTypes.IoPaneModeChanged, payload: {mode}});
        });

        recordApi.on(ActionTypes.IoPaneModeChanged, function* (addEvent, {payload: {mode}}) {
            yield call(addEvent, 'ioPane.mode', mode);
        });
        replayApi.on('ioPane.mode', function(replayContext: ReplayContext, event) {
            const mode = event[2];

            ioPaneModeChangedReducer(replayContext.state, {payload: {mode}});
        });

        /* Set up the terminal or input. */
        stepperApi.onInit(function(stepperState: StepperState, state: AppStore) {
            const {mode} = state.ioPane;

            stepperState.inputPos = 0;
            if (mode === IoMode.Terminal) {
                stepperState.input = "";
                stepperState.terminal = new TermBuffer({lines: 10, width: 80});
                stepperState.inputBuffer = "";
            } else {
                const inputModel = getBufferModel(state, 'input');
                let input = inputModel.document.toString().trimRight();
                if (input.length !== 0) {
                    input = input + "\n";
                }
                stepperState.input = input;
                stepperState.output = "";
            }
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
            console.log('effect write', text);

            // @ts-ignore
            const context: PrinterLib = quickAlgoLibraries.getContext('printer');

            console.log('do write');
            yield ['promise', new Promise((resolve) => {
                console.log('call print_end');
                // @ts-ignore
                context.print_end(text, "", resolve); // In C, printf doesn't add \n by default in the end
            })];

            // const {state} = stepperContext;
            // if (state.terminal) {
            //     state.terminal = writeString(state.terminal, text);
            // } else {
            //     state.output = state.output + text;
            // }
            /* TODO: update the output buffer model
               If running interactively, we must alter the actual global state.
               If pre-computing states for replay, we must alter the (computed) global
               state in the replayContext.
               Currently this is done by reflectToOutput (interactively) and
               syncOutputBuffer/syncOutputBufferSaga (non-interactively).
             */
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
            // @ts-ignore
            const context: PrinterLib = quickAlgoLibraries.getContext('printer');

            let hasResult = false;
            let result;

            console.log('start read');

            const promise = context.read((elm) => {
                result = elm;
                hasResult = true;
            });

            let i = 0;
            while (!hasResult) {
                console.log('-- not read, interact');
                yield ['interact', {
                    saga: function* () {
                        yield call(() => {
                            return promise;
                        });
                    },
                    // progress: false,
                }];
                console.log('-- end interaction');

                i++;
                // Add a security to avoid possible infinite loop
                if (i > 100) {
                    console.error('Interacting buffer exhausted, this is most likely abnormal (input required but not given in recording)');
                    break;
                }
            }

            return result;
        });

        stepperApi.onEffect('ungets', function* ungetsHandler(stepperContext: StepperContext, count) {
            stepperContext.state.inputPos -= count;
        });
    });
}
