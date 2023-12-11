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

import {call, cancel, fork, put, race, take, takeEvery, takeLatest} from 'typed-redux-saga';
import {TextEncoder} from "text-encoding-utf-8";
import {clearStepper, createRunnerSaga, getRunnerClassFromPlatform} from "./index";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {AppStore, AppStoreReplay} from "../store";
import {PlayerInstant} from "../player";
import {delay, ReplayContext} from "../player/sagas";
import {Bundle} from "../linker";
import {checkCompilingCode} from "../task/utils";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {selectAnswer} from "../task/selectors";
import {appSelect} from '../hooks';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {CodecastPlatform} from './codecast_platform';
import {App, Codecast} from '../app_types';
import {BlockBufferHandler, documentToString, TextBufferHandler} from '../buffers/document';
import {TaskAnswer} from '../task/task_types';
import {RECORDING_FORMAT_VERSION} from '../version';

export enum CompileStatus {
    Clear = 'clear',
    Running = 'running',
    Done = 'done',
    Error = 'error'
}

export const initialStateCompile = {
    status: CompileStatus.Clear,
    answer: null as TaskAnswer,
    syntaxTree: null as any
};

export function* compileSaga() {
    let state = yield* appSelect();
    const answer = selectAnswer(state);
    const {allowExecutionOverBlocksLimit} = state.options;

    // To make sure we have the time to conclude all Redux Saga actions triggered by the start of the compilation
    yield* delay(0);

    yield* put({
        type: ActionTypes.CompileStarted,
        payload: {
            answer,
        },
    });

    // Create a runner for this
    Codecast.runner = yield* call(createRunnerSaga, answer.platform);

    try {
        checkCompilingCode(answer, state, allowExecutionOverBlocksLimit ? ['blocks_limit'] : []);
    } catch (e) {
        yield* put({
            type: ActionTypes.CompileFailed,
            payload: {
                testResult: LibraryTestResult.fromString(String(e)),
            },
        });
        return;
    }

    // @ts-ignore
    if (!Codecast.runner.constructor.needsCompilation()) {
        yield* put({
            type: ActionTypes.CompileSucceeded,
        });
    } else {
        try {
            yield* call([Codecast.runner, Codecast.runner.compileAnswer], answer);
        } catch (ex) {
            yield* put({type: ActionTypes.CompileFailed, payload: {testResult: LibraryTestResult.fromString(String(ex))}});
        }
    }
}

let currentCompileTask;

