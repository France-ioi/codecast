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
import {createEmptyBufferState, TextBufferHandler} from './document';

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
                state.buffers[action.payload.buffer].actions.deltasToApply = [];
            }
            state.buffers[action.payload.buffer].actions.deltasToApply.push(action.payload.delta);
        },
        bufferClearDeltasToApply(state, action: PayloadAction<{buffer: string}>) {
            state.buffers[action.payload.buffer].actions.deltasToApply = [];
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
                state.buffers[action.payload.buffer].actions.blocksToInsert = [];
            }
            state.buffers[action.payload.buffer].actions.blocksToInsert.push({block: action.payload.block, pos: action.payload.pos});
        },
        bufferClearBlocksToInsert(state, action: PayloadAction<{buffer: string}>) {
            state.buffers[action.payload.buffer].actions.blocksToInsert = [];
        },
        bufferChangeActiveBufferName(state, action: PayloadAction<string>) {
            state.activeBufferName = action.payload;
        },
        bufferRemove(state, action: PayloadAction<string>) {
            if (action.payload === state.activeBufferName) {
                const keys = Object.keys(state.buffers);
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
} = buffersSlice.actions;

export default buffersSlice;
