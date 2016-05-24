/*

Two buffers ('source' and 'input') are stored in the global state.
XXX Currently the code for 'source' and 'input' is duplicated, this should
    be cleaned up to support any number of named buffers.
    A view should also be defined that takes the name of the buffer; currently
    this is done with the Editor component ../utils/editor.js which is passed
    callbacks that fire the appropriate actions.

The model for a buffer is an Immutable Map of this shape:

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

import {defineAction, defineSelector, addReducer, addSaga} from '../utils/linker';
import Document from './document';

const blankModel = Immutable.Map({
  document: Document.blank,
  selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
  firstVisibleRow: 0
});


export default function* (deps) {

  yield defineAction('sourceInit', 'Source.Init');
  yield defineAction('sourceLoad', 'Source.Load');
  yield defineAction('sourceReset', 'Source.Reset');
  yield defineAction('sourceEdit', 'Source.Edit');
  yield defineAction('sourceSelect', 'Source.Select');
  yield defineAction('sourceScroll', 'Source.Scroll');
  yield defineAction('sourceModelEdit', 'Source.Model.Edit');
  yield defineAction('sourceModelSelect', 'Source.Model.Select');
  yield defineAction('sourceModelScroll', 'Source.Model.Scroll');
  yield defineAction('sourceHighlight', 'Source.Highlight');

  yield defineAction('inputInit', 'Input.Init');
  yield defineAction('inputLoad', 'Input.Load');
  yield defineAction('inputReset', 'Input.Reset');
  yield defineAction('inputEdit', 'Input.Edit');
  yield defineAction('inputSelect', 'Input.Select');
  yield defineAction('inputScroll', 'Input.Scroll');
  yield defineAction('inputModelEdit', 'Input.Model.Edit');
  yield defineAction('inputModelSelect', 'Input.Model.Select');
  yield defineAction('inputModelScroll', 'Input.Model.Scroll');
  yield defineAction('inputHighlight', 'Input.Highlight');

  yield defineSelector('getSourceModel', function (state) {
    return state.getIn(['source', 'model']);
  });

  yield defineSelector('getInputModel', function (state) {
    return state.getIn(['input', 'model']);
  });

  function getSourceEditor (state) {
    return state.getIn(['source', 'editor']);
  }

  function getInputEditor (state) {
    return state.getIn(['input', 'editor']);
  }

  yield addReducer('init', state => state
    .set('source', Immutable.Map({model: blankModel, editor: null}))
    .set('input', Immutable.Map({model: blankModel, editor: null}))
  );

  yield addReducer('sourceInit', function (state, action) {
    return state.setIn(['source', 'editor'], action.editor);
  });

  yield addReducer('sourceLoad', function (state, action) {
    return state.setIn(['source', 'model'], Immutable.Map({
      document: Document.fromString(action.text),
      selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
      firstVisibleRow: 0
    }));
  });

  yield addReducer('sourceReset', function (state, action) {
    return state.setIn(['source', 'model'], action.model);
  });

  yield addReducer('sourceEdit', function (state, action) {
    const prevSource = state.getIn(['source', 'model', 'document']);
    const source = Document.applyDelta(prevSource, action.delta);
    return state.setIn(['source', 'model', 'document'], source);
  });

  yield addReducer('sourceSelect', function (state, action) {
    return state.setIn(['source', 'model', 'selection'], action.selection);
  });

  yield addReducer('sourceScroll', function (state, action) {
    return state.setIn(['source', 'model', 'firstVisibleRow'], action.firstVisibleRow);
  });

  yield addReducer('inputInit', function (state, action) {
    return state.setIn(['input', 'editor'], action.editor);
  });

  yield addReducer('inputReset', function (state, action) {
    return state.setIn(['input', 'model'], action.model);
  });

  yield addReducer('inputLoad', function (state, action) {
    return state.setIn(['input', 'model'], Immutable.Map({
      document: Document.fromString(action.text),
      selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
      firstVisibleRow: 0
    }));
  });

  yield addReducer('inputEdit', function (state, action) {
    const prevInput = state.getIn(['input', 'model', 'document']);
    const input = Document.applyDelta(prevInput, action.delta);
    return state.setIn(['input', 'model', 'document'], input);
  });

  yield addReducer('inputSelect', function (state, action) {
    return state.setIn(['input', 'model', 'selection'], action.selection);
  });

  yield addReducer('inputScroll', function (state, action) {
    return state.setIn(['input', 'model', 'firstVisibleRow'], action.firstVisibleRow);
  });

  yield addSaga(function* watchSourceInit () {
    while (true) {
      const {editor} = yield take(deps.sourceInit);
      if (editor) {
        const model = yield select(deps.getSourceModel);
        resetEditor(editor, model);
      }
    }
  });

  yield addSaga(function* watchInputInit () {
    while (true) {
      const {editor} = yield take(deps.inputInit);
      if (editor) {
        const model = yield select(deps.getInputModel);
        resetEditor(editor, model);
      }
    }
  });

  yield addSaga(function* watchSourceReset () {
    while (true) {
      const {model} = yield take(deps.sourceReset);
      const editor = yield select(getSourceEditor);
      if (editor) {
        resetEditor(editor, model);
      }
    }
  });

  yield addSaga(function* watchInputReset () {
    while (true) {
      const {model} = yield take(deps.inputReset);
      const editor = yield select(getInputEditor);
      if (editor) {
        resetEditor(editor, model);
      }
    }
  });

  yield addSaga(function *watchSourceModelSelect () {
    while (true) {
      const {selection} = yield take(deps.sourceModelSelect);
      const editor = yield select(getSourceEditor);
      if (editor) {
        editor.setSelection(selection);
      }
    }
  });

  yield addSaga(function *watchSourceHighlight () {
    while (true) {
      const {range} = yield take(deps.sourceHighlight);
      const editor = yield select(getSourceEditor);
      if (editor) {
        editor.highlight(range);
      }
    }
  });

  yield addSaga(function *watchSourceModelEdit () {
    while (true) {
      const {delta, deltas} = yield take(deps.sourceModelEdit);
      const editor = yield select(getSourceEditor);
      if (editor) {
        editor.applyDeltas(deltas || [delta]);
      }
    }
  });

  yield addSaga(function *watchSourceModelScroll () {
    while (true) {
      const {firstVisibleRow} = yield take(deps.sourceModelScroll);
      const editor = yield select(getSourceEditor);
      if (editor) {
        editor.scrollToLine(firstVisibleRow);
      }
    }
  });

  yield addSaga(function *watchInputModelSelect () {
    while (true) {
      const {selection} = yield take(deps.inputModelSelect);
      const editor = yield select(getInputEditor);
      if (editor) {
        editor.setSelection(selection);
      }
    }
  });

  yield addSaga(function *watchInputHighlight () {
    while (true) {
      const {range} = yield take(deps.inputHighlight);
      const editor = yield select(getInputEditor);
      if (editor) {
        editor.highlight(range);
      }
    }
  });

  yield addSaga(function *watchInputModelEdit () {
    while (true) {
      const {delta, deltas} = yield take(deps.inputModelEdit);
      const editor = yield select(getInputEditor);
      if (editor) {
        editor.applyDeltas(deltas || [delta]);
      }
    }
  });

  yield addSaga(function *watchInputModelScroll () {
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