export default function(bundle: Bundle) {
    function initReducer(state: AppStore): void {
        state.compile = {...initialStateCompile};
    }

    bundle.addReducer(AppActionTypes.AppInit, initReducer);

    // Requested translation of given {source}.
    bundle.defineAction(ActionTypes.Compile);

    // Clear the 'compile' state.
    bundle.defineAction(ActionTypes.CompileClear);
    bundle.addReducer(ActionTypes.CompileClear, initReducer);

    // Started translation of {source}.
    bundle.defineAction(ActionTypes.CompileStarted);
    bundle.addReducer(ActionTypes.CompileStarted, compileStartedReducer);

    // Succeeded translating {source} to {syntaxTree}.
    bundle.defineAction(ActionTypes.CompileSucceeded);
    bundle.addReducer(ActionTypes.CompileSucceeded, compileSucceededReducer);

    // Failed to compile {source} with {error}.
    bundle.defineAction(ActionTypes.CompileFailed);
    bundle.addReducer(ActionTypes.CompileFailed, compileFailedReducer);

    bundle.defineAction(ActionTypes.CompileWait);

    bundle.addSaga(function* watchCompile() {
        yield* takeLatest(ActionTypes.Compile, function* () {
            currentCompileTask = yield* fork(compileSaga);
        });

        yield* takeLatest(ActionTypes.StepperExit, function* () {
            if (currentCompileTask) {
                yield* cancel(currentCompileTask);
                currentCompileTask = null;
            }
        });

        // @ts-ignore
        yield* takeEvery(ActionTypes.CompileWait, function* ({payload: {callback, keepSubmission, fromControls}}) {
            // Wait that all pre-compilations actions are over
            yield* delay(0);

            yield* put({type: ActionTypes.Compile, payload: {keepSubmission, fromControls}});
            const outcome = yield* race({
                [CompileStatus.Done]: take(ActionTypes.StepperRestart),
                [CompileStatus.Error]: take([ActionTypes.CompileFailed, ActionTypes.StepperExit]),
            });
            callback(Object.keys(outcome)[0]);
        });
    });

    bundle.defer(function({recordApi, replayApi}: App) {
        replayApi.on('start', function* () {
            yield* put({type: PlayerActionTypes.PlayerReset, payload: {sliceName: 'compile', state: initialStateCompile}});
        });

        recordApi.on(ActionTypes.CompileStarted, function* (addEvent, action) {
            const {payload} = action;

            yield* call(addEvent, 'compile.start', payload.answer);
        });
        replayApi.on(['stepper.compile', 'compile.start'], function* (replayContext: ReplayContext, event) {
            let answer = event[2];

            // For backward-compatibility: before Codecast 7.4, this parameter was the source
            if ('string' === typeof answer) {
                const platform = yield* appSelect(state => state.options.platform);
                answer = {
                    document: TextBufferHandler.documentFromString(answer),
                    platform,
                };
            } else if ('object' === typeof answer && answer.blockly) {
                const platform = yield* appSelect(state => state.options.platform);
                answer = {
                    document: BlockBufferHandler.documentFromObject(answer),
                    platform,
                };
            }

            yield* put({type: ActionTypes.CompileStarted, payload: {answer}});
        });

        recordApi.on(ActionTypes.CompileSucceeded, function* (addEvent, action) {
            yield* call(addEvent, 'compile.success', action);
        });
        replayApi.on('compile.success', function* (replayContext: ReplayContext, event) {
            const action = event[2];

            yield* put({type: ActionTypes.CompileSucceeded, ...action});
        });

        recordApi.on(ActionTypes.CompileFailed, function* (addEvent, {payload}) {
            yield* call(addEvent, 'compile.failure', payload.testResult.serialize());
        });
        replayApi.on('compile.failure', function* (replayContext: ReplayContext, event) {
            let testResult: LibraryTestResult;
            // Ensure retro-compatibility with Codecast V6
            if (event[2].diagnostics) {
                testResult = new LibraryTestResult(null, 'compilation', {content: event[2].diagnostics});
            } else if ('object' === typeof event[2]) {
                testResult = LibraryTestResult.unserialize(event[2]);
            } else {
                testResult = LibraryTestResult.fromString(event[2]);
            }

            yield* put({type: ActionTypes.CompileFailed, payload: {testResult}});
        });

        replayApi.on('stepper.exit', function* () {
            yield* put({type: PlayerActionTypes.PlayerReset, payload: {sliceName: 'compile', state: initialStateCompile}});
        });

        replayApi.onReset(function* (instant: PlayerInstant) {
            const compileModel = instant.state.compile;

            yield* put({type: PlayerActionTypes.PlayerReset, payload: {sliceName: 'compile', state: compileModel}});
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

function compileStartedReducer(state: AppStore, {payload}): void {
    const {answer} = payload;

    state.compile.status = CompileStatus.Running;
    state.compile.answer = answer;
}

function compileSucceededReducer(state: AppStore, action): void {
    const answer = state.compile.answer;
    if (-1 !== [CodecastPlatform.Cpp, CodecastPlatform.Arduino].indexOf(answer.platform) && action.response) {
        const {ast, diagnostics} = action.response;
        state.compile.status = CompileStatus.Done;
        state.compile.syntaxTree = addNodeRanges(documentToString(answer.document), ast);
        state.stepper.error = diagnostics;
    } else {
        state.compile.status = CompileStatus.Done;
        state.stepper.error = null;
    }
}

export function compileFailedReducer(state: AppStoreReplay): void {
    state.compile.status = CompileStatus.Error;
    clearStepper(state.stepper, true);
}
