/*

Two buffers ('source' and 'input') are stored in the global state.
XXX Currently the code for 'source' and 'input' is duplicated, this should
    be cleaned up to support any number of named buffers.
    A view should also be defined that takes the name of the buffer; currently
    this is done with the Editor component ../utils/editor.js which is passed
    callbacks that fire the appropriate actions.

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


import {take, select} from 'redux-saga/effects';
import Immutable from 'immutable';

import Document from './document';

export const DocumentModel = Immutable.Record({
  document: Document.blank,
  selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
  firstVisibleRow: 0
});

export const BufferState = Immutable.Record({model: DocumentModel(), editor: null});

export default function (bundle, deps) {

  bundle.defineAction('sourceInit', 'Source.Init');
  bundle.defineAction('sourceLoad', 'Source.Load');
  bundle.defineAction('sourceReset', 'Source.Reset');
  bundle.defineAction('sourceEdit', 'Source.Edit');
  bundle.defineAction('sourceSelect', 'Source.Select');
  bundle.defineAction('sourceScroll', 'Source.Scroll');
  bundle.defineAction('sourceModelEdit', 'Source.Model.Edit');
  bundle.defineAction('sourceModelSelect', 'Source.Model.Select');
  bundle.defineAction('sourceModelScroll', 'Source.Model.Scroll');
  bundle.defineAction('sourceHighlight', 'Source.Highlight');

  bundle.defineAction('inputInit', 'Input.Init');
  bundle.defineAction('inputLoad', 'Input.Load');
  bundle.defineAction('inputReset', 'Input.Reset');
  bundle.defineAction('inputEdit', 'Input.Edit');
  bundle.defineAction('inputSelect', 'Input.Select');
  bundle.defineAction('inputScroll', 'Input.Scroll');
  bundle.defineAction('inputModelEdit', 'Input.Model.Edit');
  bundle.defineAction('inputModelSelect', 'Input.Model.Select');
  bundle.defineAction('inputModelScroll', 'Input.Model.Scroll');
  bundle.defineAction('inputHighlight', 'Input.Highlight');

  bundle.defineSelector('getSourceModel', function (state) {
    return state.getIn(['source', 'model']);
  });

  bundle.defineSelector('getInputModel', function (state) {
    return state.getIn(['input', 'model']);
  });

  function getSourceEditor (state) {
    return state.getIn(['source', 'editor']);
  }

  function getInputEditor (state) {
    return state.getIn(['input', 'editor']);
  }

  bundle.addReducer('init', state => state
    .set('source', BufferState())
    .set('input', BufferState())
  );

  bundle.addReducer('sourceInit', function (state, action) {
    return state.setIn(['source', 'editor'], action.editor);
  });

  bundle.addReducer('sourceLoad', function (state, action) {
    return state.setIn(['source', 'model'], DocumentModel({
      document: Document.fromString(action.text),
      selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
      firstVisibleRow: 0
    }));
  });

  bundle.addReducer('sourceReset', function (state, action) {
    return state.setIn(['source', 'model'], action.model);
  });

  bundle.addReducer('sourceEdit', function (state, action) {
    const prevSource = state.getIn(['source', 'model', 'document']);
    const source = Document.applyDelta(prevSource, action.delta);
    return state.setIn(['source', 'model', 'document'], source);
  });

  bundle.addReducer('sourceSelect', function (state, action) {
    return state.setIn(['source', 'model', 'selection'], action.selection);
  });

  bundle.addReducer('sourceScroll', function (state, action) {
    return state.setIn(['source', 'model', 'firstVisibleRow'], action.firstVisibleRow);
  });

  bundle.addReducer('inputInit', function (state, action) {
    return state.setIn(['input', 'editor'], action.editor);
  });

  bundle.addReducer('inputReset', function (state, action) {
    return state.setIn(['input', 'model'], action.model);
  });

  bundle.addReducer('inputLoad', function (state, action) {
    return state.setIn(['input', 'model'], DocumentModel({
      document: Document.fromString(action.text),
      selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
      firstVisibleRow: 0
    }));
  });

  bundle.addReducer('inputEdit', function (state, action) {
    const prevInput = state.getIn(['input', 'model', 'document']);
    const input = Document.applyDelta(prevInput, action.delta);
    return state.setIn(['input', 'model', 'document'], input);
  });

  bundle.addReducer('inputSelect', function (state, action) {
    return state.setIn(['input', 'model', 'selection'], action.selection);
  });

  bundle.addReducer('inputScroll', function (state, action) {
    return state.setIn(['input', 'model', 'firstVisibleRow'], action.firstVisibleRow);
  });

  bundle.addSaga(function* watchSourceInit () {
    while (true) {
      const {editor} = yield take(deps.sourceInit);
      if (editor) {
        const model = yield select(deps.getSourceModel);
        resetEditor(editor, model);
      }
    }
  });

  bundle.addSaga(function* watchInputInit () {
    while (true) {
      const {editor} = yield take(deps.inputInit);
      if (editor) {
        const model = yield select(deps.getInputModel);
        resetEditor(editor, model);
      }
    }
  });

  bundle.addSaga(function* watchSourceReset () {
    while (true) {
      const {model} = yield take(deps.sourceReset);
      const editor = yield select(getSourceEditor);
      if (editor) {
        resetEditor(editor, model);
      }
    }
  });

  bundle.addSaga(function* watchInputReset () {
    while (true) {
      const {model} = yield take(deps.inputReset);
      const editor = yield select(getInputEditor);
      if (editor) {
        resetEditor(editor, model);
      }
    }
  });

  bundle.addSaga(function *watchSourceModelSelect () {
    while (true) {
      const {selection} = yield take(deps.sourceModelSelect);
      const editor = yield select(getSourceEditor);
      if (editor) {
        editor.setSelection(selection);
      }
    }
  });

  bundle.addSaga(function *watchSourceHighlight () {
    while (true) {
      const {range} = yield take(deps.sourceHighlight);
      const editor = yield select(getSourceEditor);
      if (editor) {
        editor.highlight(range);
      }
    }
  });

  bundle.addSaga(function *watchSourceModelEdit () {
    while (true) {
      const {delta, deltas} = yield take(deps.sourceModelEdit);
      const editor = yield select(getSourceEditor);
      if (editor) {
        editor.applyDeltas(deltas || [delta]);
      }
    }
  });

  bundle.addSaga(function *watchSourceModelScroll () {
    while (true) {
      const {firstVisibleRow} = yield take(deps.sourceModelScroll);
      const editor = yield select(getSourceEditor);
      if (editor) {
        editor.scrollToLine(firstVisibleRow);
      }
    }
  });

  bundle.addSaga(function *watchInputModelSelect () {
    while (true) {
      const {selection} = yield take(deps.inputModelSelect);
      const editor = yield select(getInputEditor);
      if (editor) {
        editor.setSelection(selection);
      }
    }
  });

  bundle.addSaga(function *watchInputHighlight () {
    while (true) {
      const {range} = yield take(deps.inputHighlight);
      const editor = yield select(getInputEditor);
      if (editor) {
        editor.highlight(range);
      }
    }
  });

  bundle.addSaga(function *watchInputModelEdit () {
    while (true) {
      const {delta, deltas} = yield take(deps.inputModelEdit);
      const editor = yield select(getInputEditor);
      if (editor) {
        editor.applyDeltas(deltas || [delta]);
      }
    }
  });

  bundle.addSaga(function *watchInputModelScroll () {
    while (true) {
      const {firstVisibleRow} = yield take(deps.inputModelScroll);
      const editor = yield select(getInputEditor);
      if (editor) {
        editor.scrollToLine(firstVisibleRow);
      }
    }
  });

  function resetEditor (editor, model) {
    try {
      const text = Document.toString(model.get('document'));
      const selection = model.get('selection');
      const firstVisibleRow = model.get('firstVisibleRow');
      editor.reset(text, selection, firstVisibleRow);
    } catch (error) {
      console.log('failed to update editor view with model', error);
    }
  }

};
