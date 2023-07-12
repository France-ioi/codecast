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

import {call, put, takeEvery} from 'typed-redux-saga';
import {
    compressRange, createEmptyBufferState,
    documentToString,
    expandRange,
    getBufferHandler,
    uncompressIntoDocument
} from "./document";
import "ace-builds/src-min-noconflict/mode-c_cpp";
import "ace-builds/src-min-noconflict/mode-python";
import "ace-builds/src-min-noconflict/mode-javascript";
import "ace-builds/src-min-noconflict/mode-ocaml";
import "./modes/archetype";
import "./modes/michelson";
import "ace-builds/src-min-noconflict/snippets/html";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-min-noconflict/theme-github";

import {ActionTypes as AppActionTypes} from "../actionTypes";
import {AppStore} from "../store";
import {ReplayContext} from "../player/sagas";
import {PlayerInstant} from "../player";
import {Bundle} from "../linker";
import {updateSourceHighlightSaga} from "../stepper";
import log from 'loglevel';
import {stepperDisplayError} from '../stepper/actionTypes';
import {getMessage} from '../lang';
import {platformAnswerLoaded, platformTaskRefresh} from '../task/platform/actionTypes';
import {appSelect} from '../hooks';
import {hasBlockPlatform} from '../stepper/platforms';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {App} from '../app_types';
import {BlockType} from '../task/blocks/block_types';
import {BufferType, TextDocumentDelta, TextDocumentDeltaAction, Range} from './buffer_types';
import {
    bufferEdit,
    bufferEditPlain, bufferModelEdit,
    bufferReset,
    bufferResize,
    bufferScrollToLine,
    bufferSelect
} from './buffers_slice';
import {bufferDownload, bufferReload} from './buffer_actions';

function initBufferIfNeeded(state: AppStore, buffer: string) {
    if (!(buffer in state.buffers)) {
        // state.buffers[buffer] = new BufferState();
    }
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore, {payload: {options: {source, input}}}) => {
        state.buffers = {};

        // if (source) {
        //     bufferResetReducer(state, {buffer: 'source', text: new DocumentModel(documentFromString(source || ''))});
        // }
        // if (input) {
        //     bufferResetReducer(state, {buffer: inputBufferLibTest, text: new DocumentModel(documentFromString(input || ''))});
        // }
    });

    // bundle.addReducer(ActionTypes.BufferInit, (state: AppStore, action) => {
    //     const {buffer} = action;
    //     initBufferIfNeeded(state, buffer);
    // });

    // bundle.defineAction(ActionTypes.BufferReset);
    // bundle.addReducer(ActionTypes.BufferReset, bufferResetReducer);
    //
    // bundle.defineAction(ActionTypes.BufferEdit);
    // bundle.addReducer(ActionTypes.BufferEdit, bufferEditReducer);
    //
    // bundle.defineAction(ActionTypes.BufferEditPlain);
    // bundle.addReducer(ActionTypes.BufferEditPlain, bufferEditPlainReducer);
    //
    // bundle.defineAction(ActionTypes.BufferSelect);
    // bundle.addReducer(ActionTypes.BufferSelect, bufferSelectReducer);
    //
    // bundle.defineAction(ActionTypes.BufferScroll);
    // bundle.addReducer(ActionTypes.BufferScroll, bufferScrollReducer);

    bundle.addSaga(buffersSaga);

    bundle.defer(addRecordHooks);
    bundle.defer(addReplayHooks);
};

