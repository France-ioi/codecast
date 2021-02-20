/*

Shape of the 'compile' state:

  {
    status: /clear|running|done|error/,
    source: "…",
    syntaxTree: […],
    diagnostics: "…",
    error: "…",
    diagnosticsHtml: {__html: "…"}
  }

*/

import {call, put, select, takeLatest} from 'redux-saga/effects';

import {asyncRequestJson} from '../utils/api';

import {toHtml} from "../utils/sanitize";
import {TextEncoder} from "text-encoding-utf-8";
import {clearStepper} from "./index";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {getBufferModel} from "../buffers/selectors";
import {AppStore, AppStoreReplay} from "../store";
import {PlayerInstant} from "../player";
import {ReplayContext} from "../player/sagas";
import {Bundle} from "../linker";
import {App} from "../index";

enum CompileStatus {
    Clear = 'clear',
    Running = 'running',
    Done = 'done',
    Error = 'error'
}

export const initialStateCompile = {
    status: CompileStatus.Clear,
    diagnostics: '',
    diagnosticsHtml: '' as string | {__html: string},
    source: '',
    syntaxTree: null as any // TODO: type
};

export default function(bundle: Bundle) {
    function initReducer(state: AppStoreReplay): void {
        state.compile = initialStateCompile;
    }

    bundle.addReducer(AppActionTypes.AppInit, initReducer);

    // Requested translation of given {source}.
    bundle.defineAction(ActionTypes.Compile);

    // Clear the 'compile' state.
    bundle.defineAction(ActionTypes.CompileClear);
    bundle.addReducer(ActionTypes.CompileClear, initReducer);

    // Reset the 'compile' state.
    bundle.defineAction(ActionTypes.CompileReset);
    bundle.addReducer(ActionTypes.CompileReset, compileResetReducer);

    function compileResetReducer(state: AppStoreReplay, action): void {
        state.compile = action.state;
    }

    // Started translation of {source}.
    bundle.defineAction(ActionTypes.CompileStarted);
    bundle.addReducer(ActionTypes.CompileStarted, compileStartedReducer);

    // Succeeded translating {source} to {syntaxTree}.
    bundle.defineAction(ActionTypes.CompileSucceeded);
    bundle.addReducer(ActionTypes.CompileSucceeded, compileSucceededReducer);

    // Failed to compile {source} with {error}.
    bundle.defineAction(ActionTypes.CompileFailed);
    bundle.addReducer(ActionTypes.CompileFailed, compileFailedReducer);

    // Clear the diagnostics (compilation errors and warnings) returned
    // by the last compile operation.
    bundle.defineAction(ActionTypes.CompileClearDiagnostics);
    bundle.addReducer(ActionTypes.CompileClearDiagnostics, compileClearDiagnosticsReducer);

    bundle.addSaga(function* watchCompile() {
        yield takeLatest(ActionTypes.Compile, function* () {
            let state: AppStore = yield select();

            const getMessage = state.getMessage;
            const sourceModel = getBufferModel(state, 'source');
            const source = sourceModel.document.toString();
            const {platform} = state.options;

            yield put({
                type: ActionTypes.CompileStarted,
                source
            });

            let response;
            if (platform === 'python') {
                if (!source.trim()) {
                    yield put({
                        type: ActionTypes.CompileFailed,
                        response: {
                            diagnostics: getMessage('EMPTY_PROGRAM')
                        }
                    });
                } else {
                    yield put({
                        type: ActionTypes.CompileSucceeded,
                        platform
                    });
                }
            } else {
                state = yield select();
                try {
                    const logData = state.statistics.logData;
                    const postData = {source, platform, logData};
                    const {baseUrl} = state.options;

                    response = yield call(asyncRequestJson, baseUrl + '/compile', postData);
                } catch (ex) {
                    response = {error: ex.toString()};
                }

                response.platform = platform;
                if (response.ast) {
                    yield put({
                        type: ActionTypes.CompileSucceeded,
                        response,
                        platform
                    });
                } else {
                    yield put({type: ActionTypes.CompileFailed, response});
                }
            }
        });
    });

    bundle.defer(function({recordApi, replayApi}: App) {
        replayApi.on('start', function(replayContext: ReplayContext) {
            compileResetReducer(replayContext.state, {state: initialStateCompile});
        });

        recordApi.on(ActionTypes.CompileStarted, function* (addEvent, action) {
            const {source} = action;

            yield call(addEvent, 'compile.start', source); // XXX should also have platform
        });
        replayApi.on(['stepper.compile', 'compile.start'], function(replayContext: ReplayContext, event) {
            const action = {source: event[2]};

            compileStartedReducer(replayContext.state, action);
        });

        recordApi.on(ActionTypes.CompileSucceeded, function* (addEvent, action) {
            yield call(addEvent, 'compile.success', action);
        });
        replayApi.on('compile.success', function(replayContext: ReplayContext, event) {
            const action = event[2];

            compileSucceededReducer(replayContext.state, action);
        });

        recordApi.on(ActionTypes.CompileFailed, function* (addEvent, action) {
            const {response} = action;
            yield call(addEvent, 'compile.failure', response);
        });
        replayApi.on('compile.failure', function(replayContext: ReplayContext, event) {
            const action = {response: event[2]};

            compileFailedReducer(replayContext.state, action);
        });

        recordApi.on(ActionTypes.CompileClearDiagnostics, function* (addEvent) {
            yield call(addEvent, 'compile.clearDiagnostics');
        });
        replayApi.on('compile.clearDiagnostics', function(replayContext: ReplayContext) {
            compileClearDiagnosticsReducer(replayContext.state);
        });

        replayApi.on('stepper.exit', function(replayContext: ReplayContext) {
            initReducer(replayContext.state);
        });

        replayApi.onReset(function* (instant: PlayerInstant) {
            const compileModel = instant.state.compile;

            yield put({type: ActionTypes.CompileReset, state: compileModel});
        });
    });
};

