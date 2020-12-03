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

import {call, put, select, takeEvery} from 'redux-saga/effects';
import {Map, Record} from 'immutable';

import 'brace';
import 'brace/mode/c_cpp';
import 'brace/mode/python';
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

import {compressRange, documentFromString, emptyDocument, expandRange} from './document';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {getBufferModel} from "./selectors";

const AceThemes = [
    'ambiance', 'chaos', 'chrome', 'clouds', 'clouds_midnight', 'cobalt',
    'crimson_editor', 'dawn', 'dreamweaver', 'eclipse', 'github', 'idle_fingers',
    'iplastic', 'katzenmilch', 'kr_theme', 'kuroir', 'merbivore',
    'merbivore_soft', 'mono_industrial', 'monokai', 'pastel_on_dark',
    'solarized_dark', 'solarized_light', 'sqlserver', 'terminal', 'textmate',
    'tomorrow', 'tomorrow_night', 'tomorrow_night_blue', 'tomorrow_night_bright',
    'tomorrow_night_eighties', 'twilight', 'vibrant_ink', 'xcode'
];

export const DocumentModel = Record({
    document: emptyDocument,
    selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
    firstVisibleRow: 0
});

const BufferState = Record({
    model: DocumentModel(),
    editor: null
});

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, initReducer);

    bundle.defineAction(ActionTypes.BufferInit);
    bundle.addReducer(ActionTypes.BufferInit, bufferInitReducer);

    bundle.defineAction(ActionTypes.BufferLoad);
    bundle.addReducer(ActionTypes.BufferLoad, bufferLoadReducer);

    bundle.defineAction(ActionTypes.BufferReset);
    bundle.addReducer(ActionTypes.BufferReset, bufferResetReducer);

    bundle.defineAction(ActionTypes.BufferEdit);
    bundle.addReducer(ActionTypes.BufferEdit, bufferEditReducer);

    bundle.defineAction(ActionTypes.BufferSelect);
    bundle.addReducer(ActionTypes.BufferSelect, bufferSelectReducer);

    bundle.defineAction(ActionTypes.BufferScroll);
    bundle.addReducer(ActionTypes.BufferScroll, bufferScrollReducer);

    bundle.defineAction(ActionTypes.BufferModelEdit);
    bundle.defineAction(ActionTypes.BufferModelSelect);
    bundle.defineAction(ActionTypes.BufferModelScroll);
    bundle.defineAction(ActionTypes.BufferHighlight);

    bundle.addSaga(buffersSaga);

    bundle.defer(addRecordHooks);
    bundle.defer(addReplayHooks);
};

