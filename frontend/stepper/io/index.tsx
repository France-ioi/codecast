import React from 'react';
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';

import * as C from 'persistent-c';

import {documentFromString} from '../../buffers/document';
import {DocumentModel} from '../../buffers/index';
import {default as TerminalBundle, TermBuffer, writeString} from './terminal';
import {printfBuiltin} from './printf';
import {scanfBuiltin} from './scanf';
import {ActionTypes} from "./actionTypes";
import {IOPaneOptions} from "./IOPaneOptions";
import {InputOutputView} from "./InputOutputView";
import {IOPane} from "./IOPane";

export default function (bundle, deps) {

    bundle.include(TerminalBundle);
    bundle.use(
        'TerminalView', 'terminalInputNeeded', 'terminalInputEnter', 'terminalFocus',
        'BufferEditor',
        'getCurrentStepperState', 'stepperProgress', 'stepperIdle', 'stepperInterrupt',
        'stepperRestart', 'stepperUndo', 'stepperRedo',
        'getBufferModel', 'bufferReset', 'bufferEdit', 'bufferModelEdit', 'bufferModelSelect'
    );

    bundle.addReducer('init', function (state) {
        return state.set('ioPane', updateIoPaneState(state, {}));
    });
    bundle.addReducer('platformChanged', function (state) {
        return state.update('ioPane', ioPane => updateIoPaneState(state, ioPane));
    });

    function updateIoPaneState(state, ioPane) {
        const {platform} = state.get('options');
        if (platform === 'python') {
            return {
                //mode: 'split',
                mode: ioPane.mode || 'terminal',
                modeSelect: true
            }
        } else if (platform === 'arduino') {
            /* Arduino is forced to terminal mode. */
            return {
                mode: 'terminal',
                modeSelect: false
            };
        }

        return {
            mode: ioPane.mode || 'terminal',
            modeSelect: true
        };
    }

    bundle.defineView('IOPane', IOPaneSelector, IOPane);

    function IOPaneSelector(state, props) {
        const stepper = deps.getCurrentStepperState(state);
        const mode = stepper ? state.get('ioPane').mode : 'options';

        return {mode};
    }

    /* Options view */

    bundle.defineAction(ActionTypes.IoPaneModeChanged);
    bundle.addReducer(ActionTypes.IoPaneModeChanged, ioPaneModeChanged);

    function ioPaneModeChanged(state, {payload: {mode}}) {
        return state.update('ioPane', ioPane => ({...ioPane, mode}));
    }

    bundle.defineView('IOPaneOptions', IOPaneOptionsSelector, IOPaneOptions);

    function IOPaneOptionsSelector(state) {
        const getMessage = state.get('getMessage');
        const {mode, modeSelect} = state.get('ioPane');
        return {getMessage, mode, modeSelect};
    }

    /* Split input/output view */

    bundle.defineView('InputOutputView', InputOutputViewSelector, InputOutputView);

    function InputOutputViewSelector(state, props) {
        const stepper = deps.getCurrentStepperState(state);
        const {output} = stepper;
        return {output};
    }

    function getOutputBufferModel(state) {
        const stepper = deps.getCurrentStepperState(state);
        const {output} = stepper;
        const doc = documentFromString(output);
        const endCursor = doc.endCursor();

        return DocumentModel({
            document: doc,
            selection: {start: endCursor, end: endCursor},
            firstVisibleRow: endCursor.row
        });
    }

    bundle.defer(function ({recordApi, replayApi, stepperApi}) {

        recordApi.onStart(function* (init) {
            init.ioPaneMode = yield select(state => state.get('ioPane').mode);
        });
        replayApi.on('start', function (replayContext, event) {
            const {ioPaneMode} = event[2];
            replayContext.state = ioPaneModeChanged(replayContext.state, {payload: {mode: ioPaneMode}});
        });

        replayApi.onReset(function* (instant) {
            const {mode} = instant.state.get('ioPane');
            yield put({type: deps.ioPaneModeChanged, payload: {mode}});
        });

        recordApi.on(deps.ioPaneModeChanged, function* (addEvent, {payload: {mode}}) {
            yield call(addEvent, 'ioPane.mode', mode);
        });
        replayApi.on('ioPane.mode', function (replayContext, event) {
            const mode = event[2];
            replayContext.state = ioPaneModeChanged(replayContext.state, {payload: {mode}});
        });

        replayApi.on(['stepper.progress', 'stepper.idle', 'stepper.restart', 'stepper.undo', 'stepper.redo'], function replaySyncOutput(replayContext, event) {
            if (replayContext.state.get('ioPane').mode === 'split') {
                /* Consider: pushing updates from the stepper state to the output buffer
                   in the global state adds complexity.  Three options:
                   (1) dispatch a recorded 'buffer' action when the output changes, so
                       that a buffer event updates the model during replay;
                   (2) get the stepper to update the buffer in the global state somehow;
                   (3) make the output editor fetch its model from the stepper state.
                   It is not clear which option is best.
                */
                replayContext.state = syncOutputBuffer(replayContext.state);
                replayContext.addSaga(syncOutputBufferSaga);
            }
        });

        function syncOutputBuffer(state) {
            const model = getOutputBufferModel(state);
            return state.setIn(['buffers', 'output', 'model'], model);
        }

        function* syncOutputBufferSaga(instant) {
            const model = instant.state.getIn(['buffers', 'output', 'model']);
            yield put({type: deps.bufferReset, buffer: 'output', model});
        }

        /* Set up the terminal or input. */
        stepperApi.onInit(function (stepperState, globalState) {
            const {mode} = globalState.get('ioPane');

            stepperState.inputPos = 0;
            if (mode === 'terminal') {
                stepperState.input = "";
                stepperState.terminal = TermBuffer({lines: 10, width: 80});
                stepperState.inputBuffer = "";
            } else {
                const inputModel = deps.getBufferModel(globalState, 'input');
                let input = inputModel.get('document').toString().trimRight();
                if (input.length !== 0) {
                    input = input + "\n";
                }
                stepperState.input = input;
                stepperState.output = "";
            }
        });

        stepperApi.addBuiltin('printf', printfBuiltin);

        stepperApi.addBuiltin('putchar', function* putcharBuiltin(stepperContext, charCode) {
            const ch = String.fromCharCode(charCode.toInteger());
            yield ['write', ch];
            yield ['result', charCode];
        });

        stepperApi.addBuiltin('puts', function* putsBuiltin(stepperContext, strRef) {
            const str = C.readString(stepperContext.state.programState.memory, strRef) + '\n';
            yield ['write', str];
            const result = new C.IntegralValue(C.builtinTypes['int'], 0);
            yield ['result', result];
        });

        stepperApi.addBuiltin('scanf', scanfBuiltin);

        stepperApi.onEffect('write', function* writeEffect(stepperContext, text) {
            const {state} = stepperContext;
            if (state.terminal) {
                state.terminal = writeString(state.terminal, text);
            } else {
                state.output = state.output + text;
            }
            /* TODO: update the output buffer model
               If running interactively, we must alter the actual global state.
               If pre-computing states for replay, we must alter the (computed) global
               state in the replayContext.
               Currently this is done by reflectToOutput (interactively) and
               syncOutputBuffer/syncOutputBufferSaga (non-interactively).
             */
        });

        stepperApi.addBuiltin('gets', function* getsBuiltin(stepperContext, ref) {
            const line = yield ['gets'];
            let result = C.nullPointer;
            if (line !== null) {
                const value = new C.stringValue(line);
                yield ['store', ref, value];
                result = ref;
            }
            yield ['result', result];
        });

        stepperApi.addBuiltin('getchar', function* getcharBuiltin(stepperContext) {
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

        stepperApi.onEffect('gets', function* getsEffect(stepperContext) {
            let {state} = stepperContext;
            let {input, inputPos} = state;
            let nextNL = input.indexOf('\n', inputPos);
            while (-1 === nextNL) {
                if (!state.terminal || !stepperContext.interact) {
                    /* non-interactive, end of input */
                    return null;
                }
                /* During replay no action is needed, the stepper will suspended until
                   input events supply the necessary input. */
                yield ['interact', {saga: waitForInputSaga}];
                /* Parse the next line from updated stepper state. */
                state = stepperContext.state;
                input = state.input;
                inputPos = state.inputPos;
                nextNL = input.indexOf('\n', inputPos);
            }
            const line = input.substring(inputPos, nextNL);
            state.inputPos = nextNL + 1;
            return line;
        });

        function* waitForInputSaga() {
            /* Set the isWaitingOnInput flag on the state. */
            yield put({type: deps.terminalInputNeeded});
            /* Transfer focus to the terminal. */
            yield put({type: deps.terminalFocus});
            /* Wait for the user to enter a line. */
            yield take(deps.terminalInputEnter);
        }

        stepperApi.onEffect('ungets', function* ungetsHandler(stepperContext, count) {
            stepperContext.state.inputPos -= count;
        });

        /* Monitor actions that may need to update the output buffer.
           Currently this is done in an awkward way because stepper effects cannot
           modify the global state. So the effect modifies the 'output' property
           of the stepper state, and the saga below detects changes and pushes them
           to the global state and to the editor.
           This mechanism could by simplified by having the 'write' effect
           directly alter the global state & push the change to the editor. */
        stepperApi.addSaga(function* ioStepperSaga() {
            const {mode} = yield select(state => state.get('ioPane'));

            if (mode === 'split') {
                yield call(reflectToOutput);
            }
        });

        function* reflectToOutput() {
            /* Incrementally add text produced by the stepper to the output buffer. */
            yield takeLatest([deps.stepperProgress, deps.stepperIdle], function* (action) {
                const stepperState = yield select(deps.getCurrentStepperState);
                const outputModel = yield select(deps.getBufferModel, 'output');
                const oldSize = outputModel.get('document').size();
                const newSize = stepperState.output.length;
                if (oldSize !== newSize) {
                    const outputDoc = outputModel.get('document');
                    const endCursor = outputDoc.endCursor();
                    const delta = {
                        action: 'insert',
                        start: endCursor,
                        end: endCursor,
                        lines: stepperState.output.substr(oldSize).split('\n')
                    };
                    /* Update the model to maintain length, new end cursor. */
                    yield put({type: deps.bufferEdit, buffer: 'output', delta});
                    const newEndCursor = yield select(state => deps.getBufferModel(state, 'output').get('document').endCursor());
                    /* Send the delta to the editor to add the new output. */
                    yield put({type: deps.bufferModelEdit, buffer: 'output', delta});
                    /* Move the cursor to the end of the buffer. */
                    yield put({
                        type: deps.bufferModelSelect,
                        buffer: 'output',
                        selection: {start: newEndCursor, end: newEndCursor}
                    });
                }
            });
            /* Reset the output document. */
            yield takeEvery([deps.stepperRestart, deps.stepperUndo, deps.stepperRedo], function* () {
                const model = yield select(getOutputBufferModel);
                yield put({type: deps.bufferReset, buffer: 'output', model});
            });
        }
    });
};
