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

import {Map} from 'immutable';
import { takeLatest, put, call, select } from 'redux-saga/effects';

import { asyncRequestJson } from '../utils/api';

import { toHtml } from "../utils/sanitize";
import { TextEncoder } from "text-encoding-utf-8";
import {stepperClear} from "./index";
import {ActionTypes} from "./actionTypes";

export default function (bundle, deps) {

  bundle.use('getBufferModel');

  bundle.addReducer('init', function (state, _action) {
    return state.set('compile', compileClear());
  });

  // Requested translation of given {source}.
  bundle.defineAction(ActionTypes.Compile);

  // Clear the 'compile' state.
  bundle.defineAction(ActionTypes.CompileClear);
  bundle.addReducer(ActionTypes.CompileClear, function (state, action) {
    return state.set('compile', compileClear());
  });

  // Reset the 'compile' state.
  bundle.defineAction(ActionTypes.CompileReset);
  bundle.addReducer(ActionTypes.CompileReset, compileReset);
  function compileReset (state, action) {
    return state.set('compile', action.state);
  }

  // Started translation of {source}.
  bundle.defineAction(ActionTypes.CompileStarted);
  bundle.addReducer(ActionTypes.CompileStarted, function (state, action) {
    return state.update('compile', st => compileStarted(st, action));
  });

  // Succeeded translating {source} to {syntaxTree}.
  bundle.defineAction(ActionTypes.CompileSucceeded);
  bundle.addReducer(ActionTypes.CompileSucceeded, function (state, action) {
    return state.update('compile', st => compileSucceeded(st, action));
  });

  // Failed to compile {source} with {error}.
  bundle.defineAction(ActionTypes.CompileFailed);
  bundle.addReducer(ActionTypes.CompileFailed, function (state, action) {
    const newState = state.update('compile', st => compileFailed(st, action));

    newState.set('stepper', stepperClear());

    return newState;
  });

  // Clear the diagnostics (compilation errors and warnings) returned
  // by the last compile operation.
  bundle.defineAction(ActionTypes.CompileClearDiagnostics);
  bundle.addReducer(ActionTypes.CompileClearDiagnostics, function (state, action) {
    return state.update('compile', st => compileClearDiagnostics(st, action));
  });

  bundle.defineSelector('getCompileDiagnostics', state =>
    state.getIn(['compile', 'diagnosticsHtml'])
  );

  bundle.defineSelector('getSyntaxTree', state =>
      state.getIn(['compile', 'syntaxTree'])
  );

  bundle.defineSelector('isCompiled', function (state) {
    return /busy|done/.test(getCompileStatus(state));
  });

  function getCompileStatus (state) {
    return state.getIn(['compile', 'status']);
  }

  bundle.addSaga(function* watchCompile () {
    yield takeLatest(deps.compile, function* (action) {
      const getMessage = yield select(state => state.get('getMessage'));
      const sourceModel = yield select(deps.getBufferModel, 'source');
      const source = sourceModel.get('document').toString();
      const {platform} = yield select(state => state.get('options'));

      yield put({
        type: deps.compileStarted,
        source
      });

      let response;
      if (platform === 'python') {
        if (!source.trim()) {
          yield put({
            type: deps.compileFailed,
            response: {
              diagnostics: getMessage('EMPTY_PROGRAM')
            }
          });
        } else {
          yield put({
            type: deps.compileSucceeded,
            platform
          });
        }
      } else {
        try {
          const logData = yield select(state => state.getIn(['statistics', 'logData']));
          const postData = {source, platform, logData};
          /* XXX replace 'translate' with a computed absolute path */
          response = yield call(asyncRequestJson, '/next/compile', postData);
        } catch (ex) {
          response = {error: ex.toString()};
        }

        response.platform = platform;
        if (response.ast) {
          yield put({
            type: deps.compileSucceeded,
            response,
            platform
          });
        } else {
          yield put({type: deps.compileFailed, response});
        }
      }
    });
  });

  bundle.defer(function ({recordApi, replayApi}) {

    replayApi.on('start', function (replayContext, event) {
      const compileModel = compileClear();
      replayContext.state = compileReset(replayContext.state, {state: compileModel});
    });

    recordApi.on(deps.compileStarted, function* (addEvent, action) {
      const {source} = action;
      yield call(addEvent, 'compile.start', source); // XXX should also have platform
    });
    replayApi.on(['stepper.compile', 'compile.start'], function (replayContext, event) {
      const action = {source: event[2]};
      replayContext.state = replayContext.state.update('compile', st => compileStarted(st, action));
    });

    recordApi.on(deps.compileSucceeded, function* (addEvent, action) {
      yield call(addEvent, 'compile.success', action);
    });
    replayApi.on('compile.success', function (replayContext, event) {
      const action = event[2];

      replayContext.state = replayContext.state.update('compile', st => compileSucceeded(st, action));
    });

    recordApi.on(deps.compileFailed, function* (addEvent, action) {
      const {response} = action;
      yield call(addEvent, 'compile.failure', response);
    });
    replayApi.on('compile.failure', function (replayContext, event) {
      const action = {response: event[2]};
      replayContext.state = replayContext.state.update('compile', st => compileFailed(st, action));
    });

    recordApi.on(deps.compileClearDiagnostics, function* (addEvent, action) {
      yield call(addEvent, 'compile.clearDiagnostics');
    });
    replayApi.on('compile.clearDiagnostics', function (replayContext, event) {
      replayContext.state = replayContext.state.update('compile', st => compileClearDiagnostics(st, {}));
    });

    replayApi.on('stepper.exit', function (replayContext, event) {
      replayContext.state = replayContext.state.update('compile', compileClear);
    });

    replayApi.onReset(function* (instant) {
      const compileModel = instant.state.get('compile');
      yield put({type: deps.compileReset, state: compileModel});
    });
  });
};

const addNodeRanges = function (source, syntaxTree) {
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
  function traverse (node) {
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

function compileClear () {
  return Map({status: 'clear'});
}

function compileStarted (state, action) {
  const {source} = action;
  return state.set('status', 'running').set('source', source);
}

export function compileSucceeded(state, action) {
  if (action.platform === 'python') {
    return state
        .set('status', 'done')
        .set('diagnostics', '')
        .set('diagnosticsHtml', '');
  } else {
    const {ast, diagnostics} = action.response;
    const source = state.get('source');

    return state
        .set('status', 'done')
        .set('syntaxTree', addNodeRanges(source, ast))
        .set('diagnostics', diagnostics)
        .set('diagnosticsHtml', diagnostics && toHtml(diagnostics));
  }
}

function compileFailed (state, action) {
  const {diagnostics} = action.response;

  return state
    .set('status', 'error')
    .set('diagnostics', diagnostics)
    .set('diagnosticsHtml', toHtml(diagnostics));
}

export function compileClearDiagnostics (state, action) {
  return state.delete('diagnostics').delete('diagnosticsHtml');
}
