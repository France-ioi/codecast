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


import {call, put, takeEvery, select} from 'redux-saga/effects';
import Immutable from 'immutable';
import update from 'immutability-helper';
import React from 'react';

import 'brace';
import 'brace/mode/c_cpp';
import 'brace/theme/ambiance';
import 'brace/theme/chaos';
import 'brace/theme/chrome';
import 'brace/theme/clouds';
import 'brace/theme/clouds_midnight';
import 'brace/theme/cobalt';
import 'brace/theme/crimson_editor';
import 'brace/theme/dawn';
import 'brace/theme/dreamweaver';
import 'brace/theme/eclipse';
import 'brace/theme/github';
import 'brace/theme/idle_fingers';
import 'brace/theme/iplastic';
import 'brace/theme/katzenmilch';
import 'brace/theme/kr_theme';
import 'brace/theme/kuroir';
import 'brace/theme/merbivore';
import 'brace/theme/merbivore_soft';
import 'brace/theme/mono_industrial';
import 'brace/theme/monokai';
import 'brace/theme/pastel_on_dark';
import 'brace/theme/solarized_dark';
import 'brace/theme/solarized_light';
import 'brace/theme/sqlserver';
import 'brace/theme/terminal';
import 'brace/theme/textmate';
import 'brace/theme/tomorrow';
import 'brace/theme/tomorrow_night';
import 'brace/theme/tomorrow_night_blue';
import 'brace/theme/tomorrow_night_bright';
import 'brace/theme/tomorrow_night_eighties';
import 'brace/theme/twilight';
import 'brace/theme/vibrant_ink';
import 'brace/theme/xcode';
import 'brace/worker/javascript';

import {emptyDocument, documentFromString, compressRange, expandRange} from './document';
import Editor from './editor';

const AceThemes = [
  'ambiance', 'chaos', 'chrome', 'clouds', 'clouds_midnight', 'cobalt',
  'crimson_editor', 'dawn', 'dreamweaver', 'eclipse', 'github', 'idle_fingers',
  'iplastic', 'katzenmilch', 'kr_theme', 'kuroir', 'merbivore',
  'merbivore_soft', 'mono_industrial', 'monokai', 'pastel_on_dark',
  'solarized_dark', 'solarized_light', 'sqlserver', 'terminal', 'textmate',
  'tomorrow', 'tomorrow_night', 'tomorrow_night_blue', 'tomorrow_night_bright',
  'tomorrow_night_eighties', 'twilight', 'vibrant_ink', 'xcode'
];

export const DocumentModel = Immutable.Record({
  document: emptyDocument,
  selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
  firstVisibleRow: 0
});

const BufferState = Immutable.Record({
  model: DocumentModel(),
  editor: null
});

export default function (bundle) {

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

  bundle.defineSelector('getBufferModel', getBufferModel);

  bundle.defineView('BufferEditor', BufferEditorSelector, BufferEditor);

  bundle.addReducer('init', initReducer);
  bundle.addReducer('bufferInit', bufferInitReducer);
  bundle.addReducer('bufferLoad', bufferLoadReducer);
  bundle.addReducer('bufferReset', bufferResetReducer);
  bundle.addReducer('bufferEdit', bufferEditReducer);
  bundle.addReducer('bufferSelect', bufferSelectReducer);
  bundle.addReducer('bufferScroll', bufferScrollReducer);

  bundle.addSaga(buffersSaga);

  bundle.defer(addRecordHooks);
  bundle.defer(addReplayHooks);

};

class BufferEditor extends React.PureComponent {

  onInit = (editor) => {
    const {dispatch, buffer, actionTypes} = this.props;
    dispatch({type: actionTypes.bufferInit, buffer, editor});
  };

  onSelect = (selection) => {
    const {dispatch, buffer, actionTypes} = this.props;
    dispatch({type: actionTypes.bufferSelect, buffer, selection});
  };

  onEdit = (delta) => {
    const {dispatch, buffer, actionTypes} = this.props;
    dispatch({type: actionTypes.bufferEdit, buffer, delta});
  };

  onScroll = (firstVisibleRow) => {
    const {dispatch, buffer, actionTypes} = this.props;
    dispatch({type: actionTypes.bufferScroll, buffer, firstVisibleRow});
  };

  render () {
    return <Editor onInit={this.onInit} onEdit={this.onEdit} onSelect={this.onSelect} onScroll={this.onScroll} {...this.props} />;
  };

}

function BufferEditorSelector (state, props) {
  const actionTypes = state.get('actionTypes');
  const getMessage = state.get('getMessage');
  return {actionTypes, getMessage};
}

