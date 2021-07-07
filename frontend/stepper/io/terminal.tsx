/* Line-buffered terminal */
import React from 'react';
import produce, {immerable} from "immer";

export const initialStateTerminal = {} as any;

/* low-level terminal state functions */

class Cursor {
    [immerable] = true;

    constructor(public line = 0, public column = 0) {

    }
}

class Attrs {
    [immerable] = true;
}

class Cell {
    [immerable] = true;

    constructor(public char = ' ', public attrs = new Attrs()) {

    }
}

interface TermBufferOptions {
    width?: number,
    lines?: number
}

export class TermBuffer {
    [immerable] = true;

    width = 80;
    height = 24;
    cursor = new Cursor(0, 0);
    attrs = new Attrs();
    lines = [];
    constructor(options: TermBufferOptions = {}) {
        if (options.width) {
            this.width = options.width;
        }
        if (options.lines) {
            this.height = options.lines;
        }

        const blankCell = new Cell();
        const blankLine = new Array(this.width).fill(blankCell);
        this.lines = new Array(this.height).fill(blankLine);
    }
}

export const writeString = produce((termBuffer: TermBuffer, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
        writeChar(termBuffer, str[i]);
    }
});

const writeChar = (termBuffer: TermBuffer, char: string) => {
    if (char === '\n') {
        writeNewline(termBuffer);
    } else if (char === '\r') {
        // Move the cursor to the beginning of the current line.
        termBuffer.cursor.column = 0;
    } else {
        // Write the caracter using the current attributes and
        // move the cursor.
        termBuffer.lines[termBuffer.cursor.line][termBuffer.cursor.column] = new Cell(char, termBuffer.attrs);

        const newColumn = termBuffer.cursor.column + 1;
        if (newColumn < termBuffer.width) {
            termBuffer.cursor.column = newColumn;
        } else {
            writeNewline(termBuffer);
        }
    }
};

const writeNewline = (termBuffer: TermBuffer) => {
    // Move the cursor to the beginning of the next line.
    termBuffer.cursor.column = 0;
    termBuffer.cursor.line++;

    // Scroll by one line if needed.
    if (termBuffer.cursor.line === termBuffer.height) {
        const blankCell = new Cell(' ', termBuffer.attrs);
        const blankLine = new Array(termBuffer.width).fill(blankCell);

        termBuffer.lines.shift();
        termBuffer.lines.push(blankLine);

        termBuffer.cursor.line = termBuffer.height - 1;
    }
};
