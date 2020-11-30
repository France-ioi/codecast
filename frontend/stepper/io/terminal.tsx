/* Line-buffered terminal */

import {Map, Record, List} from 'immutable';
import React from 'react';
import {call, select, takeEvery} from 'redux-saga/effects';
import {ActionTypes} from "./actionTypes";
import {TerminalView} from "./TerminalView";

export default function (bundle, deps) {

    bundle.use(
        'getCurrentStepperState',
        'terminalInit', 'terminalInputKey', 'terminalInputBackspace', 'terminalInputEnter'
    );

    bundle.defineAction(ActionTypes.TerminalInit);
    bundle.addReducer(ActionTypes.TerminalInit, function (state, action) {
        const {iface} = action;

        return state.set('terminal', iface);
    });

    bundle.defineAction(ActionTypes.TerminalFocus);
    bundle.addSaga(function* () {
        yield takeEvery(deps.terminalFocus, function* () {
            const iface = yield select(state => state.get('terminal'));
            if (iface) {
                iface.focus();
            }
        });
    });

    bundle.defineAction(ActionTypes.TerminalInputNeeded);
    bundle.addReducer(ActionTypes.TerminalInputNeeded, terminalInputNeeded);

    function terminalInputNeeded(state) {
        return state.updateIn(['stepper', 'currentStepperState'], function (stepper) {
            return {...stepper, isWaitingOnInput: true};
        });
    }

    bundle.defineAction(ActionTypes.TerminalInputKey);
    bundle.addReducer(ActionTypes.TerminalInputKey, terminalInputKey);

    function terminalInputKey(state, action) {
        const {key} = action;

        return state.updateIn(['stepper', 'currentStepperState'], function (stepper) {
            return {...stepper, inputBuffer: stepper.inputBuffer + key};
        });
    }

    bundle.defineAction(ActionTypes.TerminalInputBackspace);
    bundle.addReducer(ActionTypes.TerminalInputBackspace, terminalInputBackspace);

    function terminalInputBackspace(state) {
        return state.updateIn(['stepper', 'currentStepperState'], function (stepper) {
            return {...stepper, inputBuffer: stepper.inputBuffer.slice(0, -1)};
        });
    }

    bundle.defineAction(ActionTypes.TerminalInputEnter);
    bundle.addReducer(ActionTypes.TerminalInputEnter, terminalInputEnter);

    function terminalInputEnter(state) {
        return state.updateIn(['stepper', 'currentStepperState'], function (stepper) {
            const inputLine = stepper.inputBuffer + '\n'
            const newInput = stepper.input + inputLine;

            let newTerminal;
            let newInputPos = stepper.inputPos;
            if (stepper.platform === 'python') {
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
                newTerminal = writeString(stepper.terminal, inputLine);
            }

            return {
                ...stepper,
                inputBuffer: "",
                input: newInput,
                inputPos: newInputPos,
                terminal: newTerminal,
                isWaitingOnInput: false
            };
        });
    }

    bundle.defer(function ({recordApi, replayApi}) {

        recordApi.on(ActionTypes.TerminalInputNeeded, function* (addEvent, action) {
            yield call(addEvent, 'terminal.wait');
        });
        replayApi.on('terminal.wait', function (replayContext, event) {
            replayContext.state = terminalInputNeeded(replayContext.state);
        });

        recordApi.on(ActionTypes.TerminalInputKey, function* (addEvent, action) {
            yield call(addEvent, 'terminal.key', action.key);
        });
        replayApi.on('terminal.key', function (replayContext, event) {
            const key = event[2];
            replayContext.state = terminalInputKey(replayContext.state, {key});
        });

        recordApi.on(ActionTypes.TerminalInputBackspace, function* (addEvent, action) {
            yield call(addEvent, 'terminal.backspace');
        });
        replayApi.on('terminal.backspace', function (replayContext, event) {
            replayContext.state = terminalInputBackspace(replayContext.state);
        });

        recordApi.on(ActionTypes.TerminalInputEnter, function* (addEvent, action) {
            yield call(addEvent, 'terminal.enter');
        });
        replayApi.on('terminal.enter', function (replayContext, event) {
            replayContext.state = terminalInputEnter(replayContext.state);
        });

    });

    bundle.defineView('TerminalView', TerminalViewSelector, TerminalView);

    function TerminalViewSelector(state, props) {
        const result = {};
        // @ts-ignore
        result.readOnly = props.preventInput;
        const stepper = deps.getCurrentStepperState(state);
        if (stepper) {
            // @ts-ignore
            result.terminal = stepper.terminal;
            // @ts-ignore
            result.input = stepper.inputBuffer;
            // @ts-ignore
            result.isWaitingOnInput = stepper.isWaitingOnInput;
        }

        return result;
    }

};

/* low-level terminal state functions */

export const Cursor = Record({line: 0, column: 0});
export const Attrs = Record({});
export const Cell = Record({char: ' ', attrs: Attrs()});

export const TermBuffer = function (options) {
    options = options || {};
    const width = options.width || 80;
    const height = options.lines || 24;
    const cursor = Cursor({line: 0, column: 0});
    const attrs = Attrs();
    const blankCell = Cell({char: ' ', attrs});
    const blankLine = List(Array(width).fill(blankCell));
    const lines = List(Array(height).fill(blankLine));
    return Map({width, height, cursor, attrs, lines}); // TODO: turn this into a Record
};

export const writeString = function (buffer, str) {
    for (let i = 0; i < str.length; i += 1) {
        buffer = writeChar(buffer, str[i]);
    }
    return buffer;
};

export const writeChar = function (buffer, char) {

    if (char === '\n') {
        return writeNewline(buffer);
    }

    if (char === '\r') {
        // Move the cursor to the beginning of the current line.
        return buffer.setIn(['cursor', 'column'], 0);
    }

    // Write the caracter using the current attributes and
    // move the cursor.
    let cursor = buffer.get('cursor');
    const line = cursor.get('line');
    let column = cursor.get('column');
    const attrs = buffer.get('attrs');
    const cell = Cell({char, attrs});
    buffer = buffer.setIn(['lines', line, column], cell);

    column += 1;
    if (column < buffer.get('width')) {
        cursor = cursor.set('column', column);
        return buffer.set('cursor', cursor);
    }

    return writeNewline(buffer);
};

const writeNewline = function (buffer) {
    // Move the cursor to the beginning of the next line.
    const height = buffer.get('height');
    let cursor = buffer.get('cursor').set('column', 0);
    let line = cursor.get('line') + 1;
    // Scroll by one line if needed.
    if (line === height) {
        const width = buffer.get('width');
        const attrs = buffer.get('attrs');
        const blankCell = Cell({char: ' ', attrs});
        const blankLine = List(Array(width).fill(blankCell));
        buffer = buffer.update('lines', lines => lines.shift().push(blankLine));
        line = height - 1;
    }
    cursor = cursor.set('line', line);
    buffer = buffer.set('cursor', cursor);
    return buffer;
};
