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
    compressRange,
    createEmptyBufferState,
    documentToString,
    expandRange,
    getBufferHandler,
    TextBufferHandler,
    uncompressIntoDocument
} from "./document";
import "ace-builds/src-min-noconflict/mode-c_cpp";
import "ace-builds/src-min-noconflict/mode-java";
import "ace-builds/src-min-noconflict/mode-python";
import "ace-builds/src-min-noconflict/mode-javascript";
import "ace-builds/src-min-noconflict/mode-ocaml";
import "./modes/archetype";
import "./modes/michelson";
import "ace-builds/src-min-noconflict/snippets/html";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-min-noconflict/theme-github";

import {AppStore} from "../store";
import {ReplayContext} from "../player/sagas";
import {PlayerInstant} from "../player";
import {Bundle} from "../linker";
import log from 'loglevel';
import {ActionTypes as StepperActionTypes, stepperDisplayError} from '../stepper/actionTypes';
import {getMessage} from '../lang';
import {platformAnswerLoaded, platformTaskRefresh} from '../task/platform/actionTypes';
import {appSelect} from '../hooks';
import {hasBlockPlatform} from '../stepper/platforms';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {App} from '../app_types';
import {
    BufferState,
    BufferStateParameters,
    BufferType,
    Document,
    Range,
    TextDocumentDelta,
    TextDocumentDeltaAction
} from './buffer_types';
import {
    bufferChangeActiveBufferName,
    bufferDissociateFromSubmission,
    bufferEdit,
    bufferEditPlain,
    bufferInit,
    bufferModelEdit,
    bufferReset,
    bufferResetDocument,
    bufferScrollToLine,
    bufferSelect
} from './buffers_slice';
import {
    bufferChangePlatform,
    bufferCreateSourceBuffer,
    bufferDownload,
    bufferDuplicateSourceBuffer,
    bufferReload
} from './buffer_actions';
import {selectSourceBuffers} from './buffer_selectors';
import {getDefaultSourceCode} from '../task/utils';
import {submissionChangeCurrentSubmissionId} from '../submission/submission_slice';
import {loadBlocklyHelperSaga} from '../stepper/js';
import {quickAlgoLibraries} from '../task/libs/quick_algo_libraries_model';
import {importPlatformModules} from '../task/libs/import_modules';
import {createQuickalgoLibrary} from '../task/libs/quickalgo_library_factory';
import {TaskAnswer} from '../task/task_types';
import {selectAnswer} from '../task/selectors';
import {RECORDING_FORMAT_VERSION} from '../version';
import {StepperStatus} from '../stepper';

export default function(bundle: Bundle) {
    bundle.addSaga(buffersSaga);

    bundle.defer(addRecordHooks);
    bundle.defer(addReplayHooks);
};

function* getNewBufferName() {
    const currentSourceBuffers = yield* appSelect(selectSourceBuffers);
    let i = 0;
    while (`source:${i}` in currentSourceBuffers) {
        i++;
    }

    return `source:${i}`;
}

function getNewFileName(state: AppStore, platform: CodecastPlatform) {
    const currentSourceBuffers = selectSourceBuffers(state);
    let j = 1;
    while (Object.values(currentSourceBuffers).find(buffer => platform === buffer.platform && getMessage('BUFFER_TAB_FILENAME').format({i: j}) === buffer.fileName)) {
        j++;
    }

    return getMessage('BUFFER_TAB_FILENAME').format({i: j});
}

export function normalizeBufferToTaskAnswer(buffer: BufferState): TaskAnswer {
    return {
        version: RECORDING_FORMAT_VERSION,
        document: buffer.document,
        fileName: buffer.fileName,
        platform: buffer.platform,
    };
}

// export function denormalizeBufferFromAnswer(answer: TaskAnswer): BufferState {
//
// }

export function* createSourceBufferFromDocument(document: Document) {
    const state: AppStore = yield* appSelect();

    const newBufferName = yield* call(getNewBufferName);
    const platform = state.options.platform;
    const newFileName = getNewFileName(state, platform);

    const newBuffer: BufferStateParameters = {
        type: document.type,
        source: true,
        fileName: newFileName,
        platform,
    };

    yield* put(bufferInit({buffer: newBufferName, ...newBuffer}));
    yield* put(bufferResetDocument({buffer: newBufferName, document, goToEnd: true}));
    yield* put(bufferChangeActiveBufferName(newBufferName));
}

function* createBufferFromSubmission(submissionId: number) {
    const newBufferName = yield* call(getNewBufferName);

    const state: AppStore = yield* appSelect();

    const submission = state.submission.taskSubmissions[submissionId];
    if (!submission?.result?.sourceCode?.source) {
        return;
    }

    const platform = submission.result.sourceCode.params.sLangProg as CodecastPlatform;

    const document = TextBufferHandler.documentFromString(submission?.result?.sourceCode?.source);

    const newBuffer: BufferStateParameters = {
        type: document.type,
        source: true,
        fileName: submission?.result?.sourceCode?.name,
        platform,
        submissionIndex: submissionId,
    };

    yield* put(bufferInit({buffer: newBufferName, ...newBuffer}));
    yield* put(bufferResetDocument({buffer: newBufferName, document, goToEnd: true}));
    yield* put(bufferChangeActiveBufferName(newBufferName));
}

