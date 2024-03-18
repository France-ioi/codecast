import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
    BufferState,
    TextDocumentDelta,
    Document,
    Range,
    TextPosition,
    BufferType,
    TextDocument,
    BufferStateParameters,
} from './buffer_types';
import {Block} from '../task/blocks/block_types';
import {createEmptyBufferState, documentToString, TextBufferHandler} from './document';
import {selectSourceBuffersFromBufferState} from './buffer_selectors';
import {DropResult} from 'react-beautiful-dnd';
import {CodeSegment, EditorType, htmlSegmentMemoize, parseHTMLToString, TagType} from './html/html_editor_config';
import {v4 as uuidv4} from "uuid"

export interface BuffersState {
    buffers: {
        [buffer: string]: BufferState,
    },
    activeBufferName: string,
}

export const buffersInitialState = {
    buffers: {},
    activeBufferName: null,
} as BuffersState;

function initBufferIfNeeded(state: BuffersState, buffer: string, type: BufferType) {
    if (!(buffer in state.buffers)) {
        state.buffers[buffer] = createEmptyBufferState(type);
    }
    if (type) {
        state.buffers[buffer].type = type;
    }
}

function generateNewId(elements: {nextId: number, elements: {[id: number]: unknown}}) {
    return elements.nextId++;
}

