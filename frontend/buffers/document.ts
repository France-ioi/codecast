import {List} from 'immutable';
import {immerable} from "immer";
import {BlockDocumentModel, DocumentModel, documentModelFromString} from "./index";

interface Range {
    row: number,
    column: number
}

export class Selection {
    [immerable] = true;

    public constructor(
        public start: Range = {
            row: 0,
            column: 0
        },
        public end: Range = {
            row: 0,
            column: 0
        }
    ) {

    }
}

export class Document {
    [immerable] = true;

    constructor(public lines: List<string>) {
        this.lines = lines;
    }

    size(): number {
        if (this.lines.size === 0) {
            return 0;
        }

        return this.lines.reduce(function(a, v) {
            return (a + v.length + 1);
        }, 0) - 1;
    }

    toString(): string {
        return this.lines.toJS().join('\n');
    }

    getContent(): string {
        return this.toString();
    }

    applyDelta(delta): Document {
        const docLines = this.lines;
        const row = delta.start.row;
        const startColumn = delta.start.column;
        const line = docLines.get(row, "");

        if (delta.action === 'insert') {
            const lines = delta.lines;
            const nLines = lines.length;
            if (nLines === 1) {
                return new Document(docLines.set(row, line.substring(0, startColumn) + lines[0] + line.substring(startColumn)));
            } else {
                const args = [row, 1, ...delta.lines] as [number, number, ...string[]];

                docLines.splice.apply(docLines, args);
                docLines[row] = line.substring(0, startColumn) + docLines[row];
                docLines[row + delta.lines.length - 1] += line.substring(startColumn);

                return new Document(
                    docLines.splice.apply(docLines, args)
                        .update(row, firstLine => line.substring(0, startColumn) + firstLine)
                        .update(row + nLines - 1, lastLine => lastLine + line.substring(startColumn))
                );
            }
        }

        if (delta.action === "remove") {
            const endColumn = delta.end.column;
            const endRow = delta.end.row;
            if (row === endRow) {
                return new Document(
                    docLines.set(row, line.substring(0, startColumn) + line.substring(endColumn)));
            } else {
                return new Document(
                    docLines.splice(
                        row,
                        endRow - row + 1,
                        line.substring(0, startColumn) + docLines.get(endRow).substring(endColumn)
                    )
                );
            }
        }

        return this;
    }

    endCursor() {
        if (this.lines.size === 0) {
            return {row: 0, column: 0};
        }

        const row = this.lines.size - 1;
        const column = this.lines.get(row).length;

        return {row, column};
    }
}

export class ObjectDocument {
    [immerable] = true;

    constructor(public content: any) {
        this.content = content;
    }

    getContent(): string {
        return this.content;
    }
}

export const documentFromString = function(text: string): Document {
    return new Document(List<string>(text.split('\n')));
};

export const emptyDocument = documentFromString('');

export const compressDocument = function (document) {
    const content = document.getContent();
    if (document instanceof ObjectDocument) {
        return content && content.blockly ? content.blockly : null;
    }

    return content;
}

export const uncompressIntoDocument = function (content) {
    if (content.substring(0, 4) === '<xml') {
        return new ObjectDocument({blockly: content});
    } else {
        return documentFromString(content);
    }
}

export const modelFromDocument = function (document) {
    if (document instanceof ObjectDocument) {
        return new BlockDocumentModel(document);
    } else {
        return new DocumentModel(document);
    }
}

export const compressRange = function(range) {
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
};

export const expandRange = function(range): Selection {
    if (!Array.isArray(range)) {
        return range;
    }

    if (range.length === 2) {
        const pos = {row: range[0], column: range[1]};

        return new Selection(pos, pos);
    } else {
        const start = {row: range[0], column: range[1]};
        const end = {row: range[2], column: range[3]};

        return new Selection(start, end);
    }
};