function* buffersSaga() {
    yield* takeEvery(bufferDownload, function* () {
        const state: AppStore = yield* appSelect();
        const currentAnswer = selectAnswer(state);
        const answerString = documentToString(currentAnswer.document);

        const data = new Blob([answerString], {type: 'text/plain'});
        const textFile = window.URL.createObjectURL(data);

        const anchor = document.createElement('a');
        anchor.href = textFile
        anchor.target = '_blank';
        anchor.download = `program_${currentAnswer.platform}.txt`;
        anchor.click();
    });

    yield* takeEvery(bufferCreateSourceBuffer, function* ({payload: {document, platform}}) {
        const state: AppStore = yield* appSelect();
        let newDocument = document ?? getDefaultSourceCode(state.options.platform, state.environment, state.task.currentTask);
        log.getLogger('editor').debug('Load new source code', newDocument);
        yield* call(createSourceBufferFromDocument, newDocument);
    });

    yield* takeEvery(bufferDuplicateSourceBuffer, function* () {
        const state: AppStore = yield* appSelect();
        const activeBuffer = state.buffers.activeBufferName;
        if (null === activeBuffer) {
            return;
        }
        const document = state.buffers.buffers[activeBuffer].document;
        const documentCopy = JSON.parse(JSON.stringify(document));
        yield* call(createSourceBufferFromDocument, documentCopy);
    });

    yield* takeEvery(bufferChangeActiveBufferName, function* () {
        const state: AppStore = yield* appSelect();
        const activeBuffer = state.buffers.activeBufferName;
        if (null === activeBuffer) {
            return;
        }

        if (state.stepper && state.stepper.status !== StepperStatus.Clear) {
            yield* put({type: StepperActionTypes.StepperExit});
        }

        const submissionIndex = state.buffers.buffers[activeBuffer].submissionIndex;
        const currentSubmissionIndex = state.submission.currentSubmissionId;

        if (currentSubmissionIndex !== submissionIndex) {
            yield* put(submissionChangeCurrentSubmissionId({submissionId: submissionIndex}));
        }
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

            const answer: TaskAnswer = {
                version: RECORDING_FORMAT_VERSION,
                document,
                platform: state.options.platform,
            };

            yield* put(platformAnswerLoaded(answer));
            yield* put(platformTaskRefresh());
        } catch (e: any) {
            if (e && e.message) {
                yield* put(stepperDisplayError(e.message));
            }
        }
    });

    yield* takeEvery(bufferDissociateFromSubmission, function* ({payload: {buffer}}) {
        const state = yield* appSelect();
        const bufferState = state.buffers.buffers[buffer];
        if (null !== bufferState.fileName) {
            return;
        }

        const newFileName = getNewFileName(state, bufferState.platform);
        yield* put(bufferInit({buffer, fileName: newFileName}));
    });

    yield* takeEvery(bufferChangePlatform, function* ({payload: {bufferName, platform}}) {
        const state = yield* appSelect();
        const bufferState = state.buffers.buffers[bufferName];
        const currentPlatform = bufferState.platform;
        yield* put(bufferInit({buffer: bufferName, platform}));

        if (currentPlatform !== platform) {
            yield* call(createQuickalgoLibrary);
            const document = getDefaultSourceCode(platform, state.environment, state.task.currentTask);
            yield* put(bufferResetDocument({buffer: bufferName, document, goToEnd: true}));
        }
    });

    yield* takeEvery(submissionChangeCurrentSubmissionId, function* () {
        const state = yield* appSelect();
        const newSubmissionId = state.submission.currentSubmissionId;
        if (null === newSubmissionId) {
            return;
        }

        // Open (or re-open) a buffer for this submission
        for (let [bufferName, bufferState] of Object.entries(state.buffers.buffers)) {
            if (newSubmissionId === bufferState.submissionIndex) {
                if (state.buffers.activeBufferName !== bufferName) {
                    yield* put(bufferChangeActiveBufferName(bufferName));
                }

                return;
            }
        }

        yield* call(createBufferFromSubmission, newSubmissionId);
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
    });
}

function addRecordHooks({recordApi}: App) {
    recordApi.onStart(function* (init) {
        const state: AppStore = yield* appSelect();

        init.buffers = {};
        for (let bufferName of Object.keys(state.buffers.buffers)) {
            const bufferModel = state.buffers.buffers[bufferName];

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
            const bufferState = {
                ...createEmptyBufferState(document.type),
                ...(buffers[bufferName].selection ? {selection: expandRange(buffers[bufferName].selection)} : {}),
                firstVisibleRow: buffers[bufferName].firstVisibleRow,
                document,
            };
            log.getLogger('editor').debug('[buffer] replay api start', bufferState);
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
    });
    replayApi.onReset(function* ({state}: PlayerInstant, quick) {
        /* Reset all buffers. */
        log.getLogger('editor').debug('Editor Buffer Reset', state);
        for (let buffer of Object.keys(state.buffers.buffers)) {
            const model = state.buffers.buffers[buffer];
            yield* put(bufferReset({buffer, state: model}))
        }
    });
}
