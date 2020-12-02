import {List} from 'immutable';

class Document {
    constructor(public lines: List<string>) {
        this.lines = lines;
    }

    size(): number {
        if (this.lines.size === 0) {
            return 0;
        }

        return this.lines.reduce(function (a, v) {
            return (a + v.length + 1);
        }, 0) - 1;
    };

    toString(): string {
        return this.lines.toJS().join('\n');
    };
    applyDelta(delta): Document {
        const docLines = this.lines;
        const row = delta.start.row;
        const startColumn = delta.start.column;
        const line = docLines.get(row, "");

        if (delta.action === 'insert') {
            const lines = delta.lines;
            const nLines = lines.length;
            if (nLines === 1) {
                return new Document(
                    docLines.set(row, line.substring(0, startColumn) + lines[0] + line.substring(startColumn)));
            } else {
                const args = [row, 1].concat(delta.lines);
                docLines.splice.apply(docLines, args);
                docLines[row] = line.substring(0, startColumn) + docLines[row];
                docLines[row + delta.lines.length - 1] += line.substring(startColumn);
                return new Document(
                    docLines.splice.apply(docLines, args)
                        .update(row, firstLine => line.substring(0, startColumn) + firstLine)
                        .update(row + nLines - 1, lastLine => lastLine + line.substring(startColumn)));
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
                    docLines.splice(row, endRow - row + 1,
                        line.substring(0, startColumn) + docLines.get(endRow).substring(endColumn)));
            }
        }

        return this;
    };

    endCursor() {
        if (this.lines.size === 0) {
            return {row: 0, column: 0};
        }

        const row = this.lines.size - 1;
        const column = this.lines.get(row).length;

        return {row, column};
    };
}

export const documentFromString = function (text: string): Document {
    return new Document(List<string>(text.split('\n')));
};

export const emptyDocument = documentFromString('');

export const compressRange = function (range) {
    const {start, end} = range;
    if (start.row === end.row && start.column === end.column) {
        return [start.row, start.column];
    } else {
        return [start.row, start.column, end.row, end.column];
    }
};

export const expandRange = function (range) {
    if (range.length === 2) {
        const pos = {row: range[0], column: range[1]};
        return {start: pos, end: pos};
    } else {
        const start = {row: range[0], column: range[1]};
        const end = {row: range[2], column: range[3]};
        return {start, end};
    }
};