// function bufferResetReducer(state: AppStore, action): void {
//     const {buffer, model} = action;
//     initBufferIfNeeded(state, buffer);
//     state.buffers[buffer].model = model;
//     state.buffers[buffer].dirty = false;
// }
//
// function bufferEditReducer(state: AppStore, action): void {
//     const {buffer, delta} = action;
//     initBufferIfNeeded(state, buffer);
//     const oldDoc = state.buffers[buffer].model.document;
//
//     state.buffers[buffer].model.document = oldDoc.applyDelta(delta);
// }
//
// function bufferEditPlainReducer(state: AppStore, action): void {
//     const {buffer, document} = action;
//     initBufferIfNeeded(state, buffer);
//     state.buffers[buffer].model.document = document;
//     state.buffers[buffer].dirty = true;
// }
//
// function bufferSelectReducer(state: AppStore, action): void {
//     const {buffer, selection} = action;
//
//     state.buffers[buffer].model.selection = selection;
// }
//
// function bufferScrollReducer(state: AppStore, action): void {
//     const {buffer, firstVisibleRow} = action;
//
//     state.buffers[buffer].model.firstVisibleRow = firstVisibleRow;
// }

export function getBufferEditor(state, buffer) {
    return buffer in state.buffers ? state.buffers[buffer].editor : null;
}

function* buffersSaga() {
    // yield* takeEvery(ActionTypes.BufferInit, function* (action) {
    //     const state = yield* appSelect();
    //
    //     // @ts-ignore
    //     const {buffer, editor} = action;
    //     if (editor) {
    //         // const model = getBufferModel(state, buffer);
    //
    //         // resetEditor(editor, model);
    //     }
    // });
    // yield* takeEvery(ActionTypes.BufferReset, function* (action) {
    //     const state: AppStore = yield* appSelect();
    //     // @ts-ignore
    //     const {buffer, model, quiet, goToEnd} = action;
    //     if (!quiet) {
    //         const editor = getBufferEditor(state, buffer);
    //         if (editor) {
    //             // resetEditor(editor, model, !!goToEnd);
    //         }
    //     }
    // });

    yield* takeEvery(bufferDownload, function* () {
        const state: AppStore = yield* appSelect();
        const platform = state.options.platform;
        const bufferHandler = getBufferHandler(state.buffers['source']);
        const answer = bufferHandler.documentToString();

        const data = new Blob([answer], {type: 'text/plain'});
        const textFile = window.URL.createObjectURL(data);

        const anchor = document.createElement('a');
        anchor.href = textFile
        anchor.target = '_blank';
        anchor.download = `program_${platform}.txt`;
        anchor.click();
    });

    yield* takeEvery(bufferReload, function* () {
        const state: AppStore = yield* appSelect();

        try {
            const fileContent = yield* call(pickFileAndGetContent);
            const document = uncompressIntoDocument(fileContent);

            if (BufferType.Block === document.type && !hasBlockPlatform(state.options.platform)) {
                throw new Error(getMessage('EDITOR_RELOAD_IMPOSSIBLE'));
            } else if (BufferType.Text === document.type && hasBlockPlatform(state.options.platform)) {
                throw new Error(getMessage('EDITOR_RELOAD_IMPOSSIBLE'));
            }

            yield* put(platformAnswerLoaded(document));
            yield* put(platformTaskRefresh());
        } catch (e: any) {
            if (e && e.message) {
                yield* put(stepperDisplayError(e.message));
            }
        }
    });
}

function pickFileAndGetContent(): Promise<string> {
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
                const content = String(readerEvent.target.result);
                resolve(content);
            }
        }

        // Add fail-safe to avoid memory leaks if the window has regained focus for more than 10 secs
        document.body.onfocus = () => {
            document.body.onfocus = null;
            setTimeout(() => {
                if (!fileSelected) {
                    log.getLogger('editor').debug('No file selected');
                    reject();
                }
            }, 10000);
        };

        input.click();
    })

}

// function resetEditor(editor, model?: BufferContentModel, goToEnd?: boolean) {
//     try {
//         if (null === model) {
//             editor.reset(null, null, null);
//         } else {
//             editor.reset(model.document, model.selection, model.firstVisibleRow);
//             if (goToEnd && editor.goToEnd) {
//                 editor.goToEnd();
//             }
//         }
//
//     } catch (error) {
//         log.getLogger('editor').debug('failed to update editor view with model', error);
//     }
// }

