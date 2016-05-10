
import Immutable from 'immutable';
import {takeLatest} from 'redux-saga';
import {put, call, select} from 'redux-saga/effects';

import {use, defineAction, defineSelector, addReducer, addSaga, defineView} from '../utils/linker';
import {asyncRequestJson} from '../utils/api';
import Document from '../utils/document';

export const addNodeRanges = function (source, syntaxTree) {
  // Compute line offsets.
  const lineOffsets = [];
  let offset = 0;
  source.split('\n').forEach(function (line) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  });
  lineOffsets.push(source.length);
  // Compute each node's range.
  (function traverse (node) {
    const attrs = node[1];
    node[1].range = {
      start: getPositionFromOffset(lineOffsets, attrs.begin),
      end: getPositionFromOffset(lineOffsets, attrs.end)
    };
    const children = node[2];
    children.forEach(traverse);
  })(syntaxTree);
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

export default function* (deps) {

  yield use('getSource');

  // Requested translation of given {source}.
  yield defineAction('translate', 'Stepper.Translate');

  // Started translation of {source}.
  yield defineAction('translateStart', 'Stepper.Translate.Start');

  // Succeeded translating {source} to {syntaxTree}.
  yield defineAction('translateSucceeded', 'Stepper.Translate.Succeeded');

  // Failed to translate {source} with {error}.
  yield defineAction('translateFailed', 'Stepper.Translate.Failed');

  yield defineSelector('getTranslateState', state =>
    state.get('translate')
  );

  yield addReducer('translateSucceeded', function (state, action) {
    const {diagnostics} = action;
    return state.set('translate', Immutable.Map({diagnostics}));
  });

  yield addReducer('translateFailed', function (state, action) {
    const {error, diagnostics} = action;
    return state.set('translate', Immutable.Map({error, diagnostics}));
  });

  function* translateSource (action) {
    const sourceState = yield select(deps.getSource);
    const source = Document.toString(sourceState.get('document'));
    yield put({type: deps.translateStart, source});
    let response, syntaxTree, error;
    try {
      response = yield call(asyncRequestJson, '/translate', {source});
      if (response.ast) {
        syntaxTree = response.ast;
        addNodeRanges(source, syntaxTree);
      }
    } catch (ex) {
      error = ex.toString();
    }
    let {diagnostics} = response;
    if (diagnostics) {
      // Sanitize the server-provided HTML.
      const el = document.createElement('div');
      el.innerHtml = `<pre>${diagnostics}</pre>`;
      diagnostics = {__html: el.innerHtml};
    }
    if (response.ast) {
      yield put({type: deps.translateSucceeded, response, diagnostics, syntaxTree});
    } else {
      yield put({type: deps.translateFailed, response, diagnostics, error});
    }
  }

  yield addSaga(function* watchTranslate () {
    // It is safe to use takeLatest here.  A previous pending call
    // will be cancelled and its effects so far overwritten by a
    // new call.
    yield* takeLatest(deps.translate, translateSource);
  });

};
