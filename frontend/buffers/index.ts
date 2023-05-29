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

import {call, put, select, takeEvery} from 'typed-redux-saga';
import {
    compressDocument,
    compressRange,
    Document,
    documentFromString,
    emptyDocument,
    expandRange, modelFromDocument,
    ObjectDocument,
    Selection, uncompressIntoDocument
} from "./document";

window.ace = require("ace-builds");
window.ace.acequire = window.ace.require || window.ace.acequire;
window.ace.config.set("loadWorkerFromBlob", false);


import "ace-builds/src-min-noconflict/mode-c_cpp";
import "ace-builds/src-min-noconflict/mode-python";
import "ace-builds/src-min-noconflict/mode-javascript";
import "ace-builds/src-min-noconflict/mode-ocaml";
import "./modes/archetype";
import "./modes/michelson";
import "ace-builds/src-min-noconflict/snippets/html";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-min-noconflict/theme-github";

import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {getBufferModel} from "./selectors";
import {immerable} from "immer";
import {AppStore} from "../store";
import {ReplayContext} from "../player/sagas";
import {PlayerInstant} from "../player";
import {Bundle} from "../linker";
import {App} from "../index";
import {updateSourceHighlightSaga} from "../stepper";
import {BlockType} from "../task/blocks/blocks";
import log from 'loglevel';
import {stepperDisplayError} from '../stepper/actionTypes';
import {getMessage} from '../lang';
import {platformAnswerLoaded, platformTaskRefresh} from '../task/platform/actionTypes';
import {hasBlockPlatform} from '../stepper/js';
import {appSelect} from '../hooks';
import {CodecastPlatform} from '../stepper/platforms';

const AceThemes = [
    'github',
];

export abstract class BufferContentModel {
    [immerable] = true;

    public document;
    public selection;
    public firstVisibleRow: number = 0;
}

export class DocumentModel extends BufferContentModel {
    [immerable] = true;

    constructor(
        public document: Document = emptyDocument,
        public selection: Selection = new Selection(),
        public firstVisibleRow: number = 0
    ) {
        super();
    }
}

export class BlockDocumentModel extends BufferContentModel {
    [immerable] = true;

    constructor(
        public document: ObjectDocument = new ObjectDocument(null),
        public selection: string = null,
    ) {
        super();
    }
}

export class BufferState {
    [immerable] = true;

    public dirty; // Has the buffer been modified completely recently, in which case it needs to be entirely reloaded

    constructor(public model = new DocumentModel()) {

    }

    editor = null;
}

export const documentModelFromString = function (text: string): DocumentModel {
    const doc = documentFromString(text);

    return new DocumentModel(doc);
}

function initBufferIfNeeded(state: AppStore, buffer: string, editor = null) {
    if (!(buffer in state.buffers)) {
        state.buffers[buffer] = editor ? new BufferState(editor.getEmptyModel()) : new BufferState();
    }
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore, {payload: {options: {source, input}}}) => {
        state.buffers = {};

        if (source) {
            bufferResetReducer(state, {buffer: 'source', text: new DocumentModel(documentFromString(source || ''))});
        }
        if (input) {
            bufferResetReducer(state, {buffer: 'input', text: new DocumentModel(documentFromString(input || ''))});
        }
    });

    bundle.defineAction(ActionTypes.BufferInit);
    bundle.addReducer(ActionTypes.BufferInit, (state: AppStore, action) => {
        const {buffer, editor} = action;
        initBufferIfNeeded(state, buffer, editor);

        state.buffers[buffer].editor = editor;
    });

    bundle.defineAction(ActionTypes.BufferReset);
    bundle.addReducer(ActionTypes.BufferReset, bufferResetReducer);

    bundle.defineAction(ActionTypes.BufferEdit);
    bundle.addReducer(ActionTypes.BufferEdit, bufferEditReducer);

    bundle.defineAction(ActionTypes.BufferEditPlain);
    bundle.addReducer(ActionTypes.BufferEditPlain, bufferEditPlainReducer);

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

function bufferResetReducer(state: AppStore, action): void {
    const {buffer, model} = action;
    initBufferIfNeeded(state, buffer);
    state.buffers[buffer].model = model;
    state.buffers[buffer].dirty = false;
}

function bufferEditReducer(state: AppStore, action): void {
    const {buffer, delta} = action;
    initBufferIfNeeded(state, buffer);
    const oldDoc = state.buffers[buffer].model.document;

    state.buffers[buffer].model.document = oldDoc.applyDelta(delta);
}

function bufferEditPlainReducer(state: AppStore, action): void {
    const {buffer, document} = action;
    initBufferIfNeeded(state, buffer);
    state.buffers[buffer].model.document = document;
    state.buffers[buffer].dirty = true;
}

function bufferSelectReducer(state: AppStore, action): void {
    const {buffer, selection} = action;

    state.buffers[buffer].model.selection = selection;
}

function bufferScrollReducer(state: AppStore, action): void {
    const {buffer, firstVisibleRow} = action;

    state.buffers[buffer].model.firstVisibleRow = firstVisibleRow;
}