function addRecordHooks({recordApi}: App) {
    recordApi.onStart(function* (init) {
        const state: AppStore = yield* appSelect();

        init.buffers = {};
        for (let bufferName of Object.keys(state.buffers)) {
            const bufferModel = state.buffers[bufferName];

            init.buffers[bufferName] = {
                document: documentToString(bufferModel.document),
                selection: compressRange(bufferModel.selection),
                firstVisibleRow: bufferModel.firstVisibleRow
            }
        }
    });
    recordApi.on(bufferSelect.type, function* (addEvent, action) {
        const {buffer, selection} = action.payload;

        yield* call(addEvent, 'buffer.select', buffer, compressRange(selection));
    });
    recordApi.on(bufferEdit.type, function* (addEvent, action) {
        const state: AppStore = yield* appSelect();
        const {buffer, delta} = action.payload;
        const {start, end} = delta;
        const range: Range = {start, end};

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
    recordApi.on(bufferEditPlain.type, function* (addEvent, action) {
        const {buffer, document} = action.payload;
        let content = documentToString(document);
        yield* call(addEvent, 'buffer.edit_plain', buffer, content);
    });
    recordApi.on(bufferScrollToLine.type, function* (addEvent, action) {
        const {buffer, firstVisibleRow} = action.payload;

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
            const bufferState = createEmptyBufferState(document.type);
            bufferState.document = document;
            log.getLogger('editor').debug('Gotten document', document);
            yield* put(bufferReset({buffer: bufferName, state: bufferState}));
        }

    });
    replayApi.on('buffer.select', function* (replayContext: ReplayContext, event) {
        const buffer = event[2];
        const selection = expandRange(event[3]);
        yield* put(bufferSelect({buffer, selection}));
    });
    replayApi.on('buffer.edit_plain', function* (replayContext: ReplayContext, event) {
        const buffer = event[2];
        const content = event[3];
        const document = uncompressIntoDocument(content);
        yield* put(bufferEditPlain({buffer, document}))
    });
    replayApi.on(['buffer.insert', 'buffer.delete'], function*(replayContext: ReplayContext, event) {
        // XXX use reducer imported from common/buffers
        const buffer = event[2];
        const range = expandRange(event[3]);
        let delta: TextDocumentDelta;
        if (event[1].endsWith('insert')) {
            delta = {
                action: TextDocumentDeltaAction.Insert,
                start: range.start,
                end: range.end,
                lines: event[4]
            };
        } else if (event[1].endsWith('delete')) {
            delta = {
                action: TextDocumentDeltaAction.Remove,
                start: range.start,
                end: range.end,
            };
        }

        if (delta) {
            yield* put(bufferEdit({buffer, delta}));
            replayContext.addSaga(function* () {
                yield* put(bufferModelEdit({buffer, delta}));
            });
        }
    });
    replayApi.on('buffer.scroll', function* (replayContext: ReplayContext, event) {
        // XXX use reducer imported from common/buffers
        const buffer = event[2];
        const firstVisibleRow = event[3];

        yield* put(bufferScrollToLine({buffer, firstVisibleRow}));

        // replayContext.addSaga(function* () {
        //     yield* put({type: ActionTypes.BufferModelScroll, buffer, firstVisibleRow});
        // });
    });
    replayApi.onReset(function* ({state}: PlayerInstant, quick) {
        /* Reset all buffers. */
        log.getLogger('editor').debug('Editor Buffer Reset', state);
        for (let buffer of Object.keys(state.buffers)) {
            const model = state.buffers[buffer];
            // const dirty = state.buffers[buffer].dirty;
            // yield* put({type: ActionTypes.BufferReset, buffer, model, quiet: quick && !dirty && model instanceof DocumentModel});
            // TODO: Implement quiet
            yield* put(bufferReset({buffer, state: model}))
        }

        yield* call(updateSourceHighlightSaga, state);
    });
}
