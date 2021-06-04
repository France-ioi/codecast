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
import {compressRange, Document, documentFromString, emptyDocument, expandRange, Selection} from "./document";

import 'brace';
import 'brace/mode/c_cpp';
import 'brace/mode/python';
import 'brace/snippets/html';
import 'brace/ext/language_tools';
import 'brace/theme/github';
import 'brace/worker/javascript';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {getBufferModel} from "./selectors";
import {immerable} from "immer";
import {AppStore, AppStoreReplay} from "../store";
import {ReplayContext} from "../player/sagas";
import {PlayerInstant} from "../player";
import {Bundle} from "../linker";
import {App} from "../index";

// import 'brace/theme/ambiance';
// import 'brace/theme/chaos';
// import 'brace/theme/chrome';
// import 'brace/theme/clouds';
// import 'brace/theme/clouds_midnight';
// import 'brace/theme/cobalt';
// import 'brace/theme/crimson_editor';
// import 'brace/theme/dawn';
// import 'brace/theme/dreamweaver';
// import 'brace/theme/eclipse';
// import 'brace/theme/idle_fingers';
// import 'brace/theme/iplastic';
// import 'brace/theme/katzenmilch';
// import 'brace/theme/kr_theme';
// import 'brace/theme/kuroir';
// import 'brace/theme/merbivore';
// import 'brace/theme/merbivore_soft';
// import 'brace/theme/mono_industrial';
// import 'brace/theme/monokai';
// import 'brace/theme/pastel_on_dark';
// import 'brace/theme/solarized_dark';
// import 'brace/theme/solarized_light';
// import 'brace/theme/sqlserver';
// import 'brace/theme/terminal';
// import 'brace/theme/textmate';
// import 'brace/theme/tomorrow';
// import 'brace/theme/tomorrow_night';
// import 'brace/theme/tomorrow_night_blue';
// import 'brace/theme/tomorrow_night_bright';
// import 'brace/theme/tomorrow_night_eighties';
// import 'brace/theme/twilight';
// import 'brace/theme/vibrant_ink';
// import 'brace/theme/xcode';

const AceThemes = [
    'github',
    // 'ambiance', 'chaos', 'chrome', 'clouds', 'clouds_midnight', 'cobalt',
    // 'crimson_editor', 'dawn', 'dreamweaver', 'eclipse', 'github', 'idle_fingers',
    // 'iplastic', 'katzenmilch', 'kr_theme', 'kuroir', 'merbivore',
    // 'merbivore_soft', 'mono_industrial', 'monokai', 'pastel_on_dark',
    // 'solarized_dark', 'solarized_light', 'sqlserver', 'terminal', 'textmate',
    // 'tomorrow', 'tomorrow_night', 'tomorrow_night_blue', 'tomorrow_night_bright',
    // 'tomorrow_night_eighties', 'twilight', 'vibrant_ink', 'xcode'
];

export class DocumentModel {
    [immerable] = true;

    constructor(
        public document: Document = emptyDocument,
        public selection: Selection = new Selection(),
        public firstVisibleRow: number = 0
    ) {

    }
}

class BufferState {
    [immerable] = true;

    constructor(public model = new DocumentModel()) {

    }

    editor = null;
}

export const documentModelFromString = function (text: string): DocumentModel {
    const doc = documentFromString(text);

    return new DocumentModel(doc);
}

export const initialStateBuffers: {[key: string]: BufferState} = {
    source: new BufferState(),
    input: new BufferState(),
    output: new BufferState()
};

function initBufferIfNeeded(state: AppStore, buffer: string) {
    if (!(buffer in state.buffers)) {
        state.buffers[buffer] = new BufferState();
    }
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore, {payload: {options: {source, input}}}) => {
        state.buffers = initialStateBuffers;

        if (source) {
            bufferLoadReducer(state, {buffer: 'source', text: source || ''});
        }
        if (input) {
            bufferLoadReducer(state, {buffer: 'input', text: input || ''});
        }
    });

    bundle.defineAction(ActionTypes.BufferInit);
    bundle.addReducer(ActionTypes.BufferInit, (state: AppStore, action) => {
        const {buffer, editor} = action;
        initBufferIfNeeded(state, buffer);

        state.buffers[buffer].editor = editor;
    });

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

function bufferLoadReducer(state: AppStore, action): void {
    const {buffer, text} = action;
    initBufferIfNeeded(state, buffer);
    state.buffers[buffer].model = new DocumentModel(documentFromString(text));
}

function bufferResetReducer(state: AppStore, action): void {
    const {buffer, model} = action;
    initBufferIfNeeded(state, buffer);
    state.buffers[buffer].model = model;
}

function bufferEditReducer(state: AppStoreReplay, action): void {
    const {buffer, delta} = action;
    const oldDoc = state.buffers[buffer].model.document;

    state.buffers[buffer].model.document = oldDoc.applyDelta(delta);
}

function bufferSelectReducer(state: AppStoreReplay, action): void {
    const {buffer, selection} = action;

    state.buffers[buffer].model.selection = selection;
}

function bufferScrollReducer(state: AppStoreReplay, action): void {
    const {buffer, firstVisibleRow} = action;

    state.buffers[buffer].model.firstVisibleRow = firstVisibleRow;
}