export const buffersSlice = createSlice({
    name: 'buffers',
    initialState: buffersInitialState,
    reducers: {
        bufferInit(state, action: PayloadAction<{buffer: string} & BufferStateParameters>) {
            initBufferIfNeeded(state, action.payload.buffer, action.payload.type);
            for (let item of ['source', 'fileName', 'platform', 'submissionIndex']) {
                if (item in action.payload) {
                    state.buffers[action.payload.buffer][item] = action.payload[item];
                }
            }
        },
        bufferEdit(state, action: PayloadAction<{buffer: string, delta: TextDocumentDelta}>) {
            // initBufferIfNeeded(state, buffer);
            const oldDoc = state.buffers[action.payload.buffer].document as TextDocument;
            state.buffers[action.payload.buffer].document = TextBufferHandler.applyDelta(oldDoc, action.payload.delta);
        },
        bufferModelEdit(state, action: PayloadAction<{buffer: string, delta: TextDocumentDelta}>) {
            if (!('deltasToApply' in state.buffers[action.payload.buffer].actions)) {
                state.buffers[action.payload.buffer].actions.deltasToApply = {nextId: 0, elements: {}};
            }
            const id = generateNewId(state.buffers[action.payload.buffer].actions.deltasToApply);
            state.buffers[action.payload.buffer].actions.deltasToApply.elements[id] = action.payload.delta;
        },
        bufferClearDeltasToApply(state, action: PayloadAction<{buffer: string, ids: string[]}>) {
            for (let id of action.payload.ids) {
                delete state.buffers[action.payload.buffer].actions.deltasToApply.elements[id];
            }
        },
        // This one is recorded, bufferResetDocument is not
        bufferEditPlain(state, action: PayloadAction<{buffer: string, document: Document}>) {
            // initBufferIfNeeded(state, buffer);
            state.buffers[action.payload.buffer].document = action.payload.document;
        },
        bufferSelect(state, action: PayloadAction<{buffer: string, selection: Range|string}>) {
            // initBufferIfNeeded(state, buffer);
            state.buffers[action.payload.buffer].selection = action.payload.selection;
        },
        bufferReset(state, action: PayloadAction<{buffer: string, state: BufferState}>) {
            initBufferIfNeeded(state, action.payload.buffer, action.payload.state.document.type);
            state.buffers[action.payload.buffer].document = action.payload.state.document;
            state.buffers[action.payload.buffer].selection = action.payload.state.selection;
            state.buffers[action.payload.buffer].firstVisibleRow = action.payload.state.firstVisibleRow;
        },
        bufferResetDocument(state, action: PayloadAction<{buffer: string, document: Document, goToEnd?: boolean}>) {
            initBufferIfNeeded(state, action.payload.buffer, action.payload.document.type);
            state.buffers[action.payload.buffer].document = action.payload.document;
            state.buffers[action.payload.buffer].firstVisibleRow = undefined;
            if (action.payload.goToEnd) {
                if (!('goToEnd' in state.buffers[action.payload.buffer].actions)) {
                    state.buffers[action.payload.buffer].actions.goToEnd = 0;
                }
                state.buffers[action.payload.buffer].actions.goToEnd++;
            }
        },
        bufferScrollToLine(state, action: PayloadAction<{buffer: string, firstVisibleRow: number}>) {
            // initBufferIfNeeded(state, buffer);
            state.buffers[action.payload.buffer].firstVisibleRow = action.payload.firstVisibleRow;
        },
        bufferResize(state, action: PayloadAction<{buffer: string}>) {
            if (!(action.payload.buffer in state.buffers)) {
                return;
            }
            if (!('resize' in state.buffers[action.payload.buffer].actions)) {
                state.buffers[action.payload.buffer].actions.resize = 0;
            }
            state.buffers[action.payload.buffer].actions.resize++;
        },
        bufferInsertBlock(state, action: PayloadAction<{buffer: string, block: Block, pos?: TextPosition}>) {
            if (!('blocksToInsert' in state.buffers[action.payload.buffer].actions)) {
                state.buffers[action.payload.buffer].actions.blocksToInsert = {nextId: 0, elements: {}};
            }
            const id = generateNewId(state.buffers[action.payload.buffer].actions.blocksToInsert);
            state.buffers[action.payload.buffer].actions.blocksToInsert.elements[id] = {block: action.payload.block, pos: action.payload.pos};
        },
        bufferClearBlocksToInsert(state, action: PayloadAction<{buffer: string, ids: string[]}>) {
            for (let id of action.payload.ids) {
                delete state.buffers[action.payload.buffer].actions.blocksToInsert.elements[id];
            }
        },
        bufferChangeActiveBufferName(state, action: PayloadAction<string>) {
            state.activeBufferName = action.payload;
        },
        bufferRemove(state, action: PayloadAction<string>) {
            if (action.payload === state.activeBufferName) {
                const sourceBuffers = selectSourceBuffersFromBufferState(state);
                const keys = Object.keys(sourceBuffers);
                const currentPosition = keys.indexOf(state.activeBufferName);
                if (currentPosition - 1 >= 0) {
                    state.activeBufferName = keys[currentPosition - 1];
                } else if (currentPosition + 1 <= keys.length - 1) {
                    state.activeBufferName = keys[currentPosition + 1];
                }
            }

            delete state.buffers[action.payload];
        },
        bufferAssociateToSubmission(state, action: PayloadAction<{buffer: string, submissionIndex: number}>) {
            state.buffers[action.payload.buffer].submissionIndex = action.payload.submissionIndex;
        },
        bufferDissociateFromSubmission(state, action: PayloadAction<{buffer: string}>) {
            state.buffers[action.payload.buffer].submissionIndex = null;
        },
        toggleBlockDescription(state, action: PayloadAction<{blockId: number}>) {
            // const parentCategory = state.categories.find(c => c.blocks.find(b => b.id === action.payload.blockId))
            // if (parentCategory) {
            //     parentCategory.openDesc = parentCategory.openDesc === action.payload.blockId ? null : action.payload.blockId
            // }
        },
        visualEditorElementMove(state, action: PayloadAction<{buffer: string, elementId: DropResult}>) {
            const draggedElementId = action.payload.elementId.draggableId
            const source = action.payload.elementId.source
            const destination = action.payload.elementId.destination
            const codeElements = htmlSegmentMemoize({html: documentToString(state.buffers[action.payload.buffer].document)});
            const foundElement = codeElements.find(e => e.id === draggedElementId);
            if (source && destination && foundElement) {
                // If element dropped at higher index AND on a different line, set modifier to 1
                const modifier = (destination.index > source.index && destination.droppableId !== source.droppableId) ? 1 : 0
                // Insert element at destination index - modifier while removing element at source index
                codeElements.splice(
                    destination.index - modifier, 0, codeElements.splice(source.index, 1)[0]!
                );
                const string = parseHTMLToString(codeElements);
                state.buffers[action.payload.buffer].document = TextBufferHandler.documentFromString(string);
            } else {
                console.log('Not found!', {source, destination, draggedElementId, foundElement, codeElements})
            }
        },
        visualEditorElementDelete(state, action: PayloadAction<{buffer: string, elementId: DropResult}>) {
            const codeElements = htmlSegmentMemoize({html: documentToString(state.buffers[action.payload.buffer].document)});
            codeElements.splice(action.payload.elementId.source.index, 1);
            const string = parseHTMLToString(codeElements);
            state.buffers[action.payload.buffer].document = TextBufferHandler.documentFromString(string);
        },
        visualEditorElementCreate(state, action: PayloadAction<{buffer: string, elementId: DropResult}>) {
            const elementTagType = action.payload.elementId.draggableId.split("-")
            const elementToCreate: CodeSegment = {
                id: uuidv4(),
                type: elementTagType[1] === 'opening' ? TagType.Opening : TagType.Closing,
                value: elementTagType[0]!,
                unlocked: true
            }
            if (action.payload.elementId.destination) {
                const codeElements = htmlSegmentMemoize({html: documentToString(state.buffers[action.payload.buffer].document)});
                codeElements.splice(action.payload.elementId.destination.index, 0, elementToCreate);
                const string = parseHTMLToString(codeElements);
                state.buffers[action.payload.buffer].document = TextBufferHandler.documentFromString(string);
            }
        },
        visualEditorElementEdit(state, action: PayloadAction<{buffer: string, elementIndex: number, codeSegment: CodeSegment}>) {
            const codeElements = htmlSegmentMemoize({html: documentToString(state.buffers[action.payload.buffer].document)});
            codeElements[action.payload.elementIndex] = action.payload.codeSegment;
            const string = parseHTMLToString(codeElements);
            state.buffers[action.payload.buffer].document = TextBufferHandler.documentFromString(string);
        },
        switchEditorMode(state, action: PayloadAction<{buffer: string}>) {
            const bufferState = state.buffers[action.payload.buffer];

            if (bufferState.htmlMode === EditorType.Textual) {
                bufferState.htmlMode = EditorType.Visual
            } else {
                bufferState.htmlMode = EditorType.Textual
            }
        },
    },
});

export const {
    bufferInit,
    bufferEdit,
    bufferEditPlain,
    bufferModelEdit,
    bufferClearDeltasToApply,
    bufferSelect,
    bufferReset,
    bufferResetDocument,
    bufferScrollToLine,
    bufferResize,
    bufferInsertBlock,
    bufferClearBlocksToInsert,
    bufferChangeActiveBufferName,
    bufferRemove,
    bufferAssociateToSubmission,
    bufferDissociateFromSubmission,
    toggleBlockDescription,
    visualEditorElementMove,
    visualEditorElementDelete,
    visualEditorElementCreate,
    visualEditorElementEdit,
    switchEditorMode,
} = buffersSlice.actions;

export default buffersSlice;