function initReducer (state, {payload: {source, input}}) {
  state = state.set('buffers', Immutable.Map({
    source: BufferState(),
    input: BufferState(),
    output: BufferState()
  }));
  if (source) {
    state = bufferLoadReducer(state, {buffer: 'source', text: source || ''});
  }
  if (input) {
    state = bufferLoadReducer(state, {buffer: 'input', text: input || ''});
  }
  return state;
}

function bufferInitReducer (state, action) {
  const {buffer, editor} = action;
  return state.setIn(['buffers', buffer, 'editor'], editor);
}

function bufferLoadReducer (state, action) {
  const {buffer, text} = action;
  return state.setIn(['buffers', buffer, 'model'], DocumentModel({
    document: documentFromString(text),
    selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
    firstVisibleRow: 0
  }));
}

function bufferResetReducer (state, action) {
  const {buffer, model} = action;
  return state.setIn(['buffers', buffer, 'model'], model);
}

function bufferEditReducer (state, action) {
  const {buffer, delta} = action;
  const oldDoc = state.getIn(['buffers', buffer, 'model', 'document']);
  const newDoc = oldDoc.applyDelta(delta);
  return state.setIn(['buffers', buffer, 'model', 'document'], newDoc);
}

function bufferSelectReducer (state, action) {
  const {buffer, selection} = action;
  return state.setIn(['buffers', buffer, 'model', 'selection'], selection);
}

function bufferScrollReducer (state, action) {
  const {buffer, firstVisibleRow} = action;
  return state.setIn(['buffers', buffer, 'model', 'firstVisibleRow'], firstVisibleRow);
}

function loadBufferModel (dump) {
  return DocumentModel({
    document: documentFromString(dump.document),
    selection: expandRange(dump.selection),
    firstVisibleRow: dump.firstVisibleRow || 0
  });
}

function getBufferModel (state, buffer) {
  return state.getIn(['buffers', buffer, 'model']);
}

function getBufferEditor (state, buffer) {
  return state.getIn(['buffers', buffer, 'editor']);
}

function* buffersSaga () {
  const actionTypes = yield select(state => state.get('actionTypes'));
  yield takeEvery(actionTypes.bufferInit, function* (action) {
    const {buffer, editor} = action;
    if (editor) {
      const model = yield select(getBufferModel, buffer);
      resetEditor(editor, model);
    }
  });
  yield takeEvery(actionTypes.bufferReset, function* (action) {
    const {buffer, model, quiet} = action;
    if (!quiet) {
      const editor = yield select(getBufferEditor, buffer);
      if (editor) {
        resetEditor(editor, model);
      }
    }
  });
  yield takeEvery(actionTypes.bufferModelSelect, function* (action) {
    const {buffer, selection} = action;
    const editor = yield select(getBufferEditor, buffer);
    if (editor) {
      editor.setSelection(selection);
    }
  });
  yield takeEvery(actionTypes.bufferModelEdit, function* (action) {
    const {buffer, delta, deltas} = action;
    const editor = yield select(getBufferEditor, buffer);
    if (editor) {
      editor.applyDeltas(deltas || [delta]);
    }
  });
  yield takeEvery(actionTypes.bufferModelScroll, function* (action) {
    const {buffer, firstVisibleRow} = action;
    const editor = yield select(getBufferEditor, buffer);
    if (editor) {
      editor.scrollToLine(firstVisibleRow);
    }
  });
  yield takeEvery(actionTypes.bufferHighlight, function* (action) {
    const {buffer, range} = action;
    const editor = yield select(getBufferEditor, buffer);
    if (editor) {
      editor.highlight(range);
    }
  });
}

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

function addRecordHooks ({recordApi}, actionTypes) {
  recordApi.onStart(function* (init) {
    const sourceModel = yield select(getBufferModel, 'source');
    const inputModel = yield select(getBufferModel, 'input');
    init.buffers = {
      source: {
        document: sourceModel.get('document').toString(),
        selection: compressRange(sourceModel.get('selection')),
        firstVisibleRow: sourceModel.get('firstVisibleRow')
      },
      input: {
        document: inputModel.get('document').toString(),
        selection: compressRange(inputModel.get('selection')),
        firstVisibleRow: inputModel.get('firstVisibleRow')
      }
    };
  });
  recordApi.on(actionTypes.bufferSelect, function* (addEvent, action) {
    const {buffer, selection} = action;
    yield call(addEvent, 'buffer.select', buffer, compressRange(selection));
  });
  recordApi.on(actionTypes.bufferEdit, function* (addEvent, action) {
    const {buffer, delta} = action;
    const {start, end} = delta;
    const range = {start, end};
    if (delta.action === 'insert') {
      yield call(addEvent, 'buffer.insert', buffer, compressRange(range), delta.lines);
    } else {
      yield call(addEvent, 'buffer.delete', buffer, compressRange(range));
    }
  });
  recordApi.on(actionTypes.bufferScroll, function* (addEvent, action) {
    const {buffer, firstVisibleRow} = action;
    yield call(addEvent, 'buffer.scroll', buffer, firstVisibleRow);
  });
}