const addNodeRanges = function(source, syntaxTree) {
    // Assign a {row, column} position to each byte offset in the source.
    // The UTF-8 encoding indicates the byte length of each character, so we could
    // use it to maintain a counter of how many bytes to skip before incrementing
    // the column number, thus:
    //     0xxxxxxx  single-byte character, increment column
    //     110xxxxx  start of 2-bytes sequence, set counter to 1
    //     1110xxxx  start of 3-bytes sequence, set counter to 2
    //     11110xxx  start of 4-bytes sequence, set counter to 3
    //     10xxxxxx  decrement counter, if it goes to 0 then increment column
    // However, because we do not need meaningful position for byte offsets that
    // do not start a character, it is simpler to increment the column on the
    // first byte of every character (bit patterns 0xxxxxxx and 11xxxxxx), and
    // to store a null position for the other bytes (bit pattern 10xxxxxx).
    const encoder = new TextEncoder('utf-8');
    const bytesArray = encoder.encode(source);
    const bytesLen = bytesArray.length;
    const positions = [];
    let row = 0, column = 0, pos = {row, column};
    for (let bytePos = 0; bytePos < bytesLen; bytePos++) {
        const byte = bytesArray[bytePos];
        if ((byte & 0b11000000) === 0b10000000) {
            positions.push(null);
        } else {
            positions.push(pos);
            if (byte === 10) {
                row += 1;
                column = 0;
            } else {
                column += 1;
            }
            pos = {row, column};
        }
    }
    positions.push(pos);

    // Compute each node's range.
    function traverse(node) {
        const newNode = node.slice();
        const attrs = node[1];
        const {begin, end} = attrs;
        const range = begin && end && {start: positions[begin], end: positions[end]};
        newNode[1] = {...attrs, range};
        newNode[2] = node[2].map(traverse);

        return newNode;
    }

    return traverse(syntaxTree);
};

function compileStartedReducer(state: AppStoreReplay, action): void {
    const {source} = action;

    state.compile.status = CompileStatus.Running;
    state.compile.source = source;
}

function compileSucceededReducer(state: AppStoreReplay, action): void {
    if (action.platform === 'python') {
        state.compile.status = CompileStatus.Done;
        state.compile.diagnostics = '';
        state.compile.diagnosticsHtml = '';
    } else {
        const {ast, diagnostics} = action.response;
        const source = state.compile.source;

        state.compile.status = CompileStatus.Done;
        state.compile.syntaxTree = addNodeRanges(source, ast);
        state.compile.diagnostics = diagnostics;
        state.compile.diagnosticsHtml = diagnostics && toHtml(diagnostics);
    }
}

function compileFailedReducer(state: AppStoreReplay, action): void {
    const {diagnostics} = action.response;

    state.compile.status = CompileStatus.Error;
    state.compile.diagnostics = diagnostics;
    state.compile.diagnosticsHtml = toHtml(diagnostics);

    clearStepper(state.stepper);
}

function compileClearDiagnosticsReducer(state: AppStoreReplay): void {
    state.compile.diagnostics = '';
    state.compile.diagnosticsHtml = '';
}
