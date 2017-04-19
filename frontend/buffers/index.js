/*

Buffers are stored in the global state.

The model for a buffer is an Immutable Record of this shape:

  {document, selection, firstVisibleRow}

where

  - document is an Immutable List of the document's lines
  - selection is a JS object of shape {start:{row,column},end:{row,column}}
  - firstVisibleRow is the number of the first row visible in the editor's view

The 'init' action is sent when the editor view is created/destroyed.
  A reducer saves a reference to the view in the global state.
  A saga updates the editor view with the current model.
  A single view is supported.

The 'reset' action is sent when the model changes.
  A saga updates the editor view (if present) with the new model.

The 'edit', 'select' and 'scroll' actions are sent by the editor view when
user interaction change the view.
  Reducers update the model accordingly.

*/


import {take, takeEvery, select} from 'redux-saga/effects';
import Immutable from 'immutable';
import React from 'react';
import EpicComponent from 'epic-component';

import {emptyDocument, documentFromString} from './document';
import Editor from './editor';

export const DocumentModel = Immutable.Record({
  document: emptyDocument,
  selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
  firstVisibleRow: 0
});

export const BufferState = Immutable.Record({model: DocumentModel(), editor: null});

export default function (bundle, deps) {

  bundle.defineAction('bufferInit', 'Buffer.Init');
  bundle.defineAction('bufferLoad', 'Buffer.Load');
  bundle.defineAction('bufferReset', 'Buffer.Reset');
  bundle.defineAction('bufferEdit', 'Buffer.Edit');
  bundle.defineAction('bufferSelect', 'Buffer.Select');
  bundle.defineAction('bufferScroll', 'Buffer.Scroll');
  bundle.defineAction('bufferModelEdit', 'Buffer.Model.Edit');
  bundle.defineAction('bufferModelSelect', 'Buffer.Model.Select');
  bundle.defineAction('bufferModelScroll', 'Buffer.Model.Scroll');
  bundle.defineAction('bufferHighlight', 'Buffer.Highlight');

  bundle.defineSelector('getBufferModel', function (state, buffer) {
    return state.getIn(['buffers', buffer, 'model']);
  });

  function getBufferEditor (state, buffer) {
    return state.getIn(['buffers', buffer, 'editor']);
  }

  bundle.addReducer('init', state => state.set('buffers', Immutable.Map({
    source: BufferState(),
    input: BufferState(),
    output: BufferState()
  })));

  bundle.addReducer('bufferInit', function (state, action) {
    const {buffer, editor} = action;
    return state.setIn(['buffers', buffer, 'editor'], editor);
  });

  bundle.addReducer('bufferLoad', function (state, action) {
    const {buffer, text} = action;
    return state.setIn(['buffers', buffer, 'model'], DocumentModel({
      document: documentFromString(text),
      selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
      firstVisibleRow: 0
    }));
  });

  bundle.addReducer('bufferReset', function (state, action) {
    const {buffer, model} = action;
    return state.setIn(['buffers', buffer, 'model'], model);
  });

  bundle.addReducer('bufferEdit', function (state, action) {
    const {buffer, delta} = action;
    const oldDoc = state.getIn(['buffers', buffer, 'model', 'document']);
    const newDoc = oldDoc.applyDelta(delta);
    return state.setIn(['buffers', buffer, 'model', 'document'], newDoc);
  });

  bundle.addReducer('bufferSelect', function (state, action) {
    const {buffer, selection} = action;
    return state.setIn(['buffers', buffer, 'model', 'selection'], selection);
  });

  bundle.addReducer('bufferScroll', function (state, action) {
    const {buffer, firstVisibleRow} = action;
    return state.setIn(['buffers', buffer, 'model', 'firstVisibleRow'], firstVisibleRow);
  });

  bundle.addSaga(function* watchBuffers () {
    yield takeEvery(deps.bufferInit, function* (action) {
      const {buffer, editor} = action;
      if (editor) {
        const model = yield select(deps.getBufferModel, buffer);
        resetEditor(editor, model);
      }
    });
    yield takeEvery(deps.bufferReset, function* (action) {
      const {buffer, model, quiet} = action;
      if (!quiet) {
        const editor = yield select(getBufferEditor, buffer);
        if (editor) {
          resetEditor(editor, model);
        }
      }
    });
    yield takeEvery(deps.bufferModelSelect, function* (action) {
      const {buffer, selection} = action;
      const editor = yield select(getBufferEditor, buffer);
      if (editor) {
        editor.setSelection(selection);
      }
    });
    yield takeEvery(deps.bufferModelEdit, function* (action) {
      const {buffer, delta, deltas} = action;
      const editor = yield select(getBufferEditor, buffer);
      if (editor) {
        editor.applyDeltas(deltas || [delta]);
      }
    });
    yield takeEvery(deps.bufferModelScroll, function* (action) {
      const {buffer, firstVisibleRow} = action;
      const editor = yield select(getBufferEditor, buffer);
      if (editor) {
        editor.scrollToLine(firstVisibleRow);
      }
    });
    yield takeEvery(deps.bufferHighlight, function* (action) {
      const {buffer, range} = action;
      const editor = yield select(getBufferEditor, buffer);
      if (editor) {
        editor.highlight(range);
      }
    });
  });

  function resetEditor (editor, model) {
    try {
      const text = model.get('document').toString();
      const selection = model.get('selection');
      const firstVisibleRow = model.get('firstVisibleRow');
      editor.reset(text, selection, firstVisibleRow);
    } catch (error) {
      console.log('failed to update editor view with model', error);
    }
  }

  bundle.defineView('BufferEditor', BufferEditorSelector, EpicComponent(self => {

    const onInit = function (editor) {
      const {dispatch, buffer} = self.props;
      dispatch({type: deps.bufferInit, buffer, editor});
    };

    const onSelect = function (selection) {
      const {dispatch, buffer} = self.props;
      dispatch({type: deps.bufferSelect, buffer, selection});
    };

    const onEdit = function (delta) {
      const {dispatch, buffer} = self.props;
      dispatch({type: deps.bufferEdit, buffer, delta});
    };

    const onScroll = function (firstVisibleRow) {
      const {dispatch, buffer} = self.props;
      console.log('scroll', firstVisibleRow);
      dispatch({type: deps.bufferScroll, buffer, firstVisibleRow});
    };

    self.render = function () {
      return <Editor onInit={onInit} onEdit={onEdit} onSelect={onSelect} onScroll={onScroll} {...self.props} />;
    };

  }));

  function BufferEditorSelector (state, props) {
    return {};
  }

};