function addReplayHooks ({replayApi}, actionTypes) {
  replayApi.on('start', function (replayContext, event) {
    const {buffers} = event[2];
    const sourceModel = buffers && buffers.source ? loadBufferModel(buffers.source) : DocumentModel();
    const inputModel = buffers && buffers.input ? loadBufferModel(buffers.input) : DocumentModel();
    const outputModel = DocumentModel();
    replayContext.state = replayContext.state.set('buffers',
      Immutable.Map({
        source: Immutable.Map({model: sourceModel}),
        input: Immutable.Map({model: inputModel}),
        output: Immutable.Map({model: outputModel})
      }));
  });
  replayApi.on('buffer.select', function (replayContext, event) {
    // XXX use reducer imported from common/buffers
    const buffer = event[2];
    const selection = expandRange(event[3]);
    replayContext.state = bufferSelectReducer(replayContext.state, {buffer, selection});
    replayContext.addSaga(function* () {
      yield put({type: actionTypes.bufferModelSelect, buffer, selection});
    });
  });
  replayApi.on(['buffer.insert', 'buffer.delete'], function (replayContext, event) {
    // XXX use reducer imported from common/buffers
    const buffer = event[2];
    const range = expandRange(event[3]);
    let delta;
    if (event[1].endsWith('insert')) {
      delta = {
        action: 'insert',
        start: range.start,
        end: range.end,
        lines: event[4]
      };
    } else if (event[1].endsWith('delete')) {
      delta = {
        action: 'remove',
        start: range.start,
        end: range.end
      };
    }
    if (delta) {
      replayContext.state = bufferEditReducer(replayContext.state, {buffer, delta});
      replayContext.addSaga(function* () {
        yield put({type: actionTypes.bufferModelEdit, buffer, delta});
      });
    }
  });
  replayApi.on('buffer.scroll', function (replayContext, event) {
    // XXX use reducer imported from common/buffers
    const buffer = event[2];
    const firstVisibleRow = event[3];
    replayContext.state = bufferScrollReducer(replayContext.state, {buffer, firstVisibleRow});
    replayContext.addSaga(function* () {
      yield put({type: actionTypes.bufferModelScroll, buffer, firstVisibleRow});
    });
  });
  replayApi.onReset(function* ({state, range}, quick) {
    /* Reset all buffers. */
    for (let buffer of ['source', 'input', 'output']) {
      const model = state.getIn(['buffers', buffer, 'model']);
      yield put({type: actionTypes.bufferReset, buffer, model, quiet: quick});
    }
    if (range) {
      yield put({type: actionTypes.bufferHighlight, buffer: 'source', range});
    }
  });
}

/*
  bundle.defineView('AceSettings', AceSettingsSelector, AceSettings);
  bundle.addReducer('init', initReducer);
  bundle.defineAction('aceSourceThemeChanged', 'Ace.Source.Theme.Changed');
  bundle.addReducer('aceSourceThemeChanged', aceSourceThemeChangedReducer);
  bundle.addSaga()

  function initReducer (state) {
    return state.set('ace', {source: {theme: 'textmate'}});
  }

  class AceSettings extends React.PureComponent {
    _themeOptions = AceThemes.map((theme) => ({label: theme, value: theme}));
    render() {
      return (
        <div>
          <Select options={_themeOptions} onChange={this.onSelectSourceTheme} clearableValue={false} />
        </div>
      );
    }
    onSelect = (option) => {
      this.props.dispatch({type: deps.aceSourceThemeChanged, payload: {theme: option.value}});
    };
  }
  function AceSettingsSelector (state) {
    return {};
  }
  function aceSourceThemeChangedReducer (state, {payload: {theme}}) {
    return state.update('ace', ace => update(ace, {source: {theme: {$set: theme}}}));
  }
  function* aceSettingsSaga () {
    const {aceSourceThemeChanged} = yield select(state => state.get('actionTypes'));
    yield takeEvery(aceSourceThemeChanged, function* () {
      const editor = yield select(getBufferEditor, 'source');
      if (editor) {
        editor. // XXX set theme...
      }
    });
  }
*/
