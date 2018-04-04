/*

Shape of the 'translate' state:

  {
    status: /clear|running|done|error/,
    source: "…",
    syntaxTree: […],
    diagnostics: "…",
    error: "…",
    diagnosticsHtml: {__html: "…"}
  }

*/

import Immutable from 'immutable';
import {takeLatest, put, call, select} from 'redux-saga/effects';
import {TextEncoder} from 'text-encoding-utf-8';

import {asyncRequestJson} from '../utils/api';

export default function (bundle, deps) {

  bundle.use('getBufferModel');

  bundle.addReducer('init', function (state, _action) {
    return state.set('translate', translateClear());
  });

  // Requested translation of given {source}.
  bundle.defineAction('translate', 'Translate');

  // Clear the 'translate' state.
  bundle.defineAction('translateClear', 'Translate.Clear');
  bundle.addReducer('translateClear', function (state, action) {
    return state.set('translate', translateClear());
  });

  // Reset the 'translate' state.
  bundle.defineAction('translateReset', 'Translate.Reset');
  bundle.addReducer('translateReset', translateReset);
  function translateReset (state, action) {
    return state.set('translate', action.state);
  }

  // Started translation of {source}.
  bundle.defineAction('translateStarted', 'Translate.Started');
  bundle.addReducer('translateStarted', function (state, action) {
    return state.update('translate', st => translateStarted(st, action));
  });

  // Succeeded translating {source} to {syntaxTree}.
  bundle.defineAction('translateSucceeded', 'Translate.Succeeded');
  bundle.addReducer('translateSucceeded', function (state, action) {
    return state.update('translate', st => translateSucceeded(st, action));
  });

  // Failed to translate {source} with {error}.
  bundle.defineAction('translateFailed', 'Translate.Failed');
  bundle.addReducer('translateFailed', function (state, action) {
    return state.update('translate', st => translateFailed(st, action));
  });


  // Clear the diagnostics (compilation errors and warnings) returned
  // by the last translate operation.
  bundle.defineAction('translateClearDiagnostics', 'Translate.ClearDiagnostics');
  bundle.addReducer('translateClearDiagnostics', function (state, action) {
    return state.update('translate', st => translateClearDiagnostics(st, action));
  });

  bundle.defineSelector('getTranslateDiagnostics', state =>
    state.getIn(['translate', 'diagnosticsHtml'])
  );

  bundle.defineSelector('getSyntaxTree', state =>
    state.getIn(['translate', 'syntaxTree'])
  );

  bundle.defineSelector('isTranslated', function (state) {
    return /busy|done/.test(getTranslateStatus(state));
  });

  function getTranslateStatus (state) {
    return state.getIn(['translate', 'status']);
  }

  bundle.addSaga(function* watchTranslate () {
    yield takeLatest(deps.translate, function* (action) {
      const sourceModel = yield select(deps.getBufferModel, 'source');
      const source = sourceModel.get('document').toString();
      const mode = yield select(state => state.get('mode'));
      yield put({type: deps.translateStarted, source});
      let response, syntaxTree;
      try {
        response = yield call(asyncRequestJson, 'translate', {source, mode});
      } catch (ex) {
        response = {error: ex.toString()};
      }
      if (response.ast) {
        yield put({type: deps.translateSucceeded, response});
      } else {
        yield put({type: deps.translateFailed, response});
      }
    });
  });


  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

    replayApi.on('start', function (context, event, instant) {
      const translateModel = translateClear();
      context.state = translateReset(context.state, {state: translateModel});
    });

    recordApi.on(deps.translateStarted, function* (addEvent, action) {
      const {source} = action;
      yield call(addEvent, 'translate.start', source);
    });
    replayApi.on(['stepper.translate', 'translate.start'], function (context, event, instant) {
      const action = {source: event[2]};
      context.state = context.state.update('translate', st => translateStarted(st, action));
    });

    recordApi.on(deps.translateSucceeded, function* (addEvent, action) {
      const {response} = action;
      yield call(addEvent, 'translate.success', response);
    });
    replayApi.on('translate.success', function (context, event, instant) {
      const action = {response: event[2]};
      context.state = context.state.update('translate', st => translateSucceeded(st, action));
    });

    recordApi.on(deps.translateFailed, function* (addEvent, action) {
      const {response} = action;
      yield call(addEvent, 'translate.failure', response);
    });
    replayApi.on('translate.failure', function (context, event, instant) {
      const action = {response: event[2]};
      context.state = context.state.update('translate', st => translateFailed(st, action));
    });

    recordApi.on(deps.translateClearDiagnostics, function* (addEvent, action) {
      yield call(addEvent, 'translate.clearDiagnostics');
    });
    replayApi.on('translate.clearDiagnostics', function (context, event, instant) {
      context.state = context.state.update('translate', st => translateClearDiagnostics(st, {}));
    });

    replayApi.on('stepper.exit', function (context, event, instant) {
      context.state = context.state.update('translate', translateClear);
    });

    replayApi.onReset(function* (instant, quick) {
      const translateModel = instant.state.get('translate');
      yield put({type: deps.translateReset, state: translateModel});
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

const getPositionFromOffset = function (lineOffsets, offset) {
  if (typeof offset !== 'number') {
    return null;
  }
  let iLeft = 0, iRight = lineOffsets.length;
  while (iLeft + 1 < iRight) {
    const iMiddle = (iLeft + iRight) / 2 |0;
    const middle = lineOffsets[iMiddle];
    if (offset < middle)
      iRight = iMiddle;
    if (middle <= offset)
      iLeft = iMiddle;
  }
  return {row: iLeft, column: offset - lineOffsets[iLeft]};
};

function toHtml (content) {
  // Sanitize and wrap html content.
  const el = document.createElement('div');
  el.innerHtml = `<pre>${content}</pre>`;
  return {__html: el.innerHtml};
}

function translateClear (state, action) {
  return Immutable.Map({status: 'clear'});
}

function translateStarted (state, action) {
  const {source} = action;
  return state.set('status', 'running').set('source', source);
}

function translateSucceeded (state, action) {
  const {ast, diagnostics} = action.response;
  const source = state.get('source');
  return state
    .set('status', 'done')
    .set('syntaxTree', addNodeRanges(source, ast))
    .set('diagnostics', diagnostics)
    .set('diagnosticsHtml', diagnostics && toHtml(diagnostics));
}

function translateFailed (state, action) {
  console.log('translateFailed', action);
  const {diagnostics} = action.response;
  return state
    .set('status', 'error')
    .set('diagnostics', diagnostics)
    .set('diagnosticsHtml', toHtml(diagnostics));
}

function translateClearDiagnostics (state, action) {
  return state.delete('diagnostics').delete('diagnosticsHtml');
}