export function getBufferEditor(state, buffer) {
    return buffer in state.buffers ? state.buffers[buffer].editor : null;
}

function* buffersSaga() {
    yield* takeEvery(ActionTypes.BufferInit, function* (action) {
        const state = yield* appSelect();

        // @ts-ignore
        const {buffer, editor} = action;
        if (editor) {
            const model = getBufferModel(state, buffer);

            resetEditor(editor, model);
        }
    });
    yield* takeEvery(ActionTypes.BufferInsertBlock, function* (action) {
        const state: AppStore = yield* appSelect();
        // @ts-ignore
        const {buffer, block, pos} = action.payload;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            let insertNewLineBefore = false;
            let insertNewLineAfter = false;
            if ((BlockType.Function === block.type && block.category !== 'sensors') || BlockType.Directive === block.type) {
                insertNewLineBefore = insertNewLineAfter = true;
            }
            if (BlockType.Token === block.type && block.snippet && -1 !== block.snippet.indexOf('${')) {
                insertNewLineBefore = true;
            }

            if (block.snippet) {
                editor.insert(block.snippet, pos ? pos : null, true, insertNewLineBefore, insertNewLineAfter);
            } else {
                editor.insert(block.code, pos ? pos : null, false, insertNewLineBefore, insertNewLineAfter);
            }
        }
    });
    yield* takeEvery(ActionTypes.BufferReset, function* (action) {
        const state: AppStore = yield* appSelect();
        // @ts-ignore
        const {buffer, model, quiet, goToEnd} = action;
        if (!quiet) {
            const editor = getBufferEditor(state, buffer);
            if (editor) {
                resetEditor(editor, model, !!goToEnd);
            }
        }
    });
    yield* takeEvery(ActionTypes.BufferModelSelect, function* (action) {
        const state: AppStore = yield* appSelect();

        // @ts-ignore
        const {buffer, selection} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.setSelection(selection);
        }
    });
    yield* takeEvery(ActionTypes.BufferModelEdit, function* (action) {
        const state: AppStore = yield* appSelect();

        // @ts-ignore
        const {buffer, delta, deltas} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.applyDeltas(deltas || [delta]);
        }
    });
    yield* takeEvery(ActionTypes.BufferModelScroll, function* (action) {
        const state: AppStore = yield* appSelect();

        // @ts-ignore
        const {buffer, firstVisibleRow} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.scrollToLine(firstVisibleRow);
        }
    });
    yield* takeEvery(ActionTypes.BufferHighlight, function* (action) {
        const state: AppStore = yield* appSelect();

        // @ts-ignore
        const {buffer, range, className} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.highlight(range, className);
        }
    });
    yield* takeEvery(ActionTypes.BufferResize, function* (action) {
        const state: AppStore = yield* appSelect();

        // @ts-ignore
        const {buffer} = action;
        const editor = getBufferEditor(state, buffer);
        if (editor) {
            editor.resize();
        }
    });
    yield* takeEvery(ActionTypes.BufferDownload, function* () {
        const state: AppStore = yield* appSelect();
        const platform = state.options.platform;
        const sourceModel = getBufferModel(state, 'source');
        const answer = sourceModel.document ? compressDocument(sourceModel.document) : null;

        const data = new Blob([answer], {type: 'text/plain'});
        const textFile = window.URL.createObjectURL(data);

        const anchor = document.createElement('a');
        anchor.href = textFile
        anchor.target = '_blank';
        anchor.download = `program_${platform}.txt`;
        anchor.click();
    });

    yield* takeEvery(ActionTypes.BufferReload, function* () {
        const state: AppStore = yield* appSelect();

        try {
            const fileContent = yield* call(pickFileAndGetContent);
            const document = uncompressIntoDocument(fileContent);

            if (document instanceof ObjectDocument && !hasBlockPlatform(state.options.platform)) {
                throw new Error(getMessage('EDITOR_RELOAD_IMPOSSIBLE'));
            } else if (document instanceof Document && hasBlockPlatform(state.options.platform)) {
                throw new Error(getMessage('EDITOR_RELOAD_IMPOSSIBLE'));
            }

            yield* put(platformAnswerLoaded(document.getContent()));
            yield* put(platformTaskRefresh());
        } catch (e: any) {
            if (e && e.message) {
                yield* put(stepperDisplayError(e.message));
            }
        }
    });
}

function pickFileAndGetContent() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        let fileSelected = false;

        input.onchange = e => {
            const files = (e.target as HTMLInputElement).files;
            if (!files.length) {
                reject();
            }
            fileSelected = true;

            const file = files[0];
            const textType = /text.*/;
            if (!file.type.match(textType)) {
                reject(new Error(getMessage('EDITOR_RELOAD_IMPOSSIBLE')));
                return;
            }

            const reader = new FileReader();
            reader.readAsText(files[0],'UTF-8');

            reader.onload = readerEvent => {
                const content = readerEvent.target.result;
                resolve(content);
            }
        }

        document.body.onfocus = () => {
            document.body.onfocus = null;
            if (!fileSelected) {
                reject();
            }
        };

        input.click();
    })

}

