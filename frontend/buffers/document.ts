import {
    BlockBufferState,
    BlockDocument,
    BlockDocumentContent,
    BufferState,
    BufferType,
    Document,
    TextBufferState,
    TextDocument,
    Range, TextDocumentDelta, TextDocumentDeltaAction,
} from './buffer_types';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {hasBlockPlatform} from '../stepper/platforms';
import log from 'loglevel';

export function getBufferTypeFromPlatform(platform: CodecastPlatform) {
    return hasBlockPlatform(platform) ? BufferType.Block : BufferType.Text;
}

export function createEmptyBufferState(type: BufferType): BufferState {
    if (BufferType.Text === type) {
        return {
            type: BufferType.Text,
            document: TextBufferHandler.getEmptyDocument(),
            actions: {},
        }
    } else if (BufferType.Block === type) {
        return {
            type: BufferType.Block,
            document: BlockBufferHandler.getEmptyDocument(),
            actions: {},
        }
    } else {
        throw new Error("Unknown buffer type: " + type);
    }
}

export function getBufferHandler(buffer: BufferState) {
    if (BufferType.Text === buffer.type) {
        return new TextBufferHandler(buffer as TextBufferState);
    } else if (BufferType.Block === buffer.type) {
        return new BlockBufferHandler(buffer as BlockBufferState);
    } else {
        throw new Error("Unknown buffer type: " + buffer.type);
    }
}

export abstract class BufferHandler {
    buffer: BufferState;

    documentToString() {
        return this.buffer.document ? documentToString(this.buffer.document) : null;
    }
}

export class TextBufferHandler extends BufferHandler {
    buffer: TextBufferState;

    constructor(buffer: TextBufferState) {
        super();
        this.buffer = buffer;
    }

    static getEmptyDocument(): TextDocument {
        return {
            type: BufferType.Text,
            lines: [''],
        };
    }

    static documentFromString(content: string|null): TextDocument {
        return {
            type: BufferType.Text,
            lines: (content ? content : '').split("\n"),
        };
    }

    static applyDelta(document: TextDocument, delta: TextDocumentDelta): TextDocument {
        const docLines = [...document.lines];
        const row = delta.start.row;
        const startColumn = delta.start.column;
        const line = row < docLines.length ? docLines[row] : '';

        if (TextDocumentDeltaAction.Insert === delta.action) {
            const lines = delta.lines;
            const nLines = lines.length;
            if (nLines === 1) {
                docLines[row] = line.substring(0, startColumn) + lines[0] + line.substring(startColumn);
            } else {
                docLines.splice(row, 1, ...delta.lines);
                docLines[row] = line.substring(0, startColumn) + docLines[row];
                docLines[row + delta.lines.length - 1] += line.substring(startColumn);
            }
        }

        if (TextDocumentDeltaAction.Remove === delta.action) {
            const endColumn = delta.end.column;
            const endRow = delta.end.row;
            if (row === endRow) {
                docLines[row] = line.substring(0, startColumn) + line.substring(endColumn);
            } else {
                const endRowContent = endRow < docLines.length ? docLines[endRow] : '';
                docLines.splice(
                    row,
                    endRow - row + 1,
                    line.substring(0, startColumn) + endRowContent.substring(endColumn)
                );
            }
        }

        return TextBufferHandler.documentFromString(docLines.join("\n"));
    }
}

export class BlockBufferHandler extends BufferHandler {
    buffer: BlockBufferState;

    constructor(buffer: BlockBufferState) {
        super();
        this.buffer = buffer;
    }

    static getEmptyDocument(): BlockDocument {
        return {
            type: BufferType.Block,
            content: null,
        };
    }

    static documentFromObject(content: BlockDocumentContent): BlockDocument {
        return {
            type: BufferType.Block,
            content,
        }
    }
}

export function documentToString(document: Document): string {
    if (!document) {
        return '';
    }

    if (BufferType.Text === document.type) {
        return (document as TextDocument).lines.join("\n");
    } else if (BufferType.Block === document.type) {
        return (document as BlockDocument).content?.blockly;
    } else {
        throw new Error("Unknown buffer type: " + document.type);
    }
}

export function isEmptyDocument(document: Document|null) {
    if (!document) {
        return true;
    }

    if (BufferType.Text === document.type) {
        return 0 === (document as TextDocument).lines.join("\n").trim().length;
    } else if (BufferType.Block === document.type) {
        return !(document as BlockDocument).content?.blockly;
    } else {
        throw new Error("Unknown buffer type: " + document.type);
    }
}

export function uncompressIntoDocument(content: string): Document {
    if (content.substring(0, 4) === '<xml') {
        return BlockBufferHandler.documentFromObject({blockly: content});
    } else {
        return TextBufferHandler.documentFromString(content);
    }
}

export function compressRange(range: Range) {
    if ('object' === typeof range && null !== range) {
        const {start, end} = range;
        if (start.row === end.row && start.column === end.column) {
            return [start.row, start.column];
        } else {
            return [start.row, start.column, end.row, end.column];
        }
    } else {
        return range;
    }
}

export function expandRange(range): Range {
    if (!Array.isArray(range)) {
        return range;
    }

    if (range.length === 2) {
        const pos = {row: range[0], column: range[1]};

        return {
            start: pos,
            end: pos,
        }
    } else {
        const start = {row: range[0], column: range[1]};
        const end = {row: range[2], column: range[3]};

        return {start, end};
    }
}