function initReducer(state, {payload: {options: {source, input}}}) {
    state = state.set('buffers', Map({
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

function bufferInitReducer(state, action) {
    const {buffer, editor} = action;

    return state.setIn(['buffers', buffer, 'editor'], editor);
}

function bufferLoadReducer(state, action) {
    const {buffer, text} = action;

    return state.setIn(['buffers', buffer, 'model'], DocumentModel({
        document: documentFromString(text),
        selection: {start: {row: 0, column: 0}, end: {row: 0, column: 0}},
        firstVisibleRow: 0
    }));
}

function bufferResetReducer(state, action) {
    const {buffer, model} = action;

    return state.setIn(['buffers', buffer, 'model'], model);
}

function bufferEditReducer(state, action) {
    const {buffer, delta} = action;
    const oldDoc = state.getIn(['buffers', buffer, 'model', 'document']);
    const newDoc = oldDoc.applyDelta(delta);

    return state.setIn(['buffers', buffer, 'model', 'document'], newDoc);
}

function bufferSelectReducer(state, action) {
    const {buffer, selection} = action;

    return state.setIn(['buffers', buffer, 'model', 'selection'], selection);
}

function bufferScrollReducer(state, action) {
    const {buffer, firstVisibleRow} = action;

    return state.setIn(['buffers', buffer, 'model', 'firstVisibleRow'], firstVisibleRow);
}

function loadBufferModel(dump) {
    return DocumentModel({
        document: documentFromString(dump.document),
        selection: expandRange(dump.selection),
        firstVisibleRow: dump.firstVisibleRow || 0
    });
}

function getBufferEditor(state, buffer) {
    return state.getIn(['buffers', buffer, 'editor']);
}

function* buffersSaga() {
    yield takeEvery(ActionTypes.BufferInit, function* (action) {
        // @ts-ignore
        const {buffer, editor} = action;
        if (editor) {
            const model = yield select(getBufferModel, buffer);
            resetEditor(editor, model);
        }
    });
    yield takeEvery(ActionTypes.BufferReset, function* (action) {
        // @ts-ignore
        const {buffer, model, quiet} = action;
        if (!quiet) {
            const editor = yield select(getBufferEditor, buffer);
            if (editor) {
                resetEditor(editor, model);
            }
        }
    });
    yield takeEvery(ActionTypes.BufferModelSelect, function* (action) {
        // @ts-ignore
        const {buffer, selection} = action;
        const editor = yield select(getBufferEditor, buffer);
        if (editor) {
            editor.setSelection(selection);
        }
    });
    yield takeEvery(ActionTypes.BufferModelEdit, function* (action) {
        // @ts-ignore
        const {buffer, delta, deltas} = action;
        const editor = yield select(getBufferEditor, buffer);
        if (editor) {
            editor.applyDeltas(deltas || [delta]);
        }
    });
    yield takeEvery(ActionTypes.BufferModelScroll, function* (action) {
        // @ts-ignore
        const {buffer, firstVisibleRow} = action;
        const editor = yield select(getBufferEditor, buffer);
        if (editor) {
            editor.scrollToLine(firstVisibleRow);
        }
    });
    yield takeEvery(ActionTypes.BufferHighlight, function* (action) {
        // @ts-ignore
        const {buffer, range} = action;
        const editor = yield select(getBufferEditor, buffer);
        if (editor) {
            editor.highlight(range);
        }
    });
}

function resetEditor(editor, model) {
    try {
        const text = model.get('document').toString();
        const selection = model.get('selection');
        const firstVisibleRow = model.get('firstVisibleRow');

        editor.reset(text, selection, firstVisibleRow);
    } catch (error) {
        console.log('failed to update editor view with model', error);
    }
}

function addRecordHooks({recordApi}) {
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
    recordApi.on(ActionTypes.BufferSelect, function* (addEvent, action) {
        const {buffer, selection} = action;

        yield call(addEvent, 'buffer.select', buffer, compressRange(selection));
    });
    recordApi.on(ActionTypes.BufferEdit, function* (addEvent, action) {
        const {buffer, delta} = action;
        const {start, end} = delta;
        const range = {start, end};

        const {platform} = yield select(state => state.get('options'));
        if (buffer === 'output' && platform === 'python') {
            // For python, the full output is retrieved from the interpreter at each step.

            return;
        }

        if (delta.action === 'insert') {
            yield call(addEvent, 'buffer.insert', buffer, compressRange(range), delta.lines);
        } else {
            yield call(addEvent, 'buffer.delete', buffer, compressRange(range));
        }
    });
    recordApi.on(ActionTypes.BufferScroll, function* (addEvent, action) {
        const {buffer, firstVisibleRow} = action;

        yield call(addEvent, 'buffer.scroll', buffer, firstVisibleRow);
    });
}

function addReplayHooks({replayApi}) {
    replayApi.on('start', function(replayContext, event) {
        const {buffers} = event[2];
        const sourceModel = buffers && buffers.source ? loadBufferModel(buffers.source) : DocumentModel();
        const inputModel = buffers && buffers.input ? loadBufferModel(buffers.input) : DocumentModel();
        const outputModel = DocumentModel();

        replayContext.state = replayContext.state.set('buffers', Map({
            source: Map({model: sourceModel}),
            input: Map({model: inputModel}),
            output: Map({model: outputModel})
        }));
    });
    replayApi.on('buffer.select', function(replayContext, event) {
        // XXX use reducer imported from common/buffers
        const buffer = event[2];
        const selection = expandRange(event[3]);

        replayContext.state = bufferSelectReducer(replayContext.state, {buffer, selection});
        replayContext.addSaga(function* () {
            yield put({type: ActionTypes.BufferModelSelect, buffer, selection});
        });
    });
    replayApi.on(['buffer.insert', 'buffer.delete'], function(replayContext, event) {
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
                yield put({type: ActionTypes.BufferModelEdit, buffer, delta});
            });
        }
    });
    replayApi.on('buffer.scroll', function(replayContext, event) {
        // XXX use reducer imported from common/buffers
        const buffer = event[2];
        const firstVisibleRow = event[3];

        replayContext.state = bufferScrollReducer(replayContext.state, {buffer, firstVisibleRow});
        replayContext.addSaga(function* () {
            yield put({type: ActionTypes.BufferModelScroll, buffer, firstVisibleRow});
        });
    });
    replayApi.onReset(function* ({state, range}, quick) {
        /* Reset all buffers. */
        for (let buffer of ['source', 'input', 'output']) {
            const model = state.getIn(['buffers', buffer, 'model']);
            yield put({type: ActionTypes.BufferReset, buffer, model, quiet: quick});
        }
        if (range) {
            yield put({type: ActionTypes.BufferHighlight, buffer: 'source', range});
        }
    });
}