function resetEditor(editor, model?: BufferContentModel, goToEnd?: boolean) {
    try {
        if (null === model) {
            editor.reset(null, null, null);
        } else {
            editor.reset(model.document, model.selection, model.firstVisibleRow);
            if (goToEnd && editor.goToEnd) {
                editor.goToEnd();
            }
        }

    } catch (error) {
        log.getLogger('editor').debug('failed to update editor view with model', error);
    }
}

function addRecordHooks({recordApi}: App) {
    recordApi.onStart(function* (init) {
        const state: AppStore = yield* appSelect();

        init.buffers = {};
        for (let bufferName of Object.keys(state.buffers)) {
            const bufferModel = getBufferModel(state, bufferName);

            init.buffers[bufferName] = {
                document: compressDocument(bufferModel.document),
                selection: compressRange(bufferModel.selection),
                firstVisibleRow: bufferModel.firstVisibleRow
            }
        }
    });
    recordApi.on(ActionTypes.BufferSelect, function* (addEvent, action) {
        const {buffer, selection} = action;

        yield* call(addEvent, 'buffer.select', buffer, compressRange(selection));
    });
    recordApi.on(ActionTypes.BufferEdit, function* (addEvent, action) {
        const state: AppStore = yield* appSelect();
        const {buffer, delta} = action;
        const {start, end} = delta;
        const range = {start, end};

        const {platform} = state.options;
        if (buffer === 'output' && platform === CodecastPlatform.Python) {
            // For python, the full output is retrieved from the interpreter at each step.

            return;
        }

        if (delta.action === 'insert') {
            yield* call(addEvent, 'buffer.insert', buffer, compressRange(range), delta.lines);
        } else {
            yield* call(addEvent, 'buffer.delete', buffer, compressRange(range));
        }
    });
    recordApi.on(ActionTypes.BufferEditPlain, function* (addEvent, action) {
        const {buffer, document} = action;
        let content = compressDocument(document);
        yield* call(addEvent, 'buffer.edit_plain', buffer, content);
    });
    recordApi.on(ActionTypes.BufferScroll, function* (addEvent, action) {
        const {buffer, firstVisibleRow} = action;

        yield* call(addEvent, 'buffer.scroll', buffer, firstVisibleRow);
    });
}

function addReplayHooks({replayApi}: App) {
    log.getLogger('editor').debug('Add replay hooks for editor');
    replayApi.on('start', function* (replayContext: ReplayContext, event) {
        const {buffers} = event[2];
        for (let bufferName of Object.keys(buffers)) {
            const content = buffers[bufferName].document;
            const document = uncompressIntoDocument(content);
            const model = modelFromDocument(document);
            log.getLogger('editor').debug('Gotten document', document);
            yield* put({type: ActionTypes.BufferReset, buffer: bufferName, model});
        }

    });
    replayApi.on('buffer.select', function* (replayContext: ReplayContext, event) {
        // XXX use reducer imported from common/buffers
        const buffer = event[2];
        const selection = expandRange(event[3]);

        yield* put({type: ActionTypes.BufferSelect, buffer, selection});

        replayContext.addSaga(function* () {
            yield* put({type: ActionTypes.BufferModelSelect, buffer, selection});
        });
    });
    replayApi.on('buffer.edit_plain', function* (replayContext: ReplayContext, event) {
        const buffer = event[2];
        const content = event[3];
        const document = uncompressIntoDocument(content);

        yield* put({type: ActionTypes.BufferEditPlain, buffer, document});
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
            yield* put({type: ActionTypes.BufferEdit, buffer, delta});
            yield* call(replayApi.applyEvent,'buffer.edit', replayContext, [buffer]);

            replayContext.addSaga(function* () {
                yield* put({type: ActionTypes.BufferModelEdit, buffer, delta});
            });
        }
    });
    replayApi.on('buffer.scroll', function* (replayContext: ReplayContext, event) {
        // XXX use reducer imported from common/buffers
        const buffer = event[2];
        const firstVisibleRow = event[3];

        yield* put({type: ActionTypes.BufferScroll, buffer, firstVisibleRow});

        replayContext.addSaga(function* () {
            yield* put({type: ActionTypes.BufferModelScroll, buffer, firstVisibleRow});
        });
    });
    replayApi.onReset(function* ({state}: PlayerInstant, quick) {
        /* Reset all buffers. */
        log.getLogger('editor').debug('Editor Buffer Reset', state);
        for (let buffer of Object.keys(state.buffers)) {
            const model = state.buffers[buffer].model;
            const dirty = state.buffers[buffer].dirty;

            yield* put({type: ActionTypes.BufferReset, buffer, model, quiet: quick && !dirty && model instanceof DocumentModel});
        }

        yield* call(updateSourceHighlightSaga, state);
    });
}
