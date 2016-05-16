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
import {take, put, call, select} from 'redux-saga/effects';

import {use, defineAction, defineSelector, addReducer, addSaga, defineView} from '../utils/linker';
import {asyncRequestJson} from '../utils/api';
import Document from '../utils/document';

const addNodeRanges = function (source, syntaxTree) {
  // Compute line offsets.
  const lineOffsets = [];
  let offset = 0;
  source.split('\n').forEach(function (line) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  });
  lineOffsets.push(source.length);
  // Compute each node's range.
  function traverse (node) {
    const newNode = node.slice();
    const attrs = node[1];
    newNode[1] = {
      ...attrs,
      range: {
        start: getPositionFromOffset(lineOffsets, attrs.begin),
        end: getPositionFromOffset(lineOffsets, attrs.end)
      }
    };
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

const toHtml = function (content) {
  // Sanitize and wrap html content.
  const el = document.createElement('div');
  el.innerHtml = `<pre>${content}</pre>`;
  return {__html: el.innerHtml};
};

export function translateClear (state, action) {
  return Immutable.Map({status: 'clear'});
}

export function translateStarted (state, action) {
  const {source} = action;
  return state.set('status', 'running').set('source', source);
}

export function translateSucceeded (state, action) {
  const {syntaxTree, diagnostics} = action;
  const source = state.get('source');
  return state
    .set('status', 'done')
    .set('syntaxTree', addNodeRanges(source, syntaxTree))
    .set('diagnostics', diagnostics)
    .set('diagnosticsHtml', toHtml(diagnostics));
};

export function translateFailed (state, action) {
  const {error, diagnostics} = action;
  return state
    .set('status', 'error')
    .set('error', error)
    .set('diagnostics', diagnostics)
    .set('diagnosticsHtml', toHtml(diagnostics));
};

export function translateClearDiagnostics (state, action) {
  return state.delete('diagnostics').delete('diagnosticsHtml');
};

export default function* (deps) {

  yield use('init', 'getSourceModel');

  // Requested translation of given {source}.
  yield defineAction('translate', 'Translate');

  // Reset the 'translate' state.
  yield defineAction('translateReset', 'Translate.Reset');

  // Started translation of {source}.
  yield defineAction('translateStarted', 'Translate.Started');

  // Succeeded translating {source} to {syntaxTree}.
  yield defineAction('translateSucceeded', 'Translate.Succeeded');

  // Failed to translate {source} with {error}.
  yield defineAction('translateFailed', 'Translate.Failed');

  // Clear the diagnostics (compilation errors and warnings) returned
  // by the last translate operation.
  yield defineAction('translateClearDiagnostics', 'Translate.ClearDiagnostics');

  yield defineSelector('getTranslateState', state =>
    state.get('translate')
  );

  function getTranslateStatus (state) {
    return state.getIn(['translate', 'status']);
  }

  yield addReducer('init', function (state, action) {
    return state.set('translate', translateClear());
  });

  yield addReducer('translateReset', function (state, action) {
    return state.set('translate', action.state);
  });

  yield addReducer('translateStarted', function (state, action) {
    return state.update('translate', st => translateStarted(st, action));
  });

  yield addReducer('translateSucceeded', function (state, action) {
    return state.update('translate', st => translateSucceeded(st, action));
  });

  yield addReducer('translateFailed', function (state, action) {
    return state.update('translate', st => translateFailed(st, action));
  });

  yield addReducer('translateClearDiagnostics', function (state, action) {
    return state.update('translate', st => translateClearDiagnostics(st, action));
  });

  function* translateSource (source) {
    yield put({type: deps.translateStarted, source});
    let response, syntaxTree, error;
    try {
      response = yield call(asyncRequestJson, '/translate', {source});
      if (response.ast) {
        syntaxTree = response.ast;
      }
    } catch (ex) {
      error = ex.toString();
    }
    const {diagnostics} = response;
    if (syntaxTree) {
      yield put({type: deps.translateSucceeded, response, diagnostics, syntaxTree});
    } else {
      yield put({type: deps.translateFailed, response, diagnostics, error});
    }
  }

  yield addSaga(function* watchTranslate () {
    while (true) {
      const action = yield take(deps.translate);
      const status = yield select(getTranslateStatus);
      if (status !== 'running') {
        const sourceModel = yield select(deps.getSourceModel);
        const source = Document.toString(sourceModel.get('document'));
        yield call(translateSource, source);
      }
    }
  });

};
