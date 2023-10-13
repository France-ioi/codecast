import {Block} from '../task/blocks/block_types';
import {CodecastPlatform} from '../stepper/codecast_platform';

export enum BufferType {
    Text = 'text',
    Block = 'block',
}

export interface Document {
    type: BufferType,
}

export interface TextDocument extends Document {
    type: BufferType.Text,
    lines: string[],
}

export interface BlockDocumentContent {
    blockly: string,
}

export interface BlockDocument extends Document {
    type: BufferType.Block,
    content: BlockDocumentContent|null,
}

export interface TextBufferState extends BufferState {
    type: BufferType.Text,
    document: TextDocument,
    selection?: Range,
}

export interface BlockBufferState extends BufferState {
    type: BufferType.Block,
    document: BlockDocument,
    selection?: string,
}

export interface BufferState {
    source?: boolean,
    fileName?: string,
    platform?: CodecastPlatform,
    submissionId?: string,
    type: BufferType,
    document: Document,
    selection?: any,
    firstVisibleRow?: number,
    actions: {
        goToEnd?: number,
        resize?: number,
        blocksToInsert?: {block: Block, pos: TextPosition}[],
        deltasToApply?: TextDocumentDelta[],
    },
}

export interface TextPosition {
    row: number,
    column: number
}

export enum TextDocumentDeltaAction {
    Insert = 'insert',
    Remove = 'remove',
}

export interface Range {
    start: TextPosition,
    end: TextPosition,
}

export interface TextDocumentDelta {
    action: TextDocumentDeltaAction,
    start: TextPosition,
    end: TextPosition,
    lines?: string[],
}
