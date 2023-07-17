import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {BufferState, TextDocumentDelta, Document, Range, TextPosition, BufferType} from './buffer_types';
import {Block} from '../task/blocks/block_types';
import {createEmptyBufferState, TextBufferHandler} from './document';

export interface BuffersState {
    [buffer: string]: BufferState,
}

export const buffersInitialState = {} as BuffersState;

function initBufferIfNeeded(state: BuffersState, buffer: string, type: BufferType) {
    if (!(buffer in state)) {
        state[buffer] = createEmptyBufferState(type);
    }
}

export const buffersSlice = createSlice({
    name: 'buffers',
    initialState: buffersInitialState,
    reducers: {
        bufferInit(state, action: PayloadAction<{buffer: string, type: BufferType}>) {
            initBufferIfNeeded(state, action.payload.buffer, action.payload.type);
        },
        bufferEdit(state, action: PayloadAction<{buffer: string, delta: TextDocumentDelta}>) {
            // initBufferIfNeeded(state, buffer);
            const oldDoc = state[action.payload.buffer].document;
            state[action.payload.buffer].document = TextBufferHandler.applyDelta(oldDoc, action.payload.delta);
        },
        bufferModelEdit(state, action: PayloadAction<{buffer: string, delta: TextDocumentDelta}>) {
            if (!('deltasToApply' in state[action.payload.buffer].actions)) {
                state[action.payload.buffer].actions.deltasToApply = [];
            }
            state[action.payload.buffer].actions.deltasToApply.push(action.payload.delta);
        },
        bufferClearDeltasToApply(state, action: PayloadAction<{buffer: string}>) {
            state[action.payload.buffer].actions.deltasToApply = [];
        },
        // This one is recorded, bufferResetDocument is not
        bufferEditPlain(state, action: PayloadAction<{buffer: string, document: Document}>) {
            // initBufferIfNeeded(state, buffer);
            state[action.payload.buffer].document = action.payload.document;
        },
        bufferSelect(state, action: PayloadAction<{buffer: string, selection: Range|string}>) {
            // initBufferIfNeeded(state, buffer);
            state[action.payload.buffer].selection = action.payload.selection;
        },
        bufferReset(state, action: PayloadAction<{buffer: string, state: BufferState}>) {
            state[action.payload.buffer].document = action.payload.state.document;
            state[action.payload.buffer].selection = action.payload.state.selection;
            state[action.payload.buffer].highlight = action.payload.state.highlight;
            state[action.payload.buffer].firstVisibleRow = action.payload.state.firstVisibleRow;
        },
        bufferResetDocument(state, action: PayloadAction<{buffer: string, document: Document, goToEnd?: boolean}>) {
            initBufferIfNeeded(state, action.payload.buffer, action.payload.document.type);
            state[action.payload.buffer].document = action.payload.document;
            state[action.payload.buffer].firstVisibleRow = undefined;
            if (action.payload.goToEnd) {
                if (!('goToEnd' in state[action.payload.buffer].actions)) {
                    state[action.payload.buffer].actions.goToEnd = 0;
                }
                state[action.payload.buffer].actions.goToEnd++;
            }
        },
        bufferScrollToLine(state, action: PayloadAction<{buffer: string, firstVisibleRow: number}>) {
            // initBufferIfNeeded(state, buffer);
            state[action.payload.buffer].firstVisibleRow = action.payload.firstVisibleRow;
        },
        bufferResize(state, action: PayloadAction<{buffer: string}>) {
            if (!(action.payload.buffer in state)) {
                return;
            }
            if (!('resize' in state[action.payload.buffer].actions)) {
                state[action.payload.buffer].actions.resize = 0;
            }
            state[action.payload.buffer].actions.resize++;
        },
        bufferInsertBlock(state, action: PayloadAction<{buffer: string, block: Block, pos?: TextPosition}>) {
            if (!('blocksToInsert' in state[action.payload.buffer].actions)) {
                state[action.payload.buffer].actions.blocksToInsert = [];
            }
            state[action.payload.buffer].actions.blocksToInsert.push({block: action.payload.block, pos: action.payload.pos});
        },
        bufferClearBlocksToInsert(state, action: PayloadAction<{buffer: string}>) {
            state[action.payload.buffer].actions.blocksToInsert = [];
        },
        bufferHighlight(state, action: PayloadAction<{buffer: string, highlight: Range|string}>) {
            // initBufferIfNeeded(state, buffer);
            state[action.payload.buffer].highlight = action.payload.highlight;
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
    bufferHighlight,
} = buffersSlice.actions;

export default buffersSlice;
