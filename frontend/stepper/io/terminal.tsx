/* Line-buffered terminal */
import React from 'react';
import {call, select, takeEvery} from 'redux-saga/effects';
import {ActionTypes} from "./actionTypes";
import produce, {immerable} from "immer";
import {AppStore, AppStoreReplay} from "../../store";
import {ReplayContext} from "../../player/sagas";
import {Bundle} from "../../linker";
import {App} from "../../index";

export const initialStateTerminal = {} as any;

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.TerminalInit);
    bundle.addReducer(ActionTypes.TerminalInit, (state: AppStore, {terminalElement}) => {
        state.terminal = initialStateTerminal;
        state.terminalElement = terminalElement;
    });

    bundle.defineAction(ActionTypes.TerminalFocus);

    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.TerminalFocus, function* () {
            const state: AppStore = yield select();

            if (state.terminalElement) {
                state.terminalElement.focus();
            }
        });
    });

    bundle.defineAction(ActionTypes.TerminalInputNeeded);
    bundle.addReducer(ActionTypes.TerminalInputNeeded, terminalInputNeededReducer);

    function terminalInputNeededReducer(state: AppStoreReplay): void {
        // state.stepper.currentStepperState.isWaitingOnInput = true;
    }

    bundle.defineAction(ActionTypes.TerminalInputKey);
    bundle.addReducer(ActionTypes.TerminalInputKey, terminalInputKeyReducer);

    function terminalInputKeyReducer(state: AppStoreReplay, action) {
        const {key} = action;

        state.stepper.currentStepperState.inputBuffer = state.stepper.currentStepperState.inputBuffer + key;
    }

    bundle.defineAction(ActionTypes.TerminalInputBackspace);
    bundle.addReducer(ActionTypes.TerminalInputBackspace, terminalInputBackspaceReducer);

    function terminalInputBackspaceReducer(state: AppStoreReplay): void {
        state.stepper.currentStepperState.inputBuffer = state.stepper.currentStepperState.inputBuffer.slice(0, -1)
    }

    bundle.defineAction(ActionTypes.TerminalInputEnter);
    bundle.addReducer(ActionTypes.TerminalInputEnter, terminalInputEnterReducer);

    function terminalInputEnterReducer(state: AppStoreReplay): void {
        const inputLine = state.stepper.currentStepperState.inputBuffer + '\n'
        const newInput = state.stepper.currentStepperState.input + inputLine;

        let newTerminal;
        let newInputPos = state.stepper.currentStepperState.inputPos;
        if (state.stepper.currentStepperState.platform === 'python') {
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
            newTerminal = writeString(state.stepper.currentStepperState.terminal, inputLine);
        }

        state.stepper.currentStepperState.inputBuffer = '';
        state.stepper.currentStepperState.input = newInput;
        state.stepper.currentStepperState.inputPos = newInputPos;
        state.stepper.currentStepperState.terminal = newTerminal;
        // state.stepper.currentStepperState.isWaitingOnInput = false;
    }

    bundle.defer(function({recordApi, replayApi}: App) {
        recordApi.on(ActionTypes.TerminalInputNeeded, function* (addEvent) {
            yield call(addEvent, 'terminal.wait');
        });
        replayApi.on('terminal.wait', function(replayContext: ReplayContext) {
            terminalInputNeededReducer(replayContext.state);
        });

        recordApi.on(ActionTypes.TerminalInputKey, function* (addEvent, action) {
            yield call(addEvent, 'terminal.key', action.key);
        });
        replayApi.on('terminal.key', function(replayContext: ReplayContext, event) {
            const key = event[2];

            terminalInputKeyReducer(replayContext.state, {key});
        });

        recordApi.on(ActionTypes.TerminalInputBackspace, function* (addEvent) {
            yield call(addEvent, 'terminal.backspace');
        });
        replayApi.on('terminal.backspace', function(replayContext: ReplayContext) {
            terminalInputBackspaceReducer(replayContext.state);
        });

        // recordApi.on(ActionTypes.TerminalInputEnter, function* (addEvent) {
        //     yield call(addEvent, 'terminal.enter');
        // });
        // replayApi.on('terminal.enter', function(replayContext: ReplayContext) {
        //     terminalInputEnterReducer(replayContext.state);
        // });
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