function loadBufferModel(dump) {
    return new DocumentModel(documentFromString(dump.document), expandRange(dump.selection), dump.firstVisibleRow || 0);
}

function getBufferEditor(state, buffer) {
    return state.buffers[buffer].editor;
}

function* buffersSaga() {
    yield takeEvery(ActionTypes.BufferInit, function* (action) {
        const state: AppStore = yield select();

        // @ts-ignore
        const {buffer, editor} = action;
        if (editor) {
            const model = getBufferModel(state, buffer);

            resetEditor(editor, model);
        }
    });
    yield takeEvery(ActionTypes.BufferReset, function* (action) {
        const state: AppStore = yield select();
        // @ts-ignore
        const {buffer, model, quiet} = action;
        if (!quiet) {
            const editor = getBufferEditor(state, buffer);
            if (editor) {
                resetEditor(editor, model);
            }
        }
    });
    yield takeEvery(ActionTypes.BufferModelSelect, function* (action) {
        const state: AppStore = yield select();

        // @ts-ignore
        const {buffer, selection} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.setSelection(selection);
        }
    });
    yield takeEvery(ActionTypes.BufferModelEdit, function* (action) {
        const state: AppStore = yield select();

        // @ts-ignore
        const {buffer, delta, deltas} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.applyDeltas(deltas || [delta]);
        }
    });
    yield takeEvery(ActionTypes.BufferModelScroll, function* (action) {
        const state: AppStore = yield select();

        // @ts-ignore
        const {buffer, firstVisibleRow} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.scrollToLine(firstVisibleRow);
        }
    });
    yield takeEvery(ActionTypes.BufferHighlight, function* (action) {
        const state: AppStore = yield select();

        // @ts-ignore
        const {buffer, range} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.highlight(range);
        }
    });
    yield takeEvery(ActionTypes.BufferResize, function* (action) {
        const state: AppStore = yield select();

        // @ts-ignore
        const {buffer} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.resize();
        }
    });
}

function resetEditor(editor, model: DocumentModel) {
    try {
        const text = model.document.toString();

        editor.reset(text, model.selection, model.firstVisibleRow);
    } catch (error) {
        console.log('failed to update editor view with model', error);
    }
}

function addRecordHooks({recordApi}: App) {
    recordApi.onStart(function* (init) {
        const state: AppStore = yield select();

        init.buffers = {};
        for (let bufferName of Object.keys(state.buffers)) {
            const bufferModel = getBufferModel(state, bufferName);

            init.buffers[bufferName] = {
                document: bufferModel.document.toString(),
                selection: compressRange(bufferModel.selection),
                firstVisibleRow: bufferModel.firstVisibleRow
            }
        }
    });
    recordApi.on(ActionTypes.BufferSelect, function* (addEvent, action) {
        const {buffer, selection} = action;

        yield call(addEvent, 'buffer.select', buffer, compressRange(selection));
    });
    recordApi.on(ActionTypes.BufferEdit, function* (addEvent, action) {
        const state: AppStore = yield select();
        const {buffer, delta} = action;
        const {start, end} = delta;
        const range = {start, end};

        const {platform} = state.options;
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

function addReplayHooks({replayApi}: App) {
    replayApi.on('start', function(replayContext: ReplayContext, event) {
        const {buffers} = event[2];
        replayContext.state.buffers = initialStateBuffers;

        for (let bufferName of Object.keys(buffers)) {
            if (!(bufferName in replayContext.state.buffers)) {
                replayContext.state.buffers[bufferName] = new BufferState();
            }
            replayContext.state.buffers[bufferName].model = buffers && buffers[bufferName] ? loadBufferModel(buffers[bufferName]) : new DocumentModel();
        }
    });
    replayApi.on('buffer.select', function(replayContext: ReplayContext, event) {
        // XXX use reducer imported from common/buffers
        const buffer = event[2];
        const selection = expandRange(event[3]);

        bufferSelectReducer(replayContext.state, {buffer, selection});
        replayContext.addSaga(function* () {
            yield put({type: ActionTypes.BufferModelSelect, buffer, selection});
        });
    });
    replayApi.on(['buffer.insert', 'buffer.delete'], function*(replayContext: ReplayContext, event) {
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
            bufferEditReducer(replayContext.state, {buffer, delta});
            yield call(replayApi.applyEvent,'buffer.edit', replayContext, [buffer]);

            replayContext.addSaga(function* () {
                yield put({type: ActionTypes.BufferModelEdit, buffer, delta});
            });
        }
    });
    replayApi.on('buffer.scroll', function(replayContext: ReplayContext, event) {
        // XXX use reducer imported from common/buffers
        const buffer = event[2];
        const firstVisibleRow = event[3];

        bufferScrollReducer(replayContext.state, {buffer, firstVisibleRow});
        replayContext.addSaga(function* () {
            yield put({type: ActionTypes.BufferModelScroll, buffer, firstVisibleRow});
        });
    });
    replayApi.onReset(function* ({state, range}: PlayerInstant, quick) {
        /* Reset all buffers. */
        for (let buffer of Object.keys(state.buffers)) {
            const model = state.buffers[buffer].model;

            yield put({type: ActionTypes.BufferReset, buffer, model, quiet: quick});
        }
        if (range) {
            yield put({type: ActionTypes.BufferHighlight, buffer: 'source', range});
        }
    });
}
