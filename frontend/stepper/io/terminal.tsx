/* Line-buffered terminal */
import React from 'react';
import {call, put, select, takeEvery} from 'redux-saga/effects';
import {ActionTypes} from "./actionTypes";
import produce, {immerable} from "immer";
import {AppStore} from "../../store";

export const initialStateTerminal = {} as any;

export default function(bundle) {
    bundle.defineAction(ActionTypes.TerminalInit);
    bundle.addReducer(ActionTypes.TerminalInit, produce((draft: AppStore) => {
        draft.terminal = initialStateTerminal;
    }));

    bundle.defineAction(ActionTypes.TerminalFocus);

    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.TerminalFocus, function* () {
            const state: AppStore = yield select();

            const iface = state.terminal;
            if (iface) {
                iface.focus();
            }
        });
    });

    bundle.defineAction(ActionTypes.TerminalInputNeeded);
    bundle.addReducer(ActionTypes.TerminalInputNeeded, produce(terminalInputNeededReducer));

    function terminalInputNeededReducer(draft: AppStore): void {
        draft.stepper.currentStepperState.isWaitingOnInput = true;
    }

    bundle.defineAction(ActionTypes.TerminalInputKey);
    bundle.addReducer(ActionTypes.TerminalInputKey, produce(terminalInputKeyReducer));

    function terminalInputKeyReducer(draft: AppStore, action) {
        const {key} = action;

        draft.stepper.currentStepperState.inputBuffer = draft.stepper.currentStepperState.inputBuffer + key;
    }

    bundle.defineAction(ActionTypes.TerminalInputBackspace);
    bundle.addReducer(ActionTypes.TerminalInputBackspace, produce(terminalInputBackspaceReducer));

    function terminalInputBackspaceReducer(draft: AppStore): void {
        draft.stepper.currentStepperState.inputBuffer = draft.stepper.currentStepperState.inputBuffer.slice(0, -1)
    }

    bundle.defineAction(ActionTypes.TerminalInputEnter);
    bundle.addReducer(ActionTypes.TerminalInputEnter, produce(terminalInputEnterReducer));

    function terminalInputEnterReducer(draft: AppStore): void {
        const inputLine = draft.stepper.currentStepperState.inputBuffer + '\n'
        const newInput = draft.stepper.currentStepperState.input + inputLine;

        let newTerminal;
        let newInputPos = draft.stepper.currentStepperState.inputPos;
        if (draft.stepper.currentStepperState.platform === 'python') {
            newTerminal = writeString(window.currentPythonRunner._terminal, inputLine);

            /**
             * For when we are in player mode, _futureInputValue is filled with an object that
             * will contain the input value, because we need to read the terminal events first
             * without stopping the skulpt execution.
             */
            if (window.currentPythonRunner._futureInputValue) {
                window.currentPythonRunner._futureInputValue.value = inputLine.trim();

                // We update the input position yet then.
                newInputPos = window.currentPythonRunner._inputPos + inputLine.length;
                window.currentPythonRunner._inputPos = newInputPos;
            }

            window.currentPythonRunner._input = newInput;
            window.currentPythonRunner._terminal = newTerminal;
        } else {
            newTerminal = writeString(draft.stepper.currentStepperState.terminal, inputLine);
        }

        draft.stepper.currentStepperState.inputBuffer = '';
        draft.stepper.currentStepperState.input = newInput;
        draft.stepper.currentStepperState.inputPos = newInputPos;
        draft.stepper.currentStepperState.terminal = newTerminal;
        draft.stepper.currentStepperState.isWaitingOnInput = false;
    }

    bundle.defer(function({recordApi, replayApi}) {
        recordApi.on(ActionTypes.TerminalInputNeeded, function* (addEvent) {
            yield call(addEvent, 'terminal.wait');
        });
        replayApi.on('terminal.wait', function(replayContext) {
            replayContext.state = produce(terminalInputNeededReducer.bind(replayContext.state));
        });

        recordApi.on(ActionTypes.TerminalInputKey, function* (addEvent, action) {
            yield call(addEvent, 'terminal.key', action.key);
        });
        replayApi.on('terminal.key', function(replayContext, event) {
            const key = event[2];

            replayContext.state = produce(terminalInputKeyReducer.bind(replayContext.state, {key}));
        });

        recordApi.on(ActionTypes.TerminalInputBackspace, function* (addEvent) {
            yield call(addEvent, 'terminal.backspace');
        });
        replayApi.on('terminal.backspace', function(replayContext) {
            replayContext.state = produce(terminalInputBackspaceReducer.bind(replayContext.state));
        });

        recordApi.on(ActionTypes.TerminalInputEnter, function* (addEvent) {
            yield call(addEvent, 'terminal.enter');
        });
        replayApi.on('terminal.enter', function(replayContext) {
            replayContext.state = produce(terminalInputEnterReducer.bind(replayContext.state));
        });
    });
};

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

export const writeString = produce((draft: TermBuffer, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
        writeChar(draft, str[i]);
    }
});

const writeChar = produce((draft: TermBuffer, char) => {
    if (char === '\n') {
        writeNewline(draft);
    } else if (char === '\r') {
        // Move the cursor to the beginning of the current line.
        draft.cursor.column = 0;
    } else {
        // Write the caracter using the current attributes and
        // move the cursor.
        draft.lines[draft.cursor.line][draft.cursor.column] = new Cell(char, draft.attrs);

        const newColumn = draft.cursor.column + 1;
        if (newColumn < draft.width) {
            draft.cursor.column = newColumn;
        } else {
            writeNewline(draft);
        }
    }
});

const writeNewline = produce((draft: TermBuffer) => {
    // Move the cursor to the beginning of the next line.
    draft.cursor.column = 0;
    draft.cursor.line++;

    // Scroll by one line if needed.
    if (draft.cursor.line === draft.height) {
        const blankCell = new Cell(' ', draft.attrs);
        const blankLine = new Array(draft.width).fill(blankCell);

        draft.lines.shift();
        draft.lines.push(blankLine);

        draft.cursor.line = draft.height - 1;
    }
});
